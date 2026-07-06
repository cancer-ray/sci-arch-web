import axios from "axios";
import { getAccessToken } from "@/lib/supabase";

// The Fastify GMP backend (Fly/Render). Vercel rewrites /api/* here in prod;
// in dev, point REACT_APP_BACKEND_URL at http://localhost:8080.
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "";
// Backend serves all routes under /api/*; frontend calls use bare resource paths.
export const API_BASE = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API_BASE });

// Attach the Supabase access token as a bearer on every request. The backend
// verifies it (jose/JWKS) and derives the audited actor from it.
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
