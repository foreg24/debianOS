import { authors, evidence, initialQuestion, sections as labs } from './content.js';
import { blocks as sections, speaker } from './presentation.js';
import { bindConsoles, consoleView } from './console.js';
import { chapters, deliveries } from './chapters.js';
import { button, drawers, evidenceButton, practiceActions, practiceViews, resetPractice } from './practices.js';

const main = document.querySelector('#main');
const rail = document.querySelector('.rail');
const dialog = document.querySelector('#overlay');
const announcement = document.querySelector('#announce');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const scrollPlugin = window.ScrollTrigger;
const gsap = window.gsap;
if (gsap && scrollPlugin) gsap.registerPlugin(scrollPlugin);

let sectionIndex = 0;
let animation = null;
let stateAnimation = null;
let closingFocus = null;
const number = index => String(index + 1).padStart(2, '0');
const pdf = (page = 1) => './assets/informe.pdf#page=' + page;

function opening() {
  return `<section class="opening">
    <div class="hero-copy" data-enter>
      <p class="overline hero-kicker"><span></span> 01 / APERTURA · JUAN CAMILO LAGUNA</p>
      <h1>Debian<br><em>en práctica.</em></h1>
      <p class="hero-description">${initialQuestion}</p>
      <p class="hero-detail">Del primer arranque a la recuperación de datos. Tres entregas siguen la evolución de un servidor Debian y ponen a prueba su operación.</p>
      <div class="actions hero-actions">
        <a class="btn primary" href="#exposicion/sistema"><span aria-hidden="true">▶</span> Iniciar exposición</a>
        <button class="btn" data-action="choose">Elegir práctica</button>
      </div>
    </div>
    <div class="hero-visual" data-enter aria-hidden="true"><div class="debian-glass"><i></i></div></div>
    <nav class="delivery-map" aria-label="Las tres entregas del proyecto">${deliveries.map((delivery, index) => `
      <a href="${index < 2 ? '#laboratorio/' + delivery.section : '#exposicion/sistema'}"><small>Entrega 0${index + 1}</small><strong>${delivery.title} <span aria-hidden="true">↗</span></strong><span>${delivery.detail}</span></a>`).join('')}</nav>
  </section>`;
}

function optionalLab(id) {
  const lab = labs.find(item => item.id === id);
  const { readings } = chapters[id];
  return `<details class="chapter-reading optional-lab" id="laboratorio/${id}">
    <summary>Explorar · ${lab.title} <span aria-hidden="true">+</span></summary>
    <p class="practice-instruction">${lab.intro}</p><div data-practice="${id}">${practiceViews[id]()}</div>
    <div class="reading-grid">${readings.map(([title, body, page]) => `<article><h3>${title}</h3><p>${body}</p><a href="${pdf(page)}" target="_blank" rel="noopener">Informe · pág. ${page} ↗</a></article>`).join('')}</div>
  </details>`;
}

function presentationBlock(s, i) {
  return `<header class="chapter-header"><p class="overline"><span class="accent-dot"></span> Bloque ${number(i)} / ${speaker(i)}</p>
    <h2>${s.title.replace(/(\S+)$/, '<em>$1</em>')}</h2><p class="chapter-lead">${s.lead}</p></header>
    <div class="demo-layout">${s.steps ? consoleView(s) : ''}
      <aside class="demo-reading"><h3>${s.steps ? 'Qué muestra la práctica' : 'Para consultar'}</h3><p>${s.insight}</p>
      <div class="demo-sources">${s.evidence.map(key => evidenceButton(key)).join('')}</div></aside></div>
    ${(s.labs ?? []).map(optionalLab).join('')}`;
}

function enableLogoReflection() {
  const visual = main.querySelector('.hero-visual');
  const plate = visual.querySelector('.debian-glass');
  const hover = window.matchMedia('(any-hover: hover)');
  let frame = 0;
  function reset() {
    cancelAnimationFrame(frame);
    for (const name of ['--tilt-x', '--tilt-y', '--light-x', '--light-y']) plate.style.removeProperty(name);
  }
  visual.addEventListener('pointermove', event => {
    if (motion.matches || !hover.matches || event.pointerType === 'touch') return;
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const bounds = visual.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width));
      const y = Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height));
      plate.style.setProperty('--tilt-x', (20 - 30 * y) + 'deg');
      plate.style.setProperty('--tilt-y', (-25 + 38 * x) + 'deg');
      plate.style.setProperty('--light-x', (x * 100) + '%');
      plate.style.setProperty('--light-y', (y * 100) + '%');
    });
  });
  visual.addEventListener('pointerleave', reset);
  visual.addEventListener('pointercancel', reset);
  window.addEventListener('blur', reset);
  motion.addEventListener('change', reset);
}

