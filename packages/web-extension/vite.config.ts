import { defineConfig } from 'vite';
import webExtension, { readJsonFile } from 'vite-plugin-web-extension';
import zip from 'vite-plugin-zip';
import * as path from 'path';

export default defineConfig({
  root: 'src',
  // Configure our outputs - nothing special, this is normal vite config
  build: {
    outDir: path.resolve(
      __dirname,
      'dist',
      process.env.TARGET_BROWSER as string,
    ),
    emptyOutDir: true,
  },
  // Add the webExtension plugin
  plugins: [
    webExtension({
      // A function to generate manifest file dynamically.
      manifest: () => {
        const packageJson = readJsonFile('package.json');
        return {
          ...readJsonFile('./src/manifest.json'),
          version: packageJson.version,
          author: packageJson.author,
        };
      },
      assets: 'assets',
      browser: process.env.TARGET_BROWSER,
      webExtConfig: {
        startUrl: ['github.com/rrweb-io/rrweb'],
        watchIgnored: ['*.md', '*.log'],
      },
    }),
    process.env.ZIP === 'true' &&
      zip({
        dir: 'dist',
        outputName: process.env.TARGET_BROWSER,
      }),
  ],
});
