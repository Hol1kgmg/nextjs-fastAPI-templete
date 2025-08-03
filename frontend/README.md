# My App

Next.js 15 + TypeScript + Tailwind CSS + shadcn/ui を使用したモダンなWebアプリケーションテンプレートです。

## 技術スタック

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Vitest + Testing Library
- **Storybook**: Component development & documentation
- **Package Manager**: Bun
- **Version Management**: mise (Node.js, Bun, Task管理)
- **Task Runner**: Task (統一コマンド体系)
- **Git Hooks**: Lefthook

## 開発環境のセットアップ

### 前提条件

- **mise**: ツールバージョン管理 ([インストール方法](https://mise.jdx.dev/getting-started.html))
- **Task**: タスクランナー（miseで自動インストール）
- Node.js 18.18.0 以上（miseで管理）
- Bun 1.1.8（miseで管理）

**重要**: このプロジェクトではmiseを使用してNode.js、Bun、Taskのバージョンを統一管理しています。

### セットアップ手順

```bash
# 1. 必要なツールをインストール
mise install

# 2. 環境確認
mise current

# 3. 依存関係をインストール
task install
# または
bun install
```

### 開発サーバーの起動

```bash
# Taskを使用（推奨）
task dev

# または従来の方法
bun run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 利用可能なコマンド

### Taskコマンド（推奨）

```bash
# 環境管理
task install         # 依存関係をインストール

# 開発
task dev            # 開発サーバーを起動
task build          # プロダクション用ビルド
task start          # プロダクションサーバーを起動
task typecheck      # TypeScript型チェック

# コード品質
task check          # Biome linter/formatter チェック
task check:fix      # Biome 自動修正（unsafe修正含む）
task format         # Biome フォーマットチェック
task format:fix     # Biome 自動フォーマット

# 統合コマンド
task check:all      # 全品質チェック統合実行
task fix:all        # 自動修正統合実行

# テスト・Storybook
task test           # Vitestでテスト実行
task storybook      # Storybook開発サーバーを起動
task build-storybook # Storybookをビルド
```

### 従来のbunコマンド

```bash
# 開発
bun run dev          # 開発サーバーを起動
bun run build        # プロダクション用ビルド
bun run start        # プロダクションサーバーを起動
bun run typecheck    # TypeScript型チェック

# コード品質
bun run check        # Biome linter/formatter チェック
bun run check:fix    # Biome 自動修正（unsafe修正含む）
bun run format       # Biome フォーマットチェック
bun run format:fix   # Biome 自動フォーマット

# テスト・Storybook
bun run test         # Vitestでテスト実行
bun run storybook    # Storybook開発サーバーを起動
bun run build-storybook # Storybookをビルド

# 環境確認
bun run env:check    # Node.js・Bunバージョン確認
bun run env:mise     # mise管理ツール一覧表示
```

## プロジェクト構成

```
src/
├── app/                    # Next.js App Router
│   ├── globals.css        # グローバルスタイル
│   ├── layout.tsx         # ルートレイアウト
│   └── page.tsx           # ホームページ
├── components/
│   ├── ui/                # shadcn/ui コンポーネント
│   ├── shared/            # 共有コンポーネント
│   └── features/          # 機能別コンポーネント
└── lib/
    └── utils.ts           # ユーティリティ関数
```

## コーディング規約

このプロジェクトは厳密なコーディング規約に従っています：

- **コンポーネント命名**: ディレクトリ名（kebab-case）とTSXファイル名（PascalCase）の対応
- **インポート**: `@/` エイリアスを使用した絶対パス
- **コード品質**: Biomeによる自動linting/formatting
- **Git Hooks**: コミット前の自動品質チェック

詳細は `CLAUDE.md` を参照してください。

## Git Hooks

Lefthookにより以下のフックが自動実行されます：

- **Pre-commit**: `bun run check:fix` による自動修正
- **Pre-push**: `bun run check` と `bun run typecheck` による品質チェック

## mise環境での開発

### 前提条件
- mise ([インストール方法](https://mise.jdx.dev/getting-started.html))

### 環境構築手順

1. **フロントエンドディレクトリに移動**:
```bash
cd frontend
```

2. **mise環境セットアップ**:
```bash
# ツールのインストール
mise install

# 環境の有効化（必要に応じて）
eval "$(mise activate zsh)"

# インストール確認
mise list
node --version  # v18.18.0
bun --version   # 1.1.8
```

3. **依存関係インストール**:
```bash
task install
```

4. **開発サーバー起動**:
```bash
task dev
```

### 利用可能なタスク

```bash
task --list  # 全タスク一覧表示

# 基本コマンド
task install     # 依存関係インストール
task dev         # 開発サーバー起動
task build       # プロダクションビルド
task test        # テスト実行

# 品質チェック
task check       # Biome linting
task format      # Biome formatting
task typecheck   # TypeScript型チェック
task check:all   # 統合品質チェック

# ユーティリティ
task clean       # 生成ファイルクリーンアップ
task fix:all     # 自動修正
```

### トラブルシューティング

#### mise環境が認識されない
```bash
# mise環境の再有効化
eval "$(mise activate zsh)"

# ツールの再インストール
mise install
```

#### Node.js/Bunのバージョンが違う
```bash
# mise管理下のツールが使用されているか確認
which node  # ~/.local/share/mise/installs/node/18.18.0/bin/node
which bun   # ~/.local/share/mise/installs/bun/1.1.8/bin/bun

# バージョン確認
node --version  # v18.18.0
bun --version   # 1.1.8
```

## 環境確認

開発環境で問題が発生した場合は、以下のコマンドで環境を確認できます：

```bash
# mise管理ツールの確認
mise current
mise list

# バージョン確認
task env:check     # または bun run env:check
task env:mise      # または bun run env:mise

# Task一覧表示
task --list
```

## shadcn/ui

shadcn/uiコンポーネントは `src/components/ui/` に配置されています。新しいコンポーネントを追加する場合：

```bash
bunx shadcn@latest add [component-name]
```

## Docker デプロイメント

### 前提条件
- Docker
- Docker Compose（オプション）

### ビルドと実行

#### 基本的な使用方法
```bash
# フロントエンドディレクトリに移動
cd frontend

# Dockerイメージをビルド
task docker:build

# コンテナを起動
task docker:run

# ログを確認
task docker:logs

# コンテナを停止
task docker:stop
```

#### Docker Composeを使用する場合
```bash
cd frontend/docker
docker-compose up -d
```

### 環境変数設定

本番環境では以下の環境変数を設定してください：

- `BACKEND_API_URL`: バックエンドAPIのURL
- `NODE_ENV`: production（固定）

### トラブルシューティング

#### ビルドエラー
- `task docker:clean`でイメージとボリュームをクリーンアップ
- `docker system prune`でDockerキャッシュをクリア

#### 起動エラー
- `task docker:logs`でログを確認
- ポート3000が使用中でないか確認

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [Biome](https://biomejs.dev/)
- [Vitest](https://vitest.dev/)
- [Storybook](https://storybook.js.org/)
