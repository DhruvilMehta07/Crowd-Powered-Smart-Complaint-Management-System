import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Only report coverage for files that were actually imported/used during tests
      // Set all: false so coverage only includes files touched by the test
      
      include: [
        'src/pages/**/*.{js,jsx,ts,tsx}',
        'src/components/**/*.{js,jsx,ts,tsx}',
      ],
      exclude: [
        'node_modules/',
        'src/setupTests.js',
        '**/__tests__/**',
        '**/*.test.jsx',
        '**/*.spec.jsx',
        'src/Tests/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
