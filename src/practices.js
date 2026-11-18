import { evidence, initialQuestion } from './content.js';
import {
  addLink, backupCycle, devices, diskError, diskMetrics, newBackup, newDirectory,
  pageSteps, readName, restoreSnapshot, sequences, sshAttempt, threadState, validateRestoration,
} from './model.js';

const algorithms = { fifo: 'FIFO', lru: 'LRU', optimo: 'Óptimo' };
const commands = ['cat /etc/os-release', 'uname -r'];
const processTree = [
  { name: 'systemd', pid: 1, ppid: 0, depth: 0 },
  { name: 'sshd', pid: 420, ppid: 1, depth: 1 },
  { name: 'bash', pid: 812, ppid: 420, depth: 2 },
  { name: 'python3', pid: 936, ppid: 812, depth: 3 },
];

const initializers = {
  sistema: () => ({ command: 0 }),
  procesos: () => ({ mode: 'libre', step: 0, node: 0 }),
  memoria: () => ({ preset: 'guia', count: 3, algorithm: 'fifo', step: 0, prediction: '', compare: false }),
  archivos: () => ({ directory: newDirectory(), checked: false }),
  dispositivos: () => ({ index: 0, predictions: ['', '', ''], revealed: [false, false, false] }),
  seguridad: () => ({ origin: 'internal', user: 'authorized', credential: 'key', result: null }),
  respaldo: newBackup,
  diagnostico: () => ({ incident: 'blocks', blocks: false, inodes: false, guess: '', resolved: false }),
  verificacion: () => ({ shown: false }),
  restauracion: () => ({ selection: '', restored: null, validation: null, close: false }),
};

export const state = {};
export function resetPractice(id) {
  if (initializers[id]) state[id] = initializers[id]();
  if (id === 'respaldo') state.restauracion = initializers.restauracion();
}
export function resetAll() { Object.keys(initializers).forEach(resetPractice); }
resetAll();

export const button = (label, action, value = '', options = {}) =>
  `<button type="button" class="btn ${options.primary ? 'primary' : ''} ${options.className ?? ''}" data-action="${action}" data-value="${value}"${options.pressed === undefined ? '' : ` aria-pressed="${options.pressed}"`}${options.disabled ? ' disabled' : ''}>${label}</button>`;
const primary = (label, action, value = '', disabled = false) => button(label, action, value, { primary: true, disabled });
const toggle = (label, action, value, selected) => button(label, action, value, { pressed: value === selected });
const select = (label, action, options, selected) =>
  `<label class="field"><span id="label-${action}">${label}</span><select data-change="${action}" aria-labelledby="label-${action}">${options.map(([key, value]) => `<option value="${key}"${String(key) === String(selected) ? ' selected' : ''}>${value}</option>`).join('')}</select></label>`;
const prediction = (label, action, value) =>
  `<form class="prediction" data-form="${action}"><label class="field">${label}<input type="number" min="0" max="9999" required value="${value}" placeholder="?" inputmode="numeric" name="prediction"></label><button class="btn" type="submit">Registrar</button></form>`;
