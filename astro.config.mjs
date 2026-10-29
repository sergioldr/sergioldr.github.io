// @ts-check
import { defineConfig } from 'astro/config';

// Served from the user site repo (sergioldr.github.io), so no `base` is needed.
export default defineConfig({
  site: 'https://sergioldr.github.io',
  trailingSlash: 'ignore',
});
