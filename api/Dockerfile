FROM node:22-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma

# Installe aussi les devDeps (Prisma CLI) pour `prisma generate`, puis génère le client.
RUN pnpm install --frozen-lockfile && pnpm exec prisma generate

COPY src ./src
RUN chown -R node:node /app

ENV NODE_ENV=production
EXPOSE 3000

USER node

CMD ["node", "src/index.mjs"]
