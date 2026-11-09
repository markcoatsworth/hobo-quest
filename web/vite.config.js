import { readFileSync } from 'node:fs';
import { defineConfig } from 'vite';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  // Relative asset paths, so dist/ works from any subfolder (itch.io etc.).
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(version),
  },
});
