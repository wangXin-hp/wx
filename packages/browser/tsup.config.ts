import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // browser 包新增了多个内部 Integration 模块；合并它们可以避免消费者解析无扩展名相对导入。
  bundle: true,
  clean: false,
  dts: false,
  sourcemap: true,
  splitting: false,
  target: 'es2022',
  outDir: 'dist',
  external: ['@trace-kit/core'],
  outExtension({ format }) {
    // browser 包不内联 core：消费者显式依赖两个包，版本边界更清楚，
    // 也能避免多个上层包各自打入一份 core 代码。
    return { js: format === 'cjs' ? '.cjs' : '.js' }
  },
})
