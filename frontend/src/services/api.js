import axios from 'axios';
import { MOCK_ISSUES, MOCK_CLUSTERS, MOCK_DEPARTMENTS, MOCK_USERS } from '../mockData';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 5000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to attach access token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('cs_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Local in-memory state initialized with mock data
let localIssues = [...MOCK_ISSUES];
let localClusters = [...MOCK_CLUSTERS];
let localDepartments = [...MOCK_DEPARTMENTS];

// Helper to calculate distance in km using Haversine formula
function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const api = {
  // --- AUTH ---
  async login(email, password) {
    try {
      const res = await apiClient.post('/auth/login', { email, password });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend unreachable or auth failed, using local mock auth:', err.message);
      const user = MOCK_USERS.find((u) => u.email === email) || {
        id: `u-${Date.now()}`,
        name: email.split('@')[0],
        email,
        role: email.includes('admin') ? 'admin' : email.includes('dept') ? 'department' : 'citizen',
        department_id: email.includes('dept') ? MOCK_DEPARTMENTS[0].id : null,
      };
      const token = `mock_token_${Date.now()}`;
      return { user, accessToken: token };
    }
  },

  async register(data) {
    try {
      const res = await apiClient.post('/auth/register', data);
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for register:', err.message);
      const user = {
        id: `u-${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        role: data.role || 'citizen',
        department_id: null,
      };
      return { user, accessToken: `mock_token_${Date.now()}` };
    }
  },

  async getCurrentUser() {
    try {
      const res = await apiClient.get('/auth/me');
      return res.data;
    } catch (err) {
      return null;
    }
  },

  // --- ISSUES ---
  async getIssues(params = {}) {
    try {
      const res = await apiClient.get('/issues', { params });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend unreachable, returning local mock issues:', err.message);
      let filtered = [...localIssues];
      if (params.category) filtered = filtered.filter((i) => i.category === params.category);
      if (params.status) filtered = filtered.filter((i) => i.status === params.status);
      if (params.ward) filtered = filtered.filter((i) => i.ward?.toLowerCase().includes(params.ward.toLowerCase()));
      if (params.user_id) filtered = filtered.filter((i) => i.user_id === params.user_id);
      return {
        issues: filtered,
        total: filtered.length,
        page: 1,
        limit: 50,
      };
    }
  },

  async getIssueDetail(id) {
    try {
      const res = await apiClient.get(`/issues/${id}`);
      return res.data;
    } catch (err) {
      console.warn('[API] Backend unreachable, returning local mock issue detail:', err.message);
      const issue = localIssues.find((i) => i.id === id);
      if (!issue) throw new Error('Issue not found');
      const siblings = localIssues.filter((i) => i.cluster_id === issue.cluster_id && i.id !== id);
      return {
        ...issue,
        cluster_siblings: siblings,
        status_logs: issue.status_logs || [
          {
            id: '1',
            old_status: null,
            new_status: issue.status,
            changed_by_name: issue.reporter_name || 'Citizen',
            changed_at: issue.created_at,
            note: 'Issue reported',
          },
        ],
      };
    }
  },

  async createIssue(formData, currentUser) {
    try {
      const res = await apiClient.post('/issues', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend unreachable, saving issue to local mock state:', err.message);
      const category = formData.get('category');
      const description = formData.get('description');
      const lat = parseFloat(formData.get('latitude'));
      const lng = parseFloat(formData.get('longitude'));
      const ward = formData.get('ward') || 'Central Ward';
      const photoFile = formData.get('photo');

      let photo_url = 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60';
      if (photoFile && typeof photoFile === 'object') {
        photo_url = URL.createObjectURL(photoFile);
      }

      // Check for nearby cluster (within 300m and matching category)
      const nearbyCluster = localClusters.find(
        (c) => c.category === category && getDistanceKm(lat, lng, c.centroid_lat, c.centroid_lng) <= 0.35
      );

      const newIssue = {
        id: `d-${Date.now()}`,
        user_id: currentUser?.id || 'b1000000-0000-0000-0000-000000000002',
        reporter_name: currentUser?.name || 'Current Citizen',
        category,
        description,
        photo_url,
        latitude: lat,
        longitude: lng,
        ward,
        status: 'reported',
        cluster_id: nearbyCluster ? nearbyCluster.id : null,
        cluster_member_count: nearbyCluster ? nearbyCluster.member_count + 1 : 1,
        cluster_status: nearbyCluster ? nearbyCluster.status : 'reported',
        department_name: nearbyCluster ? nearbyCluster.department_name : null,
        upvote_count: 1,
        created_at: new Date().toISOString(),
        status_logs: [
          {
            id: `log-${Date.now()}`,
            old_status: null,
            new_status: 'reported',
            changed_by_name: currentUser?.name || 'Citizen',
            changed_at: new Date().toISOString(),
            note: 'Issue reported by citizen',
          },
        ],
      };

      if (nearbyCluster) {
        nearbyCluster.member_count += 1;
      }

      localIssues.unshift(newIssue);
      return { issue: newIssue, nearby_cluster: nearbyCluster || null };
    }
  },

  async upvoteIssue(id) {
    try {
      const res = await apiClient.post(`/issues/${id}/upvote`);
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for upvote:', err.message);
      const issue = localIssues.find((i) => i.id === id);
      if (issue) {
        issue.upvote_count = (issue.upvote_count || 0) + 1;
        return { upvote_count: issue.upvote_count };
      }
      return { upvote_count: 1 };
    }
  },

  async updateStatus(id, { status, note }, currentUser) {
    try {
      const res = await apiClient.patch(`/issues/${id}/status`, { status, note });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for updateStatus:', err.message);
      const issue = localIssues.find((i) => i.id === id);
      if (issue) {
        const oldStatus = issue.status;
        issue.status = status;
        if (issue.cluster_id) {
          const cluster = localClusters.find((c) => c.id === issue.cluster_id);
          if (cluster) cluster.status = status;
        }
        if (!issue.status_logs) issue.status_logs = [];
        issue.status_logs.push({
          id: `log-${Date.now()}`,
          old_status: oldStatus,
          new_status: status,
          changed_by_name: currentUser?.name || 'Municipal Officer',
          changed_at: new Date().toISOString(),
          note: note || `Status transitioned to ${status}`,
        });
      }
      return { message: 'Status updated', issue_id: id, new_status: status };
    }
  },

  async assignDepartment(id, { department_id }) {
    try {
      const res = await apiClient.post(`/issues/${id}/assign`, { department_id });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for assignDepartment:', err.message);
      const issue = localIssues.find((i) => i.id === id);
      const dept = localDepartments.find((d) => d.id === department_id);
      if (issue && dept) {
        issue.department_name = dept.name;
        if (issue.cluster_id) {
          const cluster = localClusters.find((c) => c.id === issue.cluster_id);
          if (cluster) {
            cluster.assigned_department_id = dept.id;
            cluster.department_name = dept.name;
          }
        }
      }
      return { message: `Issue assigned to ${dept?.name || 'Department'}` };
    }
  },

  // --- CLUSTERS ---
  async getClusters(params = {}) {
    try {
      const res = await apiClient.get('/issues/clusters', { params });
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for clusters:', err.message);
      let filtered = [...localClusters];
      if (params.category) filtered = filtered.filter((c) => c.category === params.category);
      if (params.status) filtered = filtered.filter((c) => c.status === params.status);
      return filtered;
    }
  },

  // --- DEPARTMENTS ---
  async getDepartments() {
    try {
      const res = await apiClient.get('/departments');
      return res.data;
    } catch (err) {
      return localDepartments;
    }
  },

  // --- ANALYTICS ---
  async getAnalytics() {
    try {
      const res = await apiClient.get('/analytics/overview');
      return res.data;
    } catch (err) {
      console.warn('[API] Backend fallback for analytics:', err.message);
      const total = localIssues.length;
      const resolved = localIssues.filter((i) => i.status === 'resolved').length;
      const inProgress = localIssues.filter((i) => i.status === 'in_progress').length;
      const reported = localIssues.filter((i) => i.status === 'reported').length;
      const rejected = localIssues.filter((i) => i.status === 'rejected').length;

      // Category breakdown
      const byCategory = {};
      localIssues.forEach((i) => {
        byCategory[i.category] = (byCategory[i.category] || 0) + 1;
      });

      // Ward breakdown
      const byWard = {};
      localIssues.forEach((i) => {
        const w = i.ward || 'Unknown Ward';
        byWard[w] = (byWard[w] || 0) + 1;
      });

      return {
        overview: {
          total_issues: total,
          reported_count: reported,
          in_progress_count: inProgress,
          resolved_count: resolved,
          rejected_count: rejected,
          active_clusters: localClusters.length,
          resolution_rate_percent: total > 0 ? Math.round((resolved / total) * 100) : 0,
          avg_triage_hours: 18.5,
        },
        by_category: byCategory,
        by_ward: byWard,
        clusters: localClusters,
      };
    }
  },

  // Helper for reverse geocoding via Nominatim
  async reverseGeocode(lat, lng) {
    try {
      const res = await axios.get(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=16&addressdetails=1`,
        {
          headers: { 'User-Agent': 'CrowdSourced-CivicPortal/1.0' },
          timeout: 4000,
        }
      );
      const data = res.data;
      const addr = data.address || {};
      const ward = addr.suburb || addr.neighbourhood || addr.city_district || addr.quarter || addr.city || 'Central District';
      const formatted = data.display_name ? data.display_name.split(',').slice(0, 3).join(', ') : 'Selected Location';
      return { ward, address: formatted };
    } catch (err) {
      return { ward: 'Central Ward', address: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    }
  },
};
