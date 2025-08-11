**AI エージェント利用時、開発開始プロンプトメモ**
Kiro 用

```bash
リポジトリ直下のKIRO_PROMPT.mdを読み込み、記載された初期命令を実行してください。
```

Claude Code 用

```bash
~/.claude/settings.local.jsonを読み込んで、リポジトリ直下のREADME.mdとCLAUDE.mdを確認後、担当領域を明確にしてから、該当する専用CLAUDE.mdを読み込んで待機して
```

**Kiro 関連ファイルの git 管理**

```bash
# .kiro/prompts*はすでにgit追跡に含まれているため、命令プロンプトドキュメントを無視するコマンドを実行する必要があります
git update-index --assume-unchanged .kiro/prompts/*
```

# Next.js + FastAPI Template

モダンなフルスタック Web アプリケーション開発のためのテンプレートリポジトリです。Next.js 15 と FastAPI を組み合わせ、型安全性と開発効率を重視した構成になっています。

## 🚀 概要

このテンプレートは、以下の特徴を持つフルスタックアプリケーションの迅速な開発を支援します：

- **型安全性**: TypeScript（フロントエンド）と Python 型ヒント（バックエンド）による完全な型安全性
- **モダンな技術スタック**: 最新のフレームワークとツールを採用
- **開発効率**: 自動化されたマイグレーション、リンティング、フォーマット
- **プロダクション対応**: Docker、CI/CD 対応の本格的な構成

## 📁 プロジェクト構成

```
nextjs-fastapi-template/
├── .mise.toml                  # 統合ツールバージョン管理
├── Taskfile.yml                # 統合タスクランナー設定
├── CLAUDE.md                   # AI開発ガイドライン
├── TROUBLESHOOTING.md          # 包括的トラブルシューティング
├── frontend/                   # Next.js フロントエンド
│   ├── .mise.toml             # フロントエンド固有設定
│   ├── Taskfile.yml           # フロントエンド専用タスク
│   ├── docker/                # フロントエンドDocker設定
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # Reactコンポーネント
│   │   └── lib/               # ユーティリティ
│   ├── package.json
│   └── README.md              # フロントエンド詳細ドキュメント
├── backend/                    # FastAPI バックエンド
│   ├── .mise.toml             # バックエンド固有設定
│   ├── Taskfile.yml           # バックエンド専用タスク
│   ├── docker/                # バックエンドDocker設定
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   ├── src/
│   │   ├── main.py           # FastAPIアプリケーション
│   │   ├── db/               # データベース関連
│   │   │   ├── migrations/   # Alembicマイグレーション
│   │   │   └── models/       # SQLAlchemyモデル
│   │   └── script/           # ユーティリティスクリプト
│   │       └── auto_migrate/ # 自動マイグレーションツール
│   ├── pyproject.toml
│   └── README.md              # バックエンド詳細ドキュメント
└── README.md                   # このファイル（統合ガイド）
```

### 統合環境の特徴

- **mise 統一管理**: プロジェクト直下で全ツールのバージョン統一管理
- **Task 統合実行**: `task dev`で両方同時起動、`task dev:backend`で個別実行
- **Docker 分離環境**: 各環境独立したコンテナ設定
- **後方互換性**: 既存のサブディレクトリでの開発も継続可能

## 🛠️ 技術スタック

### フロントエンド

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Vitest + Testing Library
- **Package Manager**: Bun

### バックエンド

- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0+
- **Migration**: Alembic + 自動マイグレーションツール
- **Code Quality**: Ruff (linting & formatting) + mypy (type checking)
- **Package Manager**: uv

### 開発環境・インフラ

- **Version Management**: mise
- **Task Runner**: Task
- **Containerization**: Docker + Docker Compose
- **Git Hooks**: Lefthook (frontend) + 品質チェック自動化

## ⚡ クイックスタート

### 前提条件

