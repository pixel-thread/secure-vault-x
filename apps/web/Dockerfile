FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Copy standalone output
COPY apps/web/.next/standalone ./

# Copy Next.js static assets
COPY apps/web/.next/static ./apps/web/.next/static

# Copy public assets
COPY apps/web/public ./apps/web/public

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
