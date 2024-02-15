# Füge Knoten hinzu
for node in graph:
    if node == "A":
        dot.node(node, color="red", xlabel="test")
        dot.node(node + '_label', shape='plaintext')
        dot.edge(node , 'A_label', style='invis')
    dot.node(node)

# Füge Kanten hinzu
for start, edges in graph.items():
    for end, weight in edges.items():
        dot.edge(start, end, label=str(weight))
