import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Filter,
  Search,
  Layers,
  Sparkles,
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  ExternalLink,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import IssueCard from '../components/IssueCard';
import IssueDetailModal from '../components/IssueDetailModal';
import Toast from '../components/Toast';
import { CATEGORY_META, STATUS_META } from '../mockData';

// Custom Leaflet DivIcon generator
function createCustomMarkerIcon(category, status, memberCount = 1) {
  const meta = CATEGORY_META[category] || CATEGORY_META.other;
  const isCluster = memberCount > 1;

  const html = `
    <div class="custom-leaflet-marker ${isCluster ? 'cluster-marker' : ''}" style="--marker-color: ${meta.color}">
      <div class="marker-pin" style="background-color: ${meta.color};">
        ${isCluster ? `<span class="marker-count">${memberCount}</span>` : `<div class="marker-inner-dot"></div>`}
      </div>
      <div class="marker-pulse" style="border-color: ${meta.color};"></div>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-div-icon',
    html,
    iconSize: isCluster ? [36, 36] : [28, 28],
    iconAnchor: isCluster ? [18, 18] : [14, 14],
    popupAnchor: [0, -18],
  });
}

// Map helper to center on selected issue
function MapFocusHandler({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 15, { duration: 1.2 });
    }
  }, [center, map]);
  return null;
}

export default function LiveMap() {
  const [issues, setIssues] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [detailModalIssue, setDetailModalIssue] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchWard, setSearchWard] = useState('');
  const [showClustersOnly, setShowClustersOnly] = useState(false);
  const [mapFocus, setMapFocus] = useState(null);
  const [toast, setToast] = useState(null);

  // Fetch issues & clusters
  const fetchData = async () => {
    setLoading(true);
    try {
      const [issuesRes, clustersRes] = await Promise.all([
        api.getIssues({
          category: filterCategory || undefined,
          status: filterStatus || undefined,
          ward: searchWard || undefined,
        }),
        api.getClusters({
          category: filterCategory || undefined,
          status: filterStatus || undefined,
        }),
      ]);
      setIssues(issuesRes.issues || []);
      setClusters(clustersRes || []);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load issues' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterCategory, filterStatus, searchWard]);

  // Handle Upvoting
  const handleUpvote = async (issueId) => {
    try {
      const res = await api.upvoteIssue(issueId);
      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId
            ? { ...i, upvote_count: res.upvote_count, user_has_upvoted: true }
            : i
        )
      );
      if (detailModalIssue && detailModalIssue.id === issueId) {
        setDetailModalIssue((prev) => ({
          ...prev,
          upvote_count: res.upvote_count,
          user_has_upvoted: true,
        }));
      }
      setToast({ type: 'success', message: 'Issue priority upvoted!' });
    } catch (err) {
      setToast({ type: 'error', message: 'Could not submit upvote' });
    }
  };

  // Handle Card Click (focus on map & select)
  const handleSelectIssue = (issue) => {
    setSelectedIssue(issue);
    setMapFocus([issue.latitude, issue.longitude]);
  };

  // Filtered issues to display
  const displayedIssues = showClustersOnly
    ? issues.filter((i) => i.cluster_member_count > 1)
    : issues;

  // Default Center (Delhi NCR)
  const defaultCenter = [28.6139, 77.2090];

  return (
    <div className="live-map-page">
      {/* Top Filter & Control Header */}
      <div className="map-toolbar glass-card">
        <div className="toolbar-left">
          <div className="search-input-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ward / locality..."
              value={searchWard}
              onChange={(e) => setSearchWard(e.target.value)}
              className="toolbar-search-input"
            />
          </div>

          <div className="category-scroll-pills">
            <button
              onClick={() => setFilterCategory('')}
              className={`filter-pill ${filterCategory === '' ? 'active' : ''}`}
            >
              All Categories ({issues.length})
            </button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setFilterCategory(key === filterCategory ? '' : key)}
                className={`filter-pill ${filterCategory === key ? 'active' : ''}`}
                style={{
                  '--pill-color': meta.color,
                  borderColor: filterCategory === key ? meta.color : undefined,
                }}
              >
                <span className="pill-dot" style={{ backgroundColor: meta.color }} />
                {meta.label}
              </button>
            ))}
          </div>
        </div>

        <div className="toolbar-right">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="toolbar-select"
          >
            <option value="">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>

          <button
            onClick={() => setShowClustersOnly(!showClustersOnly)}
            className={`btn btn-sm ${showClustersOnly ? 'btn-primary' : 'btn-secondary'}`}
            title="Toggle DBSCAN clustered hot spots"
          >
            <Layers size={15} />
            <span>{showClustersOnly ? 'Clusters Only' : 'All Reports'}</span>
          </button>

          <Link to="/report" className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>New Report</span>
          </Link>
        </div>
      </div>

      {/* Main Content Layout: Map + Split Feed */}
      <div className="map-layout-container">
        {/* Left Side: Leaflet Dark Interactive Map */}
        <div className="map-viewport-wrapper glass-card">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%', borderRadius: 'var(--radius-lg)' }}
          >
            {/* CartoDB Dark Matter Tiles */}
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />

            <MapFocusHandler center={mapFocus} />

            {/* Cluster Circles Overlay */}
            {clusters.map((cluster) => (
              <CircleMarker
                key={cluster.id}
                center={[cluster.centroid_lat, cluster.centroid_lng]}
                radius={24 + Math.min(cluster.member_count * 4, 20)}
                pathOptions={{
                  color: CATEGORY_META[cluster.category]?.color || '#00d4ff',
                  fillColor: CATEGORY_META[cluster.category]?.color || '#00d4ff',
                  fillOpacity: 0.18,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            ))}

            {/* Individual & Clustered Issue Markers */}
            {displayedIssues.map((issue) => (
              <Marker
                key={issue.id}
                position={[issue.latitude, issue.longitude]}
                icon={createCustomMarkerIcon(
                  issue.category,
                  issue.status,
                  issue.cluster_member_count || 1
                )}
                eventHandlers={{
                  click: () => setSelectedIssue(issue),
                }}
              >
                <Popup className="dark-popup">
                  <div className="map-popup-inner">
                    {issue.photo_url && (
                      <div className="popup-photo">
                        <img src={issue.photo_url} alt={issue.category} />
                      </div>
                    )}
                    <div className="popup-body">
                      <div className="popup-badge-row">
                        <span className={`badge ${STATUS_META[issue.status]?.class || 'badge-reported'}`}>
                          {STATUS_META[issue.status]?.label || issue.status}
                        </span>
                        {issue.cluster_member_count > 1 && (
                          <span className="badge badge-assigned">
                            <Layers size={11} /> {issue.cluster_member_count} grouped
                          </span>
                        )}
                      </div>
                      <h4 className="popup-title">{issue.ward || 'Civic Issue'}</h4>
                      <p className="popup-desc">{issue.description || 'No description'}</p>

                      <div className="popup-footer">
                        <button
                          onClick={() => handleUpvote(issue.id)}
                          className={`upvote-btn-sm ${issue.user_has_upvoted ? 'voted' : ''}`}
                        >
                          <ThumbsUp size={12} />
                          <span>{issue.upvote_count || 0}</span>
                        </button>
                        <button
                          onClick={() => setDetailModalIssue(issue)}
                          className="btn btn-outline btn-xs"
                        >
                          <span>Full Detail</span>
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>

          {/* Floating Map Overlay Legend */}
          <div className="map-floating-legend glass-card">
            <div className="legend-title">Active Layers</div>
            <div className="legend-items">
              {Object.entries(CATEGORY_META).slice(0, 4).map(([key, meta]) => (
                <div key={key} className="legend-item">
                  <span className="legend-indicator" style={{ backgroundColor: meta.color }} />
                  <span>{meta.label.split(' ')[0]}</span>
                </div>
              ))}
              <div className="legend-item">
                <span className="legend-indicator-dashed" />
                <span>DBSCAN Cluster</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Issue Feed List */}
        <div className="map-feed-sidebar">
          <div className="feed-header">
            <div>
              <h3 className="feed-title">Civic Reports</h3>
              <span className="feed-count">
                Showing {displayedIssues.length} issues {showClustersOnly && '(Clusters only)'}
              </span>
            </div>
            <button onClick={fetchData} className="btn-icon" title="Refresh list">
              <RefreshCw size={15} className={loading ? 'spin' : ''} />
            </button>
          </div>

          <div className="feed-cards-scroll">
            {displayedIssues.length === 0 ? (
              <div className="empty-feed glass-card">
                <AlertCircle size={32} color="var(--text-muted)" />
                <h4>No reports match your filters</h4>
                <p>Try clearing your category or ward search filter.</p>
                <button
                  onClick={() => { setFilterCategory(''); setFilterStatus(''); setSearchWard(''); }}
                  className="btn btn-outline btn-sm"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              displayedIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  isSelected={selectedIssue?.id === issue.id}
                  onSelect={(item) => {
                    handleSelectIssue(item);
                    setDetailModalIssue(item);
                  }}
                  onUpvote={handleUpvote}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Issue Detail Modal */}
      {detailModalIssue && (
        <IssueDetailModal
          issue={detailModalIssue}
          onClose={() => setDetailModalIssue(null)}
          onUpvote={handleUpvote}
          onStatusUpdate={async (id, status, note) => {
            await api.updateStatus(id, { status, note });
            setToast({ type: 'success', message: 'Status updated successfully' });
            fetchData();
          }}
          onAssignDept={async (id, deptId) => {
            await api.assignDepartment(id, { department_id: deptId });
            setToast({ type: 'success', message: 'Assigned to department' });
            fetchData();
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
