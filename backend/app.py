
import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

API_KEY = os.getenv("RAILRADAR_API_KEY")
BASE_URL = "https://api.railradar.in/v1"

HEADERS = {
    "Authorization": f"Bearer {API_KEY}"
}


@app.route("/")
def home():
    return jsonify({
        "message": "Railway backend is running",
        "status": "success"
    })


@app.route("/health")
def health():
    return jsonify({"status": "healthy"})


@app.route("/stations")
def stations():
    q = request.args.get("q", "").strip()

    if not q:
        return jsonify({"error": "Enter station name or code"}), 400

    if not API_KEY:
        return jsonify({"error": "RailRadar API key is missing"}), 500

    try:
        response = requests.get(
            f"{BASE_URL}/lookup/search/stations",
            headers=HEADERS,
            params={"q": q, "limit": 10},
            timeout=(5, 10)
        )

        try:
            data = response.json()
        except ValueError:
            return jsonify({
                "error": "Invalid response from RailRadar",
                "status": response.status_code
            }), 502

        return jsonify(data), response.status_code

    except requests.Timeout:
        return jsonify({
            "error": "RailRadar request timed out. Please try again."
        }), 504

    except requests.RequestException as e:
        app.logger.error("Station API error: %s", e)
        return jsonify({"error": "Unable to connect to RailRadar"}), 502


@app.route("/trains")
def trains():
    source = request.args.get("from", "").strip().upper()
    destination = request.args.get("to", "").strip().upper()
    date = request.args.get("date", "").strip()

    if not source or not destination:
        return jsonify({
            "error": "Source and destination are required"
        }), 400

    if not API_KEY:
        return jsonify({"error": "RailRadar API key is missing"}), 500

    try:
        response = requests.get(
            f"{BASE_URL}/trains/between/{source}/{destination}",
            headers=HEADERS,
            params={"date": date} if date else {},
            timeout=(5, 10)
        )

        try:
            data = response.json()
        except ValueError:
            return jsonify({
                "error": "Invalid response from RailRadar",
                "status": response.status_code
            }), 502

        return jsonify(data), response.status_code

    except requests.Timeout:
        return jsonify({
            "error": "Train search timed out. Please try again."
        }), 504

    except requests.RequestException as e:
        app.logger.error("Train API error: %s", e)
        return jsonify({"error": "Unable to connect to RailRadar"}), 502


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
