
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'node',
    include: ['./test/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
})
