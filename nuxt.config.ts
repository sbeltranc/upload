// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,

    fileSizeLimit: 200 * 1024 * 1024,
    prohibitedFileTypes: ['exe', 'scr', 'cpl', 'doc', 'jar', 'bat', 'cmd', 'sh', 'ps1', 'pkg', 'dmg', 'js'],

    r2: {
      accountId: process.env.R2_ACCOUNT_ID,
      accessKeyId: process.env.R2_ACCESS_KEY_ID,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      bucket: process.env.R2_BUCKET,
      publicDomain: process.env.R2_PUBLIC_DOMAIN,
    },
  },

  pages: false,

  nitro: {
    preset: 'bun',
    serveStatic: false,
  },

  css: ['~/assets/css/main.css'],
  modules: ['@nuxt/eslint', '@nuxt/image', '@nuxt/ui', '@nuxt/fonts'],
})