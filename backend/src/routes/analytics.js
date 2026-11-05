import express from 'express';
import { query } from '../db/pool.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// ─── GET /api/analytics/summary ─────────────────────────────
router.get('/summary', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    // 1. Total counts
    const totals = await query(`
      SELECT
        COUNT(*) AS total_issues,
        COUNT(*) FILTER (WHERE status = 'reported') AS reported,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'rejected') AS rejected,
        COUNT(DISTINCT cluster_id) FILTER (WHERE cluster_id IS NOT NULL) AS clustered_count
      FROM issues
    `);

    // 2. Issues by category
    const byCategory = await query(`
      SELECT category, COUNT(*) AS count
      FROM issues
      GROUP BY category
      ORDER BY count DESC
    `);

    // 3. Issues by ward (top 10)
    const byWard = await query(`
      SELECT ward, COUNT(*) AS count
      FROM issues
      WHERE ward IS NOT NULL AND ward != 'Unknown Ward'
      GROUP BY ward
      ORDER BY count DESC
      LIMIT 10
    `);

    // 4. Average resolution time per category (in hours)
    const resolutionTime = await query(`
      SELECT i.category,
             ROUND(AVG(
               EXTRACT(EPOCH FROM (sl2.changed_at - i.created_at)) / 3600
             )::numeric, 1) AS avg_hours
      FROM issues i
      JOIN status_logs sl2 ON sl2.issue_id = i.id AND sl2.new_status = 'resolved'
      WHERE i.status = 'resolved'
      GROUP BY i.category
    `);

    // 5. Cluster growth over time (weekly)
    const clusterGrowth = await query(`
      SELECT
        DATE_TRUNC('week', created_at) AS week,
        COUNT(*) AS new_clusters
      FROM issue_clusters
      GROUP BY week
      ORDER BY week ASC
    `);

    // 6. Issues reported per day (last 30 days)
    const dailyReports = await query(`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS count
      FROM issues
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    // 7. Duplicate reduction rate: % of issues that were merged into clusters
    const totalIssues = parseInt(totals.rows[0].total_issues);
    const clusteredIssues = parseInt(totals.rows[0].clustered_count || 0);
    const duplicateReductionRate =
      totalIssues > 0
        ? parseFloat(((clusteredIssues / totalIssues) * 100).toFixed(1))
        : 0;

    // 8. Clusters by status
    const clustersByStatus = await query(`
      SELECT status, COUNT(*) AS count
      FROM issue_clusters
      GROUP BY status
    `);

    res.json({
      totals: totals.rows[0],
      by_category: byCategory.rows,
      by_ward: byWard.rows,
      resolution_time: resolutionTime.rows,
      cluster_growth: clusterGrowth.rows,
      daily_reports: dailyReports.rows,
      duplicate_reduction_rate: duplicateReductionRate,
      clusters_by_status: clustersByStatus.rows,
    });
  } catch (err) {
    console.error('[Analytics] Summary error:', err.message);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
