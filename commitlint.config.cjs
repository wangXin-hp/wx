const scopes = ['repo', 'core', 'browser', 'playground', 'docs', 'deps', 'release']

/** @type {import('cz-git').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // scope 与 monorepo 的真实边界保持一致，避免出现无法检索的随意分类。
    // scope 可以省略；一旦填写，就必须来自这个列表。
    'scope-enum': [2, 'always', scopes],
    'header-max-length': [2, 'always', 100],
  },
  prompt: {
    messages: {
      type: '请选择本次提交的类型：',
      scope: '请选择影响范围（可跳过）：',
      subject: '请用简短的祈使句描述变更：\n',
      body: '补充详细说明（可选，使用 | 换行）：\n',
      breaking: '描述破坏性变更（可选，使用 | 换行）：\n',
      footer: '填写关联 Issue（可选，例如 #12）：\n',
      confirmCommit: '确认使用以上提交信息？',
    },
    types: [
      { value: 'feat', name: 'feat:     新增功能' },
      { value: 'fix', name: 'fix:      修复缺陷' },
      { value: 'docs', name: 'docs:     文档变更' },
      { value: 'style', name: 'style:    只调整格式，不改变行为' },
      { value: 'refactor', name: 'refactor: 重构，既不修复缺陷也不新增功能' },
      { value: 'perf', name: 'perf:     性能优化' },
      { value: 'test', name: 'test:     测试新增或调整' },
      { value: 'build', name: 'build:    构建系统或依赖变更' },
      { value: 'ci', name: 'ci:       持续集成配置变更' },
      { value: 'chore', name: 'chore:    其他维护性变更' },
      { value: 'revert', name: 'revert:   回退已有提交' },
    ],
    scopes,
    allowCustomScopes: false,
    allowEmptyScopes: true,
    useEmoji: false,
    confirmColorize: true,
    maxHeaderLength: 100,
  },
}
