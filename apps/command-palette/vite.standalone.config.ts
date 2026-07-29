import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as path from 'node:path';

export default defineConfig(() => {
  const publicPath = process.env.PUBLIC_PATH || '/bahmni-new/';
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/command-palette-standalone',
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify('production'),
      'process.env.PUBLIC_URL': JSON.stringify(publicPath),
    },
    resolve: {
      alias: [
        {
          find: /^virtual:command-palette-styles/,
          replacement: path.resolve(
            __dirname,
            '../../packages/bahmni-widgets/src/commandPalette/styles/CommandPalette.module.scss',
          ),
        },
        {
          find: '@bahmni/widgets',
          replacement: path.resolve(
            __dirname,
            '../../packages/bahmni-widgets/src/commandPalette/index.ts',
          ),
        },
      ],
    },
    build: {
      outDir: './dist-standalone',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
      lib: {
        entry: 'src/standalone.tsx',
        name: 'BahmniCommandPalette',
        fileName: () => 'command-palette.js',
        formats: ['iife' as const],
      },
    },
  };
});
