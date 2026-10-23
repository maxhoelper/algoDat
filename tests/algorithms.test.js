import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as sorting from '../js/algorithms/sorting.js';
import { dijkstra, bellmanFord, prim, kruskal } from '../js/algorithms/graphs.js';
import { PRESETS, parseGraph, buildGraph, randomGraph } from '../js/graph-io.js';

const lineIds = (algo) => new Set(algo.pseudocode.map(([id]) => id));

function assertLines(algo, steps) {
  const ids = lineIds(algo);
  for (const s of steps) {
    for (const l of [s.line].flat()) if (l !== null) assert.ok(ids.has(l), `unbekannte Pseudocode-Zeile ${l}`);
  }
}

const randomArray = (n, max) => Array.from({ length: n }, () => Math.floor(Math.random() * (max + 1)));

for (const [name, algo] of Object.entries(sorting)) {
  test(`${name} sortiert korrekt`, () => {
    const cases = [[], [7], [2, 1], [5, 2, 4, 6, 1, 3], [3, 3, 1, 1, 2], [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]];
    for (let i = 0; i < 30; i++) cases.push(randomArray(1 + Math.floor(Math.random() * 20), name === 'countingSort' ? 20 : 999));
    for (const input of cases) {
      const steps = algo.run(input);
      assert.deepEqual(steps.at(-1).array, [...input].sort((a, b) => a - b), `${name}(${input})`);
      assertLines(algo, steps);
    }
  });
}

test('Counting Sort braucht keine Vergleiche', () => {
  assert.equal(sorting.countingSort.run([2, 5, 3, 0, 2, 3, 0, 3]).at(-1).stats.comparisons, 0);
});

test('Dijkstra: CLRS-Beispiel', () => {
  const { graph, source } = PRESETS['clrs-dijkstra'];
  const steps = dijkstra.run(graph, source);
  assert.deepEqual(steps.at(-1).result.d, { s: 0, t: 8, x: 9, y: 5, z: 7 });
  assertLines(dijkstra, steps);
  // Init-Zeile + eine Zeile je Knoten
  assert.equal(steps.at(-1).table.rows.length, 6);
});

test('Bellman-Ford: CLRS-Beispiel mit negativen Gewichten', () => {
  const { graph, source } = PRESETS['clrs-bellman'];
  const steps = bellmanFord.run(graph, source);
  const { d, ok } = steps.at(-1).result;
  assert.equal(ok, true);
  assert.deepEqual(d, { s: 0, t: 2, x: 4, y: 7, z: -2 });
  assertLines(bellmanFord, steps);
});

test('Bellman-Ford erkennt negativen Zyklus', () => {
  const { graph, source } = PRESETS['negative-cycle'];
  assert.equal(bellmanFord.run(graph, source).at(-1).result.ok, false);
});

test('Dijkstra und Bellman-Ford stimmen auf Zufallsgraphen überein', () => {
  for (let i = 0; i < 50; i++) {
    const g = randomGraph(Math.random() < 0.5);
    const a = dijkstra.run(g, 'A').at(-1).result.d;
    const b = bellmanFord.run(g, 'A').at(-1).result.d;
    assert.deepEqual(a, b);
  }
});

test('Prim und Kruskal: CLRS-MST hat Gewicht 37', () => {
  const { graph, source } = PRESETS['clrs-mst'];
  const p = prim.run(graph, source);
  const k = kruskal.run(graph);
  assert.equal(p.at(-1).result.weight, 37);
  assert.equal(k.at(-1).result.weight, 37);
  assert.equal(k.at(-1).result.edges.length, 8);
  assertLines(prim, p);
  assertLines(kruskal, k);
});

test('Prim und Kruskal stimmen auf Zufallsgraphen überein', () => {
  for (let i = 0; i < 50; i++) {
    const g = randomGraph(false);
    assert.equal(prim.run(g, 'A').at(-1).result.weight, kruskal.run(g).at(-1).result.weight);
  }
});

test('Parser: Formate, Duplikate und Fehler', () => {
  const r = parseGraph('A B 4\nB -> C 2\n# Kommentar\nB A 4\nD\nC, D: 1', false);
  assert.deepEqual(r.errors, []);
  assert.deepEqual(r.ids, ['A', 'B', 'C', 'D']);
  assert.equal(r.edges.length, 3);
  assert.equal(parseGraph('A B x', true).errors.length, 1);
  const { graph } = buildGraph('A B 1\nB C 2', true);
  assert.ok(graph.nodes.every((n) => Number.isFinite(n.x) && Number.isFinite(n.y)));
});
