import assert from 'node:assert/strict';
import test from 'node:test';
import { access } from 'node:fs/promises';
import { evidence, sections } from '../src/content.js';
import { blocks, speaker } from '../src/presentation.js';
import {
  addLink, backupCycle, devices, diskMetrics, newBackup, newDirectory,
  pageSteps, readName, restoreSnapshot, sequences, sshAttempt, threadState, validateRestoration,
} from '../src/model.js';
import { practiceActions, practiceViews, resetAll, resetPractice, state } from '../src/practices.js';

test('FIFO, LRU y Óptimo reproducen la guía y Bélády', () => {
  const totals = (preset, count) => ['fifo', 'lru', 'optimo'].map(id => pageSteps(sequences[preset], count, id).at(-1).faults);
  assert.deepEqual(totals('guia', 3), [9, 7, 6]);
  assert.deepEqual(totals('belady', 3), [9, 10, 7]);
  assert.deepEqual(totals('belady', 4), [10, 8, 6]);
});

test('Óptimo mantiene una regla estable de empate y conserva cada estado', () => {
  const steps = pageSteps([1, 2, 3], 2, 'optimo');
  assert.deepEqual(steps.map(({ frames }) => frames), [[1, null], [1, 2], [3, 2]]);
  assert.equal(steps.at(-1).evicted, 1);
  assert.equal(pageSteps([2, 2], 2, 'fifo')[1].hit, true);
});

test('Los dos intercalados pierden o conservan el incremento según el candado', () => {
  assert.deepEqual(threadState('libre', 2).copies, [0, 0]);
  assert.equal(threadState('libre', 6).counter, 1);
  assert.deepEqual([threadState('mutex', 2).waiting, threadState('mutex', 2).owner], [1, 0]);
  assert.deepEqual(threadState('mutex', 5).copies, [1, 1]);
  assert.equal(threadState('mutex', 7).counter, 2);
});

test('El enlace duro conserva inodo y contenido tras quitar el original', () => {
  const directory = newDirectory();
  addLink(directory, 'hard');
  addLink(directory, 'symbolic');
  assert.equal(readName(directory, 'duro.txt').inode, readName(directory, 'original.txt').inode);
  assert.equal(readName(directory, 'simbolico.txt').open, true);
  delete directory.names['original.txt'];
  assert.equal(readName(directory, 'duro.txt').content, 'Datos del laboratorio');
  assert.deepEqual(readName(directory, 'simbolico.txt'), { open: false, reason: 'Destino ausente' });
});

test('Los contadores producen los tres deltas medidos', () => {
  assert.deepEqual(devices.map(item => item.after - item.before), [458, 116, 91]);
});

test('El acceso permitido y los rechazos se resuelven en su etapa', () => {
  const valid = { origin: 'internal', user: 'authorized', credential: 'key' };
  assert.equal(sshAttempt(valid).allowed, true);
  assert.equal(sshAttempt({ ...valid, origin: 'external' }).stage, 'Red');
  for (const change of [{ credential: 'password' }, { credential: 'invalid' }, { user: 'root' }, { user: 'unknown' }]) {
    const result = sshAttempt({ ...valid, ...change });
    assert.equal(result.allowed, false);
    assert.equal(result.stage, 'Autenticación');
  }
});

test('La caída conserva la copia local, la réplica se recupera y solo quedan cinco locales', () => {
  const backup = newBackup();
  backupCycle(backup);
  backup.online = false;
  backupCycle(backup);
  assert.deepEqual(backup.local.map(copy => copy.id), [1, 2]);
  assert.deepEqual(backup.remote.map(copy => copy.id), [1]);
  assert.deepEqual(backup.log[0].events, ['Éxito local', 'Error remoto · cliente caído']);
  backup.online = true;
  backupCycle(backup);
  assert.deepEqual(backup.log[0].events, ['Éxito local', 'Réplica recuperada']);
  for (let i = 0; i < 3; i++) backupCycle(backup);
  assert.deepEqual(backup.local.map(copy => copy.id), [2, 3, 4, 5, 6]);
  assert.deepEqual(backup.remote.map(copy => copy.id), [1, 2, 3, 4, 5, 6]);
});

test('Restaurar una versión comprueba contenido, permisos, fechas y destino del enlace', () => {
  const backup = newBackup();
  backupCycle(backup);
  backupCycle(backup);
  const original = backup.local[0];
  const restored = restoreSnapshot(original);
  assert.equal(restored.path, '/tmp/restauracion-1');
  assert.equal(restored.entries.length, 5);
  assert.equal(validateRestoration(original, restored).valid, true);
  assert.equal(validateRestoration(backup.local[1], restored).valid, false);
  for (const change of [{ mode: '0600' }, { modified: '1' }, { content: 'cambio' }, { target: 'otro.txt' }]) {
    const copy = restoreSnapshot(original);
    Object.assign(copy.entries.at(-1), change);
    assert.equal(validateRestoration(original, copy).valid, false);
  }
});

test('Los incidentes saturan recursos distintos y la corrección libera el que se agotó', () => {
  const full = ({ total, used }) => used === total;
  assert.deepEqual(Object.values(diskMetrics('blocks')).map(full), [true, false]);
  assert.deepEqual(Object.values(diskMetrics('inodes')).map(full), [false, true]);
  assert.deepEqual(Object.values(diskMetrics('blocks', true)).map(full), [false, false]);
  assert.deepEqual(Object.values(diskMetrics('inodes', true)).map(full), [false, false]);
});

test('Los controles de marco y preset limpian los pasos y el reinicio restaura el recorrido', () => {
  const initial = structuredClone(state);
  practiceActions['memory-run']();
  practiceActions['memory-guess'](10);
  practiceActions['memory-count'](4);
  assert.equal(state.memoria.step, 0);
  assert.equal(state.memoria.prediction, '');
  practiceActions['memory-run']();
  practiceActions['memory-preset']('belady');
  assert.equal(state.memoria.step, 0);
  practiceActions['file-run']();
  resetPractice('archivos');
  assert.deepEqual(state.archivos, initial.archivos);
  practiceActions['backup-run']();
  practiceActions.restore('6');
  resetAll();
  assert.deepEqual(state, initial);
});

test('Las secciones enlazan sus prácticas y evidencias', async () => {
  assert.equal(sections[0].id, 'apertura');
  for (const section of sections.slice(1)) {
    assert.equal(typeof practiceViews[section.id], 'function');
    for (const key of section.evidence) assert.ok(evidence[key], key);
  }
  const captures = Object.values(evidence).filter(entry => entry[4]);
  await Promise.all(captures.map(entry => access(new URL('../assets/evidencias/' + entry[4], import.meta.url))));
});

test('Los 13 bloques siguen los turnos acordados y las 11 demos enlazan evidencias', () => {
  assert.equal(blocks.length, 13);
  assert.deepEqual(blocks.flatMap((_, i) => speaker(i) === 'Juan Camilo Laguna' ? [i + 1] : []), [1, 2, 4, 6, 8, 10, 12]);
  assert.deepEqual(blocks.flatMap((_, i) => speaker(i) === 'Jesús Forero' ? [i + 1] : []), [3, 5, 7, 9, 11, 13]);
  assert.equal(new Set(blocks.map(block => block.id)).size, 13);
  assert.equal(blocks.filter(block => block.steps?.length).length, 11);
  for (const block of blocks) {
    for (const key of block.evidence) assert.ok(evidence[key], key);
    for (const id of block.labs ?? []) assert.ok(practiceViews[id], id);
  }
});
