# Headless-Chrome stream extractor. Built on Puppeteer's official image which
# bundles a compatible Chromium + all the libs Chrome needs to actually run.
# Caller: the Next.js backend at /api/movies/stream/ via STREAM_EXTRACTOR_URL.

FROM ghcr.io/puppeteer/puppeteer:23.11.1

# Puppeteer image runs as non-root user `pptruser` and ships Chromium at
# /usr/bin/google-chrome-stable. Don't try to install another browser.

WORKDIR /app

COPY --chown=pptruser:pptruser package.json package-lock.json* ./
# --omit=dev keeps image small. PUPPETEER_SKIP_DOWNLOAD: we use the bundled Chromium.
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install --omit=dev

COPY --chown=pptruser:pptruser src ./src

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/healthz').then(r=>r.ok?process.exit(0):process.exit(1)).catch(()=>process.exit(1))"

CMD ["npm", "start"]
