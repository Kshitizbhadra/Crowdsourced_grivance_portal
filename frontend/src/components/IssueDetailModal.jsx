import React, { useState } from 'react';
import {
  X,
  MapPin,
  Clock,
  ThumbsUp,
  Layers,
  Building2,
  User,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Send
} from 'lucide-react';
import { CATEGORY_META, STATUS_META } from '../mockData';
import { useAuth } from '../context/AuthContext';

export default function IssueDetailModal({ issue, onClose, onUpvote, onStatusUpdate, onAssignDept, departments = [] }) {
  const { isDeptOfficer, isAdmin } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState(issue?.status || 'reported');
  const [statusNote, setStatusNote] = useState('');
  const [selectedDept, setSelectedDept] = useState(issue?.assigned_department_id || '');
  const [isUpdating, setIsUpdating] = useState(false);

  if (!issue) return null;

  const categoryMeta = CATEGORY_META[issue.category] || CATEGORY_META.other;
  const statusMeta = STATUS_META[issue.status] || STATUS_META.reported;

  const handleStatusSubmit = async (e) => {
    e.preventDefault();
    if (!onStatusUpdate) return;
    setIsUpdating(true);
    try {
      await onStatusUpdate(issue.id, selectedStatus, statusNote);
      setStatusNote('');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    if (!onAssignDept || !selectedDept) return;
    setIsUpdating(true);
    try {
      await onAssignDept(issue.id, selectedDept);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusSteps = ['reported', 'in_progress', 'resolved'];
  const currentStepIdx = statusSteps.indexOf(issue.status);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <span
              className="category-pill"
              style={{ backgroundColor: `${categoryMeta.color}22`, color: categoryMeta.color, borderColor: `${categoryMeta.color}66` }}
            >
              {categoryMeta.label}
            </span>
            <span className={`badge ${statusMeta.class}`}>
              {statusMeta.label}
            </span>
            {issue.cluster_member_count > 1 && (
              <span className="badge badge-assigned">
                <Layers size={12} /> {issue.cluster_member_count} Grouped Reports
              </span>
            )}
          </div>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Grid */}
        <div className="modal-body-grid">
          {/* Left Column: Media & Primary Details */}
          <div className="modal-left-col">
            {issue.photo_url ? (
              <div className="detail-media-box">
                <img src={issue.photo_url} alt={issue.category} />
              </div>
            ) : (
              <div className="detail-media-placeholder">
                <MapPin size={48} color="var(--accent-cyan)" />
                <span>Geotagged Report (No photo attached)</span>
              </div>
            )}

            <div className="detail-section">
              <h3 className="section-title">Issue Description</h3>
              <p className="detail-description-text">
                {issue.description || 'No detailed text provided by the citizen.'}
              </p>
            </div>

            <div className="detail-metadata-grid">
              <div className="meta-box">
                <span className="meta-label">Location / Ward</span>
                <span className="meta-value">{issue.ward || 'Central Ward'}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Coordinates</span>
                <span className="meta-value font-mono">
                  {issue.latitude?.toFixed(4)}, {issue.longitude?.toFixed(4)}
                </span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Reported By</span>
                <span className="meta-value">{issue.reporter_name || 'Anonymous Citizen'}</span>
              </div>
              <div className="meta-box">
                <span className="meta-label">Assigned Department</span>
                <span className="meta-value">{issue.department_name || 'Pending Assignment'}</span>
              </div>
            </div>

            {/* Upvote Call-to-action */}
            <div className="upvote-action-bar">
              <button
                onClick={() => onUpvote && onUpvote(issue.id)}
                className={`btn ${issue.user_has_upvoted ? 'btn-secondary' : 'btn-primary'} btn-upvote-large`}
              >
                <ThumbsUp size={18} />
                <span>{issue.user_has_upvoted ? 'Upvoted' : 'Upvote Issue Priority'} ({issue.upvote_count || 0})</span>
              </button>
              <span className="upvote-hint">High upvotes escalate priority in municipal queue</span>
            </div>
          </div>

          {/* Right Column: Status Progression & Audit Log & Triage Actions */}
          <div className="modal-right-col">
            {/* Status Progress Stepper */}
            <div className="stepper-box">
              <h4 className="section-title">Resolution Workflow</h4>
              <div className="step-progress-bar">
                {statusSteps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx;
                  const isCurrent = issue.status === step;
                  return (
                    <div key={step} className={`step-item ${isDone ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}>
                      <div className="step-circle">
                        {isDone ? <CheckCircle2 size={16} /> : idx + 1}
                      </div>
                      <span className="step-name">{STATUS_META[step]?.label || step}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status Audit Log Timeline */}
            <div className="timeline-box">
              <h4 className="section-title">Audit Trail & Activity</h4>
              <div className="timeline-list">
                {issue.status_logs && issue.status_logs.length > 0 ? (
                  issue.status_logs.map((log, i) => (
                    <div key={log.id || i} className="timeline-entry">
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <div className="timeline-heading">
                          <span className="timeline-author">{log.changed_by_name || 'Officer'}</span>
                          <span className="timeline-time">
                            {new Date(log.changed_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <div className="timeline-status-change">
                          {log.old_status ? (
                            <span>Transitioned from <strong>{log.old_status}</strong> to <strong>{log.new_status}</strong></span>
                          ) : (
                            <span>Status set to <strong>{log.new_status}</strong></span>
                          )}
                        </div>
                        {log.note && <p className="timeline-note">{log.note}</p>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted" style={{ fontSize: '0.875rem' }}>No status logs recorded yet.</p>
                )}
              </div>
            </div>

            {/* Clustered Siblings if present */}
            {issue.cluster_siblings && issue.cluster_siblings.length > 0 && (
              <div className="cluster-siblings-box">
                <h4 className="section-title">Nearby Reports in this Cluster ({issue.cluster_siblings.length})</h4>
                <div className="siblings-list">
                  {issue.cluster_siblings.map((sib) => (
                    <div key={sib.id} className="sibling-item">
                      <div className="sibling-dot" />
                      <div className="sibling-info">
                        <p className="sibling-desc">{sib.description || 'Nearby identical report'}</p>
                        <span className="sibling-meta">
                          Reported by {sib.reporter_name || 'Citizen'} • {new Date(sib.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Municipal Officer / Admin Action Panel */}
            {isDeptOfficer && (
              <div className="triage-action-card glass-card">
                <div className="triage-title">
                  <ShieldCheck size={16} color="var(--accent-cyan)" />
                  <span>Municipal Triage Actions</span>
                </div>

                <form onSubmit={handleStatusSubmit} className="triage-form">
                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <label className="form-label" style={{ fontSize: '0.8125rem' }}>Update Status</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="form-select"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    >
                      <option value="reported">Reported</option>
                      <option value="in_progress">In Progress (Work Dispatched)</option>
                      <option value="resolved">Resolved (Completed)</option>
                      <option value="rejected">Rejected (Out of Scope / Invalid)</option>
                    </select>
                  </div>

                  <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                    <input
                      type="text"
                      value={statusNote}
                      onChange={(e) => setStatusNote(e.target.value)}
                      placeholder="Add status change notes or work order ID..."
                      className="form-input"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating || selectedStatus === issue.status}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                  >
                    {isUpdating ? 'Updating...' : 'Save Status Update'}
                  </button>
                </form>

                {/* Admin-only Department Assignment */}
                {isAdmin && departments.length > 0 && (
                  <form onSubmit={handleDeptSubmit} className="dept-assign-form" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8125rem' }}>Assign Department</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="form-select"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                      >
                        <option value="">Select Department...</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="submit"
                      disabled={isUpdating || !selectedDept}
                      className="btn btn-secondary"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '0.875rem' }}
                    >
                      Assign Department
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
