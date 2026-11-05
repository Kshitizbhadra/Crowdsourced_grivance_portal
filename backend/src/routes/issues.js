import express from 'express';
import { query } from '../db/pool.js';
import { verifyToken, requireRole, optionalAuth } from '../middleware/auth.js';
import { upload, uploadToCloudinary } from '../middleware/upload.js';
import { detectWard } from '../services/nominatimService.js';
import { recluster, findNearbyCluster } from '../services/clusterService.js';
import { emitIssueCreated, emitStatusChanged } from '../services/socketService.js';

const router = express.Router();

const VALID_CATEGORIES = ['pothole', 'garbage', 'streetlight', 'water_leak', 'encroachment', 'other'];
const VALID_STATUSES = ['reported', 'in_progress', 'resolved', 'rejected'];

// ─── POST /api/issues — Create a new issue ───────────────────
router.post('/', verifyToken, upload.single('photo'), async (req, res) => {
  try {
    const { category, description, latitude, longitude } = req.body;

    if (!category || !latitude || !longitude) {
      return res.status(400).json({ error: 'category, latitude, and longitude are required' });
    }

    if (!VALID_CATEGORIES.includes(category)) {
      return res.status(400).json({ error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` });
    }

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ error: 'Invalid coordinates' });
    }

    // Check for nearby existing cluster BEFORE creating (for upvote prompt)
    const nearbyCluster = await findNearbyCluster(lat, lng, category);

    // Upload photo if provided
    let photo_url = null;
    if (req.file) {
      photo_url = await uploadToCloudinary(req.file.buffer, {
        public_id: `issue_${Date.now()}`,
      });
    }

    // Detect ward from GPS (async, non-blocking for UX)
    const ward = await detectWard(lat, lng);

    // Insert issue
    const result = await query(
      `INSERT INTO issues (user_id, category, description, photo_url, latitude, longitude, ward)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.user.id, category, description || null, photo_url, lat, lng, ward]
    );

    const issue = result.rows[0];

    // Insert initial status log
    await query(
      `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
       VALUES ($1, NULL, 'reported', $2, 'Issue reported by citizen')`,
      [issue.id, req.user.id]
    );

    // Emit to admin room
    emitIssueCreated({
      issue_id: issue.id,
      category: issue.category,
      lat: issue.latitude,
      lng: issue.longitude,
      ward: issue.ward,
    });

    // Trigger async re-clustering (don't await — non-blocking)
    recluster(category).catch((err) =>
      console.error('[Issues] Async recluster failed:', err.message)
    );

    // Respond with issue + nearby cluster prompt if applicable
    res.status(201).json({
      issue,
      nearby_cluster: nearbyCluster
        ? {
            id: nearbyCluster.id,
            issue_id: nearbyCluster.issue_id,
            member_count: nearbyCluster.member_count,
            status: nearbyCluster.status,
            photo_url: nearbyCluster.photo_url,
            description: nearbyCluster.description,
          }
        : null,
    });
  } catch (err) {
    console.error('[Issues] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create issue' });
  }
});

