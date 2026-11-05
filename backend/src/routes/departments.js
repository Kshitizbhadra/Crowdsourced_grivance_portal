import express from 'express';
import { query } from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/departments ────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await query(
      `SELECT d.*, COUNT(ic.id) AS active_cluster_count
       FROM departments d
       LEFT JOIN issue_clusters ic ON ic.assigned_department_id = d.id AND ic.status != 'resolved'
       GROUP BY d.id
       ORDER BY d.name ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Departments] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ─── GET /api/departments/:id/issues ─── Dept staff view ────
router.get('/:id/issues', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Dept staff can only see their own dept; admins can see any
    if (req.user.role === 'department' && req.user.department_id !== id) {
      return res.status(403).json({ error: 'Access denied to this department' });
    }

    const clusters = await query(
      `SELECT ic.*, d.name AS department_name,
              json_agg(
                json_build_object(
                  'id', i.id,
                  'description', i.description,
                  'photo_url', i.photo_url,
                  'ward', i.ward,
                  'upvote_count', i.upvote_count,
                  'created_at', i.created_at
                )
              ) FILTER (WHERE i.id IS NOT NULL) AS issues
       FROM issue_clusters ic
       LEFT JOIN departments d ON ic.assigned_department_id = d.id
       LEFT JOIN issues i ON i.cluster_id = ic.id
       WHERE ic.assigned_department_id = $1
       GROUP BY ic.id, d.name
       ORDER BY ic.created_at DESC`,
      [id]
    );

    res.json(clusters.rows);
  } catch (err) {
    console.error('[Departments] Issues error:', err.message);
    res.status(500).json({ error: 'Failed to fetch department issues' });
  }
});

export default router;
