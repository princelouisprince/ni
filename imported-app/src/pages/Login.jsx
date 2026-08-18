import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { signIn, getUserRole } from '../lib/auth';
import toast from 'react-hot-toast';
import { Eye, EyeOff, Package } from 'lucide-react';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);

      if (error) throw error;

      toast.success('Login successful');

      // Get user role to redirect appropriately
      const userId = data.user.id;
      const role = await getUserRole(userId);

      const roleRoutes = {
        assistant: '/assistant',
        carpenter: '/carpenter',
        cleaner: '/cleaner',
        boss: '/boss',
      };

      navigate(roleRoutes[role] || from, { replace: true });
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      {/* ── Left panel ── */}
      <div className="login-left">
        {/* Decorative circles */}
        <div className="login-circle login-circle--top" />
        <div className="login-circle login-circle--bottom" />

        {/* Brand */}
        <div className="login-brand">
          <div className="login-brand-icon">
            <Package size={20} color="#fff" />
          </div>
          <div>
            <div className="login-brand-name">NESTIA RW</div>
            <div className="login-brand-sub">Workshop Management System</div>
          </div>
        </div>

        {/* Hero copy */}
        <div className="login-hero">
          <h1 className="login-hero-title">
            From sketch to sofa&nbsp;— one workshop, one workflow.
          </h1>
          <p className="login-hero-body">
            Track custom sofas, beds, wardrobes and more across design,
            production, finishing and delivery — built for the people who make
            furniture.
          </p>
        </div>

        {/* Footer */}
        <div className="login-left-footer">
          © 2026 Nestia RW. Crafted in Rwanda.
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="login-right">
        <div className="login-form-wrap">
          <h2 className="login-form-title">Sign in</h2>
          <p className="login-form-subtitle">
            Use your workshop staff account to continue.
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            {/* Email */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-email">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="login-input"
                placeholder="your@email.com"
                required
              />
            </div>

            {/* Password */}
            <div className="login-field">
              <label className="login-label" htmlFor="login-password">
                Password
              </label>
              <div className="login-input-wrap">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="login-input login-input--pw"
                  placeholder="••••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="login-pw-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="login-submit"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
