import {copyFile} from 'node:fs/promises';
// Keep / and /legacy/ on the same app. APIs remain on the existing Worker.
await copyFile(new URL('../public/legacy/index.html',import.meta.url),new URL('../public/index.html',import.meta.url));
