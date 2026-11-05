import axios from 'axios';
import { query, withTransaction } from '../db/pool.js';
import { getIO } from './socketService.js';
import dotenv from 'dotenv';

dotenv.config();

const CLUSTERING_URL = process.env.CLUSTERING_SERVICE_URL || 'http://localhost:5001';

/**
 * Fetch all issues of a given category for clustering
 */
const fetchIssuesForClustering = async (category) => {
  const result = await query(
    `SELECT id, latitude, longitude, created_at
     FROM issues
     WHERE category = $1
       AND created_at >= NOW() - INTERVAL '30 days'
     ORDER BY created_at DESC`,
    [category]
  );
  return result.rows;
};

/**
 * Call the Python DBSCAN microservice with issues data
 */
const callClusteringService = async (category, issues) => {
  const response = await axios.post(`${CLUSTERING_URL}/cluster`, {
    category,
    issues: issues.map((i) => ({
      id: i.id,
      latitude: parseFloat(i.latitude),
      longitude: parseFloat(i.longitude),
      created_at: i.created_at,
    })),
  }, { timeout: 30000 });

  return response.data.clusters;
};

/**
 * Persist cluster results back to DB:
 * - Upsert issue_clusters (centroid, member_count)
 * - Update issues.cluster_id
 */
const persistClusters = async (clusters) => {
  await withTransaction(async (client) => {
    for (const cluster of clusters) {
      if (!cluster.issue_ids || cluster.issue_ids.length === 0) continue;

      const { centroid_lat, centroid_lng, issue_ids } = cluster;

      // Check if any issue in this cluster already has a cluster_id
      const existing = await client.query(
        `SELECT DISTINCT cluster_id FROM issues
         WHERE id = ANY($1::uuid[]) AND cluster_id IS NOT NULL
         LIMIT 1`,
        [issue_ids]
      );

      let clusterId;

      if (existing.rows.length > 0) {
        // Update existing cluster
        clusterId = existing.rows[0].cluster_id;
        await client.query(
          `UPDATE issue_clusters
           SET centroid_lat = $1, centroid_lng = $2, member_count = $3, updated_at = NOW()
           WHERE id = $4`,
          [centroid_lat, centroid_lng, issue_ids.length, clusterId]
        );
      } else {
        // Create new cluster — infer category from first issue
        const issueData = await client.query(
          `SELECT category FROM issues WHERE id = $1`,
          [issue_ids[0]]
        );
        const category = issueData.rows[0]?.category || 'other';

        const newCluster = await client.query(
          `INSERT INTO issue_clusters (category, centroid_lat, centroid_lng, member_count)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [category, centroid_lat, centroid_lng, issue_ids.length]
        );
        clusterId = newCluster.rows[0].id;
      }

      // Assign cluster_id to all member issues
      await client.query(
        `UPDATE issues SET cluster_id = $1 WHERE id = ANY($2::uuid[])`,
        [clusterId, issue_ids]
      );

      // Emit Socket.io update
      try {
        const io = getIO();
        io.emit('cluster:updated', {
          cluster_id: clusterId,
          member_count: issue_ids.length,
          centroid_lat,
          centroid_lng,
        });
      } catch {
        // Socket.io might not be initialized in test env
      }
    }
  });
};

/**
 * Main: re-cluster all issues of a given category
 * Called async after each new issue is created.
 */
export const recluster = async (category) => {
  try {
    const issues = await fetchIssuesForClustering(category);
    if (issues.length < 2) return; // Not enough points to cluster

    const clusters = await callClusteringService(category, issues);
    await persistClusters(clusters);

    console.log(`[Cluster] Re-clustered ${issues.length} issues in category "${category}" → ${clusters.length} clusters`);
  } catch (err) {
    console.error(`[Cluster] Reclustering failed for category "${category}":`, err.message);
  }
};

/**
 * Check if a new issue (lat, lng, category) is near an existing cluster (within ~50m)
 * Returns the nearest cluster or null
 */
export const findNearbyCluster = async (lat, lng, category) => {
  // Haversine approximation: 0.0005 degrees ≈ ~55m at equator
  const EPS_DEG = 0.0005;

  const result = await query(
    `SELECT ic.id, ic.centroid_lat, ic.centroid_lng, ic.member_count, ic.status,
            i.id as issue_id, i.photo_url, i.description
     FROM issue_clusters ic
     JOIN issues i ON i.cluster_id = ic.id
     WHERE ic.category = $1
       AND ic.status != 'resolved'
       AND ABS(ic.centroid_lat - $2) < $4
       AND ABS(ic.centroid_lng - $3) < $4
     ORDER BY
       SQRT(POWER(ic.centroid_lat - $2, 2) + POWER(ic.centroid_lng - $3, 2)) ASC
     LIMIT 1`,
    [category, lat, lng, EPS_DEG]
  );

  return result.rows[0] || null;
};
