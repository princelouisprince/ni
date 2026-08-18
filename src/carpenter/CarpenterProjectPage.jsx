import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, Calendar, Play, Upload, Clock, Image as ImageIcon, Video, XCircle, Check, Hammer } from 'lucide-react';

function CarpenterProjectPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [designImages, setDesignImages] = useState([]);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [updateFiles, setUpdateFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjectData();
  }, [id]);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      const profile = await getUserProfile(currentUser.id);
      setUser(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);
      await loadUserData();

      const currentUser = await getCurrentUser();

      // Load project with customer
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (*)
        `)
        .eq('id', id)
        .eq('assigned_carpenter', currentUser.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);
      setCustomer(projectData.customers);

      // Load design images
      const { data: files } = await supabase.storage
        .from('customer-designs')
        .list(id);

      if (files) {
        const imageUrls = await Promise.all(
          files.map(async (file) => {
            const { data } = await supabase.storage
              .from('customer-designs')
              .createSignedUrl(`${id}/${file.name}`, 3600);
            return data?.signedUrl;
          })
        );
        setDesignImages(imageUrls.filter(Boolean));
      }

      // Load timeline
      const { data: updates } = await supabase
        .from('project_updates')
        .select(`
          *,
          uploader:uploaded_by (full_name, role)
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      setTimeline(updates || []);
    } catch (error) {
      console.error('Error loading project:', error);
      toast.error('Failed to load project or access denied');
      navigate('/carpenter');
    } finally {
      setLoading(false);
    }
  };

  const handleStartProduction = async () => {
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'in_production',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Add timeline entry
      await supabase.from('project_updates').insert([{
        project_id: id,
        uploaded_by: user.id,
        message: 'Production started',
      }]);

      toast.success('Production started');
      loadProjectData();
    } catch (error) {
      console.error('Error starting production:', error);
      toast.error('Failed to start production');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleReadyForFinishing = async () => {
    setUpdatingStatus(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          status: 'ready_for_finishing',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      // Add timeline entry
      await supabase.from('project_updates').insert([{
        project_id: id,
        uploaded_by: user.id,
        message: 'Production completed, ready for finishing',
      }]);

      // Notify cleaner if assigned
      if (project.assigned_cleaner) {
        const { data: cleaner } = await supabase
          .from('users')
          .select('*')
          .eq('id', project.assigned_cleaner)
          .single();

        if (cleaner) {
          await notificationService.notifyReadyForFinishing({
            cleanerId: cleaner.id,
            cleanerEmail: cleaner.email,
            projectTitle: project.title,
            projectId: id,
          });
        }
      }

      toast.success('Project marked as ready for finishing');
      loadProjectData();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      const isValidSize = file.size <= 50 * 1024 * 1024; // 50MB limit
      return (isImage || isVideo) && isValidSize;
    });
    
    if (validFiles.length !== files.length) {
      toast.error('Some files were rejected. Images and videos up to 50MB are allowed');
    }
    
    setUpdateFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setUpdateFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadUpdate = async () => {
    if (!updateMessage.trim() && updateFiles.length === 0) {
      toast.error('Please add a message or upload files');
      return;
    }

    setUploading(true);

    try {
      // Upload files first
      const uploadPromises = updateFiles.map(async (file) => {
        const isVideo = file.type.startsWith('video/');
        const bucket = isVideo ? 'project-videos' : 'project-images';
        const fileName = `${id}/${Date.now()}-${file.name}`;
        
        try {
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, file);

          if (uploadError) throw uploadError;

          // Get signed URL
          const { data } = await supabase.storage
            .from(bucket)
            .createSignedUrl(fileName, 3600);

          return {
            url: data?.signedUrl,
            type: isVideo ? 'video' : 'image',
          };
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          throw error;
        }
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      // Create update record for each file
      for (const file of uploadedFiles) {
        await supabase.from('project_updates').insert([{
          project_id: id,
          uploaded_by: user.id,
          message: updateMessage.trim(),
          media_url: file.url,
          media_type: file.type,
        }]);
      }

      // Also create a text-only update if there's a message and no files
      if (updateMessage.trim() && updateFiles.length === 0) {
        await supabase.from('project_updates').insert([{
          project_id: id,
          uploaded_by: user.id,
          message: updateMessage.trim(),
        }]);
      }

      toast.success('Update uploaded successfully');
      setUpdateMessage('');
      setUpdateFiles([]);
      setShowUpdateForm(false);
      loadProjectData();
    } catch (error) {
      console.error('Error uploading update:', error);
      toast.error('Failed to upload update');
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wood-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-stone-600">Project not found or access denied</p>
          <button
            onClick={() => navigate('/carpenter')}
            className="btn-primary mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/carpenter')}
            className="flex items-center text-stone-600 hover:text-stone-900 mb-2"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold text-stone-900">{project.title}</h1>
          <p className="text-stone-600">{project.furniture_type}</p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      {/* Customer Information */}
      <div className="card">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Customer Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-stone-400 mt-0.5" />
            <div>
              <p className="font-medium text-stone-900">{customer?.name || 'N/A'}</p>
              <p className="text-sm text-stone-500">Customer</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Phone className="h-5 w-5 text-stone-400 mt-0.5" />
            <div>
              <p className="text-stone-900">{customer?.phone || 'N/A'}</p>
              <p className="text-sm text-stone-500">Phone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Furniture Details */}
      <div className="card">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Furniture Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-stone-500 mb-1">Description</p>
            <p className="text-stone-900">{project.description}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-1">Textile/Material</p>
            <p className="text-stone-900">{project.textile || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-1">Dimensions</p>
            <p className="text-stone-900">{project.dimensions || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-1">Color</p>
            <p className="text-stone-900">{project.color || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-1">Quantity</p>
            <p className="text-stone-900">{project.quantity}</p>
          </div>
          <div>
            <p className="text-sm text-stone-500 mb-1">Delivery Date</p>
            <p className="text-stone-900 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              {project.delivery_date ? new Date(project.delivery_date).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Design Images */}
      {designImages.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Design Images</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {designImages.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`Design ${index + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      {/* Production Actions */}
      <div className="card">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Production Actions</h3>
        <div className="flex flex-wrap gap-4">
          {project.status === 'assigned_to_carpenter' && (
            <button
              onClick={handleStartProduction}
              disabled={updatingStatus}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5 mr-2" />
              {updatingStatus ? 'Starting...' : 'Start Production'}
            </button>
          )}
          
          {project.status === 'in_production' && (
            <button
              onClick={handleReadyForFinishing}
              disabled={updatingStatus}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="h-5 w-5 mr-2" />
              {updatingStatus ? 'Updating...' : 'Ready for Finishing'}
            </button>
          )}

          {project.status === 'in_production' && (
            <button
              onClick={() => setShowUpdateForm(!showUpdateForm)}
              className="btn-secondary flex items-center"
            >
              <Upload className="h-5 w-5 mr-2" />
              Add Progress Update
            </button>
          )}
        </div>

        {/* Update Form */}
        {showUpdateForm && (
          <div className="mt-6 p-4 bg-stone-50 rounded-lg">
            <div className="space-y-4">
              <div>
                <label className="label">Progress Message</label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  className="input-field"
                  rows="3"
                  placeholder="Describe your progress (e.g., 'Frame completed', 'Foam installed')"
                />
              </div>

              <div>
                <label className="label">Upload Photos or Videos</label>
                <div className="border-2 border-dashed border-stone-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="update-files"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <label
                    htmlFor="update-files"
                    className="cursor-pointer"
                  >
                    <Upload className="h-8 w-8 text-stone-400 mx-auto mb-2" />
                    <p className="text-stone-600">Tap to upload files</p>
                    <p className="text-sm text-stone-500">Photos and videos up to 50MB</p>
                  </label>
                </div>

                {updateFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    {updateFiles.map((file, index) => (
                      <div key={index} className="relative">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="w-full h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-full h-24 bg-stone-200 rounded-lg flex items-center justify-center">
                            <Video className="h-8 w-8 text-stone-500" />
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                        <p className="text-xs text-stone-600 mt-1 truncate">{file.name}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleUploadUpdate}
                  disabled={uploading}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  {uploading ? 'Uploading...' : 'Submit Update'}
                </button>
                <button
                  onClick={() => {
                    setShowUpdateForm(false);
                    setUpdateMessage('');
                    setUpdateFiles([]);
                  }}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Timeline */}
      <div className="card">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">Production Timeline</h3>
        {timeline.length === 0 ? (
          <p className="text-stone-500 text-center py-8">No updates yet</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((update) => (
              <div key={update.id} className="flex items-start space-x-4 pb-4 border-b border-stone-100 last:border-0">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-wood-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-wood-600" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-stone-900">
                      {update.uploader?.full_name || 'Unknown'}
                      <span className="text-sm text-stone-500 ml-2 capitalize">
                        ({update.uploader?.role || 'Staff'})
                      </span>
                    </p>
                    <p className="text-sm text-stone-500">
                      {new Date(update.created_at).toLocaleString()}
                    </p>
                  </div>
                  <p className="text-stone-700 mt-1">{update.message}</p>
                  {update.media_url && (
                    <div className="mt-2">
                      {update.media_type === 'image' ? (
                        <img
                          src={update.media_url}
                          alt="Update"
                          className="w-full max-w-xs h-auto object-cover rounded-lg"
                        />
                      ) : (
                        <video
                          src={update.media_url}
                          controls
                          className="w-full max-w-xs h-auto object-cover rounded-lg"
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CarpenterProjectPage;
