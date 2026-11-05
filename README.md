# CrowdSourced — Civic Issue Reporting Portal

A full-stack crowdsourced civic issue reporting platform enabling citizens to report urban issues with GPS coordinates and photos, automatically cluster nearby reports using DBSCAN (Haversine distance), and provide municipal departments with live tracking, triaging, and real-time status updates.

---

## Project Structure

```
CrowdSourced/
├── frontend/          # React (Vite) + Leaflet.js + Chart.js + Vanilla CSS Design System
├── backend/           # Node.js + Express + Socket.io + PostgreSQL (pg) + JWT Auth
├── clustering/        # Python Flask + scikit-learn DBSCAN (Haversine) Microservice
├── .gitignore
└── README.md
```

---

## Services Overview

1. **Frontend (`frontend/`)**: Modern responsive web application built with React + Vite, Leaflet interactive dark maps, Chart.js analytics, and custom glassmorphism design tokens.
2. **Backend (`backend/`)**: RESTful API and WebSocket gateway providing authentication (JWT access + refresh tokens), issue management, municipal department assignment, and reverse geocoding via OpenStreetMap Nominatim.
3. **Clustering Microservice (`clustering/`)**: Python microservice running DBSCAN with Haversine distance metric to cluster civic issue reports within spatial and temporal proximity.

---

## Quick Start

### 1. Backend Service
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 2. Frontend Application
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 3. Clustering Microservice
```bash
cd clustering
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python app.py
```