function openDialog(title, body) {
  if (!dialog.open) closingFocus = document.activeElement;
  dialog.innerHTML = `<div class="dialog-head"><h2 id="overlay-title">${title}</h2>
    ${button('×<span class="sr-only">Cerrar panel</span>', 'dialog-close', '', { className: 'dialog-x' })}</div>
    <div class="dialog-content">${body}</div>`;
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  dialog.querySelector('button').focus();
}

function openEvidence(key) {
  const [ref, page, title, description, file] = evidence[key];
  openDialog(title, `<p class="overline">${ref} · página ${page} del PDF</p><p>${description}</p>
    ${file ? `<a class="original-image" href="./assets/evidencias/${file}" target="_blank" rel="noopener" aria-label="Ampliar captura en otra pestaña"><img src="./assets/evidencias/${file}" alt="${title}" data-img-fallback></a>` : ''}
    <div class="actions"><a class="btn primary" href="${pdf(page)}" target="_blank" rel="noopener">Abrir página en PDF ↗</a>
    ${file ? `<a class="btn" href="./assets/evidencias/${file}" target="_blank" rel="noopener">Ampliar imagen ↗</a>` : ''}</div>
    ${/^f(6[6-9]|7[01])$/.test(key) ? `<div class="note-resources" aria-label="Otras corridas">${['f66', 'f67', 'f68', 'f69', 'f70', 'f71'].filter(item => item !== key).map(item => evidenceButton(item)).join('')}</div>` : ''}`);
}

function refreshPractice(control) {
  const practice = control.closest('[data-practice]');
  if (!practice) return;
  stateAnimation?.revert();
  const { action, change, value } = control.dataset;
  const selector = change ? `[data-change="${change}"]`
    : action ? `[data-action="${action}"][data-value="${CSS.escape(value ?? '')}"]`
      : control.closest('[data-form]') ? `[data-form="${control.closest('[data-form]').dataset.form}"] button` : '';
  const id = practice.dataset.practice;
  practice.innerHTML = practiceViews[id]();
  if (['seguridad', 'respaldo', 'restauracion'].includes(id)) {
    for (const related of ['seguridad', 'respaldo', 'restauracion']) {
      if (related !== id) main.querySelector('[data-practice="' + related + '"]').innerHTML = practiceViews[related]();
    }
  }
  const equivalent = selector ? practice.querySelector(selector + ':not(:disabled)') : null;
  if (equivalent) equivalent.focus({ preventScroll: true });
  else practice.querySelector('button:not(:disabled), select')?.focus({ preventScroll: true });
  const result = practice.querySelector('.readout') ?? practice.querySelector('[data-state-visual], .metrics');
  announcement.textContent = result?.textContent ?? '';
  if (gsap && !motion.matches && action !== 'reset') {
    stateAnimation = gsap.context(() => {
      const results = practice.querySelectorAll('[data-state-visual]');
      if (results.length) gsap.from(results, {y:4, opacity:.76, duration:.24, clearProps:'transform,opacity'});
      const frame = practice.querySelector('.frame.current b');
      if (frame && ['memory-step', 'memory-run'].includes(action)) {
        gsap.from(frame, {y:-14, scale:.84, duration:.35, ease:'back.out(1.5)', clearProps:'transform'});
      }
      if (['thread-step', 'thread-run'].includes(action)) {
        const latest = [...practice.querySelectorAll('.execution-strip .executed')].at(-1);
        if (latest) gsap.from(latest, {y:7, duration:.32, backgroundColor:'#64263b', clearProps:'transform,backgroundColor'});
      }
      const sendingBackup = id === 'respaldo' && ['backup-cycle', 'backup-run'].includes(action);
      const acceptedSSH = action === 'ssh-attempt' && practice.querySelector('.readout.good');
      if (sendingBackup || acceptedSSH) {
        const wire = practice.querySelector('.network:not(.is-down) .network-link i');
        if (wire) wire.classList.add(acceptedSSH ? 'signal-incoming' : 'signal-outgoing');
      }
    }, practice);
  }
}

