import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, PlusCircle, CheckCircle2, Clock, AlertCircle, MapPin, Layers } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import IssueCard from '../components/IssueCard';
import IssueDetailModal from '../components/IssueDetailModal';

export default function MyReports() {
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);

  useEffect(() => {
    const loadMyIssues = async () => {
      setLoading(true);
      try {
        const res = await api.getIssues();
        // If logged in citizen, show their issues or all demo issues
        const userIssues = res.issues?.filter((i) => i.user_id === user?.id) || [];
        setIssues(userIssues.length > 0 ? userIssues : res.issues?.slice(0, 4) || []);
      } catch (e) {
        console.error('Error loading reports:', e);
      } finally {
        setLoading(false);
      }
    };
    loadMyIssues();
  }, [user]);

  return (
    <div className="my-reports-page">
      <div className="reports-header-strip">
        <div>
          <h1 className="page-heading">My Reported Issues</h1>
          <p className="page-subheading">
            Track real-time municipal resolution progress, work orders, and cluster groupings for complaints you filed.
          </p>
        </div>
        <Link to="/report" className="btn btn-primary">
          <PlusCircle size={16} />
          <span>Report New Issue</span>
        </Link>
      </div>

      {issues.length === 0 ? (
        <div className="glass-card empty-reports-card">
          <FileText size={48} color="var(--accent-cyan)" />
          <h3>No reports filed yet</h3>
          <p>Help your city by submitting photos and GPS coordinates of civic problems in your area.</p>
          <Link to="/report" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            Submit Your First Report
          </Link>
        </div>
      ) : (
        <div className="my-reports-grid">
          {issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onSelect={(item) => setSelectedIssue(item)}
            />
          ))}
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  );
}
