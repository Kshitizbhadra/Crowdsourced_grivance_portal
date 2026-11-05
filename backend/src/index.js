import express from 'express';
import http from 'http';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { Server } from 'socket.io';

import { initSocket } from './services/socketService.js';

import authRoutes from './routes/auth.js';
import issueRoutes from './routes/issues.js';
import departmentRoutes from './routes/departments.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// ── Socket.io ──────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    credentials: true,
  },
});

initSocket(io);

io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  // Citizen joins an issue room to get live status updates
  socket.on('join:issue', (issueId) => {
    socket.join(`issue:${issueId}`);
  });

  // Admin joins admin room to get all live updates
  socket.on('join:admin', () => {
    socket.join('admin');
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

// ── Middleware ─────────────────────────────────────────────────
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/issues', issueRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/analytics', analyticsRoutes);

// ── Health ─────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'crowdsourced-backend', timestamp: new Date().toISOString() });
});

app.get('/api', (_req, res) => {
  res.json({
    name: 'CrowdSourced Civic Issue API',
    version: '1.0.0',
    endpoints: { auth: '/api/auth', issues: '/api/issues', departments: '/api/departments', analytics: '/api/analytics' },
  });
});

// ── 404 & Error Handlers ────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

app.use((err, _req, res, _next) => {
  console.error('[App] Unhandled error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`🚀 Civic Portal Backend running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export { app, server, io };