const actions = (...items) => `<div class="actions">${items.join('')}</div>`;
const live = (content, type = '') => `<div class="readout ${type}" data-state-visual>${content}</div>`;
const panel = (label, content, className = '') => `<section class="panel ${className}"><h2 class="overline">${label}</h2>${content}</section>`;
const metric = (label, value) => `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
const foot = content => `<div class="source-foot">${content}</div>`;
export const evidenceButton = (key, label = evidence[key][0]) => button(label, 'evidence', key, { className: 'resource-button' });
const secondary = (title, copy, ...keys) => `<div class="drawer-card"><h3>${title}</h3><p>${copy}</p>${actions(...keys.map(key => evidenceButton(key)))}</div>`;
const tag = (label, tone = '') => `<span class="tag ${tone}">${label}</span>`;
const reset = () => button('Reiniciar', 'reset');
const terminal = (title, content) => `<div class="terminal"><div class="terminal-head"><span class="lights" aria-hidden="true"><i></i><i></i><i></i></span><span>${title}</span></div><div class="terminal-body">${content}</div></div>`;

export function topology({ online = true, detailed = false, origin = '', replicated = false } = {}) {
  const node = (name, address, isServer) => `<div class="network-node">
    <div class="${isServer ? 'server-icon' : 'client-icon'}" aria-hidden="true">${isServer ? '<i></i><i></i><i></i>' : '<i>›_</i>'}</div>
    <b>${name}</b><code>${address}</code>
    ${detailed ? tag(isServer || online ? 'Disponible' : 'Caído', isServer || online ? 'good' : 'bad') : ''}
  </div>`;
  return `<div class="network ${online ? '' : 'is-down'} ${detailed ? 'network-compact' : ''}">
    <div class="network-caption"><span>TOPOLOGÍA DEL LABORATORIO</span><span class="network-flag">${online ? '● EN LÍNEA' : '● CLIENTE CAÍDO'}</span></div>
    <div class="network-map">${node('Servidor', '192.168.100.10', true)}
      <div class="network-link"><span>${origin === 'external' ? 'Origen externo' : 'redso'}</span><i aria-hidden="true"></i><small>${replicated ? 'Réplica recibida' : online ? 'Red interna' : 'Sin réplica'}</small></div>
      ${node('Cliente', '192.168.100.11', false)}
    </div>
    ${detailed ? '' : '<div class="network-footer"><span>Debian GNU/Linux 13</span><span>VirtualBox</span></div>'}
  </div>`;
}

function sistema() {
  const active = state.sistema.command;
  const os = `<mark>PRETTY_NAME="Debian GNU/Linux 13 (trixie)"</mark>
