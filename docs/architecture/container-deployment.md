# Container deployment

The frontend repository builds the static React application and serves it with
Nginx. It deliberately does not run the backend, database, Redis, or TTS
models; those belong to the backend repository.

## First start

1. Start the backend repository first with `docker compose up -d --build`.
   It creates the shared `narrator-network` and exposes the API.
2. Copy `.env.example` to `.env`.
3. Set `VITE_BACKEND_URL` to the API URL a browser can reach. For local
   self-hosting, keep `http://localhost:3000`.
4. Build and start the frontend:

   ```bash
   docker compose up -d --build
   ```

During the image build, `OPENAPI_SOURCE_URL` defaults to
`http://api:3000`, which is reachable only on the shared Docker network. It
generates the Git-ignored API client from the running backend. The separately
configured `VITE_BACKEND_URL` is baked into browser JavaScript and must be a
public/browser-reachable address.

The frontend is published on `FRONTEND_PUBLISHED_PORT` (default `5173`).

## Updating

Update backend first, then rebuild frontend:

```bash
# backend repository
git pull
docker compose up -d --build

# frontend repository
git pull
docker compose up -d --build
```

This guarantees frontend API types are generated from the matching running
backend OpenAPI contract.

## Development

Frontend contributors can leave the backend in production-style Docker
containers and run Vite locally:

```bash
pnpm install
pnpm api:generate
pnpm dev
```

Use `VITE_BACKEND_URL=http://localhost:3000` when the backend publishes its
default local API port.
