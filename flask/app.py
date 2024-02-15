from flask import Flask, send_file, request, jsonify  # Import `request` hinzufügen
from flask_cors import CORS
import dijkstra_app
import kruskal_app

app = Flask(__name__)
CORS(app)
dijkstra_app.main(app)
kruskal_app.main(app)

if __name__ == '__main__':
    app.run(debug=True)
