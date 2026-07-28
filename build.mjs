import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const outputDirectory = 'dist';
const clientDirectory = join(outputDirectory, 'client');
const serverDirectory = join(outputDirectory, 'server');
const publicFiles = [
    'favicon.svg',
    'index.html',
    'og-image-generated.png',
    'og-image.svg',
    'resume.html',
    'robots.txt',
    'script.js',
    'sitemap.xml',
    'style.css',
    'thankyou.html'
];

await rm(outputDirectory, { recursive: true, force: true });
await mkdir(clientDirectory, { recursive: true });
await mkdir(serverDirectory, { recursive: true });
await Promise.all(publicFiles.map((file) => cp(file, join(clientDirectory, file))));
await writeFile(
    join(serverDirectory, 'index.js'),
    'export default { fetch(request, env) { return env.ASSETS.fetch(request); } };\n'
);
