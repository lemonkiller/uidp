# Git 使用规范

## 自动化工作流

项目提供自动化脚本简化 Git 操作，确保符合规范。

### 快速开始

```bash
# 开发前 - 创建功能分支
npm run git:start

# 开发后 - 提交并推送
npm run git:finish
```

### git:start - 开发前工作流

自动完成以下步骤：
1. 检查工作区是否干净
2. 选择分支类型（feature/bugfix/hotfix/release）
3. 切换到基础分支（develop 或 main）
4. 拉取最新代码
5. 创建并切换到新分支

**使用方法：**
```bash
# 交互式（推荐）
npm run git:start

# 命令行参数
node .tools/scripts/git-start.js feature user-login
node .tools/scripts/git-start.js bugfix fix-memory-leak
```

### git:finish - 开发后工作流

自动完成以下步骤：
1. 显示当前更改
2. 选择提交类型（feat/fix/docs/style/refactor/perf/test/chore）
3. 输入 scope 和提交描述
4. 可选添加详细描述
5. 自动 `git add .`、`git commit`、`git push`

**使用方法：**
```bash
# 交互式（推荐）
npm run git:finish

# 命令行参数
node .tools/scripts/git-finish.js "feat(auth): 添加用户登录功能"
```

---

## 分支管理

### 分支命名规范
- `main` - 主分支，用于生产环境
- `develop` - 开发分支，用于日常开发
- `feature/<功能名>` - 功能分支，如 `feature/user-login`
- `bugfix/<问题描述>` - 修复分支，如 `bugfix/fix-memory-leak`
- `hotfix/<问题描述>` - 紧急修复分支，如 `hotfix/critical-security-patch`
- `release/<版本号>` - 发布分支，如 `release/v1.2.0`

### 分支工作流程
1. 从 `develop` 创建功能分支进行开发
2. 功能完成后提交 PR 合并到 `develop`
3. 发布前从 `develop` 创建 `release` 分支
4. `release` 测试通过后合并到 `main` 和 `develop`
5. 生产环境紧急问题从 `main` 创建 `hotfix` 分支

## 提交规范

### Commit Message 格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具/依赖更新

### 示例
```
feat(auth): 添加用户登录功能

实现基于JWT的用户认证系统，包括：
- 登录接口
- Token刷新机制
- 登出功能

Closes #123
```

## 代码提交前检查

1. 确保代码可以正常编译/构建
2. 运行测试确保通过
3. 检查代码风格是否符合项目规范
4. 检查是否包含敏感信息（密码、密钥等）
5. 检查 `.gitignore` 是否正确配置

## .gitignore 规范

项目已配置 `.gitignore`，包含：
- 依赖目录：`node_modules/`
- 构建输出：`dist/`, `dist-ssr/`
- 日志文件：`*.log`
- 环境文件：`.env`, `.env.local`
- 编辑器配置：`.vscode/`, `.idea/`
- Tauri 构建产物：`src-tauri/target/`
- 系统文件：`.DS_Store`

## Pull Request 规范

1. PR 标题清晰描述变更内容
2. 填写 PR 描述模板，说明变更原因和影响
3. 关联相关 Issue
4. 确保 CI 检查通过
5. 需要至少 1 个 Reviewer 批准
6. 使用 Squash Merge 保持提交历史整洁
