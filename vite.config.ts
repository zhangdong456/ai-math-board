import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署在子路径下，资源用相对路径加载
  base: './',
  server: {
    port: 5173,
    open: true,
  },
});
