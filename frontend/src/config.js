/**
 * config.js – Centralized environment configuration
 */
const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const cleanUrl = rawUrl.replace(/\/api\/?$/, '');

const config = {
  API_URL: `${cleanUrl}/api`,
  IMAGE_BASE_URL: cleanUrl,
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
};

export default config;
