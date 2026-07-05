import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Regenerate icons after editing public/logo.svg with:  npm run generate-pwa-assets
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo.svg'],
});
