import {defineConfig} from 'vite';import react from '@vitejs/plugin-react';
export default defineConfig({base:'/tarife-at/',plugins:[react()],build:{outDir:'dist',chunkSizeWarningLimit:3000}});
