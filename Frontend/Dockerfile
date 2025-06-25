FROM oven/bun:1.1.13 as builder

WORKDIR /app

COPY . .

RUN bun install
RUN bun run build


EXPOSE 5173

CMD ["bun", "serve", "--port", "5173", "--root", "dist"]