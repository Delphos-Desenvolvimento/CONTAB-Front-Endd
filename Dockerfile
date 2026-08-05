# syntax=docker/dockerfile:1.7

# ---- build ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

ENV CI=1 \
    npm_config_audit=false \
    npm_config_fund=false \
    npm_config_update_notifier=false

COPY package.json package-lock.json ./

# Persist npm cache across builds (BuildKit)
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL \
    NODE_ENV=production

# Skip tsc in image builds — typecheck locally / CI via `npm run typecheck`
RUN npm run build:docker

# ---- runtime (Nginx) ----
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache curl

COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Wipe previous assets so removed chunks cannot linger
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /app/dist/ /usr/share/nginx/html/

RUN rm -f /usr/share/nginx/html/.htaccess || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ >/dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
