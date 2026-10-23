// Sortieralgorithmen. Jede run()-Funktion liefert eine Liste von Schritten (Snapshots),
// die der Player einzeln anzeigt. Indizes in Texten sind 1-basiert wie im Pseudocode.

function trace(input) {
  const a = [...input];
  const steps = [];
  const stats = { comparisons: 0, writes: 0 };
  const sorted = new Set();

  function snap(line, msg, hl = {}, extra = {}) {
    steps.push({ array: [...a], line, msg, hl: { ...hl, sorted: [...sorted] }, stats: { ...stats }, ...extra });
  }

  function finish(extra = {}) {
    a.forEach((_, i) => sorted.add(i));
    snap(null, 'Fertig – das Feld ist sortiert.', {}, extra);
    return steps;
  }

  return { a, steps, stats, sorted, snap, finish };
}

export const insertionSort = {
  pseudocode: [
    ['head', 'INSERTION-SORT(A, n)'],
    ['for', '  for i = 2 to n'],
    ['key', '    key = A[i]'],
    ['j', '    j = i − 1'],
    ['while', '    while j > 0 and A[j] > key'],
    ['shift', '      A[j + 1] = A[j]'],
    ['dec', '      j = j − 1'],
    ['insert', '    A[j + 1] = key'],
  ],
  run(input) {
    const { a, snap, stats, finish } = trace(input);
    snap('head', 'Start: Das erste Element allein ist bereits sortiert.', { region: [0, 0] });
    for (let i = 1; i < a.length; i++) {
      const key = a[i];
      snap(['for', 'key', 'j'], `i = ${i + 1}: key = ${key} wird in den sortierten Bereich A[1..${i}] eingefügt.`, { region: [0, i], key: i });
      let j = i - 1;
      while (j >= 0) {
        stats.comparisons++;
        const bigger = a[j] > key;
        snap('while', `Ist A[${j + 1}] = ${a[j]} > key = ${key}? ${bigger ? 'Ja' : 'Nein'}.`, { region: [0, i], key: j + 1, compare: [j] });
        if (!bigger) break;
        a[j + 1] = a[j];
        a[j] = key;
        stats.writes++;
        snap(['shift', 'dec'], `${a[j + 1]} rückt eine Position nach rechts.`, { region: [0, i], key: j, active: [j + 1] });
        j--;
      }
      stats.writes++;
      snap('insert', `key = ${key} steht jetzt an Position ${j + 2}.`, { region: [0, i], key: j + 1 });
    }
    return finish();
  },
};

export const mergeSort = {
  pseudocode: [
    ['head', 'MERGE-SORT(A, p, r)'],
    ['base', '  if p ≥ r: return'],
    ['mid', '  q = ⌊(p + r) / 2⌋'],
    ['left', '  MERGE-SORT(A, p, q)'],
    ['right', '  MERGE-SORT(A, q + 1, r)'],
    ['merge', '  MERGE(A, p, q, r)'],
    ['mhead', 'MERGE(A, p, q, r)'],
    ['copy', '  L = A[p..q], R = A[q + 1..r]'],
    ['while', '  while L und R nicht leer'],
    ['takeL', '    if L[i] ≤ R[j]: A[k] = L[i], i = i + 1'],
    ['takeR', '    else A[k] = R[j], j = j + 1'],
    ['rest', '  kopiere den Rest von L bzw. R nach A'],
  ],
  run(input) {
    const { a, snap, stats, finish } = trace(input);

    function merge(p, q, r) {
      const L = a.slice(p, q + 1);
      const R = a.slice(q + 1, r + 1);
      let i = 0, j = 0, k = p;
      const aux = () => ({
        aux: [
          { label: 'L', values: L, highlight: [i], consumed: i },
          { label: 'R', values: R, highlight: [j], consumed: j },
        ],
      });
      snap(['merge', 'copy'], `Mische A[${p + 1}..${q + 1}] und A[${q + 2}..${r + 1}]: kopiere beide Hälften nach L und R.`, { region: [p, r] }, aux());
      while (i < L.length && j < R.length) {
        stats.comparisons++;
        stats.writes++;
        if (L[i] <= R[j]) {
          a[k] = L[i++];
          snap('takeL', `L[${i}] = ${L[i - 1]} ≤ R[${j + 1}] = ${R[j]} → A[${k + 1}] = ${L[i - 1]}.`, { region: [p, r], active: [k] }, aux());
        } else {
          a[k] = R[j++];
          snap('takeR', `L[${i + 1}] = ${L[i]} > R[${j}] = ${R[j - 1]} → A[${k + 1}] = ${R[j - 1]}.`, { region: [p, r], active: [k] }, aux());
        }
        k++;
      }
      while (i < L.length || j < R.length) {
        stats.writes++;
        const v = i < L.length ? L[i++] : R[j++];
        a[k] = v;
        snap('rest', `Rest übernehmen: A[${k + 1}] = ${v}.`, { region: [p, r], active: [k] }, aux());
        k++;
      }
    }

    function sort(p, r) {
      if (p >= r) {
        snap('base', `A[${p + 1}] allein ist bereits sortiert.`, { region: [p, r] });
        return;
      }
      const q = Math.floor((p + r) / 2);
      snap('mid', `Teile A[${p + 1}..${r + 1}] bei q = ${q + 1} und sortiere zuerst die linke Hälfte.`, { region: [p, r], split: q });
      sort(p, q);
      sort(q + 1, r);
      merge(p, q, r);
    }

    if (a.length) sort(0, a.length - 1);
    return finish();
  },
};

