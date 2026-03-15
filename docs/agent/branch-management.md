# 分支管理规范

## 分支命名规范

| 分支类型 | 命名格式 | 示例 |
|---------|---------|------|
| 主分支 | `main` | 用于生产环境 |
| 开发分支 | `develop` | 用于日常开发 |
| 功能分支 | `feature/<功能名>` | `feature/user-login` |
| 修复分支 | `bugfix/<问题描述>` | `bugfix/fix-memory-leak` |
| 紧急修复 | `hotfix/<问题描述>` | `hotfix/critical-security-patch` |
| 发布分支 | `release/<版本号>` | `release/v1.2.0` |

## 分支工作流程

1. 从 `develop` 创建功能分支进行开发
2. 功能完成后提交 PR 合并到 `develop`
3. 发布前从 `develop` 创建 `release` 分支
4. `release` 测试通过后合并到 `main` 和 `develop`
5. 生产环境紧急问题从 `main` 创建 `hotfix` 分支
