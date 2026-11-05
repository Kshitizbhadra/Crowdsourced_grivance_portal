import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShieldCheck,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  Search,
  ArrowUpDown,
  Edit3,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  RefreshCw,
  Download
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueDetailModal from '../components/IssueDetailModal';
import Toast from '../components/Toast';
import { CATEGORY_META, STATUS_META } from '../mockData';

export default function AdminDashboard() {
  const { user, isAdmin, isDeptOfficer } = useAuth();

  const [activeTab, setActiveTab] = useState('issues'); // 'issues' or 'clusters'
  const [issues, setIssues] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [selectedIssueForDetail, setSelectedIssueForDetail] = useState(null);
  const [statusModalIssue, setStatusModalIssue] = useState(null);
  const [newStatus, setNewStatus] = useState('in_progress');
  const [statusNote, setStatusNote] = useState('');
  const [assignDeptModalIssue, setAssignDeptModalIssue] = useState(null);
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const [toast, setToast] = useState(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [issuesRes, clustersRes, deptsRes] = await Promise.all([
        api.getIssues({
          status: statusFilter || undefined,
          category: categoryFilter || undefined,
          ward: searchQuery || undefined,
        }),
        api.getClusters(),
        api.getDepartments(),
      ]);
      setIssues(issuesRes.issues || []);
      setClusters(clustersRes || []);
      setDepartments(deptsRes || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to fetch dashboard data' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter, categoryFilter, searchQuery]);

  // Status update handler
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!statusModalIssue) return;
    try {
      await api.updateStatus(statusModalIssue.id, { status: newStatus, note: statusNote }, user);
      setToast({ type: 'success', message: `Status updated to ${newStatus}` });
      setStatusModalIssue(null);
      setStatusNote('');
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to update status' });
    }
  };

  // Assign department handler
  const handleAssignDepartment = async (e) => {
    e.preventDefault();
    if (!assignDeptModalIssue || !selectedDeptId) return;
    try {
      await api.assignDepartment(assignDeptModalIssue.id, { department_id: selectedDeptId });
      setToast({ type: 'success', message: 'Department assigned successfully' });
      setAssignDeptModalIssue(null);
      loadData();
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to assign department' });
    }
  };

  // KPIs
  const reportedCount = issues.filter((i) => i.status === 'reported').length;
  const inProgressCount = issues.filter((i) => i.status === 'in_progress').length;
  const resolvedCount = issues.filter((i) => i.status === 'resolved').length;

  // Export issues as CSV
  const handleExportCSV = () => {
    if (issues.length === 0) {
      setToast({ type: 'error', message: 'No issues available to export' });
      return;
    }
    const headers = ['ID', 'Category', 'Ward', 'Latitude', 'Longitude', 'Status', 'Department', 'Upvotes', 'Reported Date', 'Description'];
    const rows = issues.map(i => [
      `"${i.id}"`,
      `"${i.category}"`,
      `"${i.ward || 'Central Ward'}"`,
      i.latitude,
      i.longitude,
      `"${i.status}"`,
      `"${i.department_name || 'Unassigned'}"`,
      i.upvote_count || 0,
      `"${new Date(i.created_at).toISOString()}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `crowdsourced_triage_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setToast({ type: 'success', message: 'Triage CSV report downloaded!' });
  };

  return (
    <div className="admin-dashboard-page">
      {/* Dashboard Top Header */}
      <div className="dashboard-header-strip">
        <div>
          <div className="dash-badge">
            <ShieldCheck size={14} color="var(--accent-cyan)" />
            <span>MUNICIPAL COMMAND CENTER</span>
          </div>
          <h1 className="dash-title">Civic Triaging & Operations</h1>
          <p className="dash-subtitle">
            Manage incoming citizen complaints, monitor AI cluster groupings, and assign tasks to departments.
          </p>
        </div>

        <div className="header-actions">
          <button onClick={handleExportCSV} className="btn btn-secondary btn-sm" title="Export current issues to CSV spreadsheet">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={loadData} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh Feed</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="kpi-grid">
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Pending Triage</span>
            <span className="kpi-icon status-reported-icon"><Clock size={18} /></span>
          </div>
          <div className="kpi-value text-amber">{reportedCount}</div>
          <span className="kpi-subtext">Needs department assignment</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">In Progress</span>
            <span className="kpi-icon status-progress-icon"><TrendingUp size={18} /></span>
          </div>
          <div className="kpi-value text-purple">{inProgressCount}</div>
          <span className="kpi-subtext">Work order currently active</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Resolved</span>
            <span className="kpi-icon status-resolved-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="kpi-value text-emerald">{resolvedCount}</div>
          <span className="kpi-subtext">Completed & audited</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">DBSCAN Clusters</span>
            <span className="kpi-icon status-cluster-icon"><Layers size={18} /></span>
          </div>
          <div className="kpi-value text-cyan">{clusters.length}</div>
          <span className="kpi-subtext">Spatial problem hotspots</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="dash-tabs-bar">
        <div className="tab-buttons">
          <button
            onClick={() => setActiveTab('issues')}
            className={`tab-btn ${activeTab === 'issues' ? 'active' : ''}`}
          >
            <span>All Issues ({issues.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('clusters')}
            className={`tab-btn ${activeTab === 'clusters' ? 'active' : ''}`}
          >
            <span>AI Spatial Clusters ({clusters.length})</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="tab-filters">
          <div className="filter-input-wrap">
            <Search size={14} />
            <input
              type="text"
              placeholder="Search ward / description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="dash-filter-input"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="dash-filter-select"
          >
            <option value="">All Categories</option>
            {Object.entries(CATEGORY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="dash-filter-select"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Tab Content: Issues Table */}
      {activeTab === 'issues' && (
        <div className="dash-table-container glass-card">
          <table className="dash-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Ward & Coordinates</th>
                <th>Description</th>
                <th>Cluster / Priority</th>
                <th>Assigned Dept</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => {
                const catMeta = CATEGORY_META[issue.category] || CATEGORY_META.other;
                const statMeta = STATUS_META[issue.status] || STATUS_META.reported;
                return (
                  <tr key={issue.id} className="table-row-hover">
                    <td>
                      <span
                        className="category-pill"
                        style={{ backgroundColor: `${catMeta.color}22`, color: catMeta.color }}
                      >
                        {catMeta.label}
                      </span>
                    </td>
                    <td>
                      <div className="table-ward-name">{issue.ward || 'Central Ward'}</div>
                      <div className="table-coords font-mono">
                        {issue.latitude?.toFixed(3)}, {issue.longitude?.toFixed(3)}
                      </div>
                    </td>
                    <td>
                      <div className="table-desc-text" title={issue.description}>
                        {issue.description || 'No description provided'}
                      </div>
                      <span className="table-meta-sub">
                        Reported {new Date(issue.created_at).toLocaleDateString()} by {issue.reporter_name || 'Citizen'}
                      </span>
                    </td>
                    <td>
                      {issue.cluster_member_count > 1 ? (
                        <span className="badge badge-assigned" title="Grouped by DBSCAN with nearby reports">
                          <Layers size={12} /> {issue.cluster_member_count} grouped
                        </span>
                      ) : (
                        <span className="badge badge-secondary">Single</span>
                      )}
                      <div className="table-upvotes">▲ {issue.upvote_count || 0} upvotes</div>
                    </td>
                    <td>
                      <span className="dept-label">
                        {issue.department_name || 'Unassigned'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statMeta.class}`}>
                        {statMeta.label}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          onClick={() => {
                            setStatusModalIssue(issue);
                            setNewStatus(issue.status);
                          }}
                          className="btn btn-secondary btn-xs"
                          title="Update Status"
                        >
                          <Edit3 size={13} />
                          <span>Status</span>
                        </button>

                        <button
                          onClick={() => {
                            setAssignDeptModalIssue(issue);
                            setSelectedDeptId(issue.assigned_department_id || '');
                          }}
                          className="btn btn-outline btn-xs"
                          title="Assign Department"
                        >
                          <Building2 size={13} />
                          <span>Assign</span>
                        </button>

                        <button
                          onClick={() => setSelectedIssueForDetail(issue)}
                          className="btn btn-icon btn-xs"
                          title="Full Details"
                        >
                          <ExternalLink size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tab Content: Clusters Table */}
      {activeTab === 'clusters' && (
        <div className="clusters-grid">
          {clusters.map((cluster) => {
            const catMeta = CATEGORY_META[cluster.category] || CATEGORY_META.other;
            const statMeta = STATUS_META[cluster.status] || STATUS_META.reported;
            return (
              <div key={cluster.id} className="glass-card cluster-card">
                <div className="cluster-top">
                  <span
                    className="category-pill"
                    style={{ backgroundColor: `${catMeta.color}22`, color: catMeta.color }}
                  >
                    {catMeta.label}
                  </span>
                  <span className={`badge ${statMeta.class}`}>
                    {statMeta.label}
                  </span>
                </div>

                <div className="cluster-body">
                  <div className="cluster-metric-row">
                    <div className="metric-box">
                      <span className="metric-num text-cyan">{cluster.member_count}</span>
                      <span className="metric-lbl">Clustered Reports</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-num font-mono">
                        {cluster.centroid_lat?.toFixed(3)}, {cluster.centroid_lng?.toFixed(3)}
                      </span>
                      <span className="metric-lbl">Spatial Centroid</span>
                    </div>
                  </div>

                  <div className="cluster-dept-info">
                    <Building2 size={15} color="var(--accent-cyan)" />
                    <span>{cluster.department_name || 'No department assigned yet'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Update Status Modal */}
      {statusModalIssue && (
        <div className="modal-backdrop" onClick={() => setStatusModalIssue(null)}>
          <div className="modal-content-sm glass-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Update Issue Status</h3>
            <p className="modal-subtitle">
              Issue in <strong>{statusModalIssue.ward}</strong> ({CATEGORY_META[statusModalIssue.category]?.label})
            </p>

            <form onSubmit={handleUpdateStatus}>
              <div className="form-group">
                <label className="form-label">New Status</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="reported">Reported (Logged)</option>
                  <option value="in_progress">In Progress (Work Dispatched)</option>
                  <option value="resolved">Resolved (Completed)</option>
                  <option value="rejected">Rejected (Invalid)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Audit Log Note / Work Order ID</label>
                <textarea
                  rows={3}
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="e.g. Dispatched asphalt repair crew under Work Order #RD-902..."
                  className="form-textarea"
                />
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  onClick={() => setStatusModalIssue(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Department Modal */}
      {assignDeptModalIssue && (
        <div className="modal-backdrop" onClick={() => setAssignDeptModalIssue(null)}>
          <div className="modal-content-sm glass-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Assign Department</h3>
            <p className="modal-subtitle">
              Route this issue to the responsible municipal authority
            </p>

            <form onSubmit={handleAssignDepartment}>
              <div className="form-group">
                <label className="form-label">Select Department</label>
                <select
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Select department...</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.contact_email})</option>
                  ))}
                </select>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  onClick={() => setAssignDeptModalIssue(null)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Assign Issue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Detail Modal */}
      {selectedIssueForDetail && (
        <IssueDetailModal
          issue={selectedIssueForDetail}
          onClose={() => setSelectedIssueForDetail(null)}
          departments={departments}
          onStatusUpdate={async (id, status, note) => {
            await api.updateStatus(id, { status, note }, user);
            setToast({ type: 'success', message: 'Status updated' });
            loadData();
          }}
          onAssignDept={async (id, deptId) => {
            await api.assignDepartment(id, { department_id: deptId });
            setToast({ type: 'success', message: 'Assigned to department' });
            loadData();
          }}
        />
      )}

      {/* Toast Notification */}
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