export const heapSort = {
  pseudocode: [
    ['head', 'HEAPSORT(A, n)'],
    ['build', '  BUILD-MAX-HEAP(A, n)'],
    ['for', '  for i = n downto 2'],
    ['swap', '    exchange A[1] with A[i]'],
    ['shrink', '    A.heap-size = A.heap-size − 1'],
    ['heapify', '    MAX-HEAPIFY(A, 1)'],
    ['bhead', 'BUILD-MAX-HEAP(A, n)'],
    ['bfor', '  for i = ⌊n / 2⌋ downto 1'],
    ['bheap', '    MAX-HEAPIFY(A, i)'],
    ['hhead', 'MAX-HEAPIFY(A, i)'],
    ['lr', '  l = LEFT(i), r = RIGHT(i)'],
    ['largest', '  largest = Index des Maximums von A[i], A[l], A[r]'],
    ['if', '  if largest ≠ i'],
    ['xchg', '    exchange A[i] with A[largest]'],
    ['rec', '    MAX-HEAPIFY(A, largest)'],
  ],
  run(input) {
    const { a, snap, stats, sorted, finish } = trace(input);
    const n = a.length;
    let size = n;
    const tree = () => ({ heap: size });

    function heapify(i) {
      for (;;) {
        const l = 2 * i + 1, r = 2 * i + 2;
        if (l >= size) return;
        let largest = i;
        stats.comparisons++;
        if (a[l] > a[largest]) largest = l;
        if (r < size) {
          stats.comparisons++;
          if (a[r] > a[largest]) largest = r;
        }
        const kids = r < size ? `A[${l + 1}] = ${a[l]}, A[${r + 1}] = ${a[r]}` : `A[${l + 1}] = ${a[l]}`;
        const compare = r < size ? [i, l, r] : [i, l];
        if (largest === i) {
          snap(['largest', 'if'], `A[${i + 1}] = ${a[i]} ist größer als ${kids} – Heap-Eigenschaft erfüllt.`, { region: [0, size - 1], compare }, tree());
          return;
        }
        snap(['lr', 'largest'], `Größtes von A[${i + 1}] = ${a[i]}, ${kids} ist A[${largest + 1}] = ${a[largest]}.`, { region: [0, size - 1], compare }, tree());
        [a[i], a[largest]] = [a[largest], a[i]];
        stats.writes += 2;
        snap(['xchg', 'rec'], `Tausche A[${i + 1}] und A[${largest + 1}], weiter bei Position ${largest + 1}.`, { region: [0, size - 1], swap: [i, largest] }, tree());
        i = largest;
      }
    }

    snap(['build', 'bhead'], 'Baue zuerst aus dem ganzen Feld einen Max-Heap.', { region: [0, n - 1] }, tree());
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
      snap(['bfor', 'bheap'], `MAX-HEAPIFY bei Knoten ${i + 1}.`, { region: [0, n - 1], active: [i] }, tree());
      heapify(i);
    }
    if (n > 1) snap('for', `Max-Heap fertig: A[1] = ${a[0]} ist das Maximum.`, { region: [0, n - 1], active: [0] }, tree());
    for (let i = n - 1; i >= 1; i--) {
      [a[0], a[i]] = [a[i], a[0]];
      stats.writes += 2;
      sorted.add(i);
      size = i;
      snap(['swap', 'shrink'], `Maximum ${a[i]} ans Ende (Position ${i + 1}) – der Heap schrumpft auf ${size} Elemente.`, { region: [0, size - 1], swap: [0, i] }, tree());
      snap('heapify', 'Stelle die Heap-Eigenschaft ab der Wurzel wieder her.', { region: [0, size - 1], active: [0] }, tree());
      heapify(0);
    }
    size = 0;
    return finish(tree());
  },
};

