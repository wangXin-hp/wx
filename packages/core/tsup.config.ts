import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  bundle: false,
  clean: false,
  dts: false,
  sourcemap: true,
  splitting: false,
  target: 'es2022',
  outDir: 'dist',
  outExtension({ format }) {
    // package.json 的 import/require 会分别指向这两个扩展名。
    // 显式固定扩展名可以避免构建工具升级后产物名变化而破坏消费者。
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
})