// ─── GET /api/issues — List issues ──────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { category, status, ward, cluster_id, user_id, page = 1, limit = 20 } = req.query;

    const conditions = [];
    const params = [];

    if (category) { params.push(category); conditions.push(`i.category = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`i.status = $${params.length}`); }
    if (ward) { params.push(`%${ward}%`); conditions.push(`i.ward ILIKE $${params.length}`); }
    if (cluster_id) { params.push(cluster_id); conditions.push(`i.cluster_id = $${params.length}`); }
    if (user_id) { params.push(user_id); conditions.push(`i.user_id = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(parseInt(limit), offset);

    const result = await query(
      `SELECT i.*, u.name AS reporter_name,
              ic.member_count AS cluster_member_count,
              ic.status AS cluster_status
       FROM issues i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN issue_clusters ic ON i.cluster_id = ic.id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await query(
      `SELECT COUNT(*) FROM issues i ${where}`,
      params.slice(0, -2)
    );

    res.json({
      issues: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('[Issues] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issues' });
  }
});

// ─── GET /api/issues/clusters — All clusters for map ────────
router.get('/clusters', async (req, res) => {
  try {
    const { category, status } = req.query;
    const conditions = [];
    const params = [];

    if (category) { params.push(category); conditions.push(`ic.category = $${params.length}`); }
    if (status) { params.push(status); conditions.push(`ic.status = $${params.length}`); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await query(
      `SELECT ic.*,
              d.name AS department_name,
              json_agg(
                json_build_object(
                  'id', i.id,
                  'description', i.description,
                  'photo_url', i.photo_url,
                  'ward', i.ward,
                  'created_at', i.created_at,
                  'upvote_count', i.upvote_count
                ) ORDER BY i.upvote_count DESC
              ) FILTER (WHERE i.id IS NOT NULL) AS issues
       FROM issue_clusters ic
       LEFT JOIN departments d ON ic.assigned_department_id = d.id
       LEFT JOIN issues i ON i.cluster_id = ic.id
       ${where}
       GROUP BY ic.id, d.name
       ORDER BY ic.member_count DESC`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('[Issues] Clusters error:', err.message);
    res.status(500).json({ error: 'Failed to fetch clusters' });
  }
});

// ─── GET /api/issues/:id — Issue detail ─────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const issueResult = await query(
      `SELECT i.*, u.name AS reporter_name, u.email AS reporter_email,
              ic.centroid_lat, ic.centroid_lng, ic.member_count AS cluster_member_count,
              ic.assigned_department_id,
              d.name AS department_name
       FROM issues i
       LEFT JOIN users u ON i.user_id = u.id
       LEFT JOIN issue_clusters ic ON i.cluster_id = ic.id
       LEFT JOIN departments d ON ic.assigned_department_id = d.id
       WHERE i.id = $1`,
      [id]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Status audit log
    const logsResult = await query(
      `SELECT sl.*, u.name AS changed_by_name
       FROM status_logs sl
       LEFT JOIN users u ON sl.changed_by = u.id
       WHERE sl.issue_id = $1
       ORDER BY sl.changed_at ASC`,
      [id]
    );

    // Other issues in same cluster
    let clusterSiblings = [];
    if (issueResult.rows[0].cluster_id) {
      const siblings = await query(
        `SELECT i.id, i.description, i.photo_url, i.ward, i.created_at,
                u.name AS reporter_name
         FROM issues i
         LEFT JOIN users u ON i.user_id = u.id
         WHERE i.cluster_id = $1 AND i.id != $2
         ORDER BY i.upvote_count DESC
         LIMIT 10`,
        [issueResult.rows[0].cluster_id, id]
      );
      clusterSiblings = siblings.rows;
    }

    // Check if current user has upvoted
    let userHasUpvoted = false;
    if (req.user) {
      const upvoteCheck = await query(
        'SELECT 1 FROM upvotes WHERE user_id = $1 AND issue_id = $2',
        [req.user.id, id]
      );
      userHasUpvoted = upvoteCheck.rows.length > 0;
    }

    res.json({
      ...issueResult.rows[0],
      status_logs: logsResult.rows,
      cluster_siblings: clusterSiblings,
      user_has_upvoted: userHasUpvoted,
    });
  } catch (err) {
    console.error('[Issues] Detail error:', err.message);
    res.status(500).json({ error: 'Failed to fetch issue' });
  }
});

// ─── POST /api/issues/:id/upvote ────────────────────────────
router.post('/:id/upvote', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check issue exists
    const issue = await query('SELECT id, upvote_count, cluster_id FROM issues WHERE id = $1', [id]);
    if (issue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Insert upvote (conflict = already voted)
    try {
      await query(
        'INSERT INTO upvotes (user_id, issue_id) VALUES ($1, $2)',
        [req.user.id, id]
      );
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'You have already upvoted this issue' });
      }
      throw err;
    }

    // Increment upvote count
    const updated = await query(
      'UPDATE issues SET upvote_count = upvote_count + 1 WHERE id = $1 RETURNING upvote_count',
      [id]
    );

    res.json({ upvote_count: updated.rows[0].upvote_count });
  } catch (err) {
    console.error('[Issues] Upvote error:', err.message);
    res.status(500).json({ error: 'Failed to upvote issue' });
  }
});

// ─── PATCH /api/issues/:id/status ───────────────────────────
router.patch('/:id/status', verifyToken, requireRole('admin', 'department'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const issue = await query('SELECT id, status, cluster_id FROM issues WHERE id = $1', [id]);
    if (issue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    const oldStatus = issue.rows[0].status;

    await query('UPDATE issues SET status = $1 WHERE id = $2', [status, id]);

    // Log status change
    await query(
      `INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, oldStatus, status, req.user.id, note || null]
    );

    // If cluster exists, sync cluster status too
    if (issue.rows[0].cluster_id) {
      await query(
        'UPDATE issue_clusters SET status = $1, updated_at = NOW() WHERE id = $2',
        [status, issue.rows[0].cluster_id]
      );
    }

    const now = new Date().toISOString();
    emitStatusChanged(id, { new_status: status, old_status: oldStatus, note, changed_at: now });

    res.json({ message: 'Status updated', issue_id: id, new_status: status, changed_at: now });
  } catch (err) {
    console.error('[Issues] Status update error:', err.message);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ─── POST /api/issues/:id/assign ────────────────────────────
router.post('/:id/assign', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { department_id } = req.body;

    if (!department_id) {
      return res.status(400).json({ error: 'department_id is required' });
    }

    // Verify dept exists
    const dept = await query('SELECT id, name FROM departments WHERE id = $1', [department_id]);
    if (dept.rows.length === 0) {
      return res.status(404).json({ error: 'Department not found' });
    }

    const issue = await query('SELECT cluster_id FROM issues WHERE id = $1', [id]);
    if (issue.rows.length === 0) {
      return res.status(404).json({ error: 'Issue not found' });
    }

    // Assign cluster (if exists) to department
    if (issue.rows[0].cluster_id) {
      await query(
        'UPDATE issue_clusters SET assigned_department_id = $1, updated_at = NOW() WHERE id = $2',
        [department_id, issue.rows[0].cluster_id]
      );
    }

    res.json({ message: `Issue assigned to ${dept.rows[0].name}`, department_id });
  } catch (err) {
    console.error('[Issues] Assign error:', err.message);
    res.status(500).json({ error: 'Failed to assign issue' });
  }
});

export default router;
