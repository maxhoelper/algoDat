import matplotlib.pyplot as plt
import networkx as nx

def draw_graph(graph, distances, index, discoveredNodes, visitedNodes):
    G = nx.DiGraph()

    for start, edges in graph.items():
        for end, weight in edges.items():
            G.add_edge(start, end, weight=weight)

    pos = nx.spring_layout(G, seed=42)  # Bestimmt die Positionen der Knoten

    # Erstelle ein Dictionary für Knotenfarben
    node_colors_dict = {node: 'darkblue' if node in visitedNodes else 'skyblue' for node in G.nodes()}

    # Zeichnen des Graphen
    nx.draw(G, pos, with_labels=False, node_color=[node_colors_dict[node] for node in G.nodes()], node_size=700, arrows=True)

    # Zeichnen aller Kanten in Schwarz
    nx.draw_networkx_edges(G, pos, edge_color='black')

    # Gewichte als Kantenbeschriftungen
    edge_weights = nx.get_edge_attributes(G, 'weight')
    nx.draw_networkx_edge_labels(G, pos, edge_labels=edge_weights)

    # Zeichnen der Knotenlabels mit der entsprechenden Farbe basierend auf der Knotenfarbe
    for node, color in node_colors_dict.items():
        font_color = 'lightgray' if color == 'darkblue' else 'black'
        nx.draw_networkx_labels(G, pos, labels={node: node}, font_color=font_color)

    # Externe Beschriftung für die Distanzen hinzufügen
    distance_labels = {node: f"{dist}" for node, dist in distances.items()}
    label_pos = {node: [p[0], p[1] - 0.1] for node, p in pos.items()}  # Position leicht unter den Knoten verschieben für Distanzlabels
    nx.draw_networkx_labels(G, label_pos, labels=distance_labels, font_color='red')

    output_path = f'/Users/maxhoelper/Development/quarto/algoDat/tmp/graph{index}.png'
    plt.savefig(output_path)
    plt.close()
