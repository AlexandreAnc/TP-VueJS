import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default mergeConfig(
  viteConfig,
  defineConfig({
    ssr: {
      noExternal: ['vuetify', 'vite-plugin-vuetify'],
    },
    test: {
      environment: 'jsdom',
      environmentMatchGlobs: [['api/**', 'node']],
      include: ['src/**/*.{test,spec}.{js,ts}', 'api/src/**/*.test.mjs'],
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./src/test/setupVitest.js'],
      server: {
        deps: {
          inline: ['vuetify'],
        },
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html', 'lcov'],
        include: ['src/**/*.vue', 'src/**/*.js', 'api/src/**/*.mjs'],
        exclude: [
          ...configDefaults.exclude,
          'src/main.js',
          'api/src/index.mjs',
          'src/router/index.js',
          '**/*.{test,spec}.{js,mjs}',
          'src/test/**',
        ],
        thresholds: {
          lines: 78,
          functions: 72,
          branches: 68,
          statements: 78,
        },
      },
    },
  }),
)
