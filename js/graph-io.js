// Textformat für Graphen, Layout, Beispielgraphen und Zufallsgraphen.
//
// Format: eine Kante pro Zeile, "u v gewicht" (z. B. "A B 4" oder "A -> B 4").
// Eine Zeile mit nur einem Namen legt einen isolierten Knoten an, "#" leitet einen Kommentar ein.

export const WIDTH = 640;
export const HEIGHT = 420;
const PAD = 36;

const byId = (a, b) => a.localeCompare(b, 'de', { numeric: true });

export function parseGraph(text, directed) {
  const ids = [];
  const seen = new Set();
  const edges = [];
  const errors = [];
  const pairs = new Set();
  const addNode = (id) => {
    if (!seen.has(id)) { seen.add(id); ids.push(id); }
  };

  text.split('\n').forEach((raw, i) => {
    const line = raw.replace(/#.*/, '').replace(/->|→|–|—/g, ' ').replace(/[,;:]/g, ' ').trim();
    if (!line) return;
    const parts = line.split(/\s+/);
    if (parts.length > 3) {
      errors.push(`Zeile ${i + 1}: erwartet „u v gewicht“, gefunden „${raw.trim()}“.`);
      return;
    }
    const [u, v, w] = parts;
    if ([u, v].some((id) => id && id.length > 6)) {
      errors.push(`Zeile ${i + 1}: Knotennamen dürfen höchstens 6 Zeichen lang sein.`);
      return;
    }
    addNode(u);
    if (v === undefined) return;
    const weight = w === undefined ? 1 : Number(w);
    if (!Number.isFinite(weight)) {
      errors.push(`Zeile ${i + 1}: „${w}“ ist kein gültiges Gewicht.`);
      return;
    }
    addNode(v);
    const key = directed ? `${u}\u0000${v}` : [u, v].sort().join('\u0000');
    if (pairs.has(key)) return; // doppelte Kante (z. B. A B und B A bei ungerichteten Graphen)
    pairs.add(key);
    edges.push({ u, v, w: weight });
  });

  if (!ids.length) errors.push('Der Graph braucht mindestens einen Knoten.');
  if (ids.length > 26) errors.push('Bitte höchstens 26 Knoten verwenden.');
  return { ids, edges, errors };
}

export function serializeGraph(graph) {
  const lines = graph.edges.map((e) => `${e.u} ${e.v} ${e.w}`);
  const used = new Set(graph.edges.flatMap((e) => [e.u, e.v]));
  for (const n of graph.nodes) if (!used.has(n.id)) lines.push(n.id);
  return lines.join('\n');
}

// Baut einen Graphen aus Text und übernimmt bekannte Positionen; neue Knoten werden per Kräfte-Layout platziert.
export function buildGraph(text, directed, previous = null) {
  const { ids, edges, errors } = parseGraph(text, directed);
  if (errors.length) return { errors };
  const fixed = {};
  for (const n of previous?.nodes ?? []) if (ids.includes(n.id)) fixed[n.id] = { x: n.x, y: n.y };
  const pos = layout(ids, edges, fixed);
  return { graph: { directed, nodes: ids.map((id) => ({ id, ...pos[id] })), edges }, errors: [] };
}

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Fruchterman-Reingold: Knoten stoßen sich ab, Kanten ziehen zusammen.
export function layout(ids, edges, fixed = {}) {
  const n = ids.length;
  const pos = {};
  ids.forEach((id, k) => {
    pos[id] = fixed[id]
      ? { ...fixed[id] }
      : { x: WIDTH / 2 + 0.38 * WIDTH * Math.cos((2 * Math.PI * k) / n - Math.PI / 2), y: HEIGHT / 2 + 0.36 * HEIGHT * Math.sin((2 * Math.PI * k) / n - Math.PI / 2) };
  });
  const free = ids.filter((id) => !fixed[id]);
  if (!free.length || n < 3) return round(pos);

  const k = Math.sqrt(((WIDTH - 2 * PAD) * (HEIGHT - 2 * PAD)) / n) * 0.8;
  let temp = WIDTH / 10;
  for (let iter = 0; iter < 300; iter++) {
    const disp = Object.fromEntries(ids.map((id) => [id, { x: 0, y: 0 }]));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos[ids[i]], b = pos[ids[j]];
        let dx = a.x - b.x, dy = a.y - b.y;
        const dist = Math.hypot(dx, dy) || 0.01;
        const f = (k * k) / dist;
        dx = (dx / dist) * f; dy = (dy / dist) * f;
        disp[ids[i]].x += dx; disp[ids[i]].y += dy;
        disp[ids[j]].x -= dx; disp[ids[j]].y -= dy;
      }
    }
    for (const { u, v } of edges) {
      if (u === v) continue;
      const a = pos[u], b = pos[v];
      const dx = a.x - b.x, dy = a.y - b.y;
      const dist = Math.hypot(dx, dy) || 0.01;
      const f = (dist * dist) / k;
      disp[u].x -= (dx / dist) * f; disp[u].y -= (dy / dist) * f;
      disp[v].x += (dx / dist) * f; disp[v].y += (dy / dist) * f;
    }
    for (const id of free) {
      const d = disp[id];
      const len = Math.hypot(d.x, d.y) || 0.01;
      pos[id].x = clamp(pos[id].x + (d.x / len) * Math.min(len, temp), PAD, WIDTH - PAD);
      pos[id].y = clamp(pos[id].y + (d.y / len) * Math.min(len, temp), PAD, HEIGHT - PAD);
    }
    temp = Math.max(temp * 0.97, 0.5);
  }
  return round(pos);
}