export const quickSort = {
  pseudocode: [
    ['head', 'QUICKSORT(A, p, r)'],
    ['if', '  if p < r'],
    ['part', '    q = PARTITION(A, p, r)'],
    ['rec1', '    QUICKSORT(A, p, q − 1)'],
    ['rec2', '    QUICKSORT(A, q + 1, r)'],
    ['phead', 'PARTITION(A, p, r)'],
    ['x', '  x = A[r]               // Pivot'],
    ['i', '  i = p − 1'],
    ['for', '  for j = p to r − 1'],
    ['cmp', '    if A[j] ≤ x'],
    ['inc', '      i = i + 1'],
    ['swap', '      exchange A[i] with A[j]'],
    ['final', '  exchange A[i + 1] with A[r]'],
    ['ret', '  return i + 1'],
  ],
  run(input) {
    const { a, snap, stats, sorted, finish } = trace(input);

    function partition(p, r) {
      const x = a[r];
      let i = p - 1;
      const part = (j) => ({ region: [p, r], pivot: r, partition: { p, i, j } });
      snap(['x', 'i'], `Pivot x = A[${r + 1}] = ${x}. Links sammeln sich Werte ≤ ${x}, rechts Werte > ${x}.`, part(p));
      for (let j = p; j < r; j++) {
        stats.comparisons++;
        if (a[j] <= x) {
          i++;
          if (i !== j) {
            [a[i], a[j]] = [a[j], a[i]];
            stats.writes += 2;
          }
          snap(['cmp', 'inc', 'swap'], `A[${j + 1}] = ${a[i]} ≤ ${x} → i = ${i + 1}${i !== j ? `, tausche A[${i + 1}] und A[${j + 1}]` : ''}.`, { ...part(j + 1), swap: [i, j] });
        } else {
          snap('cmp', `A[${j + 1}] = ${a[j]} > ${x} → bleibt im rechten Teil.`, { ...part(j + 1), compare: [j] });
        }
      }
      [a[i + 1], a[r]] = [a[r], a[i + 1]];
      stats.writes += 2;
      sorted.add(i + 1);
      snap(['final', 'ret'], `Pivot ${x} an seine endgültige Position ${i + 2}.`, { region: [p, r], swap: [i + 1, r] });
      return i + 1;
    }

    function sort(p, r) {
      if (p > r) return;
      if (p === r) {
        sorted.add(p);
        snap('if', `A[${p + 1}] allein ist bereits sortiert.`, { region: [p, r] });
        return;
      }
      snap(['if', 'part'], `Partitioniere A[${p + 1}..${r + 1}].`, { region: [p, r] });
      const q = partition(p, r);
      sort(p, q - 1);
      sort(q + 1, r);
    }

    sort(0, a.length - 1);
    return finish();
  },
};

