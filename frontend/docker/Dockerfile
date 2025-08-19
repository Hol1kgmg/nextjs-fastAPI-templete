# ビルドステージ
FROM node:18-alpine AS builder

WORKDIR /app

# パッケージファイルをコピー
COPY package.json ./

# すべての依存関係をインストール
RUN npm install --legacy-peer-deps

# アプリケーションをコピー
COPY . .

# 環境変数をbuild引数から設定
ARG API_BASE_URL=http://localhost:8000
ENV API_BASE_URL=${API_BASE_URL}

# Next.jsビルド
RUN npm run build

# 本番ステージ
FROM node:18-alpine AS production

WORKDIR /app

# 本番用の依存関係のみインストール
COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# ビルドされたアプリケーションをコピー
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/package.json ./package.json

# 環境変数を設定（ランタイム用）
ARG API_BASE_URL=http://localhost:8000
ENV API_BASE_URL=${API_BASE_URL}

# ポート公開
EXPOSE 3000

# アプリケーション起動
CMD ["npm", "start"]