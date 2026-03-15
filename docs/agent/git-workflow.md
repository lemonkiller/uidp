# Git 自动化工作流

项目提供自动化脚本简化 Git 操作，确保符合规范。

## 快速开始

```bash
# 开发前 - 创建功能分支
npm run git:start

# 开发后 - 提交并推送
npm run git:finish
```

## git:start - 开发前工作流

自动完成以下步骤：
1. 检查工作区是否干净
2. 选择分支类型（feature/bugfix/hotfix/release）
3. 切换到基础分支（develop 或 main）
4. 拉取最新代码
5. 创建并切换到新分支

### 使用方法

```bash
# 交互式（推荐）
npm run git:start

# 命令行参数
node .tools/scripts/git-start.js feature user-login
node .tools/scripts/git-start.js bugfix fix-memory-leak
```

## git:finish - 开发后工作流

自动完成以下步骤：
1. 显示当前更改
2. 选择提交类型（feat/fix/docs/style/refactor/perf/test/chore）
3. 输入 scope 和提交描述
4. 可选添加详细描述
5. 自动 `git add .`、`git commit`、`git push`

### 使用方法

```bash
# 交互式（推荐）
npm run git:finish

# 命令行参数
node .tools/scripts/git-finish.js "feat(auth): 添加用户登录功能"
```
