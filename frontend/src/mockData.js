// Mock / Seed Data for CrowdSourced Platform
// Reflects realistic civic issue data in Delhi NCR area matching backend schema

export const MOCK_DEPARTMENTS = [
  { id: 'a1000000-0000-0000-0000-000000000001', name: 'Roads & Potholes', contact_email: 'roads@civic.gov.in' },
  { id: 'a1000000-0000-0000-0000-000000000002', name: 'Sanitation & Garbage', contact_email: 'sanitation@civic.gov.in' },
  { id: 'a1000000-0000-0000-0000-000000000003', name: 'Electricity & Streetlights', contact_email: 'electricity@civic.gov.in' },
  { id: 'a1000000-0000-0000-0000-000000000004', name: 'Water & Drainage', contact_email: 'water@civic.gov.in' },
  { id: 'a1000000-0000-0000-0000-000000000005', name: 'Parks & Recreation', contact_email: 'parks@civic.gov.in' }
];

export const MOCK_USERS = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    name: 'Super Admin',
    email: 'admin@civic.in',
    phone: '9999000001',
    role: 'admin',
    department_id: null
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    name: 'Rahul Sharma',
    email: 'citizen1@civic.in',
    phone: '9999000002',
    role: 'citizen',
    department_id: null
  },
  {
    id: 'b1000000-0000-0000-0000-000000000007',
    name: 'Ramesh Gupta',
    email: 'dept.roads@civic.in',
    phone: '9999000007',
    role: 'department',
    department_id: 'a1000000-0000-0000-0000-000000000001'
  }
];

export const MOCK_CLUSTERS = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    category: 'pothole',
    centroid_lat: 28.6129,
    centroid_lng: 77.2295,
    member_count: 4,
    status: 'in_progress',
    assigned_department_id: 'a1000000-0000-0000-0000-000000000001',
    department_name: 'Roads & Potholes',
    created_at: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    category: 'garbage',
    centroid_lat: 28.6215,
    centroid_lng: 77.2100,
    member_count: 3,
    status: 'reported',
    assigned_department_id: 'a1000000-0000-0000-0000-000000000002',
    department_name: 'Sanitation & Garbage',
    created_at: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    category: 'streetlight',
    centroid_lat: 28.6350,
    centroid_lng: 77.2250,
    member_count: 3,
    status: 'reported',
    assigned_department_id: 'a1000000-0000-0000-0000-000000000003',
    department_name: 'Electricity & Streetlights',
    created_at: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    category: 'water_leak',
    centroid_lat: 28.6450,
    centroid_lng: 77.2150,
    member_count: 3,
    status: 'in_progress',
    assigned_department_id: 'a1000000-0000-0000-0000-000000000004',
    department_name: 'Water & Drainage',
    created_at: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    category: 'pothole',
    centroid_lat: 28.6520,
    centroid_lng: 77.2310,
    member_count: 3,
    status: 'resolved',
    assigned_department_id: 'a1000000-0000-0000-0000-000000000001',
    department_name: 'Roads & Potholes',
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000006',
    category: 'garbage',
    centroid_lat: 28.6600,
    centroid_lng: 77.2050,
    member_count: 2,
    status: 'reported',
    assigned_department_id: null,
    department_name: null,
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: 'c1000000-0000-0000-0000-000000000007',
    category: 'encroachment',
    centroid_lat: 28.6700,
    centroid_lng: 77.2400,
    member_count: 2,
    status: 'reported',
    assigned_department_id: null,
    department_name: null,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

