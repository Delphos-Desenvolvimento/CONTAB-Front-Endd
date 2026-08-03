# ---- build ----
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.ts tsconfig.json tsconfig.app.json tsconfig.node.json ./
COPY public ./public
COPY scripts ./scripts
COPY src ./src

ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

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
COPY --from=build /app/dist/ /usr/local/apache2/htdocs/

# Keep SPA fallbacks and assets; Apache handles routing via httpd.conf
RUN rm -f /usr/local/apache2/htdocs/.htaccess || true

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -fsS http://127.0.0.1/ >/dev/null || exit 1

CMD ["httpd-foreground"]
