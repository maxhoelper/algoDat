// Darstellung: Pseudocode, Balken (Sortieren), Graph (SVG), Tabellen.

import { WIDTH, HEIGHT } from './graph-io.js';
import { fmt } from './algorithms/graphs.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function el(tag, attrs = {}, parent = null) {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v !== undefined && v !== null) node.setAttribute(k, v);
  if (parent) parent.appendChild(node);
  return node;
}

// ---------- Pseudocode ----------

const KEYWORDS = /\b(for|to|downto|while|if|else|return|each|and|or|with|exchange|let|in)\b/g;

function highlightCode(text) {
  const [code, comment] = esc(text).split(/\/\/(.*)/);
  const html = code
    .replace(/\b([A-Z][A-Z]+(?:-[A-Z]+)+|MERGE|HEAPSORT|QUICKSORT|PARTITION|RELAX|LEFT|RIGHT|NIL|TRUE|FALSE)\b/g, '<span class="fn">$1</span>')
    .replace(KEYWORDS, '<span class="kw">$1</span>');
  return comment !== undefined ? `${html}<span class="cm">//${comment}</span>` : html;
}

export function renderPseudocode(container, lines) {
  container.innerHTML = '';
  const ol = document.createElement('ol');
  ol.className = 'pseudo';
  const items = new Map();
  for (const [id, text] of lines) {
    const li = document.createElement('li');
    const indent = text.match(/^ */)[0].length;
    li.style.setProperty('--indent', indent / 2);
    li.innerHTML = highlightCode(text.trimStart());
    if (!/^ /.test(text)) li.classList.add('proc');
    ol.appendChild(li);
    items.set(id, li);
  }
  container.appendChild(ol);
  return (active) => {
    const set = new Set([active].flat().filter(Boolean));
    for (const [id, li] of items) li.classList.toggle('active', set.has(id));
  };
}

// ---------- Tabelle ----------