export const MOCK_ISSUES = [
  {
    id: 'd1000001-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000002',
    reporter_name: 'Rahul Sharma',
    category: 'pothole',
    description: 'Large pothole on Janpath, causing accidents during rain',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6128,
    longitude: 77.2294,
    ward: 'Connaught Place',
    status: 'in_progress',
    cluster_id: 'c1000000-0000-0000-0000-000000000001',
    cluster_member_count: 4,
    cluster_status: 'in_progress',
    department_name: 'Roads & Potholes',
    upvote_count: 14,
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Rahul Sharma', changed_at: new Date(Date.now() - 10 * 86400000).toISOString(), note: 'Issue reported by citizen' },
      { id: '2', old_status: 'reported', new_status: 'in_progress', changed_by_name: 'Ramesh Gupta', changed_at: new Date(Date.now() - 8 * 86400000).toISOString(), note: 'Work order #RD-849 issued to contractor team.' }
    ]
  },
  {
    id: 'd1000001-0000-0000-0000-000000000002',
    user_id: 'b1000000-0000-0000-0000-000000000003',
    reporter_name: 'Priya Mehta',
    category: 'pothole',
    description: 'Deep pothole on Janpath road, nearly 30cm wide and waterlogged',
    photo_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6130,
    longitude: 77.2296,
    ward: 'Connaught Place',
    status: 'in_progress',
    cluster_id: 'c1000000-0000-0000-0000-000000000001',
    cluster_member_count: 4,
    cluster_status: 'in_progress',
    department_name: 'Roads & Potholes',
    upvote_count: 9,
    created_at: new Date(Date.now() - 9 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Priya Mehta', changed_at: new Date(Date.now() - 9 * 86400000).toISOString(), note: 'Issue reported by citizen' },
      { id: '2', old_status: 'reported', new_status: 'in_progress', changed_by_name: 'Ramesh Gupta', changed_at: new Date(Date.now() - 8 * 86400000).toISOString(), note: 'Grouped with Janpath cluster.' }
    ]
  },
  {
    id: 'd1000002-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000003',
    reporter_name: 'Priya Mehta',
    category: 'garbage',
    description: 'Overflowing garbage bins at Karol Bagh market, stench unbearable and blocking pedestrian path',
    photo_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6214,
    longitude: 77.2099,
    ward: 'Karol Bagh',
    status: 'reported',
    cluster_id: 'c1000000-0000-0000-0000-000000000002',
    cluster_member_count: 3,
    cluster_status: 'reported',
    department_name: 'Sanitation & Garbage',
    upvote_count: 18,
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Priya Mehta', changed_at: new Date(Date.now() - 5 * 86400000).toISOString(), note: 'Issue reported by citizen' }
    ]
  },
  {
    id: 'd1000002-0000-0000-0000-000000000002',
    user_id: 'b1000000-0000-0000-0000-000000000004',
    reporter_name: 'Arun Kumar',
    category: 'garbage',
    description: 'Garbage not collected for 3 days in Karol Bagh block 7',
    photo_url: 'https://images.unsplash.com/photo-1605600659873-d808a13e4d2a?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6216,
    longitude: 77.2101,
    ward: 'Karol Bagh',
    status: 'reported',
    cluster_id: 'c1000000-0000-0000-0000-000000000002',
    cluster_member_count: 3,
    cluster_status: 'reported',
    department_name: 'Sanitation & Garbage',
    upvote_count: 11,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Arun Kumar', changed_at: new Date(Date.now() - 4 * 86400000).toISOString(), note: 'Issue reported by citizen' }
    ]
  },
  {
    id: 'd1000003-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000005',
    reporter_name: 'Sunita Rao',
    category: 'streetlight',
    description: '3 consecutive streetlights completely dead along Pahar Ganj main boulevard, pitch dark at night',
    photo_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6349,
    longitude: 77.2249,
    ward: 'Pahar Ganj',
    status: 'reported',
    cluster_id: 'c1000000-0000-0000-0000-000000000003',
    cluster_member_count: 3,
    cluster_status: 'reported',
    department_name: 'Electricity & Streetlights',
    upvote_count: 22,
    created_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Sunita Rao', changed_at: new Date(Date.now() - 4 * 86400000).toISOString(), note: 'Issue reported by citizen' }
    ]
  },
  {
    id: 'd1000004-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000006',
    reporter_name: 'Vikram Singh',
    category: 'water_leak',
    description: 'Major underground pipeline rupture near Rajendra Place. Drinking water flooding street',
    photo_url: 'https://images.unsplash.com/photo-1584467735815-f778f274e296?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6449,
    longitude: 77.2148,
    ward: 'Rajendra Place',
    status: 'in_progress',
    cluster_id: 'c1000000-0000-0000-0000-000000000004',
    cluster_member_count: 3,
    cluster_status: 'in_progress',
    department_name: 'Water & Drainage',
    upvote_count: 31,
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Vikram Singh', changed_at: new Date(Date.now() - 3 * 86400000).toISOString(), note: 'Issue reported by citizen' },
      { id: '2', old_status: 'reported', new_status: 'in_progress', changed_by_name: 'Super Admin', changed_at: new Date(Date.now() - 2 * 86400000).toISOString(), note: 'Maintenance crew dispatched with vacuum pump.' }
    ]
  },
  {
    id: 'd1000005-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000002',
    reporter_name: 'Rahul Sharma',
    category: 'pothole',
    description: 'Road cave-in repaired successfully near Chandni Chowk junction',
    photo_url: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6521,
    longitude: 77.2309,
    ward: 'Chandni Chowk',
    status: 'resolved',
    cluster_id: 'c1000000-0000-0000-0000-000000000005',
    cluster_member_count: 3,
    cluster_status: 'resolved',
    department_name: 'Roads & Potholes',
    upvote_count: 27,
    created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Rahul Sharma', changed_at: new Date(Date.now() - 15 * 86400000).toISOString(), note: 'Issue reported' },
      { id: '2', old_status: 'reported', new_status: 'in_progress', changed_by_name: 'Ramesh Gupta', changed_at: new Date(Date.now() - 12 * 86400000).toISOString(), note: 'Road resurfacing ongoing.' },
      { id: '3', old_status: 'in_progress', new_status: 'resolved', changed_by_name: 'Ramesh Gupta', changed_at: new Date(Date.now() - 2 * 86400000).toISOString(), note: 'Resurfacing completed & tested.' }
    ]
  },
  {
    id: 'd1000007-0000-0000-0000-000000000001',
    user_id: 'b1000000-0000-0000-0000-000000000004',
    reporter_name: 'Arun Kumar',
    category: 'encroachment',
    description: 'Illegal temporary kiosks blocking footpath outside civil hospital gate',
    photo_url: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&auto=format&fit=crop&q=60',
    latitude: 28.6701,
    longitude: 77.2399,
    ward: 'Civil Lines',
    status: 'reported',
    cluster_id: 'c1000000-0000-0000-0000-000000000007',
    cluster_member_count: 2,
    cluster_status: 'reported',
    department_name: null,
    upvote_count: 15,
    created_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    status_logs: [
      { id: '1', old_status: null, new_status: 'reported', changed_by_name: 'Arun Kumar', changed_at: new Date(Date.now() - 1 * 86400000).toISOString(), note: 'Issue reported by citizen' }
    ]
  }
];

