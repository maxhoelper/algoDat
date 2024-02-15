import matplotlib.pyplot as plt
import matplotlib
matplotlib.use('Agg')  # Für nicht-interaktive, Datei-basierte Outputs
import json
import sys
sys.path.insert(1, '/Users/maxhoelper/Development/quarto/algoDat/algo')
import dijkstra
sys.path.insert(1, '/Users/maxhoelper/Development/quarto/algoDat')
from helper import file_count as fileCount
from helper import delete_files as deleteFiles
import zipfile  # For creating a zip file
import os
sys.path.insert(1, '/Users/maxhoelper/Development/quarto/algoDat')
from helper import draw_graph
from flask import Flask, send_file, request, jsonify  # Import `request` hinzufügen

def main(app):
    @app.route('/dijkstra/get-image', methods=['GET'])
    def get_image():
        deleteFiles.delete_files_in_folder("/Users/maxhoelper/Development/quarto/algoDat/tmp")
        deleteFiles.delete_files_in_folder("/Users/maxhoelper/Development/quarto/algoDat/tmp/temp")
        # Den Wert des `dataInput` Query-Parameters erhalten
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String

            graph = json.loads(dot_content)
            start_node = 'A'
            distances_dic, _, visited_nodes, discovered_nodes, _ = dijkstra.dijkstra(graph, start_node)
            i = 0
            for key, item in distances_dic.items():
                draw_graph.draw_graph(graph, item, key, discovered_nodes[i], visited_nodes[i])
                i = i+1

            files_directory = "/Users/maxhoelper/Development/quarto/algoDat/tmp"
            # Define the directory containing the files you want to send
            file_names = []
            for x in range(int(fileCount.get_file_count(files_directory))):
                file_names.append("graph" + str(x) + ".png")


            # Create a temporary directory to store the zip file
            temp_dir = os.path.join(files_directory, "temp")
            os.makedirs(temp_dir, exist_ok=True)

            # Path for the zip file
            zip_path = os.path.join(temp_dir, "files.zip")

            # Creating a zip file containing all the files
            with zipfile.ZipFile(zip_path, 'w') as zipf:
                for file_name in file_names:
                    file_path = os.path.join(files_directory, file_name)
                    if os.path.exists(file_path):
                        zipf.write(file_path, arcname=os.path.basename(file_path))

            # Send the zip file
            return send_file(zip_path, mimetype='application/zip', as_attachment=True)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400

    @app.route('/dijkstra/get-distances', methods=['GET'])
    def get_distances():
        # Den Wert des `dataInput` Query-Parameters erhalten
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String
            graph = json.loads(dot_content)

            start_node = 'A'
            distances, _, _, _, _ = dijkstra.dijkstra(graph, start_node)

            return jsonify(distances)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400

    @app.route('/dijkstra/get-pi', methods=['GET'])
    def get_pi():
        # Den Wert des `dataInput` Query-Parameters erhalten
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String
            graph = json.loads(dot_content)

            start_node = 'A'
            _, pi, _, _, _ = dijkstra.dijkstra(graph, start_node)

            return jsonify(pi)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400

    @app.route('/dijkstra/get-time', methods=['GET'])
    def get_time():
        # Den Wert des `dataInput` Query-Parameters erhalten
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String
            graph = json.loads(dot_content)

            start_node = 'A'
            _, _, _, _, time = dijkstra.dijkstra(graph, start_node)
            return str(time)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400

    @app.route('/dijkstra/get-visitedNodes', methods=['GET'])
    def get_visited_nodes():
        # Den Wert des `dataInput` Query-Parameters erhalten
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String
            graph = json.loads(dot_content)

            start_node = 'A'
            _, _, visited_nodes, _, _ = dijkstra.dijkstra(graph, start_node)

            return jsonify(visited_nodes)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400

    @app.route('/dijkstra/get-discoveredNodes', methods=['GET'])
    def get_discovered_nodes():
        dot_content = request.args.get('dataInput', '')  # Standardwert als leerer String, falls nicht vorhanden
        if dot_content:  # Prüfen, ob dot_content nicht leer ist
            # Erstellen des Graphen aus dem übergebenen String
            graph = json.loads(dot_content)

            start_node = 'A'
            _, _, _ , discovered_nodes, _ = dijkstra.dijkstra(graph, start_node)

            return jsonify(discovered_nodes)
        else:
            # Einen Fehler zurückgeben oder eine andere Form der Handhabung, wenn kein Inhalt übergeben wurde
            return "No dataInput provided", 400