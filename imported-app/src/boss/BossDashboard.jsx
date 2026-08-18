import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import DashboardLayout from '../layouts/DashboardLayout';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import { Package, Hammer, Sparkles, Truck, CheckCircle, Users, TrendingUp, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

function BossDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    inProduction: 0,
    readyForDelivery: 0,
    delivered: 0,
    totalCustomers: 0,
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadDashboardData();
  }, []);

  const loadUserData = async () => {
    try {
      const currentUser = await getCurrentUser();
      const profile = await getUserProfile(currentUser.id);
      setUser(profile);
    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error('Failed to load user data');
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all projects
      const { data: projectsData, error: projectsError } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (name, phone),
          carpenter:assigned_carpenter (full_name),
          cleaner:assigned_cleaner (full_name)
        `)
        .order('created_at', { ascending: false });

      if (projectsError) throw projectsError;
      setProjects(projectsData || []);

      // Load all customers
      const { data: customersData, error: customersError } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;
      setCustomers(customersData || []);

      calculateStats(projectsData || [], customersData || []);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsData, customersData) => {
    const stats = {
      totalProjects: projectsData.length,
      activeProjects: projectsData.filter(p => !['delivered', 'archived'].includes(p.status)).length,
      inProduction: projectsData.filter(p => p.status === 'in_production').length,
      readyForDelivery: projectsData.filter(p => p.status === 'ready_for_delivery').length,
      delivered: projectsData.filter(p => p.status === 'delivered').length,
      totalCustomers: customersData.length,
    };
    setStats(stats);
  };

  const getUpcomingDeliveries = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return projects
      .filter(p => {
        if (!p.delivery_date || p.status === 'delivered') return false;
        const deliveryDate = new Date(p.delivery_date);
        const diffTime = deliveryDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7; // Next 7 days
      })
      .sort((a, b) => new Date(a.delivery_date) - new Date(b.delivery_date))
      .slice(0, 5);
  };

  const getRecentProjects = () => {
    return projects.slice(0, 5);
  };

  const filteredProjects = projects.filter(project => {
    if (statusFilter === 'all') return true;
    return project.status === statusFilter;
  });

  if (loading) {
    return (
      <DashboardLayout userRole="boss" userName="Loading...">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wood-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  const upcomingDeliveries = getUpcomingDeliveries();
  const recentProjects = getRecentProjects();

  return (
    <DashboardLayout userRole="boss" userName={user?.full_name || 'Boss'}>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user?.full_name || 'Boss'}</h1>
          <p className="text-stone-600">Full visibility of all workshop operations.</p>
        </div>
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <DashboardCard title="Total Projects" value={stats.totalProjects} icon={Package} color="wood" />
          <DashboardCard title="Active Projects" value={stats.activeProjects} icon={TrendingUp} color="blue" />
          <DashboardCard title="In Production" value={stats.inProduction} icon={Hammer} color="purple" />
          <DashboardCard title="Ready for Delivery" value={stats.readyForDelivery} icon={Truck} color="orange" />
          <DashboardCard title="Delivered" value={stats.delivered} icon={CheckCircle} color="green" />
          <DashboardCard title="Total Customers" value={stats.totalCustomers} icon={Users} color="stone" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Projects */}
          <div className="card">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Recent Projects</h3>
            {recentProjects.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No projects yet</p>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/assistant/projects/${project.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{project.title}</p>
                      <p className="text-sm text-stone-500">{project.customers?.name || 'Unknown'}</p>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Deliveries */}
          <div className="card">
            <h3 className="text-lg font-semibold text-stone-900 mb-4">Upcoming Deliveries</h3>
            {upcomingDeliveries.length === 0 ? (
              <p className="text-stone-500 text-center py-8">No upcoming deliveries this week</p>
            ) : (
              <div className="space-y-3">
                {upcomingDeliveries.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 bg-stone-50 rounded-lg hover:bg-stone-100 cursor-pointer transition-colors"
                    onClick={() => navigate(`/assistant/projects/${project.id}`)}
                  >
                    <div className="flex-1">
                      <p className="font-medium text-stone-900">{project.title}</p>
                      <p className="text-sm text-stone-500">{project.customers?.name || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center text-stone-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span className="text-sm">
                        {project.delivery_date ? new Date(project.delivery_date).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* All Projects Table */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-stone-900">All Projects</h3>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field w-48"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="confirmed">Confirmed</option>
              <option value="assigned_to_carpenter">Assigned to Carpenter</option>
              <option value="in_production">In Production</option>
              <option value="ready_for_finishing">Ready for Finishing</option>
              <option value="finishing">Finishing</option>
              <option value="ready_for_delivery">Ready for Delivery</option>
              <option value="delivered">Delivered</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full mobile-table">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Customer</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Furniture</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Carpenter</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Cleaner</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Delivery</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProjects.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-stone-500">
                      No projects found
                    </td>
                  </tr>
                ) : (
                  filteredProjects.map((project) => (
                    <tr key={project.id} className="border-b border-stone-100 hover:bg-stone-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-stone-900">{project.customers?.name || 'N/A'}</p>
                          <p className="text-sm text-stone-500">{project.customers?.phone || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-stone-900">{project.title}</p>
                          <p className="text-sm text-stone-500">{project.furniture_type}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={project.status} />
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600">
                        {project.carpenter?.full_name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600">
                        {project.cleaner?.full_name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-sm text-stone-600">
                        {project.delivery_date ? new Date(project.delivery_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => navigate(`/assistant/projects/${project.id}`)}
                          className="text-wood-600 hover:text-wood-800 font-medium text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Project Status Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-stone-900 mb-4">Project Status Distribution</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { status: 'new', label: 'New', count: projects.filter(p => p.status === 'new').length },
              { status: 'confirmed', label: 'Confirmed', count: projects.filter(p => p.status === 'confirmed').length },
              { status: 'assigned_to_carpenter', label: 'Assigned', count: projects.filter(p => p.status === 'assigned_to_carpenter').length },
              { status: 'in_production', label: 'In Production', count: projects.filter(p => p.status === 'in_production').length },
              { status: 'ready_for_finishing', label: 'Ready for Finishing', count: projects.filter(p => p.status === 'ready_for_finishing').length },
              { status: 'finishing', label: 'Finishing', count: projects.filter(p => p.status === 'finishing').length },
              { status: 'ready_for_delivery', label: 'Ready for Delivery', count: projects.filter(p => p.status === 'ready_for_delivery').length },
              { status: 'delivered', label: 'Delivered', count: projects.filter(p => p.status === 'delivered').length },
              { status: 'archived', label: 'Archived', count: projects.filter(p => p.status === 'archived').length },
            ].map((item) => (
              <div key={item.status} className="text-center p-4 bg-stone-50 rounded-lg">
                <p className="text-2xl font-bold text-stone-900">{item.count}</p>
                <p className="text-sm text-stone-600">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default BossDashboard;