function updateProjectState() {
  const active = Boolean(document.fullscreenElement) || document.body.classList.contains('projected');
  document.body.classList.toggle('project-active', active);
  document.querySelector('.project-button').setAttribute('aria-pressed', active);
  document.querySelector('[data-fullscreen-label]').textContent = active ? 'Salir de proyección' : 'Proyectar';
}

async function toggleFullscreen() {
  if (document.fullscreenElement) await document.exitFullscreen();
  else if (document.body.classList.contains('projected')) document.body.classList.remove('projected');
  else {
    try {
      if (!document.documentElement.requestFullscreen) throw new Error('Fullscreen no disponible');
      await document.documentElement.requestFullscreen();
    } catch {
      document.body.classList.add('projected');
    }
  }
  updateProjectState();
}

const shellActions = {
  choose: () => { menu.open = true; links[1].focus({preventScroll:true}); },
  fullscreen: toggleFullscreen,
  'section-sources': () => shellActions['chapter-evidence'](sections[sectionIndex].id),
  evidence: openEvidence,
  'dialog-close': () => dialog.close(),
  'chapter-evidence': id => {
    const section = sections.find(item => item.id === id);
    openDialog(section.label, '<div class="actions">' + section.evidence.map(key => evidenceButton(key, evidence[key][0] + ' · p. ' + evidence[key][1])).join('') + '</div>');
  },
};

document.addEventListener('click', event => {
  const control = event.target.closest('button[data-action]');
  if (!control) {
    if (event.target === dialog) dialog.close();
    return;
  }
  const { action, value } = control.dataset;
  if (shellActions[action]) {
    shellActions[action](value);
    return;
  }
  if (drawers[action]) {
    openDialog(...drawers[action]());
    return;
  }
  if (action === 'reset') {
    const id = control.closest('[data-practice]').dataset.practice;
    resetPractice(id);
    if (id === 'seguridad') resetPractice('respaldo');
    refreshPractice(control);
    return;
  }
  if (practiceActions[action]) {
    practiceActions[action](value);
    refreshPractice(control);
  }
});

document.addEventListener('change', event => {
  const control = event.target;
  const action = control.dataset.change;
  if (!action || !practiceActions[action]) return;
  practiceActions[action](control.value);
  refreshPractice(control);
});

document.addEventListener('submit', event => {
  const action = event.target.dataset.form;
  if (!action || !practiceActions[action]) return;
  event.preventDefault();
  practiceActions[action](new FormData(event.target).get('prediction'));
  refreshPractice(event.submitter ?? event.target.querySelector('button'));
});

document.addEventListener('keydown', event => {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || dialog.open
    || event.target.closest('button, a, input, select, textarea, summary, [contenteditable]')) return;
  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
    event.preventDefault();
    const target = sections[sectionIndex + (event.key === 'ArrowRight' ? 1 : -1)];
    if (target) visit(target.id);
  }
});
document.addEventListener('error', event => {
  const target = event.target;
  if (target instanceof HTMLImageElement && target.hasAttribute('data-img-fallback')) {
    const missing = document.createElement('span');
    missing.className = 'missing-image';
    missing.textContent = 'Imagen no disponible · consulta el PDF.';
    const holder = target.closest('.original-image');
    (holder ?? target).replaceWith(missing);
  }
}, true);
dialog.addEventListener('close', () => {
  if (closingFocus?.isConnected) closingFocus.focus({ preventScroll: true });
  closingFocus = null;
});
document.addEventListener('fullscreenchange', updateProjectState);

const href = id => '#exposicion/' + id;
rail.innerHTML = `<details class="mobile-index"><summary>Secciones</summary></details>
  <div class="rail-content"><p class="rail-title">Recorrido <span>${sections.length} secciones</span></p>
  <nav class="timeline" aria-label="Secciones de exposición">${sections.map((s,i) => `<a href="${href(s.id)}"><span class="timeline-index">${number(i)}</span><span>${s.label}<small>${speaker(i)}</small></span></a>`).join('')}</nav>
  <div class="rail-bottom"><span><span class="local-indicator"></span> Laboratorio local</span></div></div>`;
