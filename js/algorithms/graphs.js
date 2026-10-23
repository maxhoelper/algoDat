// Graphalgorithmen. Ein Graph ist { directed, nodes: [{ id, x, y }], edges: [{ u, v, w }] }.
// Jede run()-Funktion liefert Schritte mit Knoten-/Kantenzuständen, Tabelle und Infozeilen.

const byId = (a, b) => a.localeCompare(b, 'de', { numeric: true });

export const fmt = (x) => (x === Infinity ? '∞' : x === -Infinity ? '−∞' : String(x).replace('-', '−'));

export function adjacency(graph) {
  const adj = Object.fromEntries(graph.nodes.map((n) => [n.id, []]));
  graph.edges.forEach((e, idx) => {
    adj[e.u].push({ v: e.v, w: e.w, idx });
    if (!graph.directed && e.u !== e.v) adj[e.v].push({ v: e.u, w: e.w, idx });
  });
  for (const list of Object.values(adj)) list.sort((x, y) => byId(x.v, y.v));
  return adj;
}

const setText = (ids) => `{${ids.join(', ')}}`;

// Gemeinsames Gerüst für Dijkstra und Prim: Knoten verlassen nacheinander die Warteschlange Q.
function queueTrace(graph, source, valueName) {
  const ids = graph.nodes.map((n) => n.id);
  const val = Object.fromEntries(ids.map((id) => [id, Infinity]));
  const pi = Object.fromEntries(ids.map((id) => [id, null]));
  const piEdge = {};
  const Q = new Set(ids);
  const done = new Set();
  const rows = [];
  const changed = new Set();
  const stats = { checks: 0, updates: 0 };
  const steps = [];
  let current = null;
  val[source] = 0;

  const columns = ['Schritt', 'u', ...ids];

  function pushRow(label, u) {
    rows.push([
      label,
      u ?? '–',
      ...ids.map((id) => ({
        text: fmt(val[id]),
        sub: pi[id] ?? '',
        cls: id === u ? 'pick' : done.has(id) ? 'final' : changed.has(id) ? 'changed' : '',
      })),
    ]);
    changed.clear();
  }

  function snap(line, msg, { edge = null, edgeState = 'active', info = [] } = {}) {
    const nodes = {}, labels = {}, edges = {};
    for (const id of ids) {
      nodes[id] = done.has(id) ? 'done' : val[id] < Infinity ? 'frontier' : 'idle';
      labels[id] = fmt(val[id]);
      if (piEdge[id] != null) edges[piEdge[id]] = done.has(id) ? 'tree' : 'candidate';
    }
    if (current) nodes[current] = 'current';
    if (edge != null) edges[edge] = edgeState;
    const queue = [...Q].sort((x, y) => val[x] - val[y] || byId(x, y)).map((id) => `${id}: ${fmt(val[id])}`);
    steps.push({
      line, msg, nodes, labels, edges,
      table: { columns, rows: rows.map((r) => [...r]), highlightRow: rows.length - 1 },
      info: [{ label: 'Q', value: queue.length ? queue.join(', ') : '∅' }, ...info],
      stats: { ...stats },
      result: { [valueName]: { ...val }, pi: { ...pi } },
    });
  }

  function extractMin() {
    let best = null;
    for (const id of [...Q].sort(byId)) if (best === null || val[id] < val[best]) best = id;
    Q.delete(best);
    return best;
  }

  return { ids, val, pi, piEdge, Q, done, changed, stats, steps, snap, pushRow, extractMin, setCurrent: (u) => { current = u; } };
}