export const CATEGORY_META = {
  pothole: { label: 'Pothole & Roads', color: '#f59e0b', icon: 'AlertTriangle' },
  garbage: { label: 'Garbage & Waste', color: '#10b981', icon: 'Trash2' },
  streetlight: { label: 'Streetlight & Power', color: '#eab308', icon: 'Lightbulb' },
  water_leak: { label: 'Water & Drainage', color: '#00d4ff', icon: 'Droplets' },
  encroachment: { label: 'Footpath & Encroachment', color: '#ef4444', icon: 'ShieldAlert' },
  other: { label: 'General / Other', color: '#a855f7', icon: 'HelpCircle' }
};

export const STATUS_META = {
  reported: { label: 'Reported', color: 'var(--status-reported)', bg: 'var(--status-reported-bg)', class: 'badge-reported' },
  assigned: { label: 'Assigned', color: 'var(--status-assigned)', bg: 'var(--status-assigned-bg)', class: 'badge-assigned' },
  in_progress: { label: 'In Progress', color: 'var(--status-in-progress)', bg: 'var(--status-in-progress-bg)', class: 'badge-in_progress' },
  resolved: { label: 'Resolved', color: 'var(--status-resolved)', bg: 'var(--status-resolved-bg)', class: 'badge-resolved' },
  rejected: { label: 'Rejected', color: 'var(--status-rejected)', bg: 'var(--status-rejected-bg)', class: 'badge-rejected' }
};
