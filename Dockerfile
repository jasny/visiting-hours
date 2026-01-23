# 1. Install dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# If you use Prisma or similar, install openssl
RUN apk add --no-cache libc6-compat

COPY package.json yarn.lock ./

RUN yarn config set registry https://registry.npmjs.org
RUN yarn --version && yarn install --frozen-lockfile

# 2. Build the app
FROM node:22-alpine AS builder
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY . .
COPY --from=deps /app/node_modules ./node_modules

RUN yarn build

# 3. Imag
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3000

CMD ["yarn", "start"]

