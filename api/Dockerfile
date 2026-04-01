FROM node:22-alpine

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

COPY src ./src
RUN chown -R node:node /app

ENV NODE_ENV=production
EXPOSE 3000

USER node

CMD ["node", "src/index.mjs"]
