import heapq
from copy import deepcopy
import time

def dijkstra(graph, start):
    start_time = time.time()  # Startzeit messen

    queue = []
    heapq.heappush(queue, (0, start))

    distances = {node: float('infinity') for node in graph}
    distances[start] = 0
    predecessors = {node: None for node in graph}
    distances_dic = {}
    predecessors_dic = {}
    visited_nodes_dic = {}
    discovered_nodes_dic = {}

    visited_nodes = []  # Startknoten wird zunächst nicht als besucht markiert
    discovered_nodes = [start]  # Startknoten als entdeckt markieren

    i = 0

    while queue:
        current_distance, current_node = heapq.heappop(queue)

        # Verhindern, dass Knoten mehrfach zu visited_nodes hinzugefügt werden
        if current_node not in visited_nodes:
            visited_nodes.append(current_node)  # Markiere den Knoten als besucht, sobald er entnommen wird

        if current_distance > distances[current_node]:
            continue

        distances_dic[i] = deepcopy(distances)
        predecessors_dic[i] = deepcopy(predecessors)
        visited_nodes_dic[i] = deepcopy(visited_nodes)
        discovered_nodes_dic[i] = deepcopy(discovered_nodes)

        for neighbor, weight in graph[current_node].items():
            if neighbor not in visited_nodes and neighbor not in discovered_nodes:
                discovered_nodes.append(neighbor)

            distance = current_distance + weight

            if distance < distances[neighbor]:
                distances[neighbor] = distance
                predecessors[neighbor] = current_node
                if neighbor not in visited_nodes:
                    heapq.heappush(queue, (distance, neighbor))

        i += 1

    end_time = time.time()  # Endzeit messen
    execution_time = end_time - start_time  # Ausführungszeit berechnen

    return distances_dic, predecessors_dic, visited_nodes_dic, discovered_nodes_dic, execution_time
