# API使用ガイド

## 概要

このAPIは、Next.jsフロントエンドとの連携を前提としたRESTful APIです。
クリーンアーキテクチャベースで設計され、型安全性とフロントエンド開発者の使いやすさを重視しています。

## ベースURL

- **開発環境**: `http://localhost:8000`
- **本番環境**: `https://api.example.com`

## OpenAPI仕様書

開発サーバー起動後、以下のURLでSwagger UIを確認できます：
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`
- **OpenAPIスキーマ**: `http://localhost:8000/openapi.json`

## 認証

現在は認証なしでアクセス可能です。将来的にはJWT認証の実装を予定しています。

## エラーハンドリング

すべてのエラーは統一された形式で返されます：

```json
{
  "error": true,
  "message": "エラーメッセージ",
  "timestamp": "2025-08-24T15:30:00.000Z",
  "path": "/api/examples/999"
}
```

### HTTPステータスコード

| コード | 説明 | 使用場面 |
|--------|------|----------|
| 200 | OK | 正常な取得・更新・削除 |
| 201 | Created | 新規作成成功 |
| 400 | Bad Request | リクエスト形式エラー |
| 404 | Not Found | リソースが見つからない |
| 422 | Unprocessable Entity | バリデーションエラー |
| 500 | Internal Server Error | サーバー内部エラー |

## ページネーション

