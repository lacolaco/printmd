import { defineConfig } from 'vitest/config';

// tools/ 配下 (lint ルール等の Node コード) 用。Angular の unit-test ビルダーは
// src 外のテストを発見できないため、独立した vitest 設定で回す
export default defineConfig({
  test: {
    include: ['tools/**/*.spec.ts'],
    environment: 'node',
  },
});
