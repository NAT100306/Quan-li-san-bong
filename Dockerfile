# Stage 1: Cài đặt dependencies và build dự án
FROM node:18-alpine AS builder
WORKDIR /app

# Sao chép package.json và package-lock.json
COPY package*.json ./

# Cài đặt toàn bộ dependencies (bao gồm devDependencies để build)
RUN npm ci

# Sao chép toàn bộ mã nguồn
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build ứng dụng Next.js
RUN npm run build

# Stage 2: Runtime runner gọn nhẹ
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Sao chép các tệp tin cần thiết từ builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Mở cổng 3000 chạy ứng dụng Next.js
EXPOSE 3000

# Khởi chạy ứng dụng và tự động đồng bộ database schema
CMD ["sh", "-c", "npx prisma db push && npm start"]
