// API configuration
import { API_BASE_URL as ENV_API_BASE_URL } from '@env';

export const API_BASE_URL = ENV_API_BASE_URL || 'http://localhost:3000';

export default {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000, // 30 seconds for file uploads
};
