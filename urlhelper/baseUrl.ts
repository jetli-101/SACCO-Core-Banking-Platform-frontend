// Single source of truth for the backend's base URL. Point NEXT_PUBLIC_API_BASE_URL
// at the real backend once it exists; everything under urlhelper/endpoints builds on this.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000/api/v1';
