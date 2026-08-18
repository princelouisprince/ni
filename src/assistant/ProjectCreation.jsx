import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import toast from 'react-hot-toast';
import { ArrowLeft, Save, X, Plus, Upload, XCircle } from 'lucide-react';

const FURNITURE_TYPES = [
  'Sofa',
  'Bed',
  'TV Stand',
  'Wardrobe',
  'Dining Table',
  'Chair',
  'Custom',
  'Other',
];

function ProjectCreation() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  });
  const [designFiles, setDesignFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [formData, setFormData] = useState({
    title: '',
    furniture_type: 'Sofa',
    description: '',
    textile: '',
    dimensions: '',
    color: '',
    quantity: 1,
    budget: '',
    delivery_date: '',
  });
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadCustomers();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      const profile = await getUserProfile(currentUser.id);
      setUser(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!selectedCustomer && !showNewCustomerForm) {
      newErrors.customer = 'Please select or create a customer';
    }
    
    if (showNewCustomerForm) {
      if (!newCustomer.name.trim()) newErrors.newCustomerName = 'Customer name is required';
      if (!newCustomer.phone.trim()) newErrors.newCustomerPhone = 'Phone number is required';
    }
    
    if (!formData.title.trim()) newErrors.title = 'Project title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.quantity || formData.quantity < 1) newErrors.quantity = 'Quantity must be at least 1';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.phone.trim()) {
      toast.error('Please fill in customer name and phone');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          name: newCustomer.name.trim(),
          phone: newCustomer.phone.trim(),
          email: newCustomer.email.trim() || null,
          address: newCustomer.address.trim() || null,
          notes: newCustomer.notes.trim() || null,
        }])
        .select()
        .single();

      if (error) throw error;

      setSelectedCustomer(data);
      setCustomers([...customers, data]);
      setShowNewCustomerForm(false);
      setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
      toast.success('Customer created successfully');
    } catch (error) {
      console.error('Error creating customer:', error);
      toast.error('Failed to create customer');
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    const validFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length !== files.length) {
      toast.error('Only image files are allowed');
    }
    
    setDesignFiles(prev => [...prev, ...validFiles]);
  };

  const removeFile = (index) => {
    setDesignFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadDesignImages = async (projectId) => {
    const uploadPromises = designFiles.map(async (file) => {
      const fileName = `${projectId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('customer-designs')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      return fileName;
    });

    try {
      return await Promise.all(uploadPromises);
    } catch (error) {
      console.error('Error uploading designs:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setSubmitting(true);

    try {
      let customerId = selectedCustomer?.id;

      // Create new customer if needed
      if (showNewCustomerForm && !customerId) {
        const { data, error } = await supabase
          .from('customers')
          .insert([{
            name: newCustomer.name.trim(),
            phone: newCustomer.phone.trim(),
            email: newCustomer.email.trim() || null,
            address: newCustomer.address.trim() || null,
            notes: newCustomer.notes.trim() || null,
          }])
          .select()
          .single();

        if (error) throw error;
        customerId = data.id;
      }

      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert([{
          customer_id: customerId,
          title: formData.title.trim(),
          furniture_type: formData.furniture_type,
          description: formData.description.trim(),
          textile: formData.textile.trim() || null,
          dimensions: formData.dimensions.trim() || null,
          color: formData.color.trim() || null,
          quantity: parseInt(formData.quantity),
          budget: formData.budget ? parseFloat(formData.budget) : null,
          delivery_date: formData.delivery_date || null,
          status: 'new',
        }])
        .select()
        .single();

      if (projectError) throw projectError;

      // Upload design images
      if (designFiles.length > 0) {
        try {
          await uploadDesignImages(project.id);
        } catch (uploadError) {
          console.error('Upload failed:', uploadError);
          toast.error('Project created but some images failed to upload');
          // Don't throw here - project was created successfully
        }
      }

      toast.success('Project created successfully');
      navigate(`/assistant/projects/${project.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error(error.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
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

  return (
    <DashboardLayout userRole="assistant" userName={user?.full_name || 'Assistant'}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => navigate('/assistant')}
            className="flex items-center text-stone-600 hover:text-stone-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to dashboard
          </button>
          <h1 className="text-2xl font-bold text-stone-900">New project</h1>
          <p className="text-stone-600">Create a new furniture project for a customer.</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer Selection */}
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Customer</h3>
              
              {!showNewCustomerForm ? (
                <div className="space-y-4">
                  <select
                    value={selectedCustomer?.id || ''}
                    onChange={(e) => setSelectedCustomer(customers.find(c => c.id === e.target.value))}
                    className={`input-field ${errors.customer ? 'border-red-500' : ''}`}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                  
                  <button
                    type="button"
                    onClick={() => setShowNewCustomerForm(true)}
                    className="btn-secondary flex items-center"
                  >
                    <Plus className="h-5 w-5 mr-2" />
                    Create New Customer
                  </button>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-stone-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Name *</label>
                      <input
                        type="text"
                        value={newCustomer.name}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                        className={`input-field ${errors.newCustomerName ? 'border-red-500' : ''}`}
                        placeholder="Customer name"
                      />
                      {errors.newCustomerName && <p className="text-red-500 text-sm mt-1">{errors.newCustomerName}</p>}
                    </div>
                    <div>
                      <label className="label">Phone *</label>
                      <input
                        type="tel"
                        value={newCustomer.phone}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                        className={`input-field ${errors.newCustomerPhone ? 'border-red-500' : ''}`}
                        placeholder="Phone number"
                      />
                      {errors.newCustomerPhone && <p className="text-red-500 text-sm mt-1">{errors.newCustomerPhone}</p>}
                    </div>
                    <div>
                      <label className="label">Email</label>
                      <input
                        type="email"
                        value={newCustomer.email}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                        className="input-field"
                        placeholder="Email"
                      />
                    </div>
                    <div>
                      <label className="label">Address</label>
                      <input
                        type="text"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                        className="input-field"
                        placeholder="Address"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="label">Notes</label>
                    <textarea
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                      className="input-field"
                      rows="2"
                      placeholder="Additional notes"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handleCreateCustomer}
                      className="btn-primary flex items-center"
                    >
                      <Save className="h-5 w-5 mr-2" />
                      Add Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewCustomerForm(false);
                        setNewCustomer({ name: '', phone: '', email: '', address: '', notes: '' });
                      }}
                      className="btn-secondary flex items-center"
                    >
                      <X className="h-5 w-5 mr-2" />
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Project Details */}
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Project Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Project Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className={`input-field ${errors.title ? 'border-red-500' : ''}`}
                    placeholder="Custom Living Room Sofa"
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="label">Furniture Type *</label>
                  <select
                    name="furniture_type"
                    value={formData.furniture_type}
                    onChange={handleChange}
                    className="input-field"
                  >
                    {FURNITURE_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="label">Description *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    className={`input-field ${errors.description ? 'border-red-500' : ''}`}
                    rows="3"
                    placeholder="Detailed description of the furniture piece"
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <label className="label">Textile/Material</label>
                  <input
                    type="text"
                    name="textile"
                    value={formData.textile}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Fabric type, leather, etc."
                  />
                </div>

                <div>
                  <label className="label">Dimensions</label>
                  <input
                    type="text"
                    name="dimensions"
                    value={formData.dimensions}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="200cm x 90cm x 85cm"
                  />
                </div>

                <div>
                  <label className="label">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Navy blue, gray, etc."
                  />
                </div>

                <div>
                  <label className="label">Quantity *</label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    className={`input-field ${errors.quantity ? 'border-red-500' : ''}`}
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                <div>
                  <label className="label">Budget (RWF)</label>
                  <input
                    type="number"
                    name="budget"
                    value={formData.budget}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="500000"
                  />
                </div>

                <div>
                  <label className="label">Delivery Date</label>
                  <input
                    type="date"
                    name="delivery_date"
                    value={formData.delivery_date}
                    onChange={handleChange}
                    className="input-field"
                  />
                </div>
              </div>
            </div>

            {/* Design Images */}
            <div>
              <h3 className="text-lg font-semibold text-stone-900 mb-4">Design Images</h3>
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-8 text-center">
                <input
                  type="file"
                  id="design-images"
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <label
                  htmlFor="design-images"
                  className="cursor-pointer"
                >
                  <Upload className="h-12 w-12 text-stone-400 mx-auto mb-4" />
                  <p className="text-stone-600 mb-2">Click to upload design images</p>
                  <p className="text-sm text-stone-500">PNG, JPG, GIF up to 10MB each</p>
                </label>
              </div>

              {designFiles.length > 0 && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {designFiles.map((file, index) => (
                    <div key={index} className="relative">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
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

            {/* Submit */}
            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="h-5 w-5 mr-2" />
                {submitting ? 'Creating Project...' : 'Create Project'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/assistant')}
                className="btn-secondary flex items-center"
              >
                <X className="h-5 w-5 mr-2" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default ProjectCreation;
