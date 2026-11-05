import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ShieldCheck, Building2, Users, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';

export default function AuthPage() {
  const navigate = useNavigate();
  const { login, register, switchRole } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegister) {
        await register({ name, email, phone, password });
        setToast({ type: 'success', message: 'Account registered successfully!' });
      } else {
        await login(email, password);
        setToast({ type: 'success', message: 'Logged in successfully!' });
      }
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setToast({ type: 'error', message: err.response?.data?.error || 'Authentication failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (role) => {
    switchRole(role);
    setToast({ type: 'success', message: `Logged in as ${role.toUpperCase()}!` });
    setTimeout(() => navigate(role === 'citizen' ? '/' : '/admin'), 800);
  };

  return (
    <div className="auth-page-container">
      <div className="auth-cards-layout">
        {/* Left Side: Auth Form */}
        <div className="glass-card auth-main-card">
          <div className="auth-header">
            <h2 className="auth-title">
              {isRegister ? 'Create Citizen Account' : 'Sign in to CrowdSourced'}
            </h2>
            <p className="auth-subtitle">
              {isRegister
                ? 'Join thousands of citizens improving civic infrastructure'
                : 'Access your reported issues and municipal triage tools'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {isRegister && (
              <>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9999000002"
                    className="form-input"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@civic.in"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-block">
              {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
              <span>{loading ? 'Please wait...' : isRegister ? 'Register Account' : 'Sign In'}</span>
            </button>
          </form>

          <div className="auth-switch-prompt">
            <span>{isRegister ? 'Already have an account?' : "Don't have an account?"}</span>
            <button
              onClick={() => setIsRegister(!isRegister)}
              className="btn-text-link"
            >
              {isRegister ? 'Sign In' : 'Register Here'}
            </button>
          </div>
        </div>

        {/* Right Side: Quick Demo Login Cards */}
        <div className="glass-card quick-demo-card">
          <div className="demo-header">
            <span className="badge badge-assigned">Instant Demo Access</span>
            <h3>Test As Any Role</h3>
            <p>One-click instant login to test features across roles without filling forms:</p>
          </div>

          <div className="demo-roles-list">
            <button
              onClick={() => handleQuickLogin('admin')}
              className="demo-role-item interactive"
            >
              <div className="demo-icon-wrap" style={{ color: '#00d4ff', backgroundColor: 'rgba(0,212,255,0.1)' }}>
                <ShieldCheck size={24} />
              </div>
              <div className="demo-role-text">
                <div className="demo-role-title">Super Admin</div>
                <div className="demo-role-desc">Full access: triage issues, assign depts, view all clusters</div>
              </div>
              <ArrowRight size={16} className="demo-arrow" />
            </button>

            <button
              onClick={() => handleQuickLogin('department')}
              className="demo-role-item interactive"
            >
              <div className="demo-icon-wrap" style={{ color: '#8b5cf6', backgroundColor: 'rgba(139,92,246,0.1)' }}>
                <Building2 size={24} />
              </div>
              <div className="demo-role-text">
                <div className="demo-role-title">Department Officer</div>
                <div className="demo-role-desc">Roads & Sanitation: update status & work order logs</div>
              </div>
              <ArrowRight size={16} className="demo-arrow" />
            </button>

            <button
              onClick={() => handleQuickLogin('citizen')}
              className="demo-role-item interactive"
            >
              <div className="demo-icon-wrap" style={{ color: '#10b981', backgroundColor: 'rgba(16,185,129,0.1)' }}>
                <Users size={24} />
              </div>
              <div className="demo-role-text">
                <div className="demo-role-title">Citizen (Rahul Sharma)</div>
                <div className="demo-role-desc">Report new issues, geotag on map, upvote priorities</div>
              </div>
              <ArrowRight size={16} className="demo-arrow" />
            </button>
          </div>
        </div>
      </div>

      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
