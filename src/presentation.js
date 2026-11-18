import { pageSteps, sequences } from './model.js';

export const speaker = index => index === 0 || index % 2 === 1 ? 'Juan Camilo Laguna' : 'Jesús Forero';

function comparison(preset, frames) {
  const totals = ['fifo', 'lru', 'optimo'].map(policy => pageSteps(sequences[preset], frames, policy).at(-1).faults);
  return frames + ' marcos     ' + totals.join('        ');
}

// Each step contains the displayed command, a selected output or reported observation,
// and, when needed, the host on which the documented operation took place.
export const blocks = [
  { id: 'apertura', label: 'Apertura', evidence: ['virtualbox', 'manual'] },
  {
    id: 'sistema', label: 'Preparación de las máquinas', title: 'Dos máquinas en redso',
    lead: 'La instalación de Debian 13 y el estudio de procesos de las primeras entregas fueron el punto de partida. Clonamos la máquina y registramos el estado inicial para poder demostrar qué cambió al convertirla en servidor.',
    insight: 'El servidor recibió 4096 MB de RAM y el cliente 1024 MB. Los nombres se resolvían con /etc/hosts. Un primer intento apuntó a 192.168.108.10, fuera de la subred configurada. Corregir el tercer octeto permitió comprobar la comunicación.',
    evidence: ['base', 'virtualbox', 'ping'], labs: ['sistema','procesos'],
    steps: [
      ['bash linea_base.sh', 'Estado inicial guardado en linea_base_antes.txt.'],
      ['wc -l linea_base_antes.txt', '48 linea_base_antes.txt'],
      ['ip -br addr show enp0s8', 'enp0s8    UP    192.168.100.10/24'],
      ['ip -br addr show enp0s8', 'enp0s8    UP    192.168.100.11/24', 'cliente'],
      ['ping -c 4 servidor', 'Servidor 192.168.100.10 · tiempos menores de 2,4 ms · pérdida de paquetes 0 %.', 'cliente'],
    ],
  },
  {
    id: 'memoria-teoria', label: 'Memoria por demanda', title: 'Reservar y ocupar memoria',
    lead: 'Linux puede reservar espacio de direcciones antes de asignar marcos físicos. La diferencia se ve al comparar la memoria virtual de un proceso con la parte que realmente reside en RAM.',
    insight: 'Un fallo menor puede resolverse con una página ya en memoria o una nueva página de ceros. Un fallo mayor necesita una lectura desde almacenamiento. Por eso el tamaño virtual por sí solo dice poco sobre la presión real.',
    evidence: ['t7'],
    steps: [['ps -eo pid,comm,vsz,rss --sort=-rss | head', 'Proceso        VSZ (kB)     RSS (kB)\ngnome-shell     3900808       332728']],
  },
  {
    id: 'memoria-practica', label: 'Experimentos de memoria', title: 'Medir la presión de memoria',
    lead: 'Medimos la RAM disponible antes de añadir intercambio. Después variamos la reserva de memoria y la tendencia a usar swap. La ocupación final y el movimiento de páginas cuentan partes distintas del experimento.',
    insight: 'Con la misma reserva de 3154 MB, el tercer ensayo terminó con menos swap ocupado, pero pasó de 1 a 22 fallos mayores y registró entradas y salidas. Hay que leer el saldo final junto con la actividad de vmstat.',
    evidence: ['t7','t8','t20'],
    steps: [
      ['free -m', 'Memoria total: 3921 MB     Disponible: 2866 MB'],
      ['swapon --show', '/dev/sda5    partición    ≈1101 MB    prioridad -2'],
      ['sudo fallocate -l 1G /swapfile && sudo chmod 600 /swapfile', ''],
      ['sudo mkswap /swapfile && sudo swapon /swapfile', ''],
      ['swapon --show', '/dev/sda5    partición    prioridad -2\n/swapfile    archivo      1024 MiB    prioridad -3\nIntercambio total registrado: 2124 MB'],
      ['sysctl vm.swappiness', 'vm.swappiness = 60'],
      ['sudo sysctl vm.swappiness=10', 'vm.swappiness = 10'],
      ['vmstat 1', 'Tabla 8 · tres ejecuciones\nReserva     Swap final    Fallos mayores    Actividad\n1427 MB          0 MB            34         si/so en cero\n3154 MB        379 MB             1         pico de so: 105488\n3154 MB        274 MB            22         si y so activos (tendencia 60)'],
    ],
  },
  {
    id: 'memoria', label: 'Reemplazo y Bélády', title: 'Qué página sale primero',
    lead: 'Con todos los marcos ocupados, cada política debe elegir qué página reemplazar. Reproducimos los cálculos del informe sobre las mismas cadenas para contrastar el resultado manual.',
    insight: 'FIFO expulsó páginas por orden de llegada. En la segunda cadena pasó de 9 a 10 fallos al añadir un marco. LRU y Óptimo conservaron la propiedad de pila y redujeron los fallos.',
    evidence: ['t10','t11'], labs: ['memoria'],
    steps: [
      ['# Cadena de la guía · ' + sequences.guia.join(' '), '             FIFO     LRU      Óptimo\n' + comparison('guia', 3)],
      ['# Cadena de Bélády · ' + sequences.belady.join(' '), '             FIFO     LRU      Óptimo\n' + comparison('belady', 3) + '\n' + comparison('belady', 4)],
    ],
  },
  {
    id: 'archivos', label: 'Sistema de archivos', title: 'Del disco a los permisos',
    lead: 'Preparamos un segundo disco para /datos. En él comprobamos cómo se conserva un archivo al retirar su nombre y cómo compartir la carpeta del proyecto con permisos distintos para el grupo y para lector.',
    insight: 'El montaje por UUID sobrevivió al reinicio. Un enlace duro conservó el contenido del inodo 14 tras borrar el nombre original. El bit setgid mantuvo el grupo equipo para los archivos nuevos y la ACL dio lectura y recorrido a lector.',
    evidence: ['volumen','t12','t13'], labs: ['archivos'],
    steps: [
      ['lsblk', 'sdb    1G    disk    (sin particiones)'],
      ['sudo fdisk /dev/sdb', 'Partición creada: /dev/sdb1'],
      ['sudo mkfs.ext4 -L DATOS /dev/sdb1', 'ext4 · 261888 bloques de 4 kB · 65536 inodos'],
      ['sudo blkid /dev/sdb1', 'UUID="8e23c49a-c774-4a18-9da4-7fc354343bcb"  LABEL="DATOS"  TYPE="ext4"'],
      ['sudo mount -a && df -h /datos', 'Tras corregir la entrada de fstab: /dev/sdb1 montado en /datos · tamaño 989M'],
      ['ln original.txt duro.txt && ln -s original.txt simbolico.txt && ls -li', 'Inodo 14   2 enlaces   original.txt, duro.txt\nInodo 15   1 enlace    simbolico.txt -> original.txt'],
      ['rm original.txt && cat duro.txt', 'Se pudo leer el contenido original.'],
      ['cat simbolico.txt', 'No existe el fichero o el directorio.'],
      ['sudo chmod 2770 /datos/proyecto && ls -ld /datos/proyecto', 'drwxrws---    root equipo    /datos/proyecto'],
      ['sudo setfacl -m u:lector:r-x /datos/proyecto && getfacl /datos/proyecto', 'user:lector:r-x'],
    ],
  },
  {
    id: 'dispositivos', label: 'Dispositivos e interrupciones', title: 'Del hardware al núcleo',
    lead: 'Identificamos dispositivos de bloques y de caracteres, localizamos el controlador de red y comparamos los contadores de interrupciones antes y después de generar actividad.',
    insight: 'El controlador e1000 comunica el núcleo con la tarjeta que emula VirtualBox. Las diferencias de los contadores permiten asociar la actividad de teclado, disco y red con el trabajo que atendió el núcleo.',
    evidence: ['driver','t15','irq-captura'], labs: ['dispositivos'],
    steps: [
      ['ls -l /dev/sda /dev/sdb', 'brw-rw----    /dev/sda\nbrw-rw----    /dev/sdb'],
      ['ls -l /dev/null /dev/random /dev/tty1', 'Tipo c · dispositivos de caracteres: null, random y tty1'],
      ['lspci | grep -i ethernet', 'Intel Corporation 82540EM Gigabit Ethernet Controller'],
      ['modinfo e1000', 'description: Intel(R) PRO/1000 Network Driver\nlicense:     GPL v2'],
      ['cat /proc/interrupts', 'Dos lecturas     Antes     Después     Aumento\ni8042             2085        2543        +458\nata_piix           714         830        +116\nenp0s8             347         438         +91'],
    ],
  },
  {
    id: 'seguridad', label: 'Seguridad y respaldos', title: 'Proteger y respaldar el servidor',
    lead: 'Abrimos SSH en el cortafuegos antes de activarlo y validamos la configuración del servicio. Los registros y la tarea programada permitieron comprobar qué estaba funcionando.',
    insight: 'El registro de sshd acredita que el servicio escucha en el puerto 22. La tarea de cron creaba un comprimido cada cinco minutos y conservaba las cinco versiones locales más recientes.',
    evidence: ['seguridad','registro','cron'], labs: ['seguridad'],
    steps: [
      ['sudo ufw default deny incoming && sudo ufw default allow outgoing', ''],
      ['sudo ufw allow 22 && sudo ufw enable && sudo ufw status verbose', 'Estado: activo\nEntrante: denegar   Saliente: permitir\n22   ALLOW IN'],
      ['sudo sshd -t && sudo sshd -T | grep -i permitroot', 'permitrootlogin no'],
      ['journalctl -u ssh', 'sshd[3524]: Server listening on 0.0.0.0 port 22.'],
      ['last', 'Se consultó el historial de sesiones de la máquina.'],
      ['crontab -l', '*/5 * * * * /home/jesusylaguna/respaldo.sh'],
      ['ls /datos/respaldos', 'errores.log\nproyecto_20261118_010501.tar.gz\nproyecto_20261118_011001.tar.gz\nproyecto_20261118_011501.tar.gz\nproyecto_20261118_011515.tar.gz\nproyecto_20261118_011604.tar.gz'],
    ],
  },
  {
    id: 'respaldo', label: 'Sistema distribuido', title: 'Qué pasa si cae el cliente',
    lead: 'Las dos máquinas intercambiaron llaves para la administración remota y la réplica. Apagar el cliente permitió distinguir el trabajo local del que dependía de tener disponible el segundo nodo.',
    insight: 'El acceso inverso requirió instalar el servicio SSH en el cliente. Durante la caída continuaron las copias locales y se registraron seis fallos de réplica. La siguiente ejecución programada volvió a transferir el respaldo al cliente.',
    evidence: ['llaves','replica','caida'], labs: ['respaldo'],
    steps: [
      ['ssh-keygen -t ed25519 && ssh-copy-id servidor', 'Llave pública instalada en servidor.', 'cliente'],
      ['ssh-keygen -t ed25519 && ssh-copy-id cliente', 'Tras habilitar SSH en cliente, la llave quedó instalada en el sentido inverso.'],
      ['ssh servidor hostname', 'servidor', 'cliente'],
      ["ssh -t servidor 'sudo ufw status'", 'Estado: activo\n22   ALLOW IN', 'cliente'],
      ['cat /datos/respaldos/errores.log', ['00:44:31','00:50:01','00:55:01','01:00:01','01:05:01','01:16:09'].map(time => '2026-11-18 ' + time + ' ERROR: no se pudo copiar a cliente').join('\n')],
      ['wc -l /datos/respaldos/errores.log', '6 /datos/respaldos/errores.log'],
    ],
  },
  {
    id: 'diagnostico', label: 'Incidentes 1 y 2', title: 'Un error, dos causas',
    lead: 'En ambos incidentes falló la creación de un archivo. Comparamos los bloques con los inodos para averiguar qué recurso había llegado a su límite.',
    insight: 'En el primer incidente se liberó espacio al retirar el registro desmesurado. En el segundo había 920 MB libres y faltaban inodos. La acumulación de 65 510 archivos vacíos explica cómo pueden coexistir ambas medidas.',
    evidence: ['t17'], labs: ['diagnostico'],
    steps: [
      ['df -h /datos  # Incidente 1', '/dev/sdb1    989M    973M    0    100%    /datos'],
      ['df -i /datos', 'Inodos utilizados: 1 %'],
      ['sudo du -sh /datos/* | sort -h', '973M    /datos/incidente'],
      ['df -h /datos  # Incidente 2', '/dev/sdb1    989M    1,7M    920M    1%    /datos'],
      ['df -i /datos', '/dev/sdb1    65536    65536    0    100%    /datos'],
    ],
  },
  {
    id: 'incidentes-red', label: 'Incidentes 3 y 4', title: 'Memoria lenta y SSH en espera',
    lead: 'Para la lentitud medimos memoria residente e intercambio. Para la conexión SSH seguimos el recorrido desde el cliente hasta el servicio y el cortafuegos del servidor.',
    insight: 'El PID 6422 concentraba la memoria residente. En el incidente remoto, el ping respondía y SSH escuchaba, pero faltaba la regla de entrada al puerto 22. La evidencia encaminó cada diagnóstico hacia una corrección distinta.',
    evidence: ['t18','t19'],
    steps: [
      ['ps -eo pid,comm,rss --sort=-rss | head', 'PID     COMMAND     RSS (kB)\n6422    python3      2676948'],
      ['vmstat 1', 'si y so activos · intercambio de 268 a 693456 kB'],
      ['kill 6422 && free -m', 'Después de terminar el proceso: 2667 MB disponibles.'],
      ['ping -c 4 servidor', 'El servidor respondió.', 'cliente'],
      ['sudo systemctl status ssh', 'active (running) · escuchando en el puerto 22'],
      ['sudo ufw status', 'Estado: activo · sin regla para el puerto 22'],
      ['sudo ufw allow 22', 'Regla añadida.'],
      ['ssh servidor hostname', 'servidor', 'cliente'],
    ],
  },
  {
    id: 'verificacion', label: 'Verificación y restauración', title: 'Comprobar y recuperar',
    lead: 'Volvimos a medir el sistema, ejecutamos el verificador de la docente y extrajimos el respaldo en un directorio temporal para inspeccionarlo sin sobrescribir la carpeta de trabajo.',
    insight: 'La captura del verificador registra 20 de 20 comprobaciones correctas. La extracción muestra cinco archivos regulares y, además, el enlace simbólico roto. Conservar su destino también forma parte de restaurar el estado original.',
    evidence: ['verificador-captura','t20','restauracion-captura','f135'], labs: ['verificacion','restauracion'],
    steps: [
      ['sudo ./verificar_servidor.sh', 'RESULTADO: 20 de 20 comprobaciones correctas'],
      ['# Comparación con la línea base · Tabla 20', '/swapfile activo · /datos montado por UUID · SSH en el puerto 22\nUsuario lector · grupo equipo · interfaz enp0s8'],
      ['mkdir -p /tmp/prueba && tar xzf "$(ls -1t /datos/respaldos/*.tar.gz | head -1)" -C /tmp/prueba', ''],
      ['ls -lR /tmp/prueba', '/tmp/prueba/proyecto:\n-rw-rw-r--    19 nov 18 00:09 duro.txt\n-rw-rw-r--  3650 nov 18 00:38 inventario_dispositivos.txt\n-rw-rw-r--     0 nov 18 00:25 mi_archivo.txt\n-rw-rw-r--     0 nov 18 01:23 prueba2.txt\n-rw-rw-r--     0 nov 18 01:20 prueba.txt\nlrwxrwxrwx    12 nov 18 00:09 simbolico.txt -> original.txt'],
    ],
  },
  {
    id: 'cierre', label: 'Cierre y preguntas', title: 'Preguntas del grupo',
    lead: '¿Qué medición permitió distinguir las dos fallas de almacenamiento? ¿Qué operación siguió disponible al apagar el cliente? ¿Qué se recuperó al extraer la última copia?',
    insight: 'El manual reúne la topología, las tareas programadas y los pasos de restauración. La bitácora permite volver al comando que respalda cada conclusión.',
    evidence: ['manual','bitacora'],
  },
];

