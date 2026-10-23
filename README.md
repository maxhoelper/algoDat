# AlgoDat – Algorithmen Schritt für Schritt

Interaktive Visualisierung der klassischen Algorithmen aus *Algorithmen und Datenstrukturen*, gebaut für die Klausurvorbereitung:

- **Pseudocode nach CLRS** (Cormen et al., *Introduction to Algorithms*). Die gerade ausgeführte Zeile ist hervorgehoben.
- **Die Tabellen aus der Klausur**: d/π bei Dijkstra und Bellman-Ford, key/π bei Prim, sortierte Kantenliste mit Status bei Kruskal. Sie wachsen Zeile für Zeile mit, sodass man die eigene Lösung damit vergleichen kann.
- **Eigene Eingaben**: Zahlenfolgen bzw. Graphen als Kantenliste (`A B 4`), dazu Zufallsgraphen und die Beispiele aus dem CLRS.
- Alles läuft im Browser, ohne Server, Build-Schritt oder Abhängigkeiten.

| Sortieren | Minimale Spannbäume | Kürzeste Wege |
|---|---|---|
| Insertion Sort, Merge Sort, Heapsort, Quicksort, Counting Sort, Radix Sort | Kruskal, Prim | Bellman-Ford, Dijkstra |

## Lokal starten

ES-Module brauchen einen HTTP-Server (ein Doppelklick auf `index.html` reicht nicht):

```bash
npm start
```

Danach http://localhost:8000 öffnen.

## Tests

```bash
npm test
```

Die Tests prüfen alle Sortierverfahren mit Zufallseingaben, die CLRS-Beispiele (Dijkstra, Bellman-Ford, MST mit Gewicht 37), die Erkennung negativer Zyklen und vergleichen Dijkstra/Bellman-Ford sowie Prim/Kruskal auf Zufallsgraphen.

## Aufbau

```
index.html            Gerüst, Navigation
css/style.css         Gestaltung inkl. Dark Mode
js/app.js             Routing, Seiten, Eingaben
js/catalog.js         Erklärtexte, Laufzeiten, Beispiele
js/algorithms/        Algorithmen – liefern eine Liste von Schritten (Snapshots)
js/views.js           Darstellung: Balken, Heap-Baum, Graph (SVG), Tabellen, Pseudocode
js/player.js          Schrittsteuerung (← → Leertaste)
js/graph-io.js        Graph-Textformat, Layout, Beispiel- und Zufallsgraphen
```

## Geschichte

Ursprünglich 2024 als Quarto-Seite mit Flask-Backend zur Vorlesung an der Universität Mannheim entstanden (Tag `v1-quarto`), 2026 komplett neu gebaut.
