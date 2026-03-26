import { google } from 'googleapis';

const getRedirectUri = () => {
  let baseUrl = '';
  
  if (process.env.GOOGLE_REDIRECT_URI) {
    baseUrl = process.env.GOOGLE_REDIRECT_URI;
  } else if (process.env.GOOGLE_REDIRECT) {
    baseUrl = process.env.GOOGLE_REDIRECT;
  } else {
    baseUrl = process.env.APP_URL || '';
  }
  
  // Remove trailing slash if present
  baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  if (!baseUrl) {
    console.warn('Warning: APP_URL is not set. OAuth redirect URI might be invalid.');
    return '/api/auth/google/callback';
  }
  
  // If the URL already contains the callback path, return it as is
  if (baseUrl.includes('/api/auth/google/callback')) {
    return baseUrl;
  }
  
  // Otherwise, append the callback path
  return `${baseUrl}/api/auth/google/callback`;
};

export const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SI,
  getRedirectUri()
);

export const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