リストAPIは以下の形式でページネーション情報を返します：

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "per_page": 10,
  "pages": 10
}
```

### クエリパラメータ

- **page**: ページ番号（デフォルト: 1）
- **per_page**: 1ページあたりの件数（デフォルト: 10、最大: 100）

## API エンドポイント

### Health API

システムの状態監視を行うAPIです。

#### GET /api/health/
詳細なシステムヘルス情報を取得します。

**レスポンス例**:
```json
{
  "status": "healthy",
  "timestamp": "2025-08-24T15:30:00.000Z",
  "message": "All systems operational",
  "metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 62.8,
    "disk_usage": 23.1,
    "uptime_seconds": 86400
  },
  "version": "1.0.0"
}
```

#### GET /api/health/simple
軽量なヘルスチェックです。

**レスポンス例**:
```json
{
  "status": "ok"
}
```

### Examples API

サンプルデータのCRUD操作を行うAPIです。

#### POST /api/examples/
新しいExampleを作成します。

**リクエスト例**:
```json
{
  "name": "Sample Example",
  "description": "This is a sample example"
}
```

**レスポンス例**:
```json
{
  "id": 1,
  "name": "Sample Example",
  "description": "This is a sample example",
  "is_active": true,
  "created_at": "2025-08-24T15:30:00.000Z",
  "updated_at": "2025-08-24T15:30:00.000Z"
}
```

#### GET /api/examples/
Exampleのリストを取得します（ページネーション対応）。

**クエリパラメータ**:
- `page`: ページ番号
- `per_page`: 1ページあたりの件数
- `search`: 名前での部分一致検索

**レスポンス例**:
```json
{
  "items": [
    {
      "id": 1,
      "name": "Sample Example",
      "description": "This is a sample example",
      "is_active": true,
      "created_at": "2025-08-24T15:30:00.000Z",
      "updated_at": "2025-08-24T15:30:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "per_page": 10,
  "pages": 1
}
```

#### GET /api/examples/{example_id}
指定されたExampleの詳細を取得します。

#### PUT /api/examples/{example_id}
指定されたExampleを更新します。

**リクエスト例**:
```json
{
  "name": "Updated Example",
  "description": "This is an updated example",
  "is_active": false
}
```

#### DELETE /api/examples/{example_id}
指定されたExampleを削除します。

**レスポンス例**:
```json
{
  "message": "Example deleted successfully"
}
```

## フロントエンド連携

### TypeScript型定義

バックエンドのPydanticモデルに対応するTypeScript型定義を作成してください：

```typescript
// Example関連の型定義
interface ExampleBase {
  name: string;
  description?: string | null;
}

interface ExampleCreate extends ExampleBase {}

interface ExampleUpdate extends Partial<ExampleBase> {
  is_active?: boolean;
}

interface ExampleResponse extends ExampleBase {
  id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ExampleListResponse {
  items: ExampleResponse[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

// Health API関連の型定義
interface SystemMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  uptime_seconds: number;
}

interface HealthResponse {
  status: "healthy" | "warning" | "unhealthy";
  timestamp: string;
  message: string;
  metrics: SystemMetrics;
  version: string;
}

// エラーレスポンス型定義
interface ErrorResponse {
  error: boolean;
  message: string;
  timestamp: string;
  path: string;
}
```

### Result型対応

エラーハンドリングはResult型パターンに対応しています：

```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// 使用例
async function fetchExample(id: number): Promise<Result<ExampleResponse>> {
  try {
    const response = await fetch(`/api/examples/${id}`);
    
    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Network error" };
  }
}
```

### API クライアント例

```typescript
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  // Examples API
  async createExample(data: ExampleCreate): Promise<Result<ExampleResponse>> {
    return this.request('POST', '/api/examples/', data);
  }

  async getExamples(params?: {
    page?: number;
    per_page?: number;
    search?: string;
  }): Promise<Result<ExampleListResponse>> {
    const queryString = new URLSearchParams(
      Object.entries(params || {}).map(([k, v]) => [k, String(v)])
    ).toString();
    
    return this.request('GET', `/api/examples/?${queryString}`);
  }

  async getExample(id: number): Promise<Result<ExampleResponse>> {
    return this.request('GET', `/api/examples/${id}`);
  }

  async updateExample(id: number, data: ExampleUpdate): Promise<Result<ExampleResponse>> {
    return this.request('PUT', `/api/examples/${id}`, data);
  }

  async deleteExample(id: number): Promise<Result<{ message: string }>> {
    return this.request('DELETE', `/api/examples/${id}`);
  }

  // Health API
  async getHealth(): Promise<Result<HealthResponse>> {
    return this.request('GET', '/api/health/');
  }

  // 共通リクエストメソッド
  private async request<T>(
    method: string, 
    path: string, 
    body?: unknown
  ): Promise<Result<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.message };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  }
}

// 使用例
const api = new ApiClient();

// Example作成
const createResult = await api.createExample({
  name: "New Example",
  description: "Example description"
});

if (createResult.success) {
  console.log("Created:", createResult.data);
} else {
  console.error("Error:", createResult.error);
}
```

## 開発ツール

### cURL例

```bash
# Health check
curl -X GET "http://localhost:8000/api/health/"

# Create Example
curl -X POST "http://localhost:8000/api/examples/" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Example", "description": "Test description"}'

# Get Examples with pagination
curl -X GET "http://localhost:8000/api/examples/?page=1&per_page=10&search=test"

# Update Example
curl -X PUT "http://localhost:8000/api/examples/1" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Example", "is_active": false}'

# Delete Example
curl -X DELETE "http://localhost:8000/api/examples/1"
```

## バリデーション

### Example作成・更新時のバリデーション

- **name**: 
  - 必須（作成時）
  - 1-100文字
  - 文字列型
  
- **description**: 
  - 任意
  - 最大1000文字
  - 文字列型またはnull

- **is_active** (更新時のみ):
  - 任意
  - boolean型

### バリデーションエラー例

```json
{
  "detail": [
    {
      "type": "string_too_short",
      "loc": ["body", "name"],
      "msg": "String should have at least 1 character",
      "input": ""
    }
  ]
}
```

## パフォーマンス

### レスポンス時間目標
- **Health API**: < 100ms
- **Examples API (単体取得)**: < 200ms
- **Examples API (リスト取得)**: < 500ms

### 推奨事項
- ページネーションを使用してリスト取得の負荷を軽減
- 必要な場合のみ検索機能を使用
- 適切なエラーハンドリングを実装

## サポート

### 問い合わせ先
- **技術サポート**: support@example.com
- **GitHub Issues**: [プロジェクトリポジトリ]

### よくある質問

**Q: データベースはどのような構成ですか？**
A: PostgreSQL 15+を使用し、SQLAlchemy 2.0でORMマッピングしています。

**Q: 認証は今後追加されますか？**
A: はい、JWT認証の実装を予定しています。

**Q: ページネーションの最大件数制限はありますか？**
A: per_pageパラメータは最大100件までです。

**Q: エラーが発生した場合のデバッグ方法は？**
A: レスポンスのtimestampとpathを使用してサーバーログを確認してください。