import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import {
  BarChart3,
  TrendingUp,
  CheckCircle2,
  Clock,
  Layers,
  MapPin,
  Sparkles,
  Zap
} from 'lucide-react';
import { api } from '../services/api';
import { CATEGORY_META } from '../mockData';

// Register ChartJS modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getAnalytics();
        setAnalytics(data);
      } catch (e) {
        console.error('Analytics load error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const overview = analytics?.overview || {
    total_issues: 12,
    reported_count: 5,
    in_progress_count: 4,
    resolved_count: 3,
    active_clusters: 7,
    resolution_rate_percent: 25,
    avg_triage_hours: 18.5,
  };

  const byCategory = analytics?.by_category || {
    pothole: 5,
    garbage: 3,
    streetlight: 2,
    water_leak: 2,
  };

  const byWard = analytics?.by_ward || {
    'Connaught Place': 4,
    'Karol Bagh': 3,
    'Pahar Ganj': 2,
    'Rajendra Place': 2,
    'Civil Lines': 1,
  };

  // Chart 1: Category Breakdown (Doughnut)
  const categoryLabels = Object.keys(byCategory).map((k) => CATEGORY_META[k]?.label?.split(' ')[0] || k);
  const categoryValues = Object.values(byCategory);
  const categoryColors = Object.keys(byCategory).map((k) => CATEGORY_META[k]?.color || '#00d4ff');

  const categoryChartData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryValues,
        backgroundColor: categoryColors,
        borderColor: '#0a0f1e',
        borderWidth: 2,
      },
    ],
  };

  // Chart 2: Status Breakdown (Bar)
  const statusChartData = {
    labels: ['Reported', 'In Progress', 'Resolved', 'Rejected'],
    datasets: [
      {
        label: 'Issues',
        data: [
          overview.reported_count || 0,
          overview.in_progress_count || 0,
          overview.resolved_count || 0,
          overview.rejected_count || 0,
        ],
        backgroundColor: ['#f59e0b', '#8b5cf6', '#10b981', '#ef4444'],
        borderRadius: 6,
      },
    ],
  };

  // Chart 3: Ward Distribution (Horizontal Bar)
  const wardLabels = Object.keys(byWard);
  const wardValues = Object.values(byWard);

  const wardChartData = {
    labels: wardLabels,
    datasets: [
      {
        label: 'Reports Filed',
        data: wardValues,
        backgroundColor: 'rgba(0, 212, 255, 0.7)',
        borderColor: '#00d4ff',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  // Chart 4: Resolution Trend Line
  const trendChartData = {
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'This Week'],
    datasets: [
      {
        label: 'Resolved Issues',
        data: [2, 5, 8, 14, 22],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Incoming Reports',
        data: [6, 12, 18, 25, 30],
        borderColor: '#00d4ff',
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8',
          font: { family: 'Inter', size: 12 },
        },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' },
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8' },
      },
    },
  };

  return (
    <div className="analytics-page">
      <div className="analytics-header">
        <div>
          <h1 className="page-heading">Civic Performance & Intelligence</h1>
          <p className="page-subheading">
            Aggregated metrics on municipal resolution speed, DBSCAN hotspot clustering, and ward complaint density.
          </p>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="kpi-grid" style={{ marginBottom: '2rem' }}>
        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Resolution Rate</span>
            <span className="kpi-icon status-resolved-icon"><CheckCircle2 size={18} /></span>
          </div>
          <div className="kpi-value text-emerald">{overview.resolution_rate_percent}%</div>
          <span className="kpi-subtext">Of total issues resolved</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Avg Triage Time</span>
            <span className="kpi-icon status-reported-icon"><Clock size={18} /></span>
          </div>
          <div className="kpi-value text-cyan">{overview.avg_triage_hours}h</div>
          <span className="kpi-subtext">From report to assignment</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">AI Spatial Clusters</span>
            <span className="kpi-icon status-cluster-icon"><Layers size={18} /></span>
          </div>
          <div className="kpi-value text-purple">{overview.active_clusters}</div>
          <span className="kpi-subtext">Active grouped hotspots</span>
        </div>

        <div className="glass-card kpi-card">
          <div className="kpi-top">
            <span className="kpi-label">Total Citizen Reports</span>
            <span className="kpi-icon status-progress-icon"><Zap size={18} /></span>
          </div>
          <div className="kpi-value text-amber">{overview.total_issues}</div>
          <span className="kpi-subtext">Across all city wards</span>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="analytics-charts-grid">
        {/* Chart 1: Category Distribution */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Complaints by Category</h3>
          <p className="chart-subtitle">Proportion of reported issues per civic sector</p>
          <div className="chart-canvas-wrapper doughnut-wrapper">
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } },
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Chart 2: Status Breakdown */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Current Status Pipeline</h3>
          <p className="chart-subtitle">Issues distributed across municipal triage stages</p>
          <div className="chart-canvas-wrapper">
            <Bar data={statusChartData} options={chartOptions} />
          </div>
        </div>

        {/* Chart 3: Ward Distribution */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Top Complaint Wards</h3>
          <p className="chart-subtitle">Wards with highest civic report frequency</p>
          <div className="chart-canvas-wrapper">
            <Bar
              data={wardChartData}
              options={{
                ...chartOptions,
                indexAxis: 'y',
              }}
            />
          </div>
        </div>

        {/* Chart 4: Resolution Velocity Trend */}
        <div className="glass-card chart-card">
          <h3 className="chart-title">Resolution Velocity & Trend</h3>
          <p className="chart-subtitle">Weekly comparison of reported vs resolved tickets</p>
          <div className="chart-canvas-wrapper">
            <Line data={trendChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
