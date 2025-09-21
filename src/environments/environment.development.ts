// Production environment configuration for EcoBarómetro
export const environment = {
  production: false,
  
  // Supabase Configuration
  supabaseUrl: 'https://bhvxxqgjepodfbgvnbva.supabase.co', // Replace with your production Supabase URL
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJodnh4cWdqZXBvZGZiZ3ZuYnZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgzNjkxMzYsImV4cCI6MjA3Mzk0NTEzNn0.J7R6-ukkGhVBMxmqxhLKKgnshESiy8KSIb6m-Ctd1D0', // Replace with your production Supabase anon key
  
  // Application Configuration
  appName: 'EcoBarómetro',
  appVersion: '1.0.0',
  
  // API Configuration
  apiUrl: 'YOUR_PRODUCTION_SUPABASE_URL/rest/v1',
  
  // Game Configuration
  defaultGameSettings: {
    questionsPerGame: 15,
    timePerQuestion: 30, // seconds
    difficultyLevels: {
      easy: { questions: 10, timeLimit: 45 },
      normal: { questions: 15, timeLimit: 30 },
      hard: { questions: 20, timeLimit: 20 }
    }
  },
  
  // Level Configuration
  levelSystem: {
    pointsPerLevel: 1000,
    maxLevel: 50,
    bonusMultipliers: {
      speed: 1.2,
      accuracy: 1.5,
      streak: 1.3
    }
  },
  
  // File Upload Configuration
  fileUpload: {
    maxFileSize: 1048576, // 1MB in bytes
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    allowedDocumentTypes: ['application/pdf', 'text/csv', 'application/json']
  },
  
  // Feature Flags
  features: {
    enableOfflineMode: true,
    enableSocialSharing: true,
    enableNotifications: true,
    enableAnalytics: true,
    enableMultiLanguage: true,
    enableDarkMode: true,
    enableExportData: true,
    enableImportQuestions: true
  },
  
  // Cache Configuration
  cache: {
    defaultTTL: 600000, // 10 minutes
    maxSize: 200, // Maximum number of cached items
    enablePersistence: true
  },
  
  // PWA Configuration
  pwa: {
    enableServiceWorker: true,
    updateCheckInterval: 3600000, // 1 hour
    enablePushNotifications: true
  },
  
  // Security Configuration
  security: {
    enableCSRF: true,
    tokenExpirationTime: 86400000, // 24 hours
    maxLoginAttempts: 5,
    lockoutDuration: 900000 // 15 minutes
  },
  
  // Analytics Configuration
  analytics: {
    enableUserTracking: true,
    enablePerformanceMonitoring: true,
    enableErrorReporting: true
  },
  
  // Social Media Configuration
  socialMedia: {
    twitter: {
      enabled: true,
      hashtags: ['EcoBarómetro', 'Sostenibilidad', 'MedioAmbiente']
    },
    facebook: {
      enabled: true,
      appId: 'YOUR_PRODUCTION_FACEBOOK_APP_ID'
    },
    linkedin: {
      enabled: true
    }
  },
  
  // Localization
  localization: {
    defaultLanguage: 'es',
    supportedLanguages: ['es', 'en'],
    dateFormat: 'dd/MM/yyyy',
    timeFormat: 'HH:mm',
    currency: 'COP',
    timezone: 'America/Bogota'
  },
  
  // Email Configuration (for notifications)
  email: {
    enableEmailNotifications: true,
    fromAddress: 'noreply@ecobarometro.com',
    templates: {
      welcome: 'welcome-template',
      passwordReset: 'password-reset-template',
      achievementUnlocked: 'achievement-template',
      weeklyDigest: 'weekly-digest-template'
    }
  },
  
  // Performance Configuration
  performance: {
    enableLazyLoading: true,
    enableCodeSplitting: true,
    enableImageOptimization: true,
    bundleAnalyzer: false
  }
};