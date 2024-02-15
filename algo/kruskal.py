import heapq
from collections import defaultdict

class UnionFind:
    def __init__(self, vertices):
        self.parent = {v: v for v in vertices}
        self.rank = {v: 0 for v in vertices}

    def find(self, vertex):
        if self.parent[vertex] != vertex:
            self.parent[vertex] = self.find(self.parent[vertex])
        return self.parent[vertex]

    def union(self, u, v):
        rootU = self.find(u)
        rootV = self.find(v)
        if rootU != rootV:
            if self.rank[rootU] > self.rank[rootV]:
                self.parent[rootV] = rootU
            else:
                self.parent[rootU] = rootV
                if self.rank[rootU] == self.rank[rootV]:
                    self.rank[rootV] += 1

def kruskal(graph):
    # Initialize UnionFind
    uf = UnionFind(graph.keys())

    # Create a list to store the minimum spanning tree edges
    mst = []

    # Sort all edges in graph based on weight
    edges = [(weight, u, v) for u, adj in graph.items() for v, weight in adj.items()]
    edges = list(set(edges))  # Eliminate duplicates for undirected graph
    edges.sort()

    # Kruskal's Algorithm
    for weight, u, v in edges:
        if uf.find(u) != uf.find(v):
            uf.union(u, v)
            mst.append((u, v, weight))

    return mst

# Example usage:
# graph = {
#     "a": {"b": 4, "h": 8},
#     "b": {"a": 4, "c": 8, "h": 11},
#     "c": {"b": 8, "d": 7, "i": 2},
#     "d": {"c": 7, "e": 9, "f": 14},
#     "e": {"d": 9, "f": 10},
#     "f": {"d": 14, "e": 10, "g": 2},
#     "g": {"f": 2, "h": 1, "i": 6},
#     "h": {"a": 8, "b": 11, "g": 1, "i": 7},
#     "i": {"c": 2, "g": 6, "h": 7}
# }
# mst = kruskal(graph)
# print(mst)
