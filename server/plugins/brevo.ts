import { defineNitroPlugin } from 'nitropack/runtime/plugin'

export default defineNitroPlugin((nitroApp) => {
  // Check if Brevo API key is configured
  const config = useRuntimeConfig();
  
  if (!config.brevoApiKey) {
    console.warn('⚠️ BREVO_API_KEY is not configured. Email sending will not work.');
  } else {
    console.log('✅ Brevo email service initialized');
  }
}); 