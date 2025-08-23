# プロジェクト概要

## プロジェクトの目的
Next.js + FastAPI のフルスタック Web アプリケーション開発テンプレート。型安全性と開発効率を重視した構成で、モダンな技術スタックを採用している。

## 技術スタック

### フロントエンド
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Code Quality**: Biome (linting & formatting)
- **Testing**: Vitest + Testing Library
- **Package Manager**: Bun
- **Storybook**: コンポーネント開発とドキュメント化

### バックエンド
- **Framework**: FastAPI
- **Language**: Python 3.11
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy 2.0+
- **Migration**: Alembic + 自動マイグレーションツール
- **Code Quality**: Ruff (linting & formatting) + mypy (type checking)
- **Package Manager**: uv
- **Testing**: pytest

### 開発環境・インフラ
- **Version Management**: mise
- **Task Runner**: Task
- **Containerization**: Docker + Docker Compose
- **Git Hooks**: Lefthook (frontend) + 品質チェック自動化

## プロジェクト構造

```
nextjs-fastapi-template/
├── .mise.toml                  # 統合ツールバージョン管理
├── Taskfile.yml                # 統合タスクランナー設定
├── CLAUDE.md                   # AI開発ガイドライン（分離方針）
├── CODING_STANDARDS.md         # コーディング品質基準
├── TROUBLESHOOTING.md          # 包括的トラブルシューティング
├── frontend/                   # Next.js フロントエンド
│   ├── src/
│   │   ├── app/               # Next.js App Router
│   │   ├── components/        # Reactコンポーネント
│   │   │   ├── ui/           # shadcn/ui コンポーネント
│   │   │   ├── shared/       # 機能間で再利用可能
│   │   │   └── features/     # 機能固有
│   │   └── lib/              # ユーティリティ
│   ├── package.json
│   ├── Taskfile.yml
│   ├── CLAUDE.md             # フロントエンド専用AI指示
│   └── README.md
├── backend/                    # FastAPI バックエンド
│   ├── src/
│   │   ├── main.py           # FastAPIアプリケーション
│   │   ├── api/              # API ルート
│   │   ├── models/           # Pydantic モデル
│   │   ├── services/         # ビジネスロジック
│   │   ├── db/               # データベース関連
│   │   │   ├── models/       # SQLAlchemyモデル
│   │   │   └── migrations/   # Alembicマイグレーション
│   │   └── utils/            # ユーティリティ
│   ├── pyproject.toml
│   ├── Taskfile.yml
│   ├── CLAUDE.md             # バックエンド専用AI指示
│   └── README.md
└── README.md                   # 統合ガイド
```

## AI 分離開発方針

### フロントエンド専用 AI
- **対象**: `frontend/` ディレクトリ
- **必読**: README.md + frontend/CLAUDE.md
- **責務**: UI/UX、コンポーネント設計、フロントエンドロジック

### バックエンド専用 AI
- **対象**: `backend/` ディレクトリ
- **必読**: README.md + backend/CLAUDE.md
- **責務**: API設計、データベース設計、ビジネスロジック

### 連携方法
- **API契約**: OpenAPI/JSON Schemaによる型定義共有
- **型安全性**: PydanticモデルからTypeScript型への変換
- **独立性**: 各AIは専門領域内で完結した開発を行う