- **mise**: ツールバージョン管理 ([インストール方法](https://mise.jdx.dev/getting-started.html))
- **Docker & Docker Compose**: コンテナ環境

**統合開発環境**: このプロジェクトでは mise を使用してフロントエンドとバックエンドのツールバージョンを統一管理し、Task による一貫したコマンド体系を実現しています。

### 1. リポジトリのクローン

```bash
git clone https://github.com/Hol1kgmg/nextjs-fastAPI-templete.git
cd nextjs-fastAPI-templete
```

### 2. 統合環境セットアップ（推奨）

**最速で開発を開始する方法**:

1. **環境セットアップ（1 分）**:

   ```bash
   git clone https://github.com/Hol1kgmg/nextjs-fastAPI-templete.git
   cd nextjs-fastAPI-templete
   mise install
   task install
   ```

2. **環境設定ファイルの作成（30 秒）**:

   ```bash
   # バックエンド環境設定
   cp backend/.env.sample backend/.env

   # フロントエンド環境設定
   cp frontend/.env.sample frontend/.env
   ```

3. **フルスタック開発開始（30 秒）**:

   ```bash
   task docker:up:db
   task dev
   ```

   - フロントエンド: http://localhost:3000
   - バックエンド: http://localhost:8000
   - Adminer (DEBUG=true の場合): http://localhost:8080/?pgsql=db&username=user&db=mydb&ns=public

4. **品質チェック（30 秒）**:
   ```bash
   task check:all
   ```

**開発パターン別コマンド**:

| 開発パターン       | コマンド                                | 説明                       |
| ------------------ | --------------------------------------- | -------------------------- |
| フルスタック開発   | `task dev`                              | 両方同時起動               |
| バックエンド専用   | `task dev:backend`                      | バックエンドのみ           |
| フロントエンド専用 | `task dev:frontend`                     | フロントエンドのみ         |
| 軽量バックエンド   | `task docker:up:db && task dev:backend` | DB コンテナ + 開発サーバー |

**初回 mise セットアップが必要な場合**:

```bash
# miseのインストール（初回のみ）
brew install mise  # macOSの場合
# または
curl https://mise.run | sh

# miseのシェル統合（初回のみ）
echo 'eval "$(mise activate --shims zsh)"' >> ~/.zshrc  # zshの場合
source ~/.zshrc

# Pythonバージョンファイルサポートの有効化（初回のみ）
mise settings add idiomatic_version_file_enable_tools python
```

### 3. 個別環境での開発

**バックエンドのみ開発する場合**:

```bash
# データベースのみ起動（軽量）
task docker:up:db

# バックエンド開発サーバー起動
task dev:backend
```

**フロントエンドのみ開発する場合**:

```bash
# フロントエンド開発サーバー起動
task dev:frontend
```

### 4. 従来の方法（後方互換性）

既存の開発者は従来通りの方法も継続利用可能：

**バックエンド**:

```bash
cd backend
mise install
task install
task dev
```

**フロントエンド**:

```bash
cd frontend
mise install
task install
task dev
```

### 5. 便利なコマンド

```bash
# 統合品質チェック
task check:all

# 統合テスト実行
task test

# 統合ビルド
task build

# 統合クリーンアップ
task clean

# Docker環境管理
task docker:up:db      # データベースのみ
task docker:up         # 全Docker環境
task docker:down       # 全Docker環境停止

# マイグレーション管理（バックエンド）
task migrate           # 自動マイグレーション（生成＋適用）
task migrate:status    # 現在のマイグレーション状態確認
task migrate:history   # マイグレーション履歴表示
task migrate:generate  # マイグレーション生成のみ
task migrate:upgrade   # 手動アップグレード
task migrate:downgrade # 1つ前にダウングレード
```

## 🔧 問題が発生した場合

初回環境構築や開発中に問題が発生した場合は、**[📋 TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** を参照してください。

### 🔧 統合環境のトラブルシューティング

### よくある問題

**mise 環境の問題**:

- `mise install`後にコマンドが見つからない → ターミナル再起動
- ツールバージョンが期待と異なる → `mise list`で確認、`mise use`で修正

**Task 統合環境の問題**:

- `task dev`で片方のサーバーが起動しない → 個別コマンド（`task dev:backend`）で原因特定
- ポート競合エラー → 既存プロセスの確認・停止

**Docker 統合環境の問題**:

- `task docker:up:db`が失敗 → Docker Desktop の起動確認
- データベース接続エラー → `task docker:logs:db`でログ確認

### 従来の問題

- Docker 関連のポート競合・権限エラー
- パッケージインストール失敗
- マイグレーション・データベース接続問題
- コード品質ツールエラー

各問題の詳細な解決方法と環境固有の対処法を網羅しています。

問題が解決しない場合は、環境情報と共に GitHub でイシューを作成してください。

## 🌟 主な機能

### フロントエンド

- **モダンな React 開発**: App Router、Server Components 対応
- **コンポーネント駆動開発**: Storybook 統合
- **厳格なコード品質**: Biome + Lefthook による自動品質管理
- **型安全な UI**: shadcn/ui + TypeScript

### バックエンド

- **高性能 API**: FastAPI + 非同期処理
- **インテリジェントマイグレーション**: Decision Tree による自動ファイル命名
- **包括的な型チェック**: mypy strict mode
- **開発効率化**: 自動マイグレーション、ホットリロード

### 開発体験

- **統合 mise 環境**: プロジェクト直下で全ツール（Python 3.11, Node.js 18.18.0, Bun 1.1.8, uv, Task）を統一管理
- **統合 Task 環境**: 新しい命名規則による直感的なコマンド体系
  - `task dev` = フロントエンド・バックエンド両方起動
  - `task dev:backend` = バックエンドのみ起動
  - `task dev:frontend` = フロントエンドのみ起動
- **Docker 統合管理**: 分離環境での効率的なコンテナ管理
- **後方互換性**: 既存の開発ワークフローを完全保持
- **段階的移行**: 新機能を徐々に学習・採用可能

## 📚 ドキュメント

各コンポーネントの詳細な情報は、それぞれの README.md を参照してください：

- **[フロントエンド詳細](./frontend/README.md)**: Next.js 環境構築、開発方法、コンポーネント設計
- **[バックエンド詳細](./backend/README.md)**: FastAPI 環境構築、データベース設計、API 開発
- **[自動マイグレーションツール](./backend/src/script/auto_migrate/README.md)**: 高度なマイグレーション機能の詳細

## 🤝 開発ガイドライン

このテンプレートは、以下の開発原則に基づいて設計されています：

- **型安全性の徹底**: フロントエンドからバックエンドまで一貫した型安全性
- **コード品質の自動化**: 手動チェックに依存しない品質管理
- **開発効率の最大化**: 繰り返し作業の自動化と最適化
- **プロダクション対応**: 本格的な運用に耐える構成

## 📄 ライセンス

このテンプレートは MIT ライセンスの下で公開されています。

## 🚀 次のステップ

1. 各コンポーネントの README.md で詳細な環境構築を実行
2. サンプルコードを参考に、独自の機能を実装
3. 必要に応じて技術スタックをカスタマイズ

---

**Happy Coding! 🎉**
