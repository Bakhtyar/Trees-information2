const fs = require('fs');
let content = fs.readFileSync('vite.config.ts', 'utf8');

const importReplacement = `import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';`;

content = content.replace(`import tailwindcss from '@tailwindcss/vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\nimport {defineConfig} from 'vite';`, importReplacement);

const pluginTarget = `plugins: [react(), tailwindcss()],`;
const pluginReplacement = `plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'تطبيق معلومات الأشجار',
          short_name: 'الأشجار',
          description: 'تطبيق لإدارة ومعرفة معلومات الأشجار',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        }
      })
    ],`;

content = content.replace(pluginTarget, pluginReplacement);

fs.writeFileSync('vite.config.ts', content);
