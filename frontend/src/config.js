/**
 * config.js – Centralized environment configuration
 */
const config = {
  API_URL: `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`,
  IMAGE_BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
};

export default config;
