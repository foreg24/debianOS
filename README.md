# Debian en práctica

Exposición interactiva del proyecto integrador de Sistemas Operativos de Jesús David Forero Sánchez y Juan Camilo Laguna Muñoz. La página estática funciona en Vercel y en un servidor local.

## Desplegar en Vercel

Importa el repositorio `foreg24/debianOS`, selecciona la rama `main`, conserva el directorio raíz del repositorio y pulsa **Deploy**. La configuración de `vercel.json` instala las dependencias con `npm ci`, compila con `npm run build` y publica `dist/`. Todo el contenido y las evidencias se sirven desde el propio sitio.

## Arranque en Windows

Desde esta carpeta, con Node.js 22 o superior:

```powershell
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Abre [127.0.0.1:4173](http://127.0.0.1:4173/). En macOS o Linux usa `npm` en lugar de `npm.cmd`. Para cambiar el puerto en PowerShell, establece `$env:PORT` antes de arrancar. La instalación inicial descarga GSAP. Después de compilar, el servidor usa solo `dist/` y funciona con internet desconectado. Conserva la carpeta `dist/` y `scripts/serve.js` si vas a presentar desde otra máquina con Node.js.

## Recorrido del laboratorio

La exposición tiene 13 bloques. Laguna presenta 1, 2, 4, 6, 8, 10 y 12. Forero presenta 3, 5, 7, 9, 11 y 13. Los bloques 2 a 12 tienen una terminal de Debian que reproduce comandos y resultados seleccionados del informe. **Ejecutar demo** inicia la secuencia y permite saltar al resultado o repetirla. Las sesiones se representan en el navegador.

Desplázate por la página o elige un bloque en el índice. Las flechas izquierda y derecha cambian de sección cuando el foco está fuera de los controles. Las actividades de exploración están debajo de las consolas correspondientes. **Proyectar** activa la pantalla completa.

## Capturas y referencias

Las Figuras 41–42 y 66–71 incluyen las capturas de identificación y concurrencia. El PDF contiene varios desajustes entre las capturas y los pies de figura. La captura auténtica de interrupciones está en la p. 143, la del verificador en la p. 168 y la de extracción del respaldo en la p. 170. La nota de restauración está en la p. 173. Se puede abrir tanto la página de la nota como la captura correspondiente. La nota y la Tabla 20 (p. 171) documentan el antes y el después. Para añadir una captura del comparador se necesitaría la salida original de la comparación.

La captura de extracción lista cinco archivos regulares y un enlace. La nota habla de cinco archivos e incluye el enlace en su descripción. El navegador usa cinco elementos simulados, uno de ellos un enlace roto.

## Pruebas y edición

Ejecuta `npm.cmd test`. Las pruebas cubren los resultados de memoria, concurrencia, enlaces, dispositivos, autenticación, caída y rotación de respaldos, restauración, diagnósticos, reinicio y referencias.

El recorrido, el reparto y las secuencias de demostración están en `src/presentation.js`. Las fuentes están en `src/content.js` y los simuladores en `src/model.js`. Vuelve a compilar después de editar.
