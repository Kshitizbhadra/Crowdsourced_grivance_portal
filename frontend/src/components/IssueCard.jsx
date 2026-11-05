import React from 'react';
import { ThumbsUp, MapPin, Layers, Clock, ArrowRight } from 'lucide-react';
import { CATEGORY_META, STATUS_META } from '../mockData';

export default function IssueCard({ issue, onSelect, onUpvote, isSelected }) {
  const categoryMeta = CATEGORY_META[issue.category] || CATEGORY_META.other;
  const statusMeta = STATUS_META[issue.status] || STATUS_META.reported;

  const handleUpvoteClick = (e) => {
    e.stopPropagation();
    if (onUpvote) {
      onUpvote(issue.id);
    }
  };

  const formattedDate = new Date(issue.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  return (
    <div
      onClick={() => onSelect && onSelect(issue)}
      className={`glass-card interactive issue-card ${isSelected ? 'selected' : ''}`}
    >
      {/* Photo header thumbnail if available */}
      {issue.photo_url && (
        <div className="issue-card-media">
          <img src={issue.photo_url} alt={issue.category} loading="lazy" />
          <div className="media-overlay">
            <span
              className="category-pill"
              style={{ backgroundColor: `${categoryMeta.color}22`, color: categoryMeta.color, borderColor: `${categoryMeta.color}66` }}
            >
              {categoryMeta.label}
            </span>
          </div>
        </div>
      )}

      <div className="issue-card-content">
        {!issue.photo_url && (
          <div className="issue-card-top">
            <span
              className="category-pill"
              style={{ backgroundColor: `${categoryMeta.color}22`, color: categoryMeta.color, borderColor: `${categoryMeta.color}66` }}
            >
              {categoryMeta.label}
            </span>
            <span className={`badge ${statusMeta.class}`}>
              {statusMeta.label}
            </span>
          </div>
        )}

        <div className="issue-card-header">
          <h4 className="issue-title">{issue.ward || 'Civic Location'}</h4>
          {issue.photo_url && (
            <span className={`badge ${statusMeta.class}`}>
              {statusMeta.label}
            </span>
          )}
        </div>

        <p className="issue-description">
          {issue.description || 'No additional description provided by citizen.'}
        </p>

        {/* Cluster / Metadata Row */}
        <div className="issue-meta-row">
          <div className="meta-item">
            <MapPin size={13} />
            <span>{issue.ward || `${issue.latitude?.toFixed(3)}, ${issue.longitude?.toFixed(3)}`}</span>
          </div>
          {issue.cluster_member_count > 1 && (
            <div className="meta-item cluster-tag" title="Grouped by DBSCAN with nearby reports">
              <Layers size={13} color="#00d4ff" />
              <span>{issue.cluster_member_count} grouped reports</span>
            </div>
          )}
        </div>

        {/* Card Footer: Upvotes & Details */}
        <div className="issue-card-footer">
          <button
            onClick={handleUpvoteClick}
            className={`upvote-btn ${issue.user_has_upvoted ? 'voted' : ''}`}
            title="Upvote this issue to increase municipal priority"
          >
            <ThumbsUp size={14} />
            <span>{issue.upvote_count || 0}</span>
          </button>

          <div className="time-indicator">
            <Clock size={13} />
            <span>{formattedDate}</span>
          </div>

          <div className="view-detail-btn">
            <span>Details</span>
            <ArrowRight size={13} />
          </div>
        </div>
      </div>
    </div>
  );
}
