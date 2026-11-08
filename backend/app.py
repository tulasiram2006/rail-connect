

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

@app.route("/")
def home():
    return jsonify({"message": "Railway backend is running"})

@app.route("/stations")
def stations():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "Enter station name or code"}), 400

    try:
        response = requests.get(
            BASE_URL + "/lookup/search/stations",
            headers={"Authorization": f"Bearer {API_KEY}"},
            params={"q": q, "limit": 10},
            timeout=20
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

@app.route("/trains")
def trains():
    source = request.args.get("from", "").strip().upper()
    destination = request.args.get("to", "").strip().upper()
    date = request.args.get("date", "").strip()

    if not source or not destination:
        return jsonify({"error": "Source and destination are required"}), 400

    try:
        response = requests.get(
            f"{BASE_URL}/trains/between/{source}/{destination}",
            headers={"Authorization": f"Bearer {API_KEY}"},
            params={"date": date} if date else {},
            timeout=20
        )
        return jsonify(response.json()), response.status_code
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 502

if __name__ == "__main__":
    app.run(debug=True, port=5000)