export const dijkstra = {
  directed: true,
  needsSource: true,
  pseudocode: [
    ['head', 'DIJKSTRA(G, w, s)'],
    ['init', '  INITIALIZE-SINGLE-SOURCE(G, s)'],
    ['S', '  S = ∅'],
    ['Q', '  Q = G.V'],
    ['while', '  while Q ≠ ∅'],
    ['extract', '    u = EXTRACT-MIN(Q)'],
    ['add', '    S = S ∪ {u}'],
    ['for', '    for each v ∈ G.Adj[u]'],
    ['relax', '      RELAX(u, v, w)'],
    ['rhead', 'RELAX(u, v, w)'],
    ['rif', '  if v.d > u.d + w(u, v)'],
    ['rset', '    v.d = u.d + w(u, v)'],
    ['rpi', '    v.π = u'],
  ],
  run(graph, source) {
    const t = queueTrace(graph, source, 'd');
    const adj = adjacency(graph);
    const S = [];
    const info = () => [{ label: 'S', value: S.length ? setText(S) : '∅' }];
    const hasNegative = graph.edges.some((e) => e.w < 0);

    t.snap(['init', 'S', 'Q'], `Initialisierung: d(${source}) = 0, alle anderen d = ∞. Alle Knoten kommen in Q.` +
      (hasNegative ? ' Achtung: Der Graph enthält negative Gewichte – Dijkstra kann dann falsche Ergebnisse liefern!' : ''), { info: info() });
    t.pushRow('Init', null);

    let k = 0;
    while (t.Q.size) {
      const u = t.extractMin();
      t.setCurrent(u);
      t.done.add(u);
      S.push(u);
      t.snap(['while', 'extract', 'add'], t.val[u] === Infinity
        ? `EXTRACT-MIN liefert ${u} mit d = ∞ – ${u} ist von ${source} aus nicht erreichbar.`
        : `EXTRACT-MIN liefert ${u} mit d = ${fmt(t.val[u])}. Dieser Wert ist jetzt endgültig.`, { info: info() });

      for (const { v, w, idx } of adj[u]) {
        t.stats.checks++;
        const nd = t.val[u] + w;
        if (nd < t.val[v]) {
          t.snap(['for', 'relax', 'rif'], `Kante ${u}→${v}: d(${u}) + w = ${fmt(t.val[u])} + ${fmt(w)} = ${fmt(nd)} < d(${v}) = ${fmt(t.val[v])}? Ja.`, { edge: idx, info: info() });
          t.val[v] = nd;
          t.pi[v] = u;
          t.piEdge[v] = idx;
          t.changed.add(v);
          t.stats.updates++;
          t.snap(['rset', 'rpi'], `Verbessert: d(${v}) = ${fmt(nd)}, π(${v}) = ${u}.`, { edge: idx, edgeState: 'improve', info: info() });
        } else {
          t.snap(['for', 'relax', 'rif'], `Kante ${u}→${v}: ${fmt(t.val[u])} + ${fmt(w)} = ${fmt(nd)} ist nicht kleiner als d(${v}) = ${fmt(t.val[v])} – keine Änderung.`, { edge: idx, edgeState: 'reject', info: info() });
        }
      }
      t.pushRow(String(++k), u);
    }
    t.setCurrent(null);
    t.snap(null, 'Fertig: Die markierten Kanten bilden den Kürzeste-Wege-Baum, die Zahlen an den Knoten sind die Distanzen.', { info: info() });
    return t.steps;
  },
};

