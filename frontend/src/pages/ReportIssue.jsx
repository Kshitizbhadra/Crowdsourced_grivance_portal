import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Upload,
  AlertTriangle,
  Trash2,
  Lightbulb,
  Droplets,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Layers,
  ThumbsUp,
  Image as ImageIcon,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Toast from '../components/Toast';
import { CATEGORY_META } from '../mockData';

// Custom Pin Icon for Report Location
const reportPinIcon = L.divIcon({
  className: 'report-pin-marker',
  html: `
    <div style="
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #00d4ff, #0284c7);
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      border: 2px solid #ffffff;
      box-shadow: 0 0 16px rgba(0, 212, 255, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="width: 10px; height: 10px; background: #06101e; border-radius: 50%; transform: rotate(45deg);"></div>
    </div>
  `,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Map click listener component
function LocationMarker({ position, setPosition, onLocationChange }) {
  useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      if (onLocationChange) onLocationChange(newPos[0], newPos[1]);
    },
  });

  return position ? <Marker position={position} icon={reportPinIcon} /> : null;
}

const CATEGORIES = [
  { id: 'pothole', label: 'Pothole & Roads', icon: AlertTriangle, color: '#f59e0b', desc: 'Crater, uneven surface, broken tarmac' },
  { id: 'garbage', label: 'Garbage & Waste', icon: Trash2, color: '#10b981', desc: 'Overflowing dump, uncollected debris' },
  { id: 'streetlight', label: 'Streetlight & Power', icon: Lightbulb, color: '#eab308', desc: 'Dead bulb, flickering lamp, exposed wire' },
  { id: 'water_leak', label: 'Water & Drainage', icon: Droplets, color: '#00d4ff', desc: 'Burst pipeline, open manhole, sewage' },
  { id: 'encroachment', label: 'Encroachment', icon: ShieldAlert, color: '#ef4444', desc: 'Illegal stalls, blocked footpath' },
  { id: 'other', label: 'Other Civic Issue', icon: HelpCircle, color: '#a855f7', desc: 'Signage, tree branch, public property' },
];

