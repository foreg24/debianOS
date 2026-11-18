const escapeHTML = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const path = '~/entrega3';

function prompt(host) {
  return '<span class="shell-user">jesusylaguna@' + host + '</span>:<span class="shell-path">' + path + '</span>$ ';
}

export function consoleView(block) {
  const firstHost = block.steps[0][2] ?? 'servidor';
  return `<section class="debian-terminal" aria-label="Consola de ${block.label}" data-console="${block.id}">
    <div class="debian-titlebar"><img src="./assets/debian.png" alt=""><span>Terminal · <b data-shell-title>jesusylaguna@${firstHost}: ${path}</b></span></div>
    <div class="shell-screen" tabindex="0" aria-label="Historial de la demostración"><div class="shell-history"></div><div class="shell-prompt">${prompt(firstHost)}<i aria-hidden="true"></i></div></div>
    <div class="shell-toolbar"><button type="button" class="btn primary" data-play>▶ Ejecutar demo</button><small data-shell-status role="status">Reproducción del informe · lista</small></div>
  </section>`;
}

export function bindConsoles(main, blocks, motion) {
  const data = new Map(blocks.map(block => [block.id, block]));
  main.querySelectorAll('[data-console]').forEach(shell => {
    const steps = data.get(shell.dataset.console).steps;
    const screen = shell.querySelector('.shell-screen');
    const history = shell.querySelector('.shell-history');
    const cursor = shell.querySelector('.shell-prompt');
    const title = shell.querySelector('[data-shell-title]');
    const play = shell.querySelector('[data-play]');
    const status = shell.querySelector('[data-shell-status]');
    let timer = null;
    let index = 0;

    function append() {
      const [command, output, host = 'servidor'] = steps[index++];
      const row = document.createElement('div');
      row.className = 'shell-entry';
      row.innerHTML = '<div>' + prompt(host) + escapeHTML(command) + '</div>';
      if (output) {
        const result = document.createElement('pre');
        result.textContent = output;
        row.append(result);
      }
      history.append(row);
      cursor.innerHTML = prompt(host) + '<i aria-hidden="true"></i>';
      title.textContent = 'jesusylaguna@' + host + ': ' + path;
    }
    function finish() {
      clearTimeout(timer);
      timer = null;
      const follow = screen.scrollHeight - screen.clientHeight - screen.scrollTop < 12;
      while (index < steps.length) append();
      if (follow) screen.scrollTop = screen.scrollHeight;
      play.textContent = '↻ Repetir demo';
      status.textContent = 'Reproducción completa · ' + steps.length + ' pasos';
    }
    function advance() {
      const follow = screen.scrollHeight - screen.clientHeight - screen.scrollTop < 12;
      append();
      if (follow) screen.scrollTop = screen.scrollHeight;
      if (index === steps.length || motion.matches) finish();
      else timer = setTimeout(advance, 680);
    }
    play.addEventListener('click', () => {
      if (timer !== null) return finish();
      history.replaceChildren();
      index = 0;
      screen.scrollTop = 0;
      play.textContent = 'Ver resultado completo';
      status.textContent = 'Reproduciendo la práctica…';
      if (motion.matches) finish();
      else advance();
    });
  });
}