NAME="Debian GNU/Linux"
VERSION_ID="13"
VERSION="13 (trixie)"
VERSION_CODENAME=trixie
DEBIAN_VERSION_FULL=13.6
ID=debian
HOME_URL="https://www.debian.org/"
SUPPORT_URL="https://www.debian.org/support"
BUG_REPORT_URL="https://bugs.debian.org/"`;
  return `<div class="practice-grid">${panel('Terminal · salida del informe', `
    ${actions(...commands.map((command, index) => toggle(`<code>${command}</code>`, 'command', index, active)))}
    ${terminal(active ? 'Figura 42 · p. 49' : 'Figura 41 · p. 48', `<pre><span class="prompt">$ ${commands[active]}</span>\n${active ? '<mark>6.12.101+deb13-amd64</mark>' : os}</pre>`)}
    `)}${panel('Pregunta para el grupo', `
    <h3 class="panel-question">${active ? '¿Qué valor corresponde al núcleo en ejecución?' : '¿Qué comando confirma la versión del núcleo en ejecución?'}</h3>
    <p>${active ? 'uname -r devuelve la versión del kernel. El nombre trixie identifica la distribución que lo acompaña.' : 'PRETTY_NAME da el nombre de la distribución. Cambia de comando para encontrar el kernel.'}</p>
    ${actions(button('Prueba opcional en VM', 'vm'), evidenceButton(active ? 'f42' : 'f41'), reset())}
  `)}</div>`;
}

function procesos() {
  const { mode, step, node } = state.procesos;
  const current = threadState(mode, step);
  const last = current.history.at(-1);
  const thread = index => `Hilo ${index === 0 ? 'A' : 'B'}`;
  return `<div class="workbench">${panel('Controles', `
    ${actions(toggle('Sin protección', 'thread-mode', 'libre', mode), toggle('Exclusión mutua', 'thread-mode', 'mutex', mode))}
    ${actions(primary('Reproducir caso', 'thread-run'), button('Paso', 'thread-step', '', { disabled: step === current.total }), reset(), button('Ver traza', 'thread-trace', '', { disabled: !step }))}
  `, 'controls')}${panel('Intercalado · modelo', `

    <div class="thread-map" data-state-visual data-active="${last ? last.thread : ''}">
      ${metric('Copia local A', current.copies[0] ?? '—')}
      <i aria-hidden="true"></i>${metric('Contador compartido', current.counter)}<i aria-hidden="true"></i>
      ${metric('Copia local B', current.copies[1] ?? '—')}
    </div>
    <ol class="execution-strip" aria-label="Operaciones ejecutadas">${Array.from({length:current.total}, (_, i) => {
      const event = current.history[i];
      return `<li class="${event ? 'executed' : ''}"><span>${i + 1}</span><b>${event ? thread(event.thread) : '—'}</b><small>${event?.action ?? 'Pendiente'}</small></li>`;
    }).join('')}</ol>
    ${live(last ? `${thread(last.thread)} · ${last.action} · paso ${step}/${current.total}${current.waiting === null ? '' : `<br><strong>${thread(current.waiting)} en espera</strong>`}${current.owner === null ? '' : ` · candado en ${thread(current.owner)}`}` : 'Inicio · contador 0, copias locales vacías.')}

    `)}${panel('Árbol de procesos · ejemplo', `
    <div class="process-tree">${processTree.map((process, index) => `<button class="tree-node" type="button" style="--depth:${process.depth}" data-action="tree-node" data-value="${index}" aria-pressed="${node === index}"><span aria-hidden="true">${index ? '└' : '▣'}</span> <code>${process.name}</code></button>`).join('')}</div>
    <div class="tree-meta"><span>PID <b>${processTree[node].pid}</b></span><span>PPID <b>${processTree[node].ppid}</b></span></div>
    ${foot(`<p>Informe: 5 sin protección, con distinto orden de impresión. Con candado, 10.</p>${actions(evidenceButton('f66', 'Figuras 66–71'), button('Productor e interbloqueo', 'process-notes'))}`)}
  `)}</div>`;
}

function memoria() {
  const { preset, count, algorithm, step, prediction: guess, compare } = state.memoria;
  const sequence = sequences[preset];
  const current = pageSteps(sequence, count, algorithm)[step - 1];
  const frames = current?.frames ?? Array(count).fill(null);
  const rows = (preset === 'belady' ? [3, 4] : [count]).map(size => `<tr><th scope="row">${size}</th>${Object.keys(algorithms).map(id => `<td>${pageSteps(sequence, size, id).at(-1).faults}</td>`).join('')}</tr>`).join('');
  return `<div class="workbench">${panel('Controles', `
    <div class="fields">${select('Cadena', 'memory-preset', [['guia', 'Guía'], ['belady', 'Bélády']], preset)}
    ${select('Algoritmo', 'memory-algorithm', Object.entries(algorithms), algorithm)}
    ${select('Marcos', 'memory-count', [2, 3, 4, 5].map(n => [n, n]), count)}</div>
    ${actions(primary('Ejecutar completo', 'memory-run', '', step === sequence.length), button('Paso', 'memory-step', '', { disabled: step === sequence.length }), reset())}
  `, 'controls')}${panel('Reemplazo de páginas · modelo', `

    <div class="sequence" aria-label="Cadena de solicitudes">${sequence.map((page, index) => `<span class="${index === step - 1 ? 'current' : index < step - 1 ? 'past' : ''}">${page}</span>`).join('')}</div>
    <div class="frames">${frames.map((page, index) => `<div class="frame ${current?.slot === index ? 'current' : ''}"${current?.slot === index ? ' data-state-visual' : ''}><span>Marco ${index + 1}</span><b>${page ?? '—'}</b></div>`).join('')}</div>
    ${live(current ? `Solicitud ${current.page} · ${current.hit ? 'Acierto' : 'Fallo'} · Expulsada: ${current.evicted ?? '—'} · <strong>${current.faults} fallos</strong>` : 'Marcos vacíos · 0 fallos · 0/12 solicitudes.', current && (current.hit ? 'good' : 'bad'))}

  `)}${panel('Predicción y comparación', `
    ${prediction('Fallos previstos', 'memory-guess', guess)}
    ${guess === '' ? '<p>Registra la predicción antes de revelar los resultados.</p>' : `<p>Predicción registrada: <b>${guess}</b>${step === sequence.length ? ` · Resultado: <b>${current.faults}</b>` : ''}.</p>`}
    ${actions(button(compare ? 'Ocultar comparación' : 'Comparar', 'memory-compare', '', { pressed: compare }))}
    ${compare ? `<table class="compact-table" data-state-visual><caption>Fallos de página</caption><thead><tr><th scope="col">Marcos</th><th scope="col">FIFO</th><th scope="col">LRU</th><th scope="col">Óptimo</th></tr></thead><tbody>${rows}</tbody></table>` : ''}
    ${foot(`<p><code>si</code> trae páginas del intercambio a RAM. <code>so</code> envía páginas al intercambio.</p>${button('Memoria del servidor', 'memory-notes')}`)}
  `)}</div>`;
}

function archivos() {
  const { directory, checked } = state.archivos;
  const original = directory.names['original.txt'];
  const rows = Object.entries(directory.names).map(([name, entry]) => `<div class="file-row"><code>${name}</code><span aria-hidden="true">→</span><b>${entry.kind === 'symbolic' ? entry.target : 'inodo ' + entry.inode}</b></div>`).join('');
  return `<div class="workbench">${panel('Controles', `
    ${actions(button('Crear enlace duro', 'file-link', 'hard', { disabled: !original || !!directory.names['duro.txt'] }), button('Crear enlace simbólico', 'file-link', 'symbolic', { disabled: !original || !!directory.names['simbolico.txt'] }))}
    ${actions(primary('Quitar original', 'file-remove', '', !original), button('Comprobar enlaces', 'file-check', '', { disabled: !directory.names['duro.txt'] || !directory.names['simbolico.txt'] }), button('Ejecutar caso', 'file-run'), reset())}
  `, 'controls')}${panel('Directorio → destino · modelo', `
    <div class="file-map" data-state-visual>${rows || '<p>Directorio vacío.</p>'}</div>
    ${live('Inodo 421 · contenido: <code>Datos del laboratorio</code>')}

    `)}${panel('Apertura de los enlaces', `
    ${checked ? ['duro.txt', 'simbolico.txt'].map(name => {
      const result = readName(directory, name);
      return live(`<code>${name}</code><br><strong>${result.open ? 'Abre · inodo ' + result.inode : result.reason}</strong>${result.open ? '<br>' + result.content : ''}`, result.open ? 'good' : 'bad');
    }).join('') : '<p>Crea los enlaces y comprueba sus destinos. Después, quita el original y repite la comprobación.</p>'}
    ${foot(actions(evidenceButton('t12'), button('Ext4, grupo y ACL', 'file-notes')))}
  `)}</div>`;
}

function dispositivos() {
  const { index, predictions, revealed } = state.dispositivos;
  const device = devices[index];
  const shown = revealed[index];
  return `<div class="practice-grid">${panel('Contadores · medición del informe', `
    <div class="choice-grid">${devices.map((item, i) => toggle(item.label, 'device', i, index)).join('')}</div>
    <p><code>${device.driver}</code> · ${device.context}</p>
    <div class="measurement" data-state-visual>
      <div class="bar-row"><span>Antes</span><i style="--extent:${shown ? device.before / device.after * 100 : 100}%"></i><b>${device.before}</b></div>
      <div class="bar-row"><span>Después</span><i style="--extent:${shown ? 100 : 0}%"></i><b>${shown ? device.after : '—'}</b></div>
      ${metric('Diferencia', shown ? '+' + (device.after - device.before) : '—')}
    </div>
    ${actions(primary('Revelar medición', 'device-reveal', '', shown), reset())}
  `)}${panel('Predicción', `
    ${prediction('¿Cuántas interrupciones más?', 'device-guess', predictions[index])}
    ${predictions[index] === '' ? '<p>Registra tu estimación y compárala con la diferencia observada.</p>' : `<p>Predicción registrada: <b>+${predictions[index]}</b>.</p>`}
    ${foot(actions(evidenceButton('f107'), evidenceButton('t15'), evidenceButton('irq-captura', 'Ver contadores')))}
  `)}</div>`;
}

function seguridad() {
  const { origin, user, credential, result } = state.seguridad;
  const backups = state.respaldo;
  return `<div class="workbench">${panel('Controles', `
    <div class="fields">${select('Origen', 'ssh-origin', [['internal', 'Red interna'], ['external', 'Origen externo']], origin)}
    ${select('Usuario', 'ssh-user', [['authorized', 'Autorizado'], ['root', 'root'], ['unknown', 'Otro usuario']], user)}
    ${select('Credencial', 'ssh-credential', [['key', 'Llave válida'], ['password', 'Contraseña'], ['invalid', 'Llave inválida']], credential)}</div>
    ${actions(primary('Probar acceso SSH', 'ssh-attempt'), reset())}
  `, 'controls')}${panel('Conexión SSH · modelo', `

    ${topology({ detailed: true, origin })}

    ${result ? live(`<b>${result.allowed ? 'Acceso permitido' : 'Acceso rechazado'} · ${result.stage}</b><br>${result.reason}`, result.allowed ? 'good' : 'bad') : live('Registro simulado · pendiente de prueba.')}
  `)}${panel('Tarea programada', `
    <div class="metrics">${metric('Cada', '5 min')}${metric('Ciclos virtuales', backups.cycle)}</div>
    <p>Un clic adelanta un intervalo de la tarea y crea una copia en el modelo.</p>
    ${actions(button('Ejecutar ciclo', 'backup-cycle'))}
    ${backups.log.length ? live(backups.log[0].events.join(' · ')) : ''}
    ${foot(actions(button('Política y evidencia', 'ssh-notes'), evidenceButton('cron', 'Ver tarea')))}
  `)}</div>`;
}

function respaldo() {
  const backups = state.respaldo;
  return `<div class="practice-grid">${panel('Servidor y cliente · modelo', `
    ${topology({ online: backups.online, detailed: true, replicated: backups.online && backups.log[0]?.events.some(event => event.startsWith('Réplica ')) })}
    <div class="metrics">${metric('Locales', backups.local.length)}${metric('Remotas', backups.remote.length)}${metric('Ciclos', backups.cycle)}</div>
    ${actions(primary('Ejecutar ciclo', 'backup-cycle'), button(backups.online ? 'Simular caída' : 'Reconectar cliente', 'backup-toggle'))}
    ${actions(button('Ensayar caída y recuperación', 'backup-run'), reset())}
  `)}${panel('Registro de respaldo · simulado', `
    ${backups.local.length ? `<p>Versiones locales: <code>${backups.local.map(copy => 'v' + copy.id).join(' · ')}</code>. Límite: cinco.</p>` : '<p>Ejecuta el primer ciclo para crear una copia local.</p>'}
    <ol class="backup-log" aria-label="Últimos ciclos">${backups.log.slice(0, 6).map(cycle => `<li><b>v${cycle.id}</b><span>${cycle.events.join(' · ')}</span></li>`).join('')}</ol>
    ${foot(actions(evidenceButton('replica', 'Caída en el informe')))}
  `)}</div>`;
}

function diagnostico() {
  const { incident, blocks, inodes, guess, resolved } = state.diagnostico;
  const statistics = diskMetrics(incident, resolved);
  const meter = (kind, shown) => {
    const isBlocks = kind === 'blocks';
    const { used, total, unit } = statistics[kind];
    const percent = Math.round(used * 100 / total);
    return `<div class="meter ${kind}"><b>${isBlocks ? 'Bloques · Use%' : 'Inodos · IUse%'}</b>
      ${shown ? `<progress max="100" value="${percent}" aria-label="${isBlocks ? 'Uso de bloques' : 'Uso de inodos'}"></progress>
      <div class="meter-ledger"><code>/dev/sdb1 → /datos</code><span>Total <b>${total}${unit}</b></span><span>Ocupados <b>${used}${unit}</b></span><span>Libres <b>${total - used}${unit}</b></span><strong>${percent}%</strong></div>` : '<span class="meter-placeholder">Ejecuta el comando para consultar.</span>'}
    </div>`;
  };
  return `<div class="practice-grid">${panel('Incidentes · modelo', `
    ${actions(toggle('Incidente 1', 'disk-incident', 'blocks', incident), toggle('Incidente 2', 'disk-incident', 'inodes', incident))}
    ${live(resolved ? 'Escritura recuperada en /datos/proyecto' : diskError, resolved ? 'good' : 'bad')}
    ${actions(button('<code>df -h</code>', 'disk-read', 'blocks'), button('<code>df -i</code>', 'disk-read', 'inodes'), primary('Ver ambos medidores', 'disk-read', 'both'))}
    <div class="meter-stack" data-state-visual>${meter('blocks', blocks)}${meter('inodes', inodes)}</div>
  `)}${panel('¿Qué recurso se agotó?', `
    ${actions(toggle('Bloques', 'disk-guess', 'blocks', guess), toggle('Inodos', 'disk-guess', 'inodes', guess))}
    ${guess ? live(guess === incident ? 'Diagnóstico correcto.' : 'Revisa Use% e IUse% y vuelve a elegir.', guess === incident ? 'good' : 'bad') : '<p>Observa el porcentaje de uso de cada recurso e identifica la causa.</p>'}
    ${actions(primary('Aplicar corrección', 'disk-resolve', '', guess !== incident || resolved), reset())}
    ${resolved ? `<p>${incident === 'blocks' ? 'Se liberaron bloques al retirar el registro grande en el modelo.' : 'Se liberaron inodos al retirar el conjunto de archivos pequeños en el modelo.'}</p>` : ''}
    ${foot(actions(evidenceButton('t17', 'Incidentes reales'), button('Más diagnósticos', 'disk-notes')))}
  `)}</div>`;
}

function verificacion() {
  return `<div class="practice-grid">${panel('Comparación · Tabla 20', `
    ${state.verificacion.shown ? `<div class="difference-stack" data-state-visual>
      <div><b>Disco de datos</b><span>Disco raíz de 20 GB → segundo disco ext4 DATOS de 1 GB montado en <code>/datos</code> por UUID.</span></div>
      <div><b>Acceso remoto</b><span>Sin puertos en escucha → SSH en el puerto 22 protegido por el cortafuegos.</span></div>
    </div>` : '<p>Contrasta el montaje de datos y el acceso remoto con la línea base.</p>'}
    ${actions(primary('Revelar diferencias', 'verify-reveal', '', state.verificacion.shown), evidenceButton('t20'), reset())}
  `)}${panel('Verificador · captura original', `
    <button type="button" class="proof-preview" data-action="evidence" data-value="verificador-captura" aria-label="Ampliar captura del verificador"><img loading="lazy" src="./assets/evidencias/verificador.png" alt="Salida original del verificador del servidor"></button>
    <blockquote>${evidence['verificador-captura'][3]}</blockquote>
    <p>La salida está en la página 168. La nota de verificación está en la página 170.</p>
    ${actions(evidenceButton('verificador-captura', 'Abrir captura auténtica'), evidenceButton('f133', 'Abrir página 170'))}
  `)}</div>`;
}

function restauracion() {
  const restore = state.restauracion;
  const copies = state.respaldo.local;
  const selection = copies.some(copy => copy.id === Number(restore.selection)) ? restore.selection : copies.at(-1)?.id;
  return `<div class="practice-grid">${panel('Directorio temporal · modelo', `
    ${copies.length ? `<div class="fields">${select('Versión local', 'restore-selection', [...copies].reverse().map(copy => [copy.id, 'Versión ' + copy.id]), selection)}</div>` : '<p>Aún no hay copias locales. Puedes crear una para continuar aquí.</p>'}
    ${actions(copies.length ? primary('Restaurar copia', 'restore', selection) : primary('Crear copia local', 'backup-cycle'), button('Validar restauración', 'restore-validate', '', { disabled: !restore.restored }), reset())}
    ${restore.restored ? `<p><code>${restore.restored.path}</code></p><table class="compact-table restoration-table" data-state-visual><thead><tr><th>Elemento</th><th>Permiso</th><th>Fecha y hora</th><th>Validación</th></tr></thead><tbody>${restore.restored.entries.map((entry, index) => `<tr><th scope="row"><code>${entry.name}</code>${entry.target ? ' <small>· enlace roto</small>' : ''}</th><td>${entry.mode}</td><td><time>${entry.modified}</time></td><td>${restore.validation ? restore.validation.rows[index].matches ? 'Coincide' : 'Difiere' : '—'}</td></tr>`).join('')}</tbody></table>` : ''}
    ${restore.validation ? live(restore.validation.valid ? 'Validación correcta · 5 elementos y metadatos coinciden.' : 'Hay diferencias con el snapshot de origen.', restore.validation.valid ? 'good' : 'bad') : ''}
  `)}${panel('Evidencia y cierre', `
    <p>La nota del informe documenta la recuperación de los archivos con permisos y marcas de tiempo, incluido el enlace simbólico roto.</p>
    ${actions(evidenceButton('f135'), evidenceButton('restauracion-captura', 'Ver captura de la extracción'), evidenceButton('manual'), evidenceButton('bitacora'))}
    ${actions(primary('Volver a la pregunta inicial', 'close-talk'))}
    ${restore.close ? live(`<strong>${initialQuestion}</strong><br>Comparamos el estado inicial y final, verificamos el acceso y recuperamos una copia.`, 'good') : ''}
  `)}</div>`;
}

export const practiceViews = { sistema, procesos, memoria, archivos, dispositivos, seguridad, respaldo, diagnostico, verificacion, restauracion };

export const practiceActions = {
  command: value => { state.sistema.command = Number(value); },
  'tree-node': value => { state.procesos.node = Number(value); },
  'thread-mode': mode => Object.assign(state.procesos, { mode, step: 0 }),
  'thread-step': () => { state.procesos.step = Math.min(state.procesos.step + 1, threadState(state.procesos.mode, 0).total); },
  'thread-run': () => { state.procesos.step = threadState(state.procesos.mode, 0).total; },
  'memory-preset': preset => Object.assign(state.memoria, { preset, step: 0, prediction: '', compare: false }),
  'memory-count': count => Object.assign(state.memoria, { count: Number(count), step: 0, prediction: '', compare: false }),
  'memory-algorithm': algorithm => Object.assign(state.memoria, { algorithm, step: 0, prediction: '', compare: false }),
  'memory-step': () => { state.memoria.step = Math.min(state.memoria.step + 1, sequences[state.memoria.preset].length); },
  'memory-run': () => { state.memoria.step = sequences[state.memoria.preset].length; },
  'memory-guess': value => { state.memoria.prediction = Number(value); },
  'memory-compare': () => { state.memoria.compare = !state.memoria.compare; },
  'file-link': kind => { addLink(state.archivos.directory, kind); state.archivos.checked = false; },
  'file-remove': () => { delete state.archivos.directory.names['original.txt']; state.archivos.checked = false; },
  'file-check': () => { state.archivos.checked = true; },
  'file-run': () => {
    resetPractice('archivos');
    practiceActions['file-link']('hard');
    practiceActions['file-link']('symbolic');
    practiceActions['file-remove']();
    practiceActions['file-check']();
  },
  device: value => { state.dispositivos.index = Number(value); },
  'device-guess': value => { state.dispositivos.predictions[state.dispositivos.index] = Number(value); },
  'device-reveal': () => { state.dispositivos.revealed[state.dispositivos.index] = true; },
  'ssh-origin': origin => Object.assign(state.seguridad, { origin, result: null }),
  'ssh-user': user => Object.assign(state.seguridad, { user, result: null }),
  'ssh-credential': credential => Object.assign(state.seguridad, { credential, result: null }),
  'ssh-attempt': () => { state.seguridad.result = sshAttempt(state.seguridad); },
  'backup-cycle': () => backupCycle(state.respaldo),
  'backup-toggle': () => { state.respaldo.online = !state.respaldo.online; },
  'backup-run': () => {
    resetPractice('respaldo');
    backupCycle(state.respaldo);
    state.respaldo.online = false;
    backupCycle(state.respaldo);
    state.respaldo.online = true;
    for (let i = 0; i < 4; i++) backupCycle(state.respaldo);
  },
  'disk-incident': incident => { resetPractice('diagnostico'); state.diagnostico.incident = incident; },
  'disk-read': kind => {
    if (kind === 'both' || kind === 'blocks') state.diagnostico.blocks = true;
    if (kind === 'both' || kind === 'inodes') state.diagnostico.inodes = true;
  },
  'disk-guess': guess => { state.diagnostico.guess = guess; },
  'disk-resolve': () => { state.diagnostico.resolved = true; practiceActions['disk-read']('both'); },
  'verify-reveal': () => { state.verificacion.shown = true; },
  'restore-selection': selection => Object.assign(state.restauracion, { selection, restored: null, validation: null }),
  restore: value => {
    const snapshot = state.respaldo.local.find(copy => copy.id === Number(value));
    if (snapshot) Object.assign(state.restauracion, { snapshot, restored: restoreSnapshot(snapshot), validation: null });
  },
  'restore-validate': () => {
    const { snapshot, restored } = state.restauracion;
    if (snapshot && restored) state.restauracion.validation = validateRestoration(snapshot, restored);
  },
  'close-talk': () => { state.restauracion.close = true; },
};

export const drawers = {
  vm: () => ['Prueba manual en tu VM', `<p>En la terminal de tu VM puedes identificar el sistema con los mismos comandos de lectura.</p>
    ${terminal('Comandos opcionales', '<pre>cat /etc/os-release\nuname -r\nfree -m\ndf -h\ndf -i</pre>')}
    ${button('Volver al navegador', 'dialog-close')}`],
  'thread-trace': () => ['Traza del intercalado', `<ol class="trace-list">${threadState(state.procesos.mode, state.procesos.step).history.map(({ thread, action, local, counter }) => `<li>Hilo ${thread === 0 ? 'A' : 'B'} · ${action} · copia ${local ?? '—'} · contador ${counter}</li>`).join('')}</ol>`],
  'process-notes': () => ['Procesos · fichas del informe', `
    ${secondary('Productor-consumidor', 'Se cambió la velocidad relativa de producción y consumo. Los semáforos regulan huecos y elementos disponibles, y el candado protege el búfer. La Tabla 4 registra las esperas.', 't4')}
    ${secondary('Interbloqueo', 'Dos hilos pidieron dos recursos en orden opuesto y se bloquearon. Al pedirlos en el mismo orden, se rompió la espera circular y el programa terminó.', 't6')}`],
  'memory-notes': () => ['Memoria real e intercambio', `
    ${secondary('Línea base', 'La Tabla 7 documenta la memoria observada y la partición /dev/sda5 de 1100 MB. En el estado final se añadió /swapfile de 1024 MB, para un total de 2124 MB.', 't7', 't20')}
    ${secondary('Actividad durante los experimentos', 'En el experimento 2 se reservaron 3154 MB y se midieron 379 MB de intercambio al final. En el experimento 3, con la misma reserva y tendencia 60, se midieron 274 MB al final y actividad en si y so. El total final y el flujo miden fenómenos distintos.', 't8')}
    ${secondary('Políticas de reemplazo', 'En un empate de Óptimo se elige el marco con el menor índice.', 't10', 't11')}`],
  'file-notes': () => ['Disco, grupo y ACL', `
    ${secondary('DATOS · ext4', 'La partición /dev/sdb1 se montó en /datos mediante el UUID 8e23c49a-c774-4a18-9da4-7fc354343bcb.', 'manual', 't20')}
    ${secondary('Permisos en /datos/proyecto', 'El grupo equipo tiene acceso de trabajo al directorio. La ACL da lectura y recorrido al usuario lector, sin permiso de escritura. El bit setgid conserva el grupo en los elementos nuevos.', 't13')}`],
  'ssh-notes': () => ['Política y evidencia del laboratorio', `
    ${secondary('Cortafuegos', 'La política de entrada es denegar por defecto y permitir el acceso SSH autorizado. Si la regla falta, una conexión puede quedar esperando antes de llegar al servicio.', 'seguridad', 't19')}
    ${secondary('Servicio SSH', 'El servicio valida la autenticación una vez aceptado el tráfico. El laboratorio usa llaves y deshabilita la contraseña y el ingreso como superusuario.', 'manual')}`],
  'disk-notes': () => ['Diagnóstico · fichas del informe', `
    ${secondary('Hiperpaginación', 'Identifica qué proceso tiene más memoria residente y revisa las columnas si y so en vmstat 1 para confirmar actividad intensa de intercambio.', 't18', 'guia')}
    ${secondary('Acceso remoto bloqueado', 'Verifica primero conectividad. Si hay respuesta, consulta el estado de SSH y del cortafuegos. El informe identificó una regla ausente con el servicio activo.', 't19', 'guia')}`],
};
