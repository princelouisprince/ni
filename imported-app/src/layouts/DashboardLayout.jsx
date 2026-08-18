import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { signOut, getCurrentUser, getUserProfile } from '../lib/auth';
import toast from 'react-hot-toast';
import { LogOut, Bell, Home, Users, Hammer, TrendingUp, Package, ChevronDown } from 'lucide-react';

function getInitials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function DashboardLayout() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadUserData();
  }, []);

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

  const handleLogout = async () => {
    try {
      const { error } = await signOut();
      if (error) throw error;
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  };

  const navigationItems = {
    assistant: [
      { name: 'All Projects', href: '/assistant', icon: Home },
      { name: 'New Customer', href: '/assistant/customers/new', icon: Users },
      { name: 'New Project', href: '/assistant/projects/new', icon: Hammer },
    ],
    carpenter: [
      { name: 'My Projects', href: '/carpenter', icon: Home },
    ],
    cleaner: [
      { name: 'My Projects', href: '/cleaner', icon: Home },
    ],
    boss: [
      { name: 'Dashboard', href: '/boss', icon: TrendingUp },
    ],
  };

  const items = navigationItems[userRole] || [];

  // Page title from pathname
  const pageTitle = (() => {
    const seg = location.pathname.split('/').filter(Boolean);
    if (seg.length === 1) return 'My Projects';
    return 'Project Details';
  })();

  if (!user || !userRole) {
    return (
      <div className="dl-loading">
        <div className="dl-spinner" />
      </div>
    );
  }

  const initials = getInitials(user?.full_name);
  const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <div className="dl-root">
      {/* ── Sidebar ── */}
      <aside className="dl-sidebar">
        {/* Brand */}
        <div className="dl-brand">
          <div className="dl-brand-icon">
            <Package size={16} color="#fff" />
          </div>
          <div>
            <div className="dl-brand-name">NESTIA RW</div>
            <div className="dl-brand-sub">Workshop Management</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="dl-nav">
          {items.map((item) => {
            const active = location.pathname === item.href || location.pathname.startsWith(item.href + '/');
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.href)}
                className={`dl-nav-item${active ? ' dl-nav-item--active' : ''}`}
              >
                <item.icon size={16} />
                {item.name}
              </button>
            );
          })}
        </nav>

        {/* User info + sign out */}
        <div className="dl-user">
          <div className="dl-avatar dl-avatar--sm">{initials}</div>
          <div className="dl-user-info">
            <div className="dl-user-name">{user?.full_name || 'User'}</div>
            <div className="dl-user-role">{roleName}</div>
          </div>
        </div>
        <button onClick={handleLogout} className="dl-signout">
          <LogOut size={15} />
          Sign out
        </button>
      </aside>

      {/* ── Main ── */}
      <div className="dl-main">
        {/* Topbar */}
        <header className="dl-topbar">
          <span className="dl-topbar-title">{pageTitle}</span>
          <div className="dl-topbar-right">
            <button className="dl-bell">
              <Bell size={18} />
              <span className="dl-bell-dot" />
            </button>
            <div className="dl-topbar-user">
              <div className="dl-avatar dl-avatar--md">{initials}</div>
              <div>
                <div className="dl-topbar-uname">{user?.full_name || 'User'}</div>
                <div className="dl-topbar-urole">{roleName}</div>
              </div>
              <ChevronDown size={14} className="dl-topbar-chevron" />
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="dl-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
