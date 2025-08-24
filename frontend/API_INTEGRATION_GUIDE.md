# API統合基盤 使用ガイド

このドキュメントは、Next.js + FastAPI テンプレートのAPI統合基盤の使用方法を説明します。

## 🏗️ アーキテクチャ概要

### 共通基盤の構成

```
src/
├── atoms/           # Jotai Atoms（状態管理）
│   ├── baseAtoms.ts # APIステートファクトリー
│   └── index.ts     # エクスポート
├── actions/         # Server Actions
│   ├── baseActions.ts # Server Action用ヘルパー
│   └── index.ts     # エクスポート
├── types/           # 型定義
│   ├── baseTypes.ts # 共通型定義
│   └── index.ts     # エクスポート
└── lib/server/      # サーバー専用ユーティリティ
    └── apiConfig.ts # API設定（server-only）
```

## 🚀 新機能の実装方法

### 1. 型定義の作成

```typescript
// src/features/[feature]/types/[feature]Types.ts
export type FeatureResponse = {
  id: string;
  name: string;
  // ... その他のフィールド
};

export type FeatureApiError = {
  message: string;
  code: 'FEATURE_ERROR' | 'VALIDATION_ERROR';
  timestamp: string;
  details?: unknown;
};
```

### 2. Atoms（状態管理）の実装

```typescript
// src/features/[feature]/atoms/[feature]Atoms.ts
import { createApiStateAtoms } from '@/atoms';
import type { FeatureResponse } from '../types/featureTypes';
import type { ApiError } from '@/types';

const {
  dataAtom: featureDataAtom,
  loadingAtom: featureLoadingAtom,
  errorAtom: featureErrorAtom,
  stateAtom: featureStateAtom,
} = createApiStateAtoms<FeatureResponse, ApiError>();

export {
  featureDataAtom,
  featureLoadingAtom,
  featureErrorAtom,
  featureStateAtom,
};
```

### 3. Server Actions の実装

```typescript
// src/features/[feature]/server/[feature]Server.ts
import { createApiAction, createPostApiAction } from '@/actions';
import type { FeatureResponse } from '../types/featureTypes';
import type { ApiError } from '@/types';

export const getFeatureAction = async () => {
  return createApiAction<FeatureResponse>('/api/feature');
};

export const createFeatureAction = async (data: CreateFeatureRequest) => {
  return createPostApiAction<CreateFeatureRequest, FeatureResponse>('/api/feature', data);
};
```

### 4. Route Handler の実装

```typescript
// src/app/api/[feature]/route.ts
import { createApiAction } from '@/actions';
import type { FeatureResponse } from '@/features/feature/types/featureTypes';

export async function GET() {
  const result = await createApiAction<FeatureResponse>('/feature');
  
  if (!result.isOk()) {
    return Response.json(result.error, { status: 500 });
  }
  
  return Response.json(result.value);
}
```

### 5. Client Component の実装

```typescript
// src/features/[feature]/components/FeatureStatus.tsx
'use client';

import { useAtom } from 'jotai';
import { featureStateAtom } from '../atoms/featureAtoms';

export function FeatureStatus() {
  const [state] = useAtom(featureStateAtom);
  
  if (state.loading) return <div>Loading...</div>;
  if (state.error) return <div>Error: {state.error.message}</div>;
  if (state.data) return <div>Data: {JSON.stringify(state.data)}</div>;
  
  return <div>No data</div>;
}
```

## 🛠️ 開発のベストプラクティス

### エラーハンドリング

- Server Actions: `Result`型を使用
- Client Components: Atomsのerror状態を使用
- Route Handlers: 適切なHTTPステータスコードを返却

### 型安全性

- 全てのAPI呼び出しで型パラメータを指定
- 共通基盤の型定義を活用
- TypeScriptの厳密モードを使用

### パフォーマンス

- CSR: リアルタイム更新が必要な場合
- SSR: SEOや初期表示速度が重要な場合
- 適切な使い分けを行う

## 🧪 テスト方法

### 単体テスト

```typescript
// Atomsのテスト例
import { createApiStateAtoms } from '@/atoms';

describe('API State Atoms', () => {
  test('should create atoms with correct initial state', () => {
    const { stateAtom } = createApiStateAtoms<string, Error>();
    // テスト実装
  });
});
```

### 統合テスト

1. 開発サーバー起動: `bun run dev`
2. 各エンドポイントの動作確認
3. エラーハンドリングの確認
4. 状態管理の動作確認

## 📚 参考資料

- [Next.js App Router](https://nextjs.org/docs/app)
- [Jotai](https://jotai.org/)
- [@praha/byethrow](https://github.com/praha-inc/byethrow)
- [shadcn/ui](https://ui.shadcn.com/)