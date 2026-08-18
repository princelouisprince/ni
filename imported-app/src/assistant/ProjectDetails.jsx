import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import DashboardLayout from '../layouts/DashboardLayout';
import { notificationService } from '../services/notificationService';
import toast from 'react-hot-toast';
import { ArrowLeft, User, Phone, Mail, MapPin, Calendar, Hammer, Sparkles, Clock, Image as ImageIcon, Check, X } from 'lucide-react';

function ProjectDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [customer, setCustomer] = useState(null);
  const [carpenters, setCarpenters] = useState([]);
  const [cleaners, setCleaners] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [designImages, setDesignImages] = useState([]);
  const [showAssignCarpenter, setShowAssignCarpenter] = useState(false);
  const [showAssignCleaner, setShowAssignCleaner] = useState(false);
  const [selectedCarpenter, setSelectedCarpenter] = useState('');
  const [selectedCleaner, setSelectedCleaner] = useState('');
  const [assigning, setAssigning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjectData();
    loadStaff();
  }, [id]);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      const profile = await getUserProfile(currentUser.id);
      setUser(profile);
      setUserRole(profile?.role || 'assistant');
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadProjectData = async () => {
    try {
      setLoading(true);
      await loadUserData();

      // Load project with customer and assigned staff
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (*),
          carpenter:assigned_carpenter (full_name),
          cleaner:assigned_cleaner (full_name)
        `)
        .eq('id', id)
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
      toast.error('Failed to load project');
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const [carpenterData, cleanerData] = await Promise.all([
        supabase.from('users').select('*').eq('role', 'carpenter'),
        supabase.from('users').select('*').eq('role', 'cleaner'),
      ]);

      setCarpenters(carpenterData.data || []);
      setCleaners(cleanerData.data || []);
    } catch (error) {
      console.error('Error loading staff:', error);
    }
  };

  const handleAssignCarpenter = async () => {
    if (!selectedCarpenter) {
      toast.error('Please select a carpenter');
      return;
    }

    setAssigning(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          assigned_carpenter: selectedCarpenter,
          status: 'assigned_to_carpenter',
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      const carpenter = carpenters.find(c => c.id === selectedCarpenter);

      // Add timeline entry
      await supabase.from('project_updates').insert([{
        project_id: id,
        uploaded_by: user.id,
        message: `Carpenter assigned: ${carpenter?.full_name}`,
      }]);

      // Send notification to carpenter
      await notificationService.notifyCarpenterAssignment({
        carpenterId: selectedCarpenter,
        carpenterEmail: carpenter?.email,
        projectTitle: project.title,
        customerName: customer?.name,
        projectId: id,
        deliveryDate: project.delivery_date,
      });

      toast.success('Carpenter assigned successfully');
      setShowAssignCarpenter(false);
      setSelectedCarpenter('');
      loadProjectData();
    } catch (error) {
      console.error('Error assigning carpenter:', error);
      toast.error('Failed to assign carpenter');
    } finally {
      setAssigning(false);
    }
  };

  const handleAssignCleaner = async () => {
    if (!selectedCleaner) {
      toast.error('Please select a cleaner');
      return;
    }

    setAssigning(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update({
          assigned_cleaner: selectedCleaner,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;

      const cleaner = cleaners.find(c => c.id === selectedCleaner);

      // Add timeline entry
      await supabase.from('project_updates').insert([{
        project_id: id,
        uploaded_by: user.id,
        message: `Cleaner assigned: ${cleaner?.full_name}`,
      }]);

      // Send notification to cleaner
      await notificationService.notifyReadyForFinishing({
        cleanerId: selectedCleaner,
        cleanerEmail: cleaner?.email,
        projectTitle: project.title,
        projectId: id,
      });

      toast.success('Cleaner assigned successfully');
      setShowAssignCleaner(false);
      setSelectedCleaner('');
      loadProjectData();
    } catch (error) {
      console.error('Error assigning cleaner:', error);
      toast.error('Failed to assign cleaner');
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout userRole="assistant" userName="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wood-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!project) {
    return (
      <DashboardLayout userRole="assistant" userName={user?.full_name || 'Assistant'}>
        <div className="text-center py-12">
          <p className="text-stone-600">Project not found</p>
          <button
            onClick={() => navigate('/assistant')}
            className="btn-primary mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout userRole={userRole || 'assistant'} userName={user?.full_name || 'Assistant'}>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate(userRole === 'boss' ? '/boss' : '/assistant')}
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

        {/* Customer Section */}
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
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="text-stone-900">{customer?.email || 'N/A'}</p>
                <p className="text-sm text-stone-500">Email</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="text-stone-900">{customer?.address || 'N/A'}</p>
                <p className="text-sm text-stone-500">Address</p>
              </div>
            </div>
          </div>
          {customer?.notes && (
            <div className="mt-4 p-3 bg-stone-50 rounded-lg">
              <p className="text-sm text-stone-600">{customer.notes}</p>
            </div>
          )}
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
              <p className="text-sm text-stone-500 mb-1">Budget</p>
              <p className="text-stone-900">{project.budget ? `${project.budget.toLocaleString()} RWF` : 'N/A'}</p>
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

        {/* Production Section */}
        <div className="card">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Production Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <Hammer className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="font-medium text-stone-900">{project.carpenter?.full_name || 'Unassigned'}</p>
                <p className="text-sm text-stone-500">Carpenter</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Sparkles className="h-5 w-5 text-stone-400 mt-0.5" />
              <div>
                <p className="font-medium text-stone-900">{project.cleaner?.full_name || 'Unassigned'}</p>
                <p className="text-sm text-stone-500">Cleaner</p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-4">
            {userRole === 'assistant' && !project.assigned_carpenter && (
              <button
                onClick={() => setShowAssignCarpenter(true)}
                className="btn-primary flex items-center"
              >
                <Hammer className="h-5 w-5 mr-2" />
                Assign Carpenter
              </button>
            )}
            {userRole === 'assistant' && !project.assigned_cleaner && project.status !== 'new' && (
              <button
                onClick={() => setShowAssignCleaner(true)}
                className="btn-primary flex items-center"
              >
                <Sparkles className="h-5 w-5 mr-2" />
                Assign Cleaner
              </button>
            )}
          </div>
        </div>

        {/* Timeline */}
        <div className="card">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Project Timeline</h3>
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
                            className="w-48 h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <video
                            src={update.media_url}
                            controls
                            className="w-48 h-32 object-cover rounded-lg"
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

        {/* Assign Carpenter Modal */}
        {showAssignCarpenter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Assign Carpenter</h3>
              <select
                value={selectedCarpenter}
                onChange={(e) => setSelectedCarpenter(e.target.value)}
                className="input-field mb-4"
              >
                <option value="">Select a carpenter</option>
                {carpenters.map(carpenter => (
                  <option key={carpenter.id} value={carpenter.id}>
                    {carpenter.full_name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
                <button
                  onClick={handleAssignCarpenter}
                  disabled={assigning || !selectedCarpenter}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignCarpenter(false);
                    setSelectedCarpenter('');
                  }}
                  className="btn-secondary flex items-center"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Cleaner Modal */}
        {showAssignCleaner && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Assign Cleaner</h3>
              <select
                value={selectedCleaner}
                onChange={(e) => setSelectedCleaner(e.target.value)}
                className="input-field mb-4"
              >
                <option value="">Select a cleaner</option>
                {cleaners.map(cleaner => (
                  <option key={cleaner.id} value={cleaner.id}>
                    {cleaner.full_name}
                  </option>
                ))}
              </select>
              <div className="flex gap-4">
                <button
                  onClick={handleAssignCleaner}
                  disabled={assigning || !selectedCleaner}
                  className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Check className="h-5 w-5 mr-2" />
                  {assigning ? 'Assigning...' : 'Assign'}
                </button>
                <button
                  onClick={() => {
                    setShowAssignCleaner(false);
                    setSelectedCleaner('');
                  }}
                  className="btn-secondary flex items-center"
                >
                  <X className="h-5 w-5 mr-2" />
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default ProjectDetails;
