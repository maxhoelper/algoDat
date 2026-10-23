import { ALGORITHMS, CATEGORIES, findAlgorithm } from './catalog.js';
import { BarsView, GraphView, renderPseudocode, renderTable } from './views.js';
import { Player } from './player.js';
import { PRESETS, buildGraph, serializeGraph, randomGraph, cloneGraph } from './graph-io.js';

const main = document.getElementById('main');
const nav = document.getElementById('sidebar-nav');
let player = null;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// ---------- Theme ----------

const root = document.documentElement;
try {
  const saved = localStorage.getItem('theme');
  if (saved) root.dataset.theme = saved;
} catch { /* Speicher nicht verfügbar */ }
document.getElementById('theme-toggle').addEventListener('click', () => {
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
  root.dataset.theme = dark ? 'light' : 'dark';
  try { localStorage.setItem('theme', root.dataset.theme); } catch { /* egal */ }
});

document.getElementById('menu-toggle').addEventListener('click', () => document.body.classList.toggle('nav-open'));

// ---------- Navigation ----------

nav.innerHTML = CATEGORIES.map((c) => `
  <div class="nav-group">
    <div class="nav-title">${c.name}</div>
    ${ALGORITHMS.filter((a) => a.category === c.id).map((a) => `<a href="#/${a.id}" data-id="${a.id}">${a.name}</a>`).join('')}
  </div>`).join('');