export const prim = {
  directed: false,
  needsSource: true,
  pseudocode: [
    ['head', 'MST-PRIM(G, w, r)'],
    ['init', '  for each u ∈ G.V: u.key = ∞, u.π = NIL'],
    ['root', '  r.key = 0'],
    ['Q', '  Q = G.V'],
    ['while', '  while Q ≠ ∅'],
    ['extract', '    u = EXTRACT-MIN(Q)'],
    ['for', '    for each v ∈ G.Adj[u]'],
    ['if', '      if v ∈ Q and w(u, v) < v.key'],
    ['pi', '        v.π = u'],
    ['key', '        v.key = w(u, v)'],
  ],
  run(graph, source) {
    const t = queueTrace(graph, source, 'key');
    const adj = adjacency(graph);
    let weight = 0;
    const info = () => [{ label: 'Gewicht', value: fmt(weight) }];

    t.snap(['init', 'root', 'Q'], `Initialisierung: key(${source}) = 0, alle anderen key = ∞. Alle Knoten kommen in Q.`, { info: info() });
    t.pushRow('Init', null);

    let k = 0;
    while (t.Q.size) {
      const u = t.extractMin();
      t.setCurrent(u);
      t.done.add(u);
      if (t.pi[u] !== null) weight += t.val[u];
      t.snap(['while', 'extract'], t.val[u] === Infinity
        ? `EXTRACT-MIN liefert ${u} mit key = ∞ – der Graph ist nicht zusammenhängend, ${u} startet einen neuen Baum.`
        : t.pi[u] === null
          ? `EXTRACT-MIN liefert die Wurzel ${u}.`
          : `EXTRACT-MIN liefert ${u}: Kante ${t.pi[u]}–${u} mit Gewicht ${fmt(t.val[u])} kommt in den Baum.`, { info: info() });

      for (const { v, w, idx } of adj[u]) {
        if (!t.Q.has(v)) continue;
        t.stats.checks++;
        if (w < t.val[v]) {
          t.pi[v] = u;
          t.piEdge[v] = idx;
          t.val[v] = w;
          t.changed.add(v);
          t.stats.updates++;
          t.snap(['for', 'if', 'pi', 'key'], `Kante ${u}–${v}: w = ${fmt(w)} < key(${v}) → key(${v}) = ${fmt(w)}, π(${v}) = ${u}.`, { edge: idx, edgeState: 'improve', info: info() });
        } else {
          t.snap(['for', 'if'], `Kante ${u}–${v}: w = ${fmt(w)} ist nicht kleiner als key(${v}) = ${fmt(t.val[v])} – keine Änderung.`, { edge: idx, edgeState: 'reject', info: info() });
        }
      }
      t.pushRow(String(++k), u);
    }
    t.setCurrent(null);
    t.snap(null, `Fertig: minimaler Spannbaum mit Gesamtgewicht ${fmt(weight)}.`, { info: info() });
    t.steps.at(-1).result.weight = weight;
    return t.steps;
  },
};

