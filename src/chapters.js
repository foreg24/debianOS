export const deliveries = [
  { section: 'sistema', title: 'Instalar e identificar', detail: 'Una máquina virtual y una línea base para comparar.' },
  { section: 'procesos', title: 'Observar y coordinar', detail: 'Del árbol de procesos al trabajo entre hilos.' },
  { section: 'sistema', title: 'Operar y recuperar', detail: 'Dos máquinas, once demostraciones y una restauración comprobada.' },
];

// Each reading points to the physical PDF page used by the evidence viewer.
export const chapters = {
  sistema: {
    delivery: 1,
    lead: 'Antes de cambiar un servidor necesitamos saber qué recibimos. La primera entrega dejó una instalación reproducible de Debian y registró su estado inicial. Al final volveremos a medirla para ver qué cambió.',
    readings: [
      ['Instalar el sistema', 'VirtualBox se ejecutó sobre Windows. La máquina virtual arrancó desde la imagen ISO de Debian para amd64. El instalador preparó la raíz y el área de intercambio, instaló el escritorio GNOME y configuró GRUB para el siguiente arranque.', 26],
      ['Construir la línea base', 'El informe reunió catorce comandos para identificar el sistema, la CPU, la memoria, el disco y los dispositivos. Aquí empezamos por dos medidas que pueden cambiar por separado: el nombre de la distribución y la versión del núcleo cargado.', 48],
    ],
  },
  procesos: {
    delivery: 2,
    lead: 'Con Debian en marcha, la segunda entrega estudió quién usa los recursos y qué pasa cuando dos tareas coinciden. El contador permite seguir una pérdida de actualización desde la lectura hasta la escritura.',
    readings: [
      ['Observar un proceso', 'El PID identifica un proceso y el PPID lo vincula con su padre. El árbol de pstree muestra esa relación. top y htop permiten seguir CPU y memoria, mientras /proc/1/status registra el estado y los hilos del proceso 1. También se ensayaron señales de terminación y ajustes de prioridad con nice y renice.', 65],
      ['Proteger el contador', 'Dos hilos pueden leer el mismo valor y escribir el mismo incremento. En las tres corridas sin exclusión mutua del informe, el contador terminó en 5. Con el candado llegó a 10. La práctica de esta página permite recorrer un ejemplo más pequeño paso a paso.', 79],
      ['Coordinar la espera', 'Con un búfer de cinco posiciones, el productor pudo adelantarse al consumidor. Con una sola, tuvo que esperar a que quedara libre. En otro ensayo, dos hilos retuvieron por separado la impresora y el escáner. Pedir ambos recursos en el mismo orden rompió la espera circular.', 84],
    ],
  },
  memoria: {
    delivery: 3,
    lead: 'La tercera entrega convirtió el laboratorio en un servidor y un cliente. Empezó por medir qué ocurre bajo presión de memoria. El simulador aísla una decisión de ese problema: qué página desalojar cuando todos los marcos están ocupados.',
    readings: [
      ['El laboratorio de dos máquinas', 'El servidor recibió 4096 MB de RAM y el cliente 1024 MB. La red interna redso los conectó con direcciones fijas 192.168.100.10 y 192.168.100.11. Un segundo adaptador NAT daba salida a Internet. Así se pudo interrumpir el cliente y observar qué seguía funcionando en el servidor.', 100],
      ['Medir presión real', 'Al reservar 3154 MB, el segundo experimento terminó con 379 MB en intercambio. Esa cifra describe ocupación. Para saber si las páginas seguían moviéndose, el equipo leyó si y so en vmstat. En la configuración final, la partición y el archivo de intercambio sumaron 2124 MB.', 115],
      ['Interpretar los fallos', 'En la cadena de Bélády del informe, pasar de tres a cuatro marcos elevó los fallos de FIFO de 9 a 10. LRU bajó de 10 a 8. FIFO reemplaza por orden de llegada y LRU por antigüedad del último uso. Óptimo usa los accesos futuros como referencia para la comparación.', 124],
    ],
  },
  archivos: {
    delivery: 3,
    lead: 'El servidor necesitaba un lugar estable para los datos del proyecto. Después de montar el volumen y repartir permisos, el equipo comprobó qué se conserva al retirar un nombre. Esa distinción volverá a aparecer en la restauración.',
    readings: [
      ['Preparar el volumen', 'La segunda unidad se particionó y se formateó como ext4 con la etiqueta DATOS. El montaje persistente en /datos usa el UUID para reconocer el sistema de archivos tras reiniciar. En /datos/proyecto, el bit setgid hace que los elementos nuevos hereden el grupo equipo.', 126],
      ['Seguir la referencia', 'Un enlace duro da otro nombre al mismo inodo. Al retirar el nombre original, el contenido siguió accesible por el segundo. El enlace simbólico guardaba una ruta y quedó roto al desaparecer su destino. Por separado, una ACL dio al usuario lector permiso para leer y recorrer el directorio.', 131],
    ],
  },
  dispositivos: {
    delivery: 3,
    lead: 'El disco, el teclado y la tarjeta de red llegan a Debian a través de controladores. Para relacionar una acción física con el trabajo del núcleo, el equipo tomó dos lecturas de interrupciones y calculó la diferencia.',
    readings: [
      ['Identificar el dispositivo', 'El disco aparece como dispositivo de bloques y el teclado entrega un flujo de entrada. El inventario relacionó dispositivos, módulos y controladores, incluido e1000 para la interfaz de red. Más adelante ese inventario se transfirió entre las dos máquinas.', 137],
      ['Interpretar la diferencia', 'Durante la prueba de teclado, el contador i8042 pasó de 2085 a 2543, un aumento de 458. Una interrupción avisa al núcleo de un evento. Con sondeo, el sistema consulta repetidamente si hay trabajo pendiente. El contador registra avisos atendidos y una pulsación puede generar varios.', 141],
    ],
  },
  seguridad: {
    delivery: 3,
    lead: 'Para administrar el servidor desde el cliente tuvieron que coincidir tres condiciones: una ruta de red, una regla que dejara pasar el tráfico y una identidad aceptada por SSH. Cada una deja una evidencia distinta.',
    readings: [
      ['Seguir una conexión', 'El cortafuegos UFW denegaba por defecto las conexiones entrantes y tenía una regla para SSH. Una vez alcanzado el servicio, SSH exigía una llave autorizada. Se deshabilitaron el ingreso con contraseña y el acceso directo como root.', 144],
      ['Leer el registro', 'El mensaje de sshd que anuncia la escucha en el puerto 22 confirma que el servicio abrió ese puerto. Para verificar quién logró entrar hay que revisar también los eventos de autenticación. El proyecto aprovechó ese canal para consultas remotas y transferencias de archivos.', 146],
    ],
  },
  respaldo: {
    delivery: 3,
    lead: 'Con el acceso remoto listo, el servidor pudo guardar una copia local y enviarla al cliente. Apagar el cliente separó las dos operaciones y dejó ver qué protección seguía disponible durante la caída.',
    readings: [
      ['Automatizar la copia', 'cron ejecutaba el respaldo cada cinco minutos. El servidor conservaba las cinco versiones locales más recientes y usaba la conexión por llave para replicar. En la práctica, cada clic representa una ejecución de la tarea.', 148],
      ['Leer una falla parcial', 'Con el cliente apagado, el servidor siguió creando versiones locales y el registro acumuló seis errores de réplica. Al reconectar el cliente, la siguiente ejecución programada volvió a transferir una copia. El cliente almacenaba respaldos, mientras el servicio seguía a cargo del servidor.', 157],
    ],
  },
  diagnostico: {
    delivery: 3,
    lead: 'El equipo investigó cuatro incidentes. Los dos de almacenamiento comparten un síntoma, pero exigen decisiones diferentes. En los otros dos, las mediciones de memoria y red ayudaron a localizar la falla.',
    readings: [
      ['Disco lleno o inodos agotados', 'Un registro de 973 MB consumió los bloques del volumen. En el otro incidente quedaban 920 MB, pero los 65 536 inodos estaban ocupados. df -h muestra capacidad y df -i cuenta inodos. Si faltan inodos, hasta un archivo vacío puede fallar al crearse.', 161],
      ['Lentitud y acceso remoto', 'Ante la lentitud, el uso de memoria residente ayudó a identificar el proceso y vmstat permitió comprobar el intercambio. En la falla de SSH, el servidor respondía al ping y el servicio escuchaba. Revisar el cortafuegos reveló la regla ausente.', 166],
    ],
  },
  verificacion: {
    delivery: 3,
    lead: 'La línea base de la primera entrega vuelve a tener sentido aquí. La comparación muestra qué cambió en el servidor y el verificador contrasta la configuración final con lo que el equipo esperaba encontrar.',
    readings: [
      ['Comparar estados', 'El equipo volvió a examinar memoria de intercambio, almacenamiento y servicios. El volumen ext4 montado en /datos y el acceso remoto configurado son cambios que pueden rastrearse hasta las prácticas anteriores.', 171],
      ['Interpretar el resultado', 'La ejecución documentada terminó con 20 de 20 comprobaciones correctas. El resultado corresponde a los controles incluidos en ese verificador. Quedaba una pregunta operativa que exigía una prueba distinta: ¿podíamos recuperar los datos guardados?', 168],
    ],
  },
  restauracion: {
    delivery: 3,
    lead: 'La última prueba consistió en extraer una copia en un directorio temporal y examinar lo recuperado. Así se cierra el recorrido: instalamos el sistema, aprendimos a observarlo y reunimos evidencia de que sus datos se podían restaurar.',
    readings: [
      ['Examinar lo recuperado', 'El directorio temporal permitió inspeccionar la extracción sin sobrescribir el proyecto. Además de los nombres y permisos, se revisaron los enlaces. Recuperar un enlace simbólico roto conserva la ruta guardada en la copia, aunque su destino siga ausente.', 170],
      ['Dejar el servidor operable', 'El manual reúne direcciones, almacenamiento, acceso remoto y respaldo para quien continúe la operación. La bitácora agrupa los comandos por función y permite reconstruir las verificaciones de las tres entregas.', 174],
    ],
  },
};
