FROM node:24-bookworm-slim AS build

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# OPENAPI_SOURCE_URL is Docker-internal. VITE_BACKEND_URL is baked into the
# browser bundle and must be reachable by the user's browser.
ARG OPENAPI_SOURCE_URL=http://api:3000
ARG VITE_BACKEND_URL
ENV OPENAPI_SOURCE_URL=$OPENAPI_SOURCE_URL
ENV VITE_BACKEND_URL=$VITE_BACKEND_URL

RUN pnpm api:generate && pnpm build

FROM nginx:1.27-alpine AS runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
