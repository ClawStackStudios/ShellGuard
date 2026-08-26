import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// Twin-port topology: web shell on 4545, API on 4646.
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
      port: 4545,
      // Dev mode binds strictly to loopback (localhost), Prod mode allows all interface binds (LAN/Docker)
      host: isDev ? false : true,
      strictPort: true,
      // Dev mode defaults to safe loopback validation (undefined), Prod mode allows wide binds (true)
      allowedHosts: isDev ? undefined : true,
      proxy: {
        '/api': 'http://localhost:4646'
      }
    },
    preview: {
      port: 4545,
      host: true,
      strictPort: true,
      allowedHosts: true,
      proxy: {
        '/api': 'http://localhost:4646'
      }
    },
  };
});
