import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import { Wrench, BarChart2, Scissors, CheckCircle2, ArrowRight } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import toast from 'react-hot-toast';

const STAT_CONFIG = [
  { key: 'assigned',           label: 'ASSIGNED',             icon: Wrench,       iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { key: 'inProduction',       label: 'IN PRODUCTION',        icon: BarChart2,    iconBg: '#fef3c7', iconColor: '#d97706' },
  { key: 'readyForFinishing',  label: 'READY FOR FINISHING',  icon: Scissors,     iconBg: '#f3f4f6', iconColor: '#374151' },
  { key: 'completed',          label: 'COMPLETED PRODUCTION', icon: CheckCircle2, iconBg: '#d1fae5', iconColor: '#059669' },
];

function CarpenterDashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ assigned: 0, inProduction: 0, readyForFinishing: 0, completed: 0 });
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const currentUser = await getCurrentUser();

      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (name, phone),
          project_updates (created_at, message)
        `)
        .eq('assigned_carpenter', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      setProjects(rows);
      setStats({
        assigned:          rows.filter(p => p.status === 'assigned_to_carpenter').length,
        inProduction:      rows.filter(p => p.status === 'in_production').length,
        readyForFinishing: rows.filter(p => p.status === 'ready_for_finishing').length,
        completed:         rows.filter(p => ['delivered', 'archived', 'completed_production'].includes(p.status)).length,
      });
    } catch (error) {
      console.error('Error loading projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const getLastUpdate = (project) => {
    if (!project.project_updates?.length) return null;
    const sorted = [...project.project_updates].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );
    return sorted[0];
  };

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="dl-spinner" />
      </div>
    );
  }

  return (
    <div className="cd-root">
      {/* Section heading */}
      <div className="cd-heading">
        <h1 className="cd-heading-title">My projects</h1>
        <p className="cd-heading-sub">Projects assigned to you for production.</p>
      </div>

      {/* Stat cards */}
      <div className="cd-stats">
        {STAT_CONFIG.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
          <div key={key} className="cd-stat-card">
            <div className="cd-stat-label">{label}</div>
            <div className="cd-stat-row">
              <span className="cd-stat-value">{stats[key]}</span>
              <div className="cd-stat-icon" style={{ background: iconBg }}>
                <Icon size={18} color={iconColor} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project list */}
      <div className="cd-list">
        {projects.length === 0 ? (
          <div className="cd-empty">No projects assigned to you yet.</div>
        ) : (
          projects.map((project) => {
            const lastUpdate = getLastUpdate(project);
            const deliveryDate = project.delivery_date
              ? new Date(project.delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null;
            const updateDate = lastUpdate
              ? new Date(lastUpdate.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : null;

            return (
              <div
                key={project.id}
                className="cd-project-row"
                onClick={() => navigate(`/carpenter/projects/${project.id}`)}
              >
                <div className="cd-project-info">
                  <div className="cd-project-name">{project.title}</div>
                  <div className="cd-project-meta">
                    {project.furniture_type}
                    {deliveryDate && <> · · Due {deliveryDate}</>}
                  </div>
                  {updateDate && (
                    <div className="cd-project-update">
                      Last update: {lastUpdate?.message ? `${lastUpdate.message} · ` : ''}
                      {updateDate}
                    </div>
                  )}
                </div>
                <div className="cd-project-right">
                  <StatusBadge status={project.status} />
                  <ArrowRight size={16} className="cd-project-arrow" />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CarpenterDashboard;
