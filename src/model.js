export const sequences = {
  guia: [2, 3, 2, 1, 5, 2, 4, 5, 3, 2, 5, 2],
  belady: [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5],
};

export function pageSteps(sequence, count, algorithm) {
  const frames = Array(count).fill(null);
  const timestamps = Array(count).fill(0);
  let faults = 0;
  return sequence.map((page, step) => {
    let slot = frames.indexOf(page);
    const hit = slot !== -1;
    let evicted = null;
    if (!hit) {
      faults++;
      slot = frames.indexOf(null);
      if (slot === -1) {
        if (algorithm === 'optimo') {
          const nextAccess = frames.map(frame => {
            const next = sequence.indexOf(frame, step + 1);
            return next === -1 ? Infinity : next;
          });
          slot = nextAccess.indexOf(Math.max(...nextAccess));
        } else {
          slot = timestamps.indexOf(Math.min(...timestamps));
        }
        evicted = frames[slot];
      }
      frames[slot] = page;
    }
    if (!hit || algorithm === 'lru') timestamps[slot] = step;
    return { step, page, slot, frames: [...frames], hit, evicted, faults };
  });
}

const threadOrder = {
  libre: [[0, 'leer'], [1, 'leer'], [0, 'incrementar'], [1, 'incrementar'], [0, 'escribir'], [1, 'escribir']],
  mutex: [[0, 'leer'], [1, 'esperar'], [0, 'incrementar'], [0, 'escribir'], [1, 'leer'], [1, 'incrementar'], [1, 'escribir']],
};

export function threadState(mode, step) {
  let counter = 0;
  let owner = null;
  let waiting = null;
  const copies = [null, null];
  const history = threadOrder[mode].slice(0, step).map(([thread, action]) => {
    if (action === 'leer') {
      copies[thread] = counter;
      if (mode === 'mutex') owner = thread;
      waiting = null;
    }
    if (action === 'esperar') waiting = thread;
    if (action === 'incrementar') copies[thread]++;
    if (action === 'escribir') {
      counter = copies[thread];
      owner = null;
    }
    return { thread, action, counter, local: copies[thread] };
  });
  return { counter, copies, owner, waiting, history, total: threadOrder[mode].length };
}

export function newDirectory() {
  return { names: { 'original.txt': { kind: 'hard', inode: 421 } }, inodes: { 421: 'Datos del laboratorio' } };
}

export function addLink(directory, kind) {
  if (!directory.names['original.txt']) return;
  directory.names[kind === 'hard' ? 'duro.txt' : 'simbolico.txt'] = kind === 'hard'
    ? { kind, inode: directory.names['original.txt'].inode }
    : { kind, inode: 728, target: 'original.txt' };
}

export function readName(directory, name) {
  const entry = directory.names[name];
  if (!entry) return { open: false, reason: 'Nombre ausente' };
  const resolved = entry.kind === 'symbolic' ? directory.names[entry.target] : entry;
  return resolved
    ? { open: true, inode: resolved.inode, content: directory.inodes[resolved.inode] }
    : { open: false, reason: 'Destino ausente' };
}

export const devices = [
  { label: 'Teclado', before: 2085, after: 2543, driver: 'i8042', context: 'Pulsaciones en el teclado de la máquina virtual.' },
  { label: 'Almacenamiento', before: 714, after: 830, driver: 'ata_piix', context: 'Lectura masiva del disco. El informe también registra +381 en ahci.' },
  { label: 'Red interna', before: 347, after: 438, driver: 'enp0s8', context: 'Tráfico entre servidor y cliente.' },
];

export function sshAttempt({ origin, user, credential }) {
  if (origin !== 'internal') {
    return { allowed: false, stage: 'Red', reason: 'El cortafuegos descarta la entrada desde el origen externo.' };
  }
  if (user !== 'authorized' || credential !== 'key') {
    const reason = user === 'root' ? 'El ingreso como root está deshabilitado.'
      : user === 'unknown' ? 'El usuario no está autorizado en este modelo.'
      : credential === 'password' ? 'El servicio SSH acepta únicamente llaves.' : 'La llave no coincide con una autorizada.';
    return { allowed: false, stage: 'Autenticación', reason };
  }
  return { allowed: true, stage: 'Autenticación', reason: 'El cortafuegos permite el origen interno y SSH valida el usuario y la llave.' };
}

function snapshotEntries(cycle) {
  const file = (name, mode, content, modified = '2026-05-20 14:30') => ({ name, mode, type: 'archivo', modified, content });
  const cycleTime = new Date(Date.UTC(2026, 4, 20, 14, 30 + cycle * 5)).toISOString().slice(0, 16).replace('T', ' ');
  return [
    file('informe.txt', '0640', 'Informe de operación'),
    file('inventario.txt', '0640', 'Inventario del servidor'),
    file('bitacora.txt', '0660', 'Registro de operación hasta el ciclo ' + cycle, cycleTime),
    file('notas.txt', '0644', 'Notas de verificación'),
    { name: 'referencia', mode: '0777', type: 'simbólico roto', modified: '2026-05-20 14:31', target: 'ausente.txt' },
  ];
}

export function newBackup() {
  return { online: true, cycle: 0, local: [], remote: [], log: [], pending: false };
}

export function backupCycle(state) {
  const id = ++state.cycle;
  state.local.push({ id, entries: snapshotEntries(id) });
  state.local = state.local.slice(-5);
  const events = ['Éxito local'];
  if (state.online) {
    // Replica las versiones locales que todavía pueden recuperarse.
    const missing = state.local.filter(copy => !state.remote.some(remote => remote.id === copy.id));
    state.remote.push(...structuredClone(missing));
    events.push(state.pending ? 'Réplica recuperada' : 'Réplica completada');
  } else {
    events.push('Error remoto · cliente caído');
  }
  state.pending = !state.online;
  state.log.unshift({ id, events });
}

export function restoreSnapshot(snapshot) {
  return { path: '/tmp/restauracion-' + snapshot.id, entries: structuredClone(snapshot.entries) };
}

export function validateRestoration(snapshot, restored) {
  const rows = snapshot.entries.map(expected => {
    const actual = restored.entries.find(entry => entry.name === expected.name);
    const matches = !!actual && ['mode', 'type', 'modified', 'content', 'target'].every(field => actual[field] === expected[field]);
    return { name: expected.name, matches };
  });
  return { rows, valid: rows.every(row => row.matches) && restored.entries.length === snapshot.entries.length };
}

export const diskError = 'No queda espacio en el dispositivo';
export function diskMetrics(incident, resolved = false) {
  return {
    blocks: { total: 1000, used: incident === 'blocks' ? (resolved ? 700 : 1000) : 280, unit: 'M' },
    inodes: { total: 20000, used: incident === 'inodes' ? (resolved ? 6000 : 20000) : 4000, unit: '' },
  };
}
