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

# ---- runtime (Apache) ----
FROM httpd:2.4-alpine AS runtime

RUN apk add --no-cache curl \
  && sed -i \
    -e 's/^#\(LoadModule .*mod_rewrite.so\)/\1/' \
    -e 's/^#\(LoadModule .*mod_proxy.so\)/\1/' \
    -e 's/^#\(LoadModule .*mod_proxy_http.so\)/\1/' \
    -e 's/^#\(LoadModule .*mod_headers.so\)/\1/' \
    /usr/local/apache2/conf/httpd.conf

COPY apache/httpd.conf /usr/local/apache2/conf/httpd.conf

# Wipe previous assets so removed chunks (e.g. broken charts-*.js) cannot linger
RUN rm -rf /usr/local/apache2/htdocs/*
COPY --from=build /app/dist/ /usr/local/apache2/htdocs/

RUN rm -f /usr/local/apache2/htdocs/.htaccess || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -fsS http://127.0.0.1/ >/dev/null || exit 1

CMD ["httpd-foreground"]
