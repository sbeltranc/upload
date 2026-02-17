FROM oven/bun:latest AS builder

WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

FROM oven/bun:latest

WORKDIR /app

RUN apt-get update && apt-get install -y dumb-init && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/package.json .
COPY --from=builder /app/bun.lock .
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["bun", "run", "/app/.output/server/index.mjs"]
