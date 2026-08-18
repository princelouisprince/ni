import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { supabase } from '../lib/supabase';
import { getCurrentUser } from '../lib/auth';
import {
  Package, Plus, Hammer, Truck, CheckCircle2,
  Users, Search, ArrowRight, SlidersHorizontal,
} from 'lucide-react';
import toast from 'react-hot-toast';

const STAT_CONFIG = [
  { key: 'active',           label: 'ACTIVE PROJECTS',    icon: Package,       iconBg: '#ede9fe', iconColor: '#7c3aed' },
  { key: 'new',              label: 'NEW ORDERS',         icon: Plus,          iconBg: '#dbeafe', iconColor: '#2563eb' },
  { key: 'inProduction',     label: 'IN PRODUCTION',      icon: Hammer,        iconBg: '#fef3c7', iconColor: '#d97706' },
  { key: 'readyForDelivery', label: 'READY FOR DELIVERY', icon: Truck,         iconBg: '#fce7f3', iconColor: '#db2777' },
  { key: 'completed',        label: 'DELIVERED',          icon: CheckCircle2,  iconBg: '#d1fae5', iconColor: '#059669' },
];

const STATUS_OPTIONS = [
  { value: 'all',                  label: 'All statuses' },
  { value: 'new',                  label: 'New' },
  { value: 'confirmed',            label: 'Confirmed' },
  { value: 'assigned_to_carpenter',label: 'Assigned' },
  { value: 'in_production',        label: 'In production' },
  { value: 'ready_for_finishing',  label: 'Ready for finishing' },
  { value: 'ready_for_delivery',   label: 'Ready for delivery' },
  { value: 'delivered',            label: 'Delivered' },
];

function AssistantDashboard() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ active: 0, new: 0, inProduction: 0, readyForDelivery: 0, completed: 0 });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          customers:customer_id (name, phone, email),
          carpenter:assigned_carpenter (full_name),
          cleaner:assigned_cleaner (full_name),
          project_updates (created_at, message)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = data || [];
      setProjects(rows);
      setStats({
        active:           rows.filter(p => !['delivered', 'archived'].includes(p.status)).length,
        new:              rows.filter(p => p.status === 'new').length,
        inProduction:     rows.filter(p => p.status === 'in_production').length,
        readyForDelivery: rows.filter(p => p.status === 'ready_for_delivery').length,
        completed:        rows.filter(p => p.status === 'delivered').length,
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
    return [...project.project_updates].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    )[0];
  };

  const filtered = projects.filter((p) => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      p.customers?.name?.toLowerCase().includes(q) ||
      p.title?.toLowerCase().includes(q) ||
      p.furniture_type?.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) {
    return (
      <div className="cd-loading">
        <div className="dl-spinner" />
      </div>
    );
  }

  return (
    <div className="cd-root">
      {/* Heading + quick actions */}
      <div className="ad-header">
        <div>
          <h1 className="cd-heading-title">All Projects</h1>
          <p className="cd-heading-sub">Manage customer orders and coordinate production.</p>
        </div>
        <div className="ad-actions">
          <button className="ad-btn-outline" onClick={() => navigate('/assistant/customers/new')}>
            <Users size={15} />
            New customer
          </button>
          <button className="ad-btn-primary" onClick={() => navigate('/assistant/projects/new')}>
            <Plus size={15} />
            New project
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="ad-stats">
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

      {/* Search + filter bar */}
      <div className="ad-filter-bar">
        <div className="ad-search-wrap">
          <Search size={15} className="ad-search-icon" />
          <input
            type="text"
            className="ad-search"
            placeholder="Search customer, title, furniture…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="ad-select-wrap">
          <SlidersHorizontal size={14} className="ad-select-icon" />
          <select
            className="ad-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Project list */}
      <div className="cd-list">
        {filtered.length === 0 ? (
          <div className="cd-empty">No projects found.</div>
        ) : (
          filtered.map((project) => {
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
                onClick={() => navigate(`/assistant/projects/${project.id}`)}
              >
                <div className="cd-project-info">
                  <div className="cd-project-name">{project.title}</div>
                  <div className="cd-project-meta">
                    {project.furniture_type}
                    {project.customers?.name && <> · {project.customers.name}</>}
                    {deliveryDate && <> · · Due {deliveryDate}</>}
                  </div>
                  {updateDate && (
                    <div className="cd-project-update">
                      Last update:{lastUpdate?.message ? ` ${lastUpdate.message} · ` : ' '}
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

export default AssistantDashboard;
