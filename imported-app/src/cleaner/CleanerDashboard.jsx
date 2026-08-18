import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { getCurrentUser, getUserProfile } from '../lib/auth';
import { Home, Sparkles, Package, Truck, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

function CleanerDashboard() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({
    awaitingFinishing: 0,
    finishing: 0,
    readyForDelivery: 0,
  });
  const navigate = useNavigate();

  useEffect(() => {
    loadUserData();
    loadProjects();
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

  const loadProjects = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();
      
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (name, phone),
          project_updates (
            created_at,
            message
          )
        `)
        .eq('assigned_cleaner', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProjects(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (projectsData) => {
    const stats = {
      awaitingFinishing: projectsData.filter(p => p.status === 'ready_for_finishing').length,
      finishing: projectsData.filter(p => p.status === 'finishing').length,
      readyForDelivery: projectsData.filter(p => p.status === 'ready_for_delivery').length,
    };
    setStats(stats);
  };

  const getLastUpdate = (project) => {
    if (!project.project_updates || project.project_updates.length === 0) {
      return 'No updates';
    }
    const lastUpdate = project.project_updates[project.project_updates.length - 1];
    return new Date(lastUpdate.created_at).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wood-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Welcome back, {user?.full_name || 'Cleaner'}</h1>
        <p className="text-stone-600">Manage your assigned finishing projects.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <DashboardCard title="Awaiting Finishing" value={stats.awaitingFinishing} icon={Clock} color="wood" />
        <DashboardCard title="Finishing" value={stats.finishing} icon={Sparkles} color="purple" />
        <DashboardCard title="Ready for Delivery" value={stats.readyForDelivery} icon={Truck} color="green" />
      </div>

      {/* My Projects Section */}
      <div className="card">
        <h3 className="text-lg font-semibold text-stone-900 mb-4">My Projects</h3>
        
        {projects.length === 0 ? (
          <div className="text-center py-8 text-stone-500">
            No projects assigned to you yet
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="border border-stone-200 rounded-lg p-4 hover:bg-stone-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-stone-900">{project.title}</h4>
                        <p className="text-sm text-stone-600">{project.customers?.name || 'Unknown Customer'}</p>
                        <p className="text-sm text-stone-500">{project.furniture_type}</p>
                      </div>
                      <div className="mt-2 md:mt-0">
                        <StatusBadge status={project.status} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:flex-row md:items-center gap-4 text-sm text-stone-600">
                    <div>
                      <p className="text-xs text-stone-500">Delivery</p>
                      <p>{project.delivery_date ? new Date(project.delivery_date).toLocaleDateString() : 'TBD'}</p>
                    </div>
                    <button
                      onClick={() => navigate(`/cleaner/projects/${project.id}`)}
                      className="btn-primary text-sm"
                    >
                      View Project
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CleanerDashboard;
