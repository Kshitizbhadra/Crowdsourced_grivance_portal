import os
import numpy as np
from sklearn.cluster import DBSCAN
from datetime import datetime, timezone, timedelta

EARTH_RADIUS_METERS = 6371000.0

def run_dbscan_clustering(issues, eps_meters=50.0, min_samples=2, time_window_days=30):
    """
    Cluster issues using DBSCAN with Haversine distance metric.
    
    :param issues: List of dicts, each with 'id', 'latitude', 'longitude', 'created_at', 'category'
    :param eps_meters: Maximum distance between two samples in meters
    :param min_samples: Minimum number of samples to form a dense region
    :param time_window_days: Time window filter in days
    :return: List of cluster objects with centroid and member issue IDs
    """
    if not issues:
        return []

    # Optional: Filter by recent time window if created_at is provided
    now = datetime.now(timezone.utc)
    filtered_issues = []
    for issue in issues:
        created_at_str = issue.get('created_at')
        if created_at_str and time_window_days:
            try:
                # Handle ISO timestamps with Z or offset
                dt = datetime.fromisoformat(created_at_str.replace('Z', '+00:00'))
                if (now - dt) > timedelta(days=time_window_days):
                    continue
            except Exception:
                pass
        filtered_issues.append(issue)

    if not filtered_issues:
        return []

    # If only 1 issue, return as a 1-member cluster
    if len(filtered_issues) == 1:
        single = filtered_issues[0]
        return [{
            "cluster_label": 0,
            "centroid_lat": float(single['latitude']),
            "centroid_lng": float(single['longitude']),
            "member_count": 1,
            "issue_ids": [single['id']],
            "category": single.get('category', 'general')
        }]

    # Convert coordinates (lat, lng) in degrees to radians for Haversine metric
    coords = np.array([[float(i['latitude']), float(i['longitude'])] for i in filtered_issues])
    coords_rad = np.radians(coords)

    # Convert eps in meters to radians: eps_rad = eps_meters / EARTH_RADIUS_METERS
    eps_rad = eps_meters / EARTH_RADIUS_METERS

    # Run DBSCAN
    db = DBSCAN(eps=eps_rad, min_samples=min_samples, metric='haversine', algorithm='ball_tree')
    labels = db.fit_predict(coords_rad)

    clusters_map = {}
    noise_issues = []

    for idx, label in enumerate(labels):
        issue = filtered_issues[idx]
        if label == -1:
            # Noise points / singletons
            noise_issues.append(issue)
        else:
            if label not in clusters_map:
                clusters_map[label] = []
            clusters_map[label].append(issue)

    result_clusters = []

    # Form clusters from DBSCAN dense regions
    for label, cluster_items in clusters_map.items():
        lats = [float(item['latitude']) for item in cluster_items]
        lngs = [float(item['longitude']) for item in cluster_items]
        result_clusters.append({
            "cluster_label": int(label),
            "centroid_lat": float(np.mean(lats)),
            "centroid_lng": float(np.mean(lngs)),
            "member_count": len(cluster_items),
            "issue_ids": [item['id'] for item in cluster_items],
            "category": cluster_items[0].get('category', 'general')
        })

    # Treat noise items as individual 1-member clusters
    noise_label_counter = max(labels) + 1 if len(labels) > 0 and max(labels) >= 0 else 0
    for noise_issue in noise_issues:
        result_clusters.append({
            "cluster_label": int(noise_label_counter),
            "centroid_lat": float(noise_issue['latitude']),
            "centroid_lng": float(noise_issue['longitude']),
            "member_count": 1,
            "issue_ids": [noise_issue['id']],
            "category": noise_issue.get('category', 'general')
        })
        noise_label_counter += 1

    return result_clusters
