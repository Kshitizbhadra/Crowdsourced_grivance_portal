import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from dbscan import run_dbscan_clustering

load_dotenv()

app = Flask(__name__)
CORS(app)

PORT = int(os.environ.get('PORT', 5001))
DEFAULT_EPS_METERS = float(os.environ.get('DBSCAN_EPS_METERS', 50.0))
DEFAULT_MIN_SAMPLES = int(os.environ.get('DBSCAN_MIN_SAMPLES', 2))
DEFAULT_TIME_WINDOW_DAYS = int(os.environ.get('DBSCAN_TIME_WINDOW_DAYS', 30))

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "service": "crowdsourced-clustering",
        "default_eps_meters": DEFAULT_EPS_METERS,
        "default_min_samples": DEFAULT_MIN_SAMPLES
    })

@app.route('/cluster', methods=['POST'])
def cluster_endpoint():
    try:
        data = request.get_json(force=True)
        issues = data.get('issues', [])
        eps_meters = float(data.get('eps_meters', DEFAULT_EPS_METERS))
        min_samples = int(data.get('min_samples', DEFAULT_MIN_SAMPLES))
        time_window_days = int(data.get('time_window_days', DEFAULT_TIME_WINDOW_DAYS))

        clusters = run_dbscan_clustering(
            issues=issues,
            eps_meters=eps_meters,
            min_samples=min_samples,
            time_window_days=time_window_days
        )

        return jsonify({
            "status": "success",
            "cluster_count": len(clusters),
            "clusters": clusters
        }), 200

    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=PORT, debug=True)
