import restart from 'vite-plugin-restart'

export default {
  root: 'public', // Set root directory to 'public' for Vite
  publicDir: 'public', // Vite will serve files from 'public' as static assets
  server: {
    host: true,
    open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env),
    proxy: {
      '/save': 'http://localhost:3000', // Forward /save API requests to Express server
      '/random-pose': 'http://localhost:3000', // Forward /random-pose API requests to Express server
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    restart({ restart: ['../static/**'] }), // Restart server on static file change
  ],
};