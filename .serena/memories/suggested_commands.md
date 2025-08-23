# 推奨開発コマンド

## 統合環境管理（プロジェクトルート）

### 環境セットアップ
- `mise install` - .mise.tomlで指定されたツール（Python 3.11, Node.js 18.18.0, Bun 1.1.8, uv, Task, lefthook, rust）をインストール
- `task install` - 全依存関係をインストール（フロントエンド + バックエンド + Git hooks）

### 開発サーバー
- `task dev` - フロントエンド・バックエンド両方同時起動
- `task dev:frontend` - フロントエンドのみ（Next.js）
- `task dev:backend` - バックエンドのみ（FastAPI）

### 品質チェック・修正
- `task check:all` - 全品質チェック統合実行
- `task fix:all` - 自動修正統合実行（フロント+バック）
- `task test` - 全テスト実行
- `task build` - 全ビルド実行

### Docker環境
- `task docker:build` - 全Docker imageビルド
- `task docker:up` - 全Docker環境起動
- `task docker:up:db` - データベースのみ起動
- `task docker:down` - 全Docker環境停止

### マイグレーション（バックエンド）
- `task migrate` - 自動マイグレーション（生成＋適用）
- `task migrate:status` - マイグレーション状態確認
- `task migrate:history` - マイグレーション履歴表示

## フロントエンド専用コマンド（frontend/）

### 基本開発
- `task dev` - Next.js開発サーバー
- `task build` - プロダクションビルド
- `task test` - Vitest テスト実行
- `task storybook` - Storybook開発サーバー

### 品質管理
- `task check` - Biomeリンティング+フォーマットチェック
- `task check:fix` - Biome自動修正（unsafe含む）
- `task format:fix` - Biome自動フォーマット
- `task typecheck` - TypeScript型チェック

### UI コンポーネント
- `task ui:add <component-name>` - shadcn/ui コンポーネント追加

## バックエンド専用コマンド（backend/）

### 基本開発
- `task dev` - FastAPI開発サーバー（uvicorn）
- `task test` - pytest テスト実行

### 品質管理
- `task lint` - Ruffリンティングチェック
- `task format` - Ruff自動フォーマット
- `task typecheck` - mypy型チェック

### データベース
- `task migrate` - 自動マイグレーション実行
- `task migrate:generate` - マイグレーション生成のみ
- `task migrate:upgrade` - 手動アップグレード
- `task migrate:downgrade` - 1つ前にダウングレード
- `task migrate:reset` - データベースリセット

## よく使用されるコマンド組み合わせ

### 初回環境構築
```bash
mise install
task install
cp backend/.env.sample backend/.env
cp frontend/.env.sample frontend/.env
```

### 開発開始
```bash
task docker:up:db  # データベース起動
task dev           # 両方のサーバー起動
```

### 品質チェック・修正
```bash
task fix:all       # 全自動修正
task check:all     # 全品質チェック
task test          # 全テスト実行
```

## システムユーティリティ（Darwin）

### ファイル操作
- `ls -la` - 詳細ファイルリスト表示
- `find . -name "*.py"` - ファイル検索
- `grep -r "pattern" .` - テキスト検索（ただし、ripgrapのrgが推奨）
- `rg "pattern"` - 高速テキスト検索（ripgrep、推奨）

### Git操作
- `git status` - 作業状態確認
- `git add .` - 全変更をステージ
- `git commit -m "message"` - コミット
- `git push` - リモートにプッシュ

### Docker操作
- `docker ps` - 実行中コンテナ一覧
- `docker logs <container>` - コンテナログ表示
- `docker exec -it <container> bash` - コンテナ内シェル

## 注意事項

### lefthookとコード品質
- **絶対に `LEFTHOOK=0` を使用しない**
- pre-commitフックによる自動修正は品質向上のため
- 品質チェックエラーは必ず対処する

### AI分離開発
- **フロントエンドAI**: `backend/` ディレクトリを操作しない
- **バックエンドAI**: `frontend/` ディレクトリを操作しない
- 各AIは専用CLAUDE.mdのルールに従う