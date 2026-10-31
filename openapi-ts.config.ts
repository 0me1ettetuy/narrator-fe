import { loadEnv } from 'vite';

const env = loadEnv(process.env.NODE_ENV ?? 'development', process.cwd(), '');
const backendUrl = env.OPENAPI_SOURCE_URL ?? env.VITE_BACKEND_URL;

if (!backendUrl) {
  throw new Error(
    'OPENAPI_SOURCE_URL or VITE_BACKEND_URL must be set to generate the OpenAPI client.',
  );
}

const openapiUrl = new URL('/openapi-json', backendUrl).toString();

export default {
  input: openapiUrl,
  output: 'src/shared/api/generated',
  plugins: ['@hey-api/sdk', '@hey-api/client-fetch', '@tanstack/react-query'],
};
