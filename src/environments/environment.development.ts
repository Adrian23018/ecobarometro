// src/environments/environment.prod.ts
export const environment = {
  production: true,
  supabase: {
    url: 'TU_SUPABASE_URL_PROD',
    anonKey: 'TU_SUPABASE_ANON_KEY_PROD'
  },
  app: {
    name: 'EcoBarómetro',
    version: '1.0.0'
  }
};