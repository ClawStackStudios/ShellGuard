import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig} from 'vite';

// Twin-port topology: web shell on 6464, API on 6565.
export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const isTls = process.env.TLS_ENABLED === 'true';

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined;
  if (isTls) {
    const dataDir = process.env.DATA_DIR || './data-dev';
    const certPath = process.env.TLS_CERT_PATH || path.resolve(__dirname, dataDir, 'certs/cert.pem');
    const keyPath = process.env.TLS_KEY_PATH || path.resolve(__dirname, dataDir, 'certs/key.pem');
    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      httpsOptions = {
        key: fs.readFileSync(keyPath),
        cert: fs.readFileSync(certPath),
      };
    }
  }

  const apiTarget = isTls ? 'https://localhost:6565' : 'http://localhost:6565';
  const proxyConfig = {
    '/api': {
      target: apiTarget,
      secure: false,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 6464,
      // Dev mode binds strictly to loopback (localhost), Prod mode allows all interface binds (LAN/Docker)
      host: isDev ? false : true,
      strictPort: true,
      // Dev mode defaults to safe loopback validation (undefined), Prod mode allows wide binds (true)
      allowedHosts: isDev ? undefined : true,
      https: httpsOptions,
      watch: {
        usePolling: true,
        interval: 1000,
        ignored: ['**/tests/**', '**/data*/**', '**/*.sqlite*', '**/*.wal', '**/*.shm', '**/.agents/**', '**/.clinerules/**', '**/node_modules/**', '**/.git/**']
      },
      proxy: proxyConfig,
    },
    preview: {
      port: 6464,
      host: true,
      strictPort: true,
      allowedHosts: true,
      https: httpsOptions,
      proxy: proxyConfig,
    },
  };
});