export const bellmanFord = {
  directed: true,
  needsSource: true,
  pseudocode: [
    ['head', 'BELLMAN-FORD(G, w, s)'],
    ['init', '  INITIALIZE-SINGLE-SOURCE(G, s)'],
    ['for', '  for i = 1 to |G.V| − 1'],
    ['each', '    for each edge (u, v) ∈ G.E'],
    ['relax', '      RELAX(u, v, w)'],
    ['check', '  for each edge (u, v) ∈ G.E'],
    ['cif', '    if v.d > u.d + w(u, v)'],
    ['false', '      return FALSE   // negativer Zyklus'],
    ['true', '  return TRUE'],
    ['rhead', 'RELAX(u, v, w)'],
    ['rif', '  if v.d > u.d + w(u, v)'],
    ['rset', '    v.d = u.d + w(u, v), v.π = u'],
  ],
  run(graph, source) {
    const ids = graph.nodes.map((n) => n.id);
    const d = Object.fromEntries(ids.map((id) => [id, Infinity]));
    const pi = Object.fromEntries(ids.map((id) => [id, null]));
    const piEdge = {};
    d[source] = 0;
    // Kanten in Eingabereihenfolge; ungerichtete Kanten zählen in beide Richtungen.
    const edges = [];
    graph.edges.forEach((e, idx) => {
      edges.push({ u: e.u, v: e.v, w: e.w, idx });
      if (!graph.directed && e.u !== e.v) edges.push({ u: e.v, v: e.u, w: e.w, idx });
    });
    const columns = ['Durchlauf', ...ids];
    const rows = [];
    const changed = new Set();
    const stats = { checks: 0, updates: 0 };
    const steps = [];
    let pass = 0;
    let finished = false;

    const pushRow = (label) => {
      rows.push([label, ...ids.map((id) => ({ text: fmt(d[id]), sub: pi[id] ?? '', cls: changed.has(id) ? 'changed' : '' }))]);
      changed.clear();
    };

    const snap = (line, msg, { edge = null, edgeState = 'active', from = null, ok } = {}) => {
      const nodes = {}, labels = {}, es = {};
      for (const id of ids) {
        nodes[id] = finished && d[id] < Infinity ? 'done' : d[id] < Infinity ? 'frontier' : 'idle';
        labels[id] = fmt(d[id]);
        if (piEdge[id] != null) es[piEdge[id]] = finished ? 'tree' : 'candidate';
      }
      if (from) nodes[from] = 'current';
      if (edge != null) es[edge] = edgeState;
      steps.push({
        line, msg, nodes, labels, edges: es,
        table: { columns, rows: rows.map((r) => [...r]), highlightRow: rows.length - 1 },
        info: [{ label: 'Durchlauf', value: pass ? `${pass} von ${ids.length - 1}` : '–' }],
        stats: { ...stats },
        result: { d: { ...d }, pi: { ...pi }, ok },
      });
    };

    snap('init', `Initialisierung: d(${source}) = 0, alle anderen d = ∞. Es folgen bis zu |V| − 1 = ${ids.length - 1} Durchläufe über alle ${edges.length} Kanten.`);
    pushRow('Init');

    for (pass = 1; pass < ids.length; pass++) {
      let anyChange = false;
      snap('for', `Durchlauf ${pass}: relaxiere alle Kanten in der festen Reihenfolge.`);
      for (const { u, v, w, idx } of edges) {
        stats.checks++;
        const nd = d[u] + w;
        if (d[u] === Infinity) {
          snap(['each', 'relax', 'rif'], `Kante ${u}→${v}: d(${u}) = ∞ – nichts zu tun.`, { edge: idx, edgeState: 'reject', from: u });
        } else if (nd < d[v]) {
          d[v] = nd;
          pi[v] = u;
          piEdge[v] = idx;
          changed.add(v);
          stats.updates++;
          anyChange = true;
          snap(['each', 'relax', 'rif', 'rset'], `Kante ${u}→${v}: ${fmt(d[u])} + ${fmt(w)} = ${fmt(nd)} ist kleiner → d(${v}) = ${fmt(nd)}, π(${v}) = ${u}.`, { edge: idx, edgeState: 'improve', from: u });
        } else {
          snap(['each', 'relax', 'rif'], `Kante ${u}→${v}: ${fmt(d[u])} + ${fmt(w)} = ${fmt(nd)} ist nicht kleiner als d(${v}) = ${fmt(d[v])}.`, { edge: idx, edgeState: 'reject', from: u });
        }
      }
      pushRow(String(pass));
      if (!anyChange) {
        snap('for', `In Durchlauf ${pass} hat sich nichts geändert – weitere Durchläufe ändern ebenfalls nichts. Weiter zur Zyklusprüfung.`);
        break;
      }
    }
    pass = Math.min(pass, ids.length - 1);

    for (const { u, v, w, idx } of edges) {
      if (d[u] !== Infinity && d[u] + w < d[v]) {
        snap(['check', 'cif', 'false'], `Kante ${u}→${v} lässt sich immer noch verbessern (${fmt(d[u])} + ${fmt(w)} < ${fmt(d[v])}) → es gibt einen negativen Zyklus. Ergebnis: FALSE.`, { edge: idx, edgeState: 'cycle', from: u, ok: false });
        return steps;
      }
    }
    finished = true;
    snap(['check', 'true'], 'Keine Kante lässt sich mehr verbessern – kein negativer Zyklus. Ergebnis: TRUE, alle Distanzen sind korrekt.', { ok: true });
    return steps;
  },
};

class UnionFind {
  constructor(ids) {
    this.parent = Object.fromEntries(ids.map((id) => [id, id]));
    this.rank = Object.fromEntries(ids.map((id) => [id, 0]));
  }

  find(x) {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }

  union(a, b) {
    const ra = this.find(a), rb = this.find(b);
    if (ra === rb) return;
    if (this.rank[ra] < this.rank[rb]) this.parent[ra] = rb;
    else if (this.rank[ra] > this.rank[rb]) this.parent[rb] = ra;
    else { this.parent[rb] = ra; this.rank[ra]++; }
  }
}