export const countingSort = {
  pseudocode: [
    ['head', 'COUNTING-SORT(A, n, k)'],
    ['new', '  B[1..n] und C[0..k] = neue Arrays'],
    ['init', '  for i = 0 to k: C[i] = 0'],
    ['count', '  for j = 1 to n: C[A[j]] = C[A[j]] + 1'],
    ['prefix', '  for i = 1 to k: C[i] = C[i] + C[i − 1]'],
    ['place', '  for j = n downto 1'],
    ['put', '    B[C[A[j]]] = A[j]'],
    ['dec', '    C[A[j]] = C[A[j]] − 1'],
    ['ret', '  return B'],
  ],
  run(input) {
    const { a, snap, stats, finish } = trace(input);
    const n = a.length;
    const k = n ? Math.max(...a) : 0;
    const C = new Array(k + 1).fill(0);
    const B = new Array(n).fill(null);
    const aux = (c = [], b = []) => ({
      aux: [
        { label: 'C', values: C, highlight: c, start: 0 },
        { label: 'B', values: B, highlight: b, start: 1 },
      ],
    });

    snap(['new', 'init'], `k = ${k}: lege die Zählfelder C[0..${k}] = 0 und die Ausgabe B an.`, {}, aux());
    for (let j = 0; j < n; j++) {
      C[a[j]]++;
      snap('count', `A[${j + 1}] = ${a[j]} → C[${a[j]}] = ${C[a[j]]}.`, { active: [j] }, aux([a[j]]));
    }
    for (let i = 1; i <= k; i++) {
      C[i] += C[i - 1];
      snap('prefix', `C[${i}] = C[${i}] + C[${i - 1}] = ${C[i]}: so viele Elemente sind ≤ ${i}.`, {}, aux([i - 1, i]));
    }
    for (let j = n - 1; j >= 0; j--) {
      const v = a[j];
      const pos = C[v] - 1;
      B[pos] = v;
      C[v]--;
      stats.writes++;
      snap(['place', 'put', 'dec'], `A[${j + 1}] = ${v} kommt nach B[${pos + 1}], danach C[${v}] = ${C[v]}.`, { active: [j] }, aux([v], [pos]));
    }
    B.forEach((v, i) => { a[i] = v; });
    snap('ret', 'B ist sortiert und wird zurückgegeben – ganz ohne einen einzigen Vergleich.', {}, aux());
    return finish();
  },
};

const DIGIT_NAMES = ['Einer', 'Zehner', 'Hunderter', 'Tausender'];

export const radixSort = {
  pseudocode: [
    ['head', 'RADIX-SORT(A, n, d)'],
    ['for', '  for i = 1 to d'],
    ['sort', '    sortiere A stabil nach Ziffer i (Counting Sort):'],
    ['count', '      C[z] = Anzahl der Elemente mit Ziffer z'],
    ['cum', '      C[z] = C[z] + C[z − 1] für z = 1..9'],
    ['put', '      for j = n downto 1: B[C[z]] = A[j], C[z] = C[z] − 1'],
    ['copy', '      A = B'],
  ],
  run(input) {
    const { a, snap, stats, finish } = trace(input);
    const n = a.length;
    const max = n ? Math.max(...a) : 0;
    const d = Math.max(1, String(max).length);

    for (let e = 0; e < d; e++) {
      const div = 10 ** e;
      const digit = (v) => Math.floor(v / div) % 10;
      const C = new Array(10).fill(0);
      const B = new Array(n).fill(null);
      const aux = (c = [], b = []) => ({
        digit: e,
        aux: [
          { label: 'C', values: C, highlight: c, start: 0 },
          { label: 'B', values: B, highlight: b, start: 1 },
        ],
      });
      snap(['for', 'sort'], `Ziffer ${e + 1} von ${d}: sortiere stabil nach den ${DIGIT_NAMES[e] ?? `${e + 1}. Stellen`}.`, {}, aux());
      for (let j = 0; j < n; j++) {
        const z = digit(a[j]);
        C[z]++;
        snap('count', `A[${j + 1}] = ${a[j]} hat Ziffer ${z} → C[${z}] = ${C[z]}.`, { active: [j] }, aux([z]));
      }
      for (let z = 1; z < 10; z++) C[z] += C[z - 1];
      snap('cum', 'Präfixsummen: C[z] ist jetzt die letzte Position für Ziffer z.', {}, aux());
      for (let j = n - 1; j >= 0; j--) {
        const z = digit(a[j]);
        const pos = C[z] - 1;
        B[pos] = a[j];
        C[z]--;
        stats.writes++;
        snap('put', `A[${j + 1}] = ${a[j]} (Ziffer ${z}) kommt nach B[${pos + 1}].`, { active: [j] }, aux([z], [pos]));
      }
      B.forEach((v, i) => { a[i] = v; });
      snap('copy', `Nach den ${DIGIT_NAMES[e] ?? `${e + 1}. Stellen`} sortiert. Gleiche Ziffern behalten ihre Reihenfolge (stabil).`, {}, { digit: e });
    }
    return finish();
  },
};