main.innerHTML = sections.map((s,i) => `<section id="exposicion/${s.id}" tabindex="-1" class="scene ${i ? 'lab-section' : 'is-opening'}">${i ? `
  ${presentationBlock(s,i)}
  <div class="chapter-links"><a class="btn previous" href="${href(sections[i-1].id)}">← ${sections[i-1].label}</a>${button('Evidencias de la práctica ↗','chapter-evidence',s.id)}
  <a class="btn" href="${href(sections[i+1]?.id ?? 'apertura')}">${sections[i+1]?.label ?? 'Volver a la apertura'} →</a></div>${i === sections.length - 1 ? '<p class="credits">' + authors.join(' · ') + '</p>' : ''}` : opening()}</section>`).join('');
const scenes = [...main.querySelectorAll('.scene')];
enableLogoReflection();
bindConsoles(main, sections, motion);
main.querySelectorAll('.chapter-reading').forEach(reading =>
  reading.addEventListener('toggle', () => scrollPlugin?.refresh()));
const menu = rail.querySelector('details');
const links = [...rail.querySelectorAll('.timeline a')];

function visit(id, smooth = true) {
  const target = document.getElementById('exposicion/' + id);
  if (!target) return;
  menu.open = false;
  target.focus({preventScroll: true});
  target.scrollIntoView({behavior: smooth && !motion.matches ? 'smooth' : 'instant'});
}
function visitHash(hash, smooth = true) {
  const [kind, id] = hash.replace(/^#/, '').split('/');
  const legacyLab = kind === 'exposicion' && ['procesos', 'restauracion'].includes(id);
  if (kind === 'laboratorio' || legacyLab) {
    const lab = document.getElementById('laboratorio/' + id);
    if (!lab) return;
    menu.open = false;
    lab.open = true;
    lab.querySelector('summary').focus({preventScroll:true});
    lab.scrollIntoView({behavior:smooth && !motion.matches ? 'smooth' : 'instant'});
  } else if (kind === 'exposicion' || !kind) visit(id || 'apertura', smooth);
}
function markSection() {
  const limit = window.innerHeight * 0.35;
  sectionIndex = Math.max(0, scenes.findLastIndex(scene => scene.getBoundingClientRect().top < limit));
  document.querySelectorAll('.tabs a').forEach((link, index) => {
    const active = index === (sectionIndex ? 1 : 0);
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  links.forEach((link, index) => {
    link.classList.toggle('selected', index === sectionIndex);
    if (index === sectionIndex) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  menu.querySelector('summary').textContent = 'Índice';
}
document.addEventListener('click', event => {
  if (menu.open && !rail.contains(event.target) && !event.target.closest('[data-action="choose"]')) menu.open = false;
  const link = event.target.closest('a[href^="#exposicion/"],a[href^="#laboratorio/"]');
  if (!link || event.ctrlKey || event.metaKey || event.shiftKey) return;
  event.preventDefault();
  if (location.hash !== link.hash) history.pushState(null, '', link.hash);
  visitHash(link.hash);
});
let scrollPending = false;
window.addEventListener('scroll', () => {
  if (scrollPending) return;
  scrollPending = true;
  requestAnimationFrame(() => { markSection(); scrollPending = false; });
}, {passive:true});
function animateSections() {
  animation?.revert();
  stateAnimation?.revert();
  if (motion.matches || !gsap) return;
  animation = gsap.context(() => {
    gsap.from('.opening > *', {y:12, opacity:0.65, duration:.30, stagger:.04, clearProps:'transform,opacity'});
    if (scrollPlugin) for (const scene of scenes.slice(1)) {
      gsap.from(scene.querySelectorAll('.chapter-header,.panel'), {y:12, opacity:.72, duration:.28, stagger:.035,
        clearProps:'transform,opacity', scrollTrigger:{trigger:scene, start:'top 88%', once:true}});
    }
  }, main);
}
motion.addEventListener('change', animateSections);
window.addEventListener('hashchange', () => visitHash(location.hash));
animateSections();
if (location.hash) visitHash(location.hash, false);
markSection();
