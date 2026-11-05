import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import LiveMap from './pages/LiveMap';
import ReportIssue from './pages/ReportIssue';
import AdminDashboard from './pages/AdminDashboard';
import Analytics from './pages/Analytics';
import AuthPage from './pages/AuthPage';
import MyReports from './pages/MyReports';

function App() {
  return (
    <AuthProvider>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<LiveMap />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/my-reports" element={<MyReports />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
