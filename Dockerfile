FROM node:20-alpine

WORKDIR /app

# 依存関係のインストールに必要なファイルのみ先行コピー
COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

# アプリケーション全体のコピー
COPY . .

# Prismaクライアント生成 ＆ 本番ビルド
RUN npx prisma generate
RUN npm run build

# Cloud Run は PORT 環境変数を注入するため動的ポートに対応
ENV PORT=3000
EXPOSE 3000

# 起動コマンド
CMD ["npm", "run", "start"]