export const kruskal = {
  directed: false,
  needsSource: false,
  pseudocode: [
    ['head', 'MST-KRUSKAL(G, w)'],
    ['A', '  A = ∅'],
    ['make', '  for each v ∈ G.V: MAKE-SET(v)'],
    ['sort', '  sortiere G.E aufsteigend nach Gewicht w'],
    ['for', '  for each (u, v) ∈ G.E in sortierter Reihenfolge'],
    ['if', '    if FIND-SET(u) ≠ FIND-SET(v)'],
    ['add', '      A = A ∪ {(u, v)}'],
    ['union', '      UNION(u, v)'],
    ['ret', '  return A'],
  ],
  run(graph) {
    const ids = graph.nodes.map((n) => n.id);
    const uf = new UnionFind(ids);
    const order = graph.edges.map((e, idx) => ({ ...e, idx })).sort((a, b) => a.w - b.w);
    const status = new Array(order.length).fill('');
    const edgeStates = {};
    const stats = { checks: 0, updates: 0 };
    const steps = [];
    let weight = 0;
    let taken = 0;

    const components = () => {
      const groups = {};
      for (const id of ids) (groups[uf.find(id)] ??= []).push(id);
      return Object.values(groups).map((g) => g.sort(byId)).sort((a, b) => byId(a[0], b[0]));
    };

    const snap = (line, msg, { cur = -1 } = {}) => {
      const comps = components();
      const groups = {}, nodes = {};
      let colour = 0;
      for (const comp of comps) {
        const g = comp.length > 1 ? colour++ : null;
        for (const id of comp) {
          nodes[id] = g === null ? 'idle' : 'group';
          if (g !== null) groups[id] = g;
        }
      }
      const edges = { ...edgeStates };
      if (cur >= 0) edges[order[cur].idx] = status[cur] === 'ok' ? 'improve' : status[cur] === 'bad' ? 'reject' : 'active';
      steps.push({
        line, msg, nodes, groups, labels: {}, edges,
        table: {
          columns: ['#', 'Kante', 'Gewicht', 'Status'],
          rows: order.map((e, i) => [
            String(i + 1),
            `${e.u}–${e.v}`,
            fmt(e.w),
            {
              text: status[i] === 'ok' ? '✓ aufgenommen' : status[i] === 'bad' ? '✗ Kreis' : status[i] === 'skip' ? 'übersprungen' : '',
              cls: status[i] === 'ok' ? 'ok' : status[i] === 'bad' ? 'bad' : 'muted',
            },
          ]),
          highlightRow: cur,
        },
        info: [
          { label: 'Mengen', value: comps.map(setText).join(' ') },
          { label: 'Gewicht', value: fmt(weight) },
        ],
        stats: { ...stats },
        result: { weight, edges: Object.keys(edgeStates).filter((k) => edgeStates[k] === 'tree').map(Number) },
      });
    };

    snap(['A', 'make'], 'A ist leer, jeder Knoten bildet seine eigene Menge.');
    snap('sort', `Kanten nach Gewicht sortiert: ${order.map((e) => `${e.u}–${e.v} (${fmt(e.w)})`).join(', ')}.`);

    for (let i = 0; i < order.length; i++) {
      const { u, v, w, idx } = order[i];
      if (taken === ids.length - 1) {
        for (let j = i; j < order.length; j++) status[j] = 'skip';
        snap('for', `A hat bereits |V| − 1 = ${taken} Kanten – der Baum ist vollständig, die restlichen Kanten werden übersprungen.`);
        break;
      }
      stats.checks++;
      const ru = uf.find(u), rv = uf.find(v);
      if (ru !== rv) {
        uf.union(u, v);
        status[i] = 'ok';
        edgeStates[idx] = 'tree';
        weight += w;
        taken++;
        stats.updates++;
        snap(['for', 'if', 'add', 'union'], `Kante ${u}–${v} (${fmt(w)}): ${u} und ${v} liegen in verschiedenen Mengen → aufnehmen und Mengen vereinigen.`, { cur: i });
      } else {
        status[i] = 'bad';
        edgeStates[idx] = 'rejected';
        snap(['for', 'if'], `Kante ${u}–${v} (${fmt(w)}): ${u} und ${v} sind schon verbunden – die Kante würde einen Kreis schließen.`, { cur: i });
      }
    }
    snap('ret', `Fertig: minimaler Spannbaum mit ${taken} Kanten und Gesamtgewicht ${fmt(weight)}.` +
      (taken < ids.length - 1 ? ' Der Graph ist nicht zusammenhängend – es entsteht ein Spannwald.' : ''));
    return steps;
  },
};