function route() {
  player?.destroy();
  player = null;
  document.body.classList.remove('nav-open');
  const id = location.hash.replace(/^#\/?/, '');
  const algo = findAlgorithm(id);
  for (const a of nav.querySelectorAll('a')) a.classList.toggle('active', a.dataset.id === id);
  if (algo) renderAlgorithm(algo); else renderHome();
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);

// ---------- Startseite ----------

function renderHome() {
  document.title = 'AlgoDat – Algorithmen Schritt für Schritt';
  main.innerHTML = `
    <section class="hero">
      <p class="eyebrow">Algorithmen und Datenstrukturen</p>
      <h1>Ausprobieren. Visualisieren. <span class="accent">Verstehen.</span></h1>
      <p class="lead">Die klassischen Algorithmen aus der Vorlesung – mit CLRS-Pseudocode, eigener Eingabe und den Tabellen, die in der Klausur abgefragt werden. Schritt für Schritt, direkt im Browser.</p>
      <div class="hero-actions">
        <a class="btn primary" href="#/dijkstra">Dijkstra ausprobieren</a>
        <a class="btn" href="#/quicksort">Quicksort ansehen</a>
      </div>
    </section>
    ${CATEGORIES.map((c) => `
      <section class="category">
        <h2>${c.name}</h2>
        <p class="muted">${c.blurb}</p>
        <div class="cards">
          ${ALGORITHMS.filter((a) => a.category === c.id).map((a) => `
            <a class="card algo-card" href="#/${a.id}">
              <h3>${a.name}</h3>
              <p>${a.short}</p>
              <span class="chip mono">${a.complexity.worst}</span>
            </a>`).join('')}
        </div>
      </section>`).join('')}
    <section class="category">
      <h2>Laufzeiten im Überblick</h2>
      <div class="table-wrap card">
        <table class="overview">
          <thead><tr><th>Algorithmus</th><th>Bester Fall</th><th>Durchschnitt</th><th>Schlechtester Fall</th><th>Speicher</th><th>Eigenschaften</th></tr></thead>
          <tbody>
            ${ALGORITHMS.map((a) => `<tr><th><a href="#/${a.id}">${a.name}</a></th><td class="mono">${a.complexity.best}</td><td class="mono">${a.complexity.avg}</td><td class="mono">${a.complexity.worst}</td><td class="mono">${a.complexity.space}</td><td>${a.props.join(', ')}</td></tr>`).join('')}
          </tbody>
        </table>
      </div>
    </section>`;
}

// ---------- Algorithmus-Seite ----------

const LEGENDS = {
  array: [['compare', 'wird verglichen'], ['active', 'wird geschrieben/getauscht'], ['key', 'key'], ['pivot', 'Pivot'], ['sorted', 'endgültig sortiert']],
  graph: [['n-current', 'aktueller Knoten'], ['n-done', 'fertig'], ['n-frontier', 'entdeckt (d < ∞)'], ['e-active', 'geprüfte Kante'], ['e-improve', 'verbessert'], ['e-tree', 'Baumkante'], ['e-candidate', 'vorläufig (π)']],
  kruskal: [['n-group', 'Farbe = Menge'], ['e-active', 'geprüfte Kante'], ['e-improve', 'aufgenommen'], ['e-tree', 'im Spannbaum'], ['e-rejected', 'verworfen (Kreis)']],
};

const STAT_LABELS = {
  array: { comparisons: 'Vergleiche', writes: 'Schreibzugriffe' },
  graph: { checks: 'geprüfte Kanten', updates: 'Verbesserungen' },
};

function renderAlgorithm(algo) {
  document.title = `${algo.name} – AlgoDat`;
  const idx = ALGORITHMS.indexOf(algo);
  const prev = ALGORITHMS[idx - 1], next = ALGORITHMS[idx + 1];
  const category = CATEGORIES.find((c) => c.id === algo.category);
  const isGraph = algo.kind === 'graph';
  const legend = algo.id === 'kruskal' ? LEGENDS.kruskal : LEGENDS[algo.kind];

  main.innerHTML = `
    <header class="algo-head">
      <p class="eyebrow">${category.name}</p>
      <h1>${algo.name}</h1>
      <p class="lead">${algo.short}</p>
      <div class="chips">
        <span class="chip mono" title="Schlechtester Fall">Worst ${algo.complexity.worst}</span>
        <span class="chip mono" title="Durchschnitt">Avg ${algo.complexity.avg}</span>
        ${algo.props.map((p) => `<span class="chip soft">${p}</span>`).join('')}
      </div>
    </header>

    <section class="card input-bar" id="input"></section>

    <section class="workspace">
      <div class="card stage">
        <div class="viz ${algo.kind}" id="viz"></div>
        <div class="legend">${legend.map(([cls, text]) => `<span><i class="sw ${cls}"></i>${text}</span>`).join('')}</div>
        <p class="message" id="message" aria-live="polite"></p>
        <div id="player"></div>
      </div>
      <aside class="side">
        <div class="card">
          <h2 class="card-title">Pseudocode <span class="muted small">nach CLRS</span></h2>
          <div id="pseudo"></div>
        </div>
        <div class="card">
          <h2 class="card-title">Zustand</h2>
          <dl class="stats" id="stats"></dl>
        </div>
      </aside>
    </section>

    ${isGraph ? `
    <section class="card">
      <h2 class="card-title">${algo.id === 'kruskal' ? 'Kantenliste' : algo.id === 'prim' ? 'key/π-Tabelle' : 'd/π-Tabelle'} <span class="muted small">wächst mit jedem Schritt – zum Vergleichen mit der eigenen Lösung</span></h2>
      <div class="table-wrap" id="table"></div>
    </section>` : ''}

    <section class="explain">
      <div class="card">
        <h2 class="card-title">So funktioniert's</h2>
        <ol class="howto">${algo.howto.map((h) => `<li>${h}</li>`).join('')}</ol>
      </div>
      <div class="card">
        <h2 class="card-title">Für die Klausur</h2>
        <ul class="exam">${algo.exam.map((h) => `<li>${h}</li>`).join('')}</ul>
        <table class="complexity">
          <tr><th>Bester Fall</th><td class="mono">${algo.complexity.best}</td></tr>
          <tr><th>Durchschnitt</th><td class="mono">${algo.complexity.avg}</td></tr>
          <tr><th>Schlechtester Fall</th><td class="mono">${algo.complexity.worst}</td></tr>
          <tr><th>Zusatzspeicher</th><td class="mono">${algo.complexity.space}</td></tr>
        </table>
      </div>
    </section>

    <nav class="pager">
      ${prev ? `<a class="card" href="#/${prev.id}"><span class="muted small">Zurück</span>${prev.name}</a>` : '<span></span>'}
      ${next ? `<a class="card next" href="#/${next.id}"><span class="muted small">Weiter</span>${next.name}</a>` : '<span></span>'}
    </nav>`;

  const setLine = renderPseudocode(document.getElementById('pseudo'), algo.impl.pseudocode);
  const message = document.getElementById('message');
  const stats = document.getElementById('stats');
  const table = document.getElementById('table');
  const labels = STAT_LABELS[algo.kind];

  let view;
  const onStep = (step) => {
    view.render(step);
    setLine(step.line);
    message.textContent = step.msg;
    const rows = Object.entries(labels).map(([k, l]) => `<dt>${l}</dt><dd class="mono">${step.stats[k]}</dd>`);
    for (const { label, value } of step.info ?? []) rows.push(`<dt>${esc(label)}</dt><dd class="mono">${esc(value)}</dd>`);
    if (step.held) rows.push(`<dt>${step.held.label}</dt><dd class="mono">${step.held.value}</dd>`);
    stats.innerHTML = rows.join('');
    if (table) renderTable(table, step.table);
  };
  player = new Player(document.getElementById('player'), onStep);

  if (isGraph) setupGraph(algo, (v) => { view = v; }, player);
  else setupArray(algo, (v) => { view = v; }, player);
}

// ---------- Eingabe: Felder ----------

function randomArray(algo, n) {
  const max = algo.maxValue === 30 ? 20 : algo.maxValue === 9999 ? 999 : 99;
  return Array.from({ length: n }, () => Math.floor(Math.random() * (max + 1)));
}

function setupArray(algo, setView, player) {
  const input = document.getElementById('input');
  const max = algo.maxValue ?? 999;
  input.innerHTML = `
    <label class="field grow">
      <span>Eingabe (ganze Zahlen 0–${max}, durch Komma getrennt)</span>
      <input id="array-input" class="mono" spellcheck="false" value="${algo.example.join(', ')}">
    </label>
    <div class="actions">
      <button class="btn primary" id="apply">Starten</button>
      <button class="btn" data-preset="example" title="Beispiel aus dem CLRS">Beispiel</button>
      <button class="btn" data-preset="random">Zufall</button>
      <button class="btn" data-preset="reversed">Umgekehrt</button>
      <button class="btn" data-preset="sorted">Sortiert</button>
    </div>
    <p class="error" id="input-error" role="alert"></p>`;

  const view = new BarsView(document.getElementById('viz'));
  setView(view);
  const field = document.getElementById('array-input');
  const error = document.getElementById('input-error');

  const run = () => {
    const parts = field.value.split(/[\s,;]+/).filter(Boolean);
    const values = parts.map(Number);
    const bad = parts.find((p, i) => !Number.isInteger(values[i]) || values[i] < 0 || values[i] > max);
    error.textContent = '';
    if (bad !== undefined) { error.textContent = `„${bad}“ ist keine ganze Zahl zwischen 0 und ${max}.`; return; }
    if (!values.length) { error.textContent = 'Bitte mindestens eine Zahl eingeben.'; return; }
    if (values.length > 32) { error.textContent = 'Bitte höchstens 32 Zahlen – sonst wird es unübersichtlich.'; return; }
    player.load(algo.impl.run(values));
  };

  input.addEventListener('click', (e) => {
    const preset = e.target.closest('[data-preset]')?.dataset.preset;
    if (!preset && e.target.id !== 'apply') return;
    const current = field.value.split(/[\s,;]+/).filter(Boolean).map(Number);
    const n = Math.max(6, Math.min(12, current.length || 8));
    if (preset === 'example') field.value = algo.example.join(', ');
    if (preset === 'random') field.value = randomArray(algo, n).join(', ');
    if (preset === 'reversed') field.value = [...current].sort((a, b) => b - a).join(', ');
    if (preset === 'sorted') field.value = [...current].sort((a, b) => a - b).join(', ');
    run();
  });
  field.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
  run();
}

// ---------- Eingabe: Graphen ----------

function setupGraph(algo, setView, player) {
  const input = document.getElementById('input');
  const impl = algo.impl;
  const presetIds = algo.presets ?? ['clrs-mst', 'vorlesung'];
  const fixedUndirected = impl.directed === false;

  input.innerHTML = `
    <div class="graph-controls">
      <label class="field">
        <span>Beispielgraph</span>
        <select id="preset">
          ${presetIds.map((id) => `<option value="${id}">${PRESETS[id].name}</option>`).join('')}
          <option value="random">Zufallsgraph</option>
        </select>
      </label>
      ${impl.needsSource ? '<label class="field"><span>Startknoten</span><select id="source"></select></label>' : ''}
      <label class="check ${fixedUndirected ? 'disabled' : ''}" title="${fixedUndirected ? 'Spannbäume sind für ungerichtete Graphen definiert' : ''}">
        <input type="checkbox" id="directed" ${fixedUndirected ? 'disabled' : ''}> gerichtet
      </label>
      <div class="actions">
        <button class="btn" id="toggle-edit" aria-expanded="false">Kanten bearbeiten</button>
        <button class="btn" id="relayout" title="Knoten neu anordnen">Neu anordnen</button>
      </div>
    </div>
    <div class="edit-panel" id="edit-panel" hidden>
      <label class="field grow">
        <span>Eine Kante pro Zeile: <code>u v gewicht</code> – z. B. <code>A B 4</code>. Ein einzelner Name ist ein isolierter Knoten.</span>
        <textarea id="edges" class="mono" rows="8" spellcheck="false"></textarea>
      </label>
      <div class="actions"><button class="btn primary" id="apply">Übernehmen</button></div>
    </div>
    <p class="error" id="input-error" role="alert"></p>
    <p class="hint muted small">Tipp: Knoten lassen sich mit der Maus verschieben. Steuerung mit ← → und Leertaste.</p>`;

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'graph');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Graph');
  document.getElementById('viz').appendChild(svg);
  const view = new GraphView(svg);
  setView(view);

  const presetSel = document.getElementById('preset');
  const sourceSel = document.getElementById('source');
  const directedBox = document.getElementById('directed');
  const edgesArea = document.getElementById('edges');
  const editPanel = document.getElementById('edit-panel');
  const toggleEdit = document.getElementById('toggle-edit');
  const error = document.getElementById('input-error');
  let graph = null;

  const run = (keepPosition = false) => {
    error.textContent = '';
    if (impl.needsSource && !graph.nodes.some((n) => n.id === sourceSel.value)) sourceSel.value = graph.nodes[0].id;
    if (!algo.allowNegative && algo.category === 'sp' && graph.edges.some((e) => e.w < 0)) {
      error.textContent = 'Hinweis: Der Graph hat negative Kantengewichte – Dijkstra ist dafür nicht gedacht.';
    }
    view.setGraph(graph);
    player.load(impl.run(graph, sourceSel?.value), keepPosition);
  };

  const fillSources = (preferred) => {
    if (!sourceSel) return;
    sourceSel.innerHTML = graph.nodes.map((n) => `<option>${esc(n.id)}</option>`).join('');
    sourceSel.value = graph.nodes.some((n) => n.id === preferred) ? preferred : graph.nodes[0].id;
  };

  const loadGraph = (g, source) => {
    graph = g;
    if (fixedUndirected) graph.directed = false;
    directedBox.checked = graph.directed;
    edgesArea.value = serializeGraph(graph);
    fillSources(source);
    run();
  };

  const loadPreset = (id) => {
    if (id === 'random') {
      loadGraph(randomGraph(fixedUndirected ? false : directedBox.checked, { negative: algo.allowNegative }), 'A');
    } else {
      loadGraph(cloneGraph(PRESETS[id].graph), PRESETS[id].source);
    }
  };

  presetSel.addEventListener('change', () => loadPreset(presetSel.value));
  sourceSel?.addEventListener('change', () => run());
  directedBox.addEventListener('change', () => {
    const built = buildGraph(edgesArea.value, directedBox.checked, graph);
    if (built.errors.length) { error.textContent = built.errors.join(' '); return; }
    graph = built.graph;
    edgesArea.value = serializeGraph(graph);
    run();
  });
  toggleEdit.addEventListener('click', () => {
    editPanel.hidden = !editPanel.hidden;
    toggleEdit.setAttribute('aria-expanded', String(!editPanel.hidden));
    if (!editPanel.hidden) edgesArea.focus();
  });
  document.getElementById('apply').addEventListener('click', () => {
    const built = buildGraph(edgesArea.value, directedBox.checked, graph);
    if (built.errors.length) { error.textContent = built.errors.join(' '); return; }
    const source = sourceSel?.value;
    graph = built.graph;
    fillSources(source);
    run();
  });
  document.getElementById('relayout').addEventListener('click', () => {
    const built = buildGraph(serializeGraph(graph), graph.directed, null);
    graph = built.graph;
    run(true);
  });

  loadPreset(presetIds[0]);
}

// Erst hier starten, damit alle Konstanten oben initialisiert sind.
route();
