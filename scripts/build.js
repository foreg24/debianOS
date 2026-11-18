import { copyFile, cp, mkdir, readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const dist = new URL('dist/', root);
await mkdir(new URL('vendor/', dist), { recursive: true });

await Promise.all([
  ...['index.html', 'styles.css'].map(file => copyFile(new URL(file, root), new URL(file, dist))),
  ...['src/', 'assets/'].map(folder => cp(new URL(folder, root), new URL(folder, dist), { recursive: true })),
  ...['gsap.min.js', 'ScrollTrigger.min.js'].map(async file => {
    const script = await readFile(new URL('node_modules/gsap/dist/' + file, root), 'utf8');
    await writeFile(new URL('vendor/' + file, dist), script.replace(/^\/\/# sourceMappingURL=.*$/m, ''));
  }),
]);
console.log('Compilación lista en dist/.');
