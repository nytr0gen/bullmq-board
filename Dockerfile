FROM node:21-alpine
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

RUN pnpm add -g pm2

WORKDIR /app
COPY ./package.json ./pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "start"]
