-- ============================================================
-- SEED DATA — CrowdSourced Civic Portal
-- Run AFTER schema.sql
-- ============================================================

-- ============================================================
-- DEPARTMENTS
-- ============================================================
INSERT INTO departments (id, name, contact_email) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Roads & Potholes', 'roads@civic.gov.in'),
  ('a1000000-0000-0000-0000-000000000002', 'Sanitation & Garbage', 'sanitation@civic.gov.in'),
  ('a1000000-0000-0000-0000-000000000003', 'Electricity & Streetlights', 'electricity@civic.gov.in'),
  ('a1000000-0000-0000-0000-000000000004', 'Water & Drainage', 'water@civic.gov.in'),
  ('a1000000-0000-0000-0000-000000000005', 'Parks & Recreation', 'parks@civic.gov.in')
ON CONFLICT DO NOTHING;

-- ============================================================
-- USERS
-- Admin: admin@civic.in / Admin@123
-- Citizens: citizen1..5@civic.in / Citizen@123
-- Dept heads: dept1..5@civic.in / Dept@123
-- password_hash is bcrypt of respective passwords
-- ============================================================
INSERT INTO users (id, name, email, phone, password_hash, role, department_id) VALUES
  -- Admin
  ('b1000000-0000-0000-0000-000000000001', 'Super Admin', 'admin@civic.in', '9999000001',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', NULL),
  -- Citizens
  ('b1000000-0000-0000-0000-000000000002', 'Rahul Sharma', 'citizen1@civic.in', '9999000002',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', NULL),
  ('b1000000-0000-0000-0000-000000000003', 'Priya Mehta', 'citizen2@civic.in', '9999000003',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', NULL),
  ('b1000000-0000-0000-0000-000000000004', 'Arun Kumar', 'citizen3@civic.in', '9999000004',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', NULL),
  ('b1000000-0000-0000-0000-000000000005', 'Sunita Rao', 'citizen4@civic.in', '9999000005',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', NULL),
  ('b1000000-0000-0000-0000-000000000006', 'Vikram Singh', 'citizen5@civic.in', '9999000006',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'citizen', NULL),
  -- Department Staff
  ('b1000000-0000-0000-0000-000000000007', 'Ramesh Gupta', 'dept.roads@civic.in', '9999000007',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'department', 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000008', 'Kavita Nair', 'dept.sanitation@civic.in', '9999000008',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'department', 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000009', 'Manoj Tiwari', 'dept.elec@civic.in', '9999000009',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'department', 'a1000000-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;

-- NOTE: All passwords above are bcrypt hash of "password" (for demo)
-- Real admin password setup done via the API after first launch.

-- ============================================================
-- ISSUE CLUSTERS (pre-computed)
-- ============================================================
INSERT INTO issue_clusters (id, category, centroid_lat, centroid_lng, member_count, status, assigned_department_id) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'pothole',    28.6129, 77.2295, 4, 'in_progress', 'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000002', 'garbage',    28.6215, 77.2100, 3, 'reported',    'a1000000-0000-0000-0000-000000000002'),
  ('c1000000-0000-0000-0000-000000000003', 'streetlight',28.6350, 77.2250, 3, 'reported',    'a1000000-0000-0000-0000-000000000003'),
  ('c1000000-0000-0000-0000-000000000004', 'water_leak', 28.6450, 77.2150, 3, 'in_progress', 'a1000000-0000-0000-0000-000000000004'),
  ('c1000000-0000-0000-0000-000000000005', 'pothole',    28.6520, 77.2310, 3, 'resolved',    'a1000000-0000-0000-0000-000000000001'),
  ('c1000000-0000-0000-0000-000000000006', 'garbage',    28.6600, 77.2050, 2, 'reported',    NULL),
  ('c1000000-0000-0000-0000-000000000007', 'encroachment',28.6700,77.2400, 2, 'reported',    NULL),
  ('c1000000-0000-0000-0000-000000000008', 'water_leak', 28.6800, 77.2500, 2, 'resolved',    'a1000000-0000-0000-0000-000000000004')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ISSUES (30 issues across Delhi NCR area)
-- ============================================================
INSERT INTO issues (id, user_id, category, description, photo_url, latitude, longitude, ward, status, cluster_id, upvote_count, created_at) VALUES
  -- Cluster 1: Pothole near Connaught Place (4 reports)
  ('d1000001-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'pothole',
   'Large pothole on Janpath, causing accidents during rain', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6128, 77.2294, 'Connaught Place', 'in_progress', 'c1000000-0000-0000-0000-000000000001', 8,
   NOW() - INTERVAL '10 days'),
  ('d1000001-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000003', 'pothole',
   'Deep pothole on Janpath road, nearly 30cm wide', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6130, 77.2296, 'Connaught Place', 'in_progress', 'c1000000-0000-0000-0000-000000000001', 3,
   NOW() - INTERVAL '9 days'),
  ('d1000001-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000004', 'pothole',
   'Pothole causing bike accidents near CP metro exit', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6127, 77.2293, 'Connaught Place', 'in_progress', 'c1000000-0000-0000-0000-000000000001', 5,
   NOW() - INTERVAL '8 days'),
  ('d1000001-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000005', 'pothole',
   'Another pothole cluster on Janpath - road is destroyed', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6131, 77.2297, 'Connaught Place', 'in_progress', 'c1000000-0000-0000-0000-000000000001', 2,
   NOW() - INTERVAL '7 days'),

  -- Cluster 2: Garbage near Karol Bagh (3 reports)
  ('d1000002-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'garbage',
   'Overflowing garbage bins at Karol Bagh market, stench unbearable', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6214, 77.2099, 'Karol Bagh', 'reported', 'c1000000-0000-0000-0000-000000000002', 12,
   NOW() - INTERVAL '5 days'),
  ('d1000002-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'garbage',
   'Garbage not collected for 3 days in Karol Bagh block 7', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6216, 77.2101, 'Karol Bagh', 'reported', 'c1000000-0000-0000-0000-000000000002', 7,
   NOW() - INTERVAL '4 days'),
  ('d1000002-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'garbage',
   'Heaps of construction debris dumped illegally on road', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6213, 77.2098, 'Karol Bagh', 'reported', 'c1000000-0000-0000-0000-000000000002', 4,
   NOW() - INTERVAL '3 days'),

  -- Cluster 3: Broken Streetlights near Lajpat Nagar (3 reports)
  ('d1000003-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'streetlight',
   'Streetlights not working on Ring Road stretch near Lajpat Nagar for 2 weeks', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
   28.6349, 77.2249, 'Lajpat Nagar', 'reported', 'c1000000-0000-0000-0000-000000000003', 15,
   NOW() - INTERVAL '14 days'),
  ('d1000003-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'streetlight',
   'No lights at night near Lajpat Nagar metro - safety concern', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
   28.6351, 77.2251, 'Lajpat Nagar', 'reported', 'c1000000-0000-0000-0000-000000000003', 9,
   NOW() - INTERVAL '12 days'),
  ('d1000003-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', 'streetlight',
   'Pole is dangling dangerously, risk of electrocution', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
   28.6348, 77.2248, 'Lajpat Nagar', 'reported', 'c1000000-0000-0000-0000-000000000003', 20,
   NOW() - INTERVAL '10 days'),

  -- Cluster 4: Water leak near Mayur Vihar (3 reports)
  ('d1000004-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'water_leak',
   'Water main burst on Mayur Vihar Phase 1, flooding the street', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6449, 77.2149, 'Mayur Vihar', 'in_progress', 'c1000000-0000-0000-0000-000000000004', 11,
   NOW() - INTERVAL '6 days'),
  ('d1000004-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'water_leak',
   'Pipe leak near park, wasting water for days', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6451, 77.2151, 'Mayur Vihar', 'in_progress', 'c1000000-0000-0000-0000-000000000004', 6,
   NOW() - INTERVAL '5 days'),
  ('d1000004-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000002', 'water_leak',
   'Sewage mixing with water supply - urgent health hazard', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6450, 77.2150, 'Mayur Vihar', 'in_progress', 'c1000000-0000-0000-0000-000000000004', 18,
   NOW() - INTERVAL '4 days'),

  -- Cluster 5: Pothole in Dwarka (3 reports) - RESOLVED
  ('d1000005-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000005', 'pothole',
   'Pothole on Dwarka Sector 10 main road fixed after months', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6519, 77.2309, 'Dwarka', 'resolved', 'c1000000-0000-0000-0000-000000000005', 4,
   NOW() - INTERVAL '25 days'),
  ('d1000005-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 'pothole',
   'Deep crater on Dwarka expressway service road', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6521, 77.2311, 'Dwarka', 'resolved', 'c1000000-0000-0000-0000-000000000005', 3,
   NOW() - INTERVAL '22 days'),
  ('d1000005-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000003', 'pothole',
   'Multiple potholes at Dwarka Sector 10 T-point', 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400',
   28.6518, 77.2308, 'Dwarka', 'resolved', 'c1000000-0000-0000-0000-000000000005', 6,
   NOW() - INTERVAL '20 days'),

  -- Cluster 6: Garbage in Rohini (2 reports)
  ('d1000006-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000004', 'garbage',
   'Garbage dump outside Rohini Sector 7 park gate', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6599, 77.2049, 'Rohini', 'reported', 'c1000000-0000-0000-0000-000000000006', 5,
   NOW() - INTERVAL '2 days'),
  ('d1000006-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'garbage',
   'Open burning of garbage near Rohini Sector 7, air pollution', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6601, 77.2051, 'Rohini', 'reported', 'c1000000-0000-0000-0000-000000000006', 3,
   NOW() - INTERVAL '1 day'),

  -- Cluster 7: Encroachment in Pitampura (2 reports)
  ('d1000007-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000002', 'encroachment',
   'Illegal shops blocking footpath at Pitampura market', NULL,
   28.6699, 77.2399, 'Pitampura', 'reported', 'c1000000-0000-0000-0000-000000000007', 8,
   NOW() - INTERVAL '8 days'),
  ('d1000007-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 'encroachment',
   'Vendors blocking road entry, vehicles unable to pass', NULL,
   28.6701, 77.2401, 'Pitampura', 'reported', 'c1000000-0000-0000-0000-000000000007', 4,
   NOW() - INTERVAL '6 days'),

  -- Cluster 8: Water leak in Janakpuri (2 reports) - RESOLVED
  ('d1000008-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000003', 'water_leak',
   'Water pipeline burst at Janakpuri C block, resolved', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6799, 77.2499, 'Janakpuri', 'resolved', 'c1000000-0000-0000-0000-000000000008', 7,
   NOW() - INTERVAL '20 days'),
  ('d1000008-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000004', 'water_leak',
   'Flooded basement due to pipe burst - now fixed', 'https://images.unsplash.com/photo-1558383817-4b7d8d5e5e5e?w=400',
   28.6801, 77.2501, 'Janakpuri', 'resolved', 'c1000000-0000-0000-0000-000000000008', 2,
   NOW() - INTERVAL '18 days'),

  -- Singleton Issues (not clustered)
  ('d1000009-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000006', 'other',
   'Broken bench in Saket park, hazard for elderly', NULL,
   28.5245, 77.2066, 'Saket', 'reported', NULL, 1,
   NOW() - INTERVAL '1 day'),
  ('d1000009-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000002', 'streetlight',
   'Streetlight flickering at Vasant Kunj Gate', NULL,
   28.5205, 77.1577, 'Vasant Kunj', 'reported', NULL, 0,
   NOW() - INTERVAL '3 hours'),
  ('d1000009-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000005', 'pothole',
   'Newly formed pothole after rain on Mehrauli-Badarpur Road', NULL,
   28.5080, 77.2590, 'Mehrauli', 'reported', NULL, 2,
   NOW() - INTERVAL '5 hours'),
  ('d1000009-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000003', 'garbage',
   'Garbage dump outside Nehru Place metro, stray animals', NULL,
   28.5491, 77.2523, 'Nehru Place', 'reported', NULL, 3,
   NOW() - INTERVAL '2 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- STATUS LOGS (Audit trail for issues)
-- ============================================================
INSERT INTO status_logs (issue_id, old_status, new_status, changed_by, note, changed_at) VALUES
  -- Cluster 1 pothole: reported → in_progress
  ('d1000001-0000-0000-0000-000000000001', 'reported', 'in_progress', 'b1000000-0000-0000-0000-000000000007',
   'Assigned to Roads department. Crew scheduled for inspection.', NOW() - INTERVAL '8 days'),
  -- Cluster 5 pothole: reported → in_progress → resolved
  ('d1000005-0000-0000-0000-000000000001', 'reported', 'in_progress', 'b1000000-0000-0000-0000-000000000007',
   'Crew dispatched to Dwarka Sector 10.', NOW() - INTERVAL '18 days'),
  ('d1000005-0000-0000-0000-000000000001', 'in_progress', 'resolved', 'b1000000-0000-0000-0000-000000000001',
   'Pothole filled and road repaired successfully.', NOW() - INTERVAL '10 days'),
  -- Cluster 8 water: reported → in_progress → resolved
  ('d1000008-0000-0000-0000-000000000001', 'reported', 'in_progress', 'b1000000-0000-0000-0000-000000000001',
   'Plumbing team dispatched.', NOW() - INTERVAL '17 days'),
  ('d1000008-0000-0000-0000-000000000001', 'in_progress', 'resolved', 'b1000000-0000-0000-0000-000000000001',
   'Pipeline repaired. Area cleaned.', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- ============================================================
-- UPVOTES
-- ============================================================
INSERT INTO upvotes (user_id, issue_id) VALUES
  ('b1000000-0000-0000-0000-000000000002', 'd1000002-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000003', 'd1000003-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000004', 'd1000003-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000005', 'd1000001-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000006', 'd1000004-0000-0000-0000-000000000003')
ON CONFLICT DO NOTHING;