export default function ReportIssue() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form State
  const [category, setCategory] = useState('pothole');
  const [description, setDescription] = useState('');
  const [coordinates, setCoordinates] = useState([28.6139, 77.2090]); // Default Delhi
  const [ward, setWard] = useState('Central District');
  const [address, setAddress] = useState('Connaught Place, New Delhi');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // Status & Duplicate Checking
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeolocating, setIsGeolocating] = useState(false);
  const [nearbyCluster, setNearbyCluster] = useState(null);
  const [toast, setToast] = useState(null);

  // Reverse geocode when coordinates change
  const handleLocationPicked = async (lat, lng) => {
    try {
      const geo = await api.reverseGeocode(lat, lng);
      setWard(geo.ward);
      setAddress(geo.address);
      checkNearbyDuplicates(lat, lng, category);
    } catch (err) {
      console.warn('Geocoding error:', err);
    }
  };

  // Check if nearby cluster exists
  const checkNearbyDuplicates = async (lat, lng, cat) => {
    try {
      const clusters = await api.getClusters({ category: cat });
      // Find cluster within ~400m
      const match = clusters.find((c) => {
        const dLat = Math.abs(c.centroid_lat - lat);
        const dLng = Math.abs(c.centroid_lng - lng);
        return dLat < 0.004 && dLng < 0.004;
      });
      setNearbyCluster(match || null);
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    checkNearbyDuplicates(coordinates[0], coordinates[1], category);
  }, [category]);

  // Use HTML5 Geolocation
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setToast({ type: 'error', message: 'Geolocation is not supported by your browser' });
      return;
    }
    setIsGeolocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCoordinates(coords);
        handleLocationPicked(coords[0], coords[1]);
        setIsGeolocating(false);
        setToast({ type: 'success', message: 'GPS location detected!' });
      },
      (err) => {
        setIsGeolocating(false);
        setToast({ type: 'error', message: 'Failed to retrieve location: ' + err.message });
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Photo change handler
  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  // Upvote existing cluster instead of submitting duplicate
  const handleUpvoteExisting = async () => {
    if (!nearbyCluster) return;
    try {
      // Find an issue in that cluster to upvote
      const issuesRes = await api.getIssues({ category: nearbyCluster.category });
      const relatedIssue = issuesRes.issues?.find((i) => i.cluster_id === nearbyCluster.id) || issuesRes.issues[0];
      if (relatedIssue) {
        await api.upvoteIssue(relatedIssue.id);
        setToast({ type: 'success', message: 'Upvoted existing report in this cluster!' });
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to upvote' });
    }
  };

  // Form Submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category) {
      setToast({ type: 'error', message: 'Please select an issue category' });
      return;
    }
    if (!description.trim()) {
      setToast({ type: 'error', message: 'Please enter a brief description' });
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('description', description);
      formData.append('latitude', coordinates[0]);
      formData.append('longitude', coordinates[1]);
      formData.append('ward', ward);
      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const res = await api.createIssue(formData, user);
      setToast({
        type: 'success',
        message: res.nearby_cluster
          ? `Report submitted! Automatically grouped into cluster #${res.nearby_cluster.id.slice(0, 8)}.`
          : 'Civic issue reported successfully!',
      });

      setTimeout(() => {
        navigate('/');
      }, 1800);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit report. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-issue-page">
      <div className="report-header">
        <h1 className="page-heading">Report a Civic Issue</h1>
        <p className="page-subheading">
          Pin the problem on the map, choose the category, and upload a photo. Our DBSCAN AI engine automatically groups duplicate reports to speed up municipal action.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="report-form-grid">
        {/* Left Column: Category & Details & Photo */}
        <div className="report-left-panel glass-card">
          {/* Step 1: Select Category */}
          <div className="form-section">
            <label className="section-label">1. Select Problem Category</label>
            <div className="category-select-grid">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`category-card ${isSelected ? 'selected' : ''}`}
                    style={{ '--cat-color': cat.color }}
                  >
                    <div className="cat-icon" style={{ color: cat.color }}>
                      <Icon size={22} />
                    </div>
                    <div className="cat-info">
                      <div className="cat-title">{cat.label}</div>
                      <div className="cat-desc">{cat.desc}</div>
                    </div>
                    {isSelected && (
                      <div className="cat-check">
                        <CheckCircle2 size={16} color={cat.color} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Description */}
          <div className="form-section">
            <label className="section-label" htmlFor="description">
              2. Describe the Issue
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 2ft deep pothole right in front of metro exit 3, causing heavy traffic jams and waterlogging during showers..."
              className="form-textarea"
              required
            />
          </div>

          {/* Step 3: Photo Upload */}
          <div className="form-section">
            <label className="section-label">3. Attach Photo (Optional)</label>
            <div className="photo-upload-zone">
              {photoPreview ? (
                <div className="photo-preview-box">
                  <img src={photoPreview} alt="Issue preview" />
                  <button
                    type="button"
                    onClick={() => { setPhotoFile(null); setPhotoPreview(null); }}
                    className="remove-photo-btn"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="upload-dropzone">
                  <Upload size={32} color="var(--accent-cyan)" />
                  <span className="dropzone-text">Click to upload photo or drag and drop</span>
                  <span className="dropzone-sub">PNG, JPG, WebP up to 10MB</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="file-input-hidden"
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Map Pin Drop & Duplicate Alert */}
        <div className="report-right-panel glass-card">
          <div className="map-picker-header">
            <div>
              <label className="section-label">4. Pin GPS Location</label>
              <p className="map-picker-hint">Click anywhere on the map to place the location pin</p>
            </div>
            <button
              type="button"
              onClick={handleUseMyLocation}
              disabled={isGeolocating}
              className="btn btn-secondary btn-sm"
            >
              <Navigation size={14} className={isGeolocating ? 'spin' : ''} />
              <span>{isGeolocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {/* Location Summary Strip */}
          <div className="location-info-strip">
            <MapPin size={16} color="var(--accent-cyan)" />
            <div className="location-text">
              <span className="location-ward">{ward}</span>
              <span className="location-coords font-mono">
                ({coordinates[0].toFixed(4)}, {coordinates[1].toFixed(4)})
              </span>
            </div>
          </div>

          {/* Leaflet Pinning Map */}
          <div className="picker-map-wrapper">
            <MapContainer
              center={coordinates}
              zoom={14}
              scrollWheelZoom={true}
              style={{ height: '320px', width: '100%', borderRadius: 'var(--radius-md)' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              />
              <LocationMarker
                position={coordinates}
                setPosition={setCoordinates}
                onLocationChange={handleLocationPicked}
              />
            </MapContainer>
          </div>

          {/* Real-Time Duplicate / Cluster Warning Banner */}
          {nearbyCluster && (
            <div className="nearby-cluster-alert glass-card">
              <div className="alert-top">
                <Layers size={18} color="#00d4ff" />
                <span className="alert-title">Similar Issue Reported Nearby!</span>
              </div>
              <p className="alert-desc">
                There is already an active <strong>{CATEGORY_META[nearbyCluster.category]?.label}</strong> report with {nearbyCluster.member_count} grouped citizens in this vicinity.
              </p>
              <div className="alert-actions">
                <button
                  type="button"
                  onClick={handleUpvoteExisting}
                  className="btn btn-primary btn-sm"
                >
                  <ThumbsUp size={14} />
                  <span>Upvote Existing ({nearbyCluster.member_count} reports)</span>
                </button>
                <span className="alert-or-text">or submit as new report</span>
              </div>
            </div>
          )}

          {/* Submit Action */}
          <div className="report-submit-bar">
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary btn-lg submit-report-btn"
            >
              <Sparkles size={18} />
              <span>{isSubmitting ? 'Submitting Report...' : 'Publish Civic Report'}</span>
            </button>
            <p className="submit-disclaimer">
              Submitted reports are publicly tracked with transparent municipal status logs.
            </p>
          </div>
        </div>
      </form>

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
