import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Twin-port topology: web shell on 5353, API on 5454.
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5353,
      // Dev mode binds strictly to loopback (localhost), Prod mode allows all interface binds (LAN/Docker)
      host: isDev ? false : true,
      strictPort: true,
      // Dev mode defaults to safe loopback validation (undefined), Prod mode allows wide binds (true)
      allowedHosts: isDev ? undefined : true,
      proxy: {
        '/api': 'http://localhost:5454'
      }
    },
    preview: {
      port: 5353,
      host: true,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': 'http://localhost:5454'
      }
    },
  };
});
