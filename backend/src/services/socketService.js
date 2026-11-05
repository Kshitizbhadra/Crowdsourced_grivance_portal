let _io = null;

/**
 * Initialize the Socket.io instance (called from index.js)
 */
export const initSocket = (io) => {
  _io = io;
};

/**
 * Get the Socket.io instance
 */
export const getIO = () => {
  if (!_io) throw new Error('Socket.io not initialized');
  return _io;
};

/**
 * Emit issue created event to admin room
 */
export const emitIssueCreated = (issueData) => {
  try {
    _io?.to('admin').emit('issue:created', issueData);
  } catch (err) {
    console.error('[Socket] emitIssueCreated error:', err.message);
  }
};

/**
 * Emit status changed event to specific issue room + admin room
 */
export const emitStatusChanged = (issueId, statusData) => {
  try {
    _io?.to(`issue:${issueId}`).emit('status:changed', { issue_id: issueId, ...statusData });
    _io?.to('admin').emit('status:changed', { issue_id: issueId, ...statusData });
  } catch (err) {
    console.error('[Socket] emitStatusChanged error:', err.message);
  }
};

/**
 * Emit cluster updated event to all clients
 */
export const emitClusterUpdated = (clusterData) => {
  try {
    _io?.emit('cluster:updated', clusterData);
  } catch (err) {
    console.error('[Socket] emitClusterUpdated error:', err.message);
  }
};
