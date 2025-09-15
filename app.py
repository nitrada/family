from flask import Flask, jsonify
from flask_cors import CORS
import json
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

@app.route('/api/latest-email')
def latest_email():
    try:
        # Read the email data from the local JSON file
        with open('data/latest-email.json', 'r') as f:
            email_data = json.load(f)
        return jsonify(email_data)
    except FileNotFoundError:
        return jsonify({'error': 'Email data not found'}), 404
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/')
def serve_index():
    # Serve the index.html file
    return app.send_static_file('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)