function round(pos) {
  for (const p of Object.values(pos)) { p.x = Math.round(p.x); p.y = Math.round(p.y); }
  return pos;
}

const at = (map) => (id) => ({ id, x: map[id][0], y: map[id][1] });
const edgeList = (s) => s.trim().split('\n').map((l) => { const [u, v, w] = l.trim().split(/\s+/); return { u, v, w: Number(w) }; });

const CLRS_SP_POS = { s: [70, 210], t: [250, 85], x: [480, 85], y: [250, 335], z: [480, 335] };
const CLRS_MST_POS = { a: [50, 210], b: [160, 90], c: [320, 90], d: [470, 90], e: [590, 210], f: [470, 330], g: [320, 330], h: [160, 330], i: [250, 210] };

export const PRESETS = {
  'clrs-dijkstra': {
    name: 'CLRS-Beispiel (gerichtet)',
    source: 's',
    graph: {
      directed: true,
      nodes: ['s', 't', 'x', 'y', 'z'].map(at(CLRS_SP_POS)),
      edges: edgeList(`s t 10
s y 5
t x 1
t y 2
y t 3
y x 9
y z 2
x z 4
z x 6
z s 7`),
    },
  },
  'clrs-bellman': {
    name: 'CLRS-Beispiel mit negativen Gewichten',
    source: 's',
    graph: {
      directed: true,
      nodes: ['s', 't', 'x', 'y', 'z'].map(at(CLRS_SP_POS)),
      edges: edgeList(`t x 5
t y 8
t z -4
x t -2
y x -3
y z 9
z x 7
z s 2
s t 6
s y 7`),
    },
  },
  'negative-cycle': {
    name: 'Negativer Zyklus',
    source: 'A',
    graph: {
      directed: true,
      nodes: [['A', 80, 210], ['B', 260, 90], ['C', 440, 210], ['D', 260, 330], ['E', 580, 210]].map(([id, x, y]) => ({ id, x, y })),
      edges: edgeList(`A B 4
A D 5
B C -2
C D -3
D B 1
C E 2`),
    },
  },
  'clrs-mst': {
    name: 'CLRS-Beispiel (ungerichtet)',
    source: 'a',
    graph: {
      directed: false,
      nodes: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map(at(CLRS_MST_POS)),
      edges: edgeList(`a b 4
a h 8
b c 8
b h 11
c d 7
c f 4
c i 2
d e 9
d f 14
e f 10
f g 2
g h 1
g i 6
h i 7`),
    },
  },
  'vorlesung': {
    name: 'Beispiel aus der alten AlgoDat-Seite',
    source: 'A',
    graph: {
      directed: false,
      nodes: ['A', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((id, k) => ({ id, x: CLRS_MST_POS['abcdefghi'[k]][0], y: CLRS_MST_POS['abcdefghi'[k]][1] })),
      edges: edgeList(`A b 4
A h 8
b c 8
b h 11
c d 7
c i 2
d e 9
d f 14
e f 10
f g 2
g h 1
g i 6
h i 7`),
    },
  },
};

export function randomGraph(directed, { n = 6 + Math.floor(Math.random() * 3), negative = false } = {}) {
  const ids = Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  const edges = [];
  const has = new Set();
  const weight = () => (negative && Math.random() < 0.2 ? -1 - Math.floor(Math.random() * 3) : 1 + Math.floor(Math.random() * 15));
  const add = (u, v) => {
    const key = directed ? `${u}${v}` : [u, v].sort().join('');
    if (u === v || has.has(key)) return;
    has.add(key);
    edges.push({ u, v, w: weight() });
  };
  // Zufälliger Spannbaum, damit (fast) alles vom Start A aus erreichbar ist.
  for (let i = 1; i < n; i++) add(ids[Math.floor(Math.random() * i)], ids[i]);
  const extra = Math.round(n * 0.7);
  for (let tries = 0; edges.length < n - 1 + extra && tries < 200; tries++) {
    add(ids[Math.floor(Math.random() * n)], ids[Math.floor(Math.random() * n)]);
  }
  edges.sort((a, b) => byId(a.u, b.u) || byId(a.v, b.v));
  const pos = layout(ids, edges);
  return { directed, nodes: ids.map((id) => ({ id, ...pos[id] })), edges };
}

export const cloneGraph = (g) => ({ directed: g.directed, nodes: g.nodes.map((n) => ({ ...n })), edges: g.edges.map((e) => ({ ...e })) });