export function renderTable(container, table) {
  if (!table) { container.innerHTML = ''; return; }
  const head = table.columns.map((c) => `<th>${esc(c)}</th>`).join('');
  const body = table.rows.map((row, r) => {
    const cells = row.map((cell, c) => {
      const tag = c === 0 ? 'th' : 'td';
      if (cell && typeof cell === 'object') {
        const sub = cell.sub ? `<span class="sub">${esc(cell.sub)}</span>` : '';
        return `<${tag} class="${cell.cls ?? ''}">${esc(cell.text)}${sub}</${tag}>`;
      }
      return `<${tag}>${esc(cell)}</${tag}>`;
    }).join('');
    return `<tr class="${r === table.highlightRow ? 'current' : ''}">${cells}</tr>`;
  }).join('');
  container.innerHTML = `<table class="trace"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
  container.querySelector('tr.current')?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
}

// ---------- Balken ----------

export class BarsView {
  constructor(container) {
    this.root = container;
    this.root.innerHTML = '<svg class="bars" role="img" aria-label="Feld als Balkendiagramm"></svg><svg class="heap" role="img" aria-label="Heap als Baum"></svg><div class="aux"></div>';
    this.svg = this.root.querySelector('svg.bars');
    this.heapSvg = this.root.querySelector('svg.heap');
    this.aux = this.root.querySelector('.aux');
  }

  classFor(i, hl) {
    const p = hl.partition;
    const inRegion = !hl.region || (i >= hl.region[0] && i <= hl.region[1]);
    const cls = [];
    if (hl.pivot === i) cls.push('pivot');
    else if (hl.key === i) cls.push('key');
    else if (hl.swap?.includes(i) || hl.active?.includes(i)) cls.push('active');
    else if (hl.compare?.includes(i)) cls.push('compare');
    else if (hl.sorted?.includes(i)) cls.push('sorted');
    else if (p && i >= p.p && i <= p.i) cls.push('low');
    else if (p && i > p.i && i < p.j) cls.push('high');
    if (!inRegion && !hl.sorted?.includes(i)) cls.push('dim');
    return cls.join(' ');
  }

  render(step) {
    const { array: a, hl } = step;
    const n = a.length;
    const svg = this.svg;
    svg.innerHTML = '';
    const bw = 40, gap = 6, top = 10, h = 210, labelH = 26;
    const width = Math.max(1, n) * (bw + gap) + gap;
    svg.setAttribute('viewBox', `0 0 ${width} ${top + h + labelH}`);
    const max = Math.max(1, ...a);
    a.forEach((v, i) => {
      const x = gap + i * (bw + gap);
      const bh = Math.max(3, (v / max) * h);
      const g = el('g', { class: `bar ${this.classFor(i, hl)}` }, svg);
      el('rect', { x, y: top + h - bh, width: bw, height: bh, rx: 4 }, g);
      const label = el('text', { x: x + bw / 2, y: top + h + 18, 'text-anchor': 'middle' }, g);
      if (step.digit !== undefined) {
        const s = String(v).padStart(step.digit + 1, '0');
        const pos = s.length - 1 - step.digit;
        for (const [k, ch] of [...s].entries()) {
          const t = el('tspan', { class: k === pos ? 'digit' : k < s.length - String(v).length ? 'pad' : '' }, label);
          t.textContent = ch;
        }
      } else {
        label.textContent = v;
      }
    });
    if (hl.split !== undefined) {
      const x = gap + (hl.split + 1) * (bw + gap) - gap / 2;
      el('line', { class: 'split', x1: x, x2: x, y1: 0, y2: top + h + 4 }, svg);
    }
    if (hl.partition) {
      const x = gap + (hl.partition.i + 1) * (bw + gap) - gap / 2;
      el('line', { class: 'boundary', x1: x, x2: x, y1: 0, y2: top + h + 4 }, svg);
    }

    this.renderHeap(step);
    this.renderAux(step);
  }

  renderHeap(step) {
    const svg = this.heapSvg;
    svg.innerHTML = '';
    const n = step.array.length;
    if (step.heap === undefined || n === 0 || n > 31) { svg.style.display = 'none'; return; }
    svg.style.display = '';
    const levels = Math.floor(Math.log2(n)) + 1;
    const W = 640, levelH = 58, r = 17;
    svg.setAttribute('viewBox', `0 0 ${W} ${levels * levelH}`);
    const pos = (i) => {
      const level = Math.floor(Math.log2(i + 1));
      const idx = i - (2 ** level - 1);
      return { x: ((idx + 0.5) / 2 ** level) * W, y: level * levelH + 28 };
    };
    for (let i = 1; i < n; i++) {
      const a = pos(i), b = pos(Math.floor((i - 1) / 2));
      el('line', { class: `tree-edge ${i >= step.heap ? 'out' : ''}`, x1: a.x, y1: a.y, x2: b.x, y2: b.y }, svg);
    }
    for (let i = 0; i < n; i++) {
      const { x, y } = pos(i);
      const out = i >= step.heap;
      const g = el('g', { class: `bar heap-node ${out ? 'sorted out' : this.classFor(i, step.hl)}` }, svg);
      el('circle', { cx: x, cy: y, r }, g);
      const t = el('text', { x, y: y + 5, 'text-anchor': 'middle' }, g);
      t.textContent = step.array[i];
    }
  }

  renderAux(step) {
    if (!step.aux) { this.aux.innerHTML = ''; return; }
    this.aux.innerHTML = step.aux.map(({ label, values, highlight = [], consumed = 0, start = 1 }) => {
      const cells = values.map((v, i) => {
        const cls = [highlight.includes(i) ? 'hl' : '', i < consumed ? 'used' : '', v === null ? 'empty' : ''].join(' ');
        return `<div class="cell ${cls}"><span class="idx">${i + start}</span><span class="val">${v === null ? '·' : esc(v)}</span></div>`;
      }).join('');
      return `<div class="aux-row"><span class="aux-label">${esc(label)}</span><div class="cells">${cells || '<span class="muted">leer</span>'}</div></div>`;
    }).join('');
  }
}

// ---------- Graph ----------

const R = 21;

export class GraphView {
  constructor(svg, { onMove } = {}) {
    this.svg = svg;
    this.onMove = onMove;
    this.graph = null;
    this.step = null;
    svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
    svg.addEventListener('pointerdown', (e) => this.startDrag(e));
  }

  setGraph(graph) {
    this.graph = graph;
  }

  point(e) {
    const pt = new DOMPoint(e.clientX, e.clientY).matrixTransform(this.svg.getScreenCTM().inverse());
    return { x: Math.max(R, Math.min(WIDTH - R, pt.x)), y: Math.max(R, Math.min(HEIGHT - R, pt.y)) };
  }

  startDrag(e) {
    const g = e.target.closest('[data-node]');
    if (!g || !this.graph) return;
    const node = this.graph.nodes.find((n) => n.id === g.dataset.node);
    e.preventDefault();
    this.svg.setPointerCapture(e.pointerId);
    this.svg.classList.add('dragging');
    const move = (ev) => {
      Object.assign(node, this.point(ev));
      this.render(this.step);
    };
    const up = () => {
      this.svg.removeEventListener('pointermove', move);
      this.svg.removeEventListener('pointerup', up);
      this.svg.removeEventListener('pointercancel', up);
      this.svg.classList.remove('dragging');
      this.onMove?.();
    };
    this.svg.addEventListener('pointermove', move);
    this.svg.addEventListener('pointerup', up);
    this.svg.addEventListener('pointercancel', up);
  }

  render(step) {
    this.step = step;
    const { svg, graph } = this;
    svg.innerHTML = '';
    if (!graph) return;
    const defs = el('defs', {}, svg);
    for (const s of ['idle', 'tree', 'candidate', 'active', 'improve', 'reject', 'rejected', 'cycle']) {
      const m = el('marker', { id: `arrow-${s}`, class: `arrow ${s}`, viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z' }, m);
    }
    const pos = Object.fromEntries(graph.nodes.map((n) => [n.id, n]));
    const pairs = new Set(graph.edges.map((e) => `${e.u}\u0000${e.v}`));
    const edgeLayer = el('g', {}, svg);
    const labelLayer = el('g', {}, svg);

    graph.edges.forEach((e, idx) => {
      const state = step?.edges?.[idx] ?? 'idle';
      const a = pos[e.u], b = pos[e.v];
      const g = el('g', { class: `edge ${state}` }, edgeLayer);
      let mid;
      if (e.u === e.v) {
        el('path', { d: `M${a.x - 10},${a.y - R + 2} C${a.x - 40},${a.y - 75} ${a.x + 40},${a.y - 75} ${a.x + 10},${a.y - R + 2}`, 'marker-end': graph.directed ? `url(#arrow-${state})` : null }, g);
        mid = { x: a.x, y: a.y - 62 };
      } else {
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy) || 1;
        const curved = graph.directed && pairs.has(`${e.v}\u0000${e.u}`);
        const off = curved ? 28 : 0;
        const nx = -dy / len, ny = dx / len;
        const c = { x: (a.x + b.x) / 2 + nx * off, y: (a.y + b.y) / 2 + ny * off };
        const trim = (from, to, d) => {
          const l = Math.hypot(to.x - from.x, to.y - from.y) || 1;
          return { x: from.x + ((to.x - from.x) / l) * d, y: from.y + ((to.y - from.y) / l) * d };
        };
        const s = trim(a, curved ? c : b, R);
        const t = trim(b, curved ? c : a, R + (graph.directed ? 2 : 0));
        el('path', { d: curved ? `M${s.x},${s.y} Q${c.x},${c.y} ${t.x},${t.y}` : `M${s.x},${s.y} L${t.x},${t.y}`, 'marker-end': graph.directed ? `url(#arrow-${state})` : null }, g);
        mid = curved ? { x: (a.x + 2 * c.x + b.x) / 4, y: (a.y + 2 * c.y + b.y) / 4 } : { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      }
      const lg = el('g', { class: `weight ${state}` }, labelLayer);
      const text = fmt(e.w);
      const w = 10 + text.length * 8;
      el('rect', { x: mid.x - w / 2, y: mid.y - 10, width: w, height: 20, rx: 6 }, lg);
      el('text', { x: mid.x, y: mid.y + 5, 'text-anchor': 'middle' }, lg).textContent = text;
    });

    for (const n of graph.nodes) {
      const state = step?.nodes?.[n.id] ?? 'idle';
      const group = step?.groups?.[n.id];
      const g = el('g', { class: `node ${state} ${group !== undefined ? `g${group % 8}` : ''}`, 'data-node': n.id, tabindex: -1 }, svg);
      el('circle', { cx: n.x, cy: n.y, r: R }, g);
      el('text', { x: n.x, y: n.y + 5, 'text-anchor': 'middle', class: 'id' }, g).textContent = n.id;
      const label = step?.labels?.[n.id];
      if (label !== undefined) {
        const lw = 12 + label.length * 8;
        const lx = n.x + R - 4, ly = n.y - R - 14;
        el('rect', { class: 'dist', x: lx - lw / 2, y: ly - 10, width: lw, height: 20, rx: 10 }, g);
        el('text', { class: 'dist', x: lx, y: ly + 5, 'text-anchor': 'middle' }, g).textContent = label;
      }
    }
  }
}
