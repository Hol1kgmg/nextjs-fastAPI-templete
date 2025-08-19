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

### フロントエンド個別開発

**統合環境を使用する場合は、[プロジェクト直下のREADME.md](../README.md)の統合環境セットアップを参照してください。**

**フロントエンドのみ個別に開発する場合**:

```bash
# フロントエンドディレクトリに移動
cd frontend

# miseツールの自動インストール
mise trust && mise install

# 依存関係のインストール
task install
# 従来の方法（後方互換性）
bun install
```

### 開発サーバーの起動

```bash
# Task統一コマンド（推奨）
task dev

# 従来の方法（後方互換性）
bun run dev
```

http://localhost:3000 でアプリケーションにアクセスできます。

## 利用可能なコマンド

利用可能なすべてのタスクコマンドは以下で確認できます：

```bash
task list
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

- **Pre-commit**: `task check:fix` による自動修正
- **Pre-push**: `task check` と `task typecheck` による品質チェック

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
task env:check
task env:mise

# Task一覧表示
task --list
```

## shadcn/ui

shadcn/uiコンポーネントは `src/components/ui/` に配置されています。新しいコンポーネントを追加する場合：

```bash
# Task統一コマンド（推奨）
task ui:add [component-name]

# 従来の方法（後方互換性）
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
