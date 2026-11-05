import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  MapPin,
  PlusCircle,
  LayoutDashboard,
  BarChart3,
  User,
  LogIn,
  LogOut,
  ShieldCheck,
  Building2,
  Users,
  FileText,
  Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, switchRole } = useAuth();
  const location = useLocation();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-container">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          <div className="brand-icon-wrapper">
            <MapPin size={22} color="#06101e" strokeWidth={2.5} />
          </div>
          <div>
            <div className="brand-title">
              Crowd<span className="brand-highlight">Sourced</span>
            </div>
            <div className="brand-subtitle">Civic Intelligence & Triage</div>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${isActive('/') ? 'active' : ''}`}
          >
            <MapPin size={17} />
            <span>Live Map</span>
          </Link>

          <Link
            to="/report"
            className={`nav-link nav-btn-primary ${isActive('/report') ? 'active' : ''}`}
          >
            <PlusCircle size={17} />
            <span>Report Issue</span>
          </Link>

          <Link
            to="/admin"
            className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
          >
            <LayoutDashboard size={17} />
            <span>Triage & Admin</span>
          </Link>

          <Link
            to="/analytics"
            className={`nav-link ${isActive('/analytics') ? 'active' : ''}`}
          >
            <BarChart3 size={17} />
            <span>Analytics</span>
          </Link>

          <Link
            to="/my-reports"
            className={`nav-link ${isActive('/my-reports') ? 'active' : ''}`}
          >
            <FileText size={17} />
            <span>My Reports</span>
          </Link>
        </nav>

        {/* User / Role Switcher Actions */}
        <div className="nav-actions">
          {/* Quick Role Switcher Pill */}
          <div className="role-switcher-container">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="role-badge-btn"
              title="Click to switch simulated demo role"
            >
              {user?.role === 'admin' && <ShieldCheck size={14} color="#00d4ff" />}
              {user?.role === 'department' && <Building2 size={14} color="#8b5cf6" />}
              {user?.role === 'citizen' && <Users size={14} color="#10b981" />}
              <span className="role-name">{user?.role ? user.role.toUpperCase() : 'GUEST'}</span>
              <span className="role-switch-hint">Switch</span>
            </button>

            {roleMenuOpen && (
              <div className="role-dropdown-menu">
                <div className="dropdown-header">Switch Simulated Role</div>
                <button
                  onClick={() => { switchRole('admin'); setRoleMenuOpen(false); }}
                  className={`role-option ${user?.role === 'admin' ? 'selected' : ''}`}
                >
                  <ShieldCheck size={16} color="#00d4ff" />
                  <div>
                    <div className="role-opt-title">Super Admin</div>
                    <div className="role-opt-desc">Full triage & department assignment</div>
                  </div>
                </button>
                <button
                  onClick={() => { switchRole('department'); setRoleMenuOpen(false); }}
                  className={`role-option ${user?.role === 'department' ? 'selected' : ''}`}
                >
                  <Building2 size={16} color="#8b5cf6" />
                  <div>
                    <div className="role-opt-title">Department Officer</div>
                    <div className="role-opt-desc">Roads / Sanitation resolution workflow</div>
                  </div>
                </button>
                <button
                  onClick={() => { switchRole('citizen'); setRoleMenuOpen(false); }}
                  className={`role-option ${user?.role === 'citizen' ? 'selected' : ''}`}
                >
                  <Users size={16} color="#10b981" />
                  <div>
                    <div className="role-opt-title">Citizen</div>
                    <div className="role-opt-desc">Report issues, upvote, and track</div>
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* User profile / Logout */}
          {user ? (
            <div className="user-profile-badge">
              <span className="user-avatar">{user.name?.charAt(0) || 'U'}</span>
              <span className="user-name">{user.name?.split(' ')[0]}</span>
              <button onClick={logout} className="btn-icon" title="Logout">
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-outline btn-sm">
              <LogIn size={15} /> Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
