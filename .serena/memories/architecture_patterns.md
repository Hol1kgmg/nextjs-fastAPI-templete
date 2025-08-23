# アーキテクチャパターン

## 全体アーキテクチャ

### フルスタック構成
```
Next.js Frontend ←→ FastAPI Backend ←→ PostgreSQL
```

### API連携基盤
- **型安全なAPI通信**: OpenAPI/JSON Schema
- **統一状態管理**: Jotai Atomsファクトリー
- **エラーハンドリング**: @praha/byethrow Result型
- **スキーマ駆動開発**: Pydantic → TypeScript型変換

## フロントエンドアーキテクチャ

### Package by Feature構成
```
src/components/
├── ui/                    # shadcn/ui コンポーネント
├── shared/                # 機能横断で再利用
└── features/              # 機能固有コンポーネント
    └── user-management/   # 機能ごとにまとめる
        ├── UserList.tsx
        ├── userHandlers.ts      # 機能固有ロジック
        ├── useUserState.ts      # 機能固有フック
        └── types.ts             # 機能固有型
```

### データフロー（Entity/Gateway）

#### Entity: データ構造の核
```typescript
// src/entities/user/index.ts
import { z } from 'zod'

export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email()
})

export type User = z.infer<typeof UserSchema>
```

#### Gateway: 外部システムとの境界
```typescript
// src/gateways/user/index.ts
import { UserSchema, type User } from '@/entities/user'

export const fetchUserList = async (): Promise<User[]> => {
  const response = await fetch('/api/users')
  const rawData = await response.json()
  return UserSchema.array().parse(rawData) // 実行時バリデーション
}
```

### コンポーネント設計パターン

#### Server/Client Components分離
```typescript
// Server Component（デフォルト）
export default async function UserListPage() {
  const users = await fetchUserList()
  return <UserList users={users} />
}

// Client Component（必要時のみ）
'use client'
export function UserInteractiveComponent() {
  const [state, setState] = useState()
  // インタラクティブな機能のみ
}
```

#### Presenter分離パターン
```typescript
// presenter.ts - 表示ロジック分離
export const formatUserName = (user: User): string => {
  return user.isVip ? `⭐ ${user.name}` : user.name
}

// Component.tsx - 構造のみに専念
export function UserCard({ user }: { user: User }) {
  return <div>{formatUserName(user)}</div>
}
```

## バックエンドアーキテクチャ

### レイヤー構成
```
API Layer      → FastAPIルート・エンドポイント
Service Layer  → ビジネスロジック
Model Layer    → Pydanticモデル・スキーマ  
Database Layer → SQLAlchemy・マイグレーション
```

### Package by Feature適用
```
src/
├── api/
│   └── users/             # 機能別APIルート
│       ├── __init__.py
│       ├── routes.py      # エンドポイント定義
│       └── dependencies.py # 依存性注入
├── services/
│   └── user_service.py    # ユーザー関連ビジネスロジック
├── models/
│   └── user_models.py     # Pydanticモデル
└── db/
    ├── models/
    │   └── user.py        # SQLAlchemyモデル
    └── migrations/        # Alembicマイグレーション
```

### 型安全なAPI設計
```python
# models/user_models.py
from pydantic import BaseModel

class UserCreateRequest(BaseModel):
    name: str
    email: str

class UserResponse(BaseModel):
    id: int
    name: str  
    email: str

# api/users/routes.py
@router.post("/users", response_model=UserResponse)
async def create_user(user_data: UserCreateRequest) -> UserResponse:
    return await user_service.create_user(user_data)
```

## データベース設計パターン

### SQLAlchemyモデル
```python
# db/models/user.py
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(nullable=False)
    email: Mapped[str] = mapped_column(unique=True, nullable=False)
```

### 自動マイグレーション
- **Decision Tree**: モデル変更を分析して意味のあるファイル名を自動生成
- **統合管理**: Alembic + カスタム自動化ツール
- **安全性**: ダウングレード経路の安全性確認

## 状態管理パターン

### フロントエンド状態管理
```typescript
// Jotai Atoms活用
import { atom } from 'jotai'

export const userListAtom = atom<User[]>([])
export const selectedUserAtom = atom<User | null>(null)
```

### エラーハンドリング統一
```typescript
// Result型による安全なエラーハンドリング
import { Result } from '@praha/byethrow'

export const fetchUserSafely = async (): Promise<Result<User[], Error>> => {
  try {
    const users = await fetchUserList()
    return Result.ok(users)
  } catch (error) {
    return Result.err(new Error('ユーザー取得に失敗しました'))
  }
}
```

## テストアーキテクチャ

### テスト戦略の分離
```
Frontend Tests:
├── Component Tests     # UIコンポーネント
├── Logic Tests        # 純粋関数
├── Snapshot Tests     # HTML構造
└── Storybook         # 視覚的確認

Backend Tests:
├── API Tests         # エンドポイント
├── Service Tests     # ビジネスロジック
├── Model Tests       # Pydanticモデル
└── Database Tests    # CRUD操作
```

### テスト分離パターン
```typescript
// ロジックテスト - 純粋関数
describe('formatUserName関数', () => {
  test('VIPユーザーの場合、名前に⭐マークが追加されること', () => {
    const user = { name: '田中太郎', isVip: true }
    const actual = formatUserName(user)
    const expected = '⭐ 田中太郎'
    expect(actual).toBe(expected)
  })
})

// コンポーネントテスト - props制御
describe('UserCardコンポーネント', () => {
  test('VIPユーザーの場合、⭐マーク付きで表示されること', () => {
    const user = { name: '田中太郎', isVip: true }
    render(<UserCard user={user} />)
    expect(screen.getByText('⭐ 田中太郎')).toBeInTheDocument()
  })
})
```

## セキュリティパターン

### API認証・認可
```python
# FastAPI依存性注入によるセキュリティ
from fastapi import Depends, HTTPException, status

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # JWT検証ロジック
    pass

@router.get("/users/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    return UserResponse.from_orm(current_user)
```

### データ検証・サニタイゼーション
```python
# Pydanticによる自動バリデーション
class UserCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    
    @validator('email')
    def validate_email_domain(cls, v):
        # カスタムバリデーション
        return v
```

## パフォーマンス最適化パターン

### Next.js最適化
- **App Router活用**: Server ComponentsでSSRパフォーマンス向上
- **Image最適化**: next/imageによる自動最適化
- **Bundle分析**: 必要時のコード分割

### FastAPI最適化  
- **非同期処理**: async/awaitによる並行処理
- **データベース接続プール**: SQLAlchemyエンジン設定
- **キャッシング**: 適切なキャッシュ戦略

### PostgreSQL最適化
- **インデックス設計**: 適切なインデックス配置
- **クエリ最適化**: SQLAlchemyクエリの効率化
- **接続管理**: 接続プール適切な設定