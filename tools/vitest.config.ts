import { defineConfig } from 'vitest/config';

// tools/ 配下 (lint ルール等の Node コード) 用。Angular の unit-test ビルダーは
// src 外のテストを発見できないため、独立した vitest 設定で回す。
// root を明示しないと実行時 cwd になり src のテストまで拾ってしまう
export default defineConfig({
  root: import.meta.dirname,
  test: {
    include: ['**/*.spec.ts'],
    environment: 'node',
  },
});
