import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // Core 的内部模块不是独立发布入口；合并后 ESM 产物不依赖消费者解析无扩展名的相对导入。
  bundle: true,
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
