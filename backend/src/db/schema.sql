-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  contact_email VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  password_hash TEXT NOT NULL,
  role VARCHAR(20) DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin', 'department')),
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ISSUE CLUSTERS (grouped issues via DBSCAN)
-- ============================================================
CREATE TABLE IF NOT EXISTS issue_clusters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(60) NOT NULL,
  centroid_lat DOUBLE PRECISION NOT NULL,
  centroid_lng DOUBLE PRECISION NOT NULL,
  member_count INT DEFAULT 1,
  status VARCHAR(30) DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'rejected')),
  assigned_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ISSUES
-- ============================================================
CREATE TABLE IF NOT EXISTS issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  category VARCHAR(60) NOT NULL CHECK (category IN ('pothole', 'garbage', 'streetlight', 'water_leak', 'encroachment', 'other')),
  description TEXT,
  photo_url TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  ward VARCHAR(120),
  status VARCHAR(30) DEFAULT 'reported' CHECK (status IN ('reported', 'in_progress', 'resolved', 'rejected')),
  cluster_id UUID REFERENCES issue_clusters(id) ON DELETE SET NULL,
  upvote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- STATUS LOGS (Audit Trail)
-- ============================================================
CREATE TABLE IF NOT EXISTS status_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  old_status VARCHAR(30),
  new_status VARCHAR(30) NOT NULL,
  changed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- UPVOTES (prevent double-upvoting)
-- ============================================================
CREATE TABLE IF NOT EXISTS upvotes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  issue_id UUID REFERENCES issues(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, issue_id)
);

-- ============================================================
-- REFRESH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_cluster_id ON issues(cluster_id);
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at);
CREATE INDEX IF NOT EXISTS idx_status_logs_issue_id ON status_logs(issue_id);
CREATE INDEX IF NOT EXISTS idx_clusters_category ON issue_clusters(category);
CREATE INDEX IF NOT EXISTS idx_clusters_status ON issue_clusters(status);
