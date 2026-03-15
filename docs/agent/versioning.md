# 版本号规范

项目采用语义化版本号（Semantic Versioning）规范。

## 版本号格式

```
主版本号.次版本号.修订号
MAJOR.MINOR.PATCH
```

## 版本号递增规则

| 版本类型 | 递增时机 | 示例 |
|---------|---------|------|
| **MAJOR** | 不兼容的 API 修改 | `1.x.x` → `2.0.0` |
| **MINOR** | 向下兼容的功能新增 | `1.1.x` → `1.2.0` |
| **PATCH** | 向下兼容的问题修复 | `1.1.1` → `1.1.2` |

## 版本号与 Commit 类型对应

| Commit 类型 | 版本号变化 | 说明 |
|------------|-----------|------|
| `feat` | `MINOR` 递增 | 新功能发布 |
| `fix` | `PATCH` 递增 | Bug 修复 |
| `BREAKING CHANGE` | `MAJOR` 递增 | 破坏性变更 |

## 版本号管理

- 版本号记录在 `uidp-editor/src-tauri/tauri.conf.json` 的 `version` 字段
- 版本号记录在 `uidp-editor/src-tauri/Cargo.toml` 的 `version` 字段
- 发布时两个文件需同步更新版本号

## 发布流程

1. 从 `develop` 创建 `release/vx.x.x` 分支
2. 更新版本号（修改 `tauri.conf.json` 和 `Cargo.toml`）
3. 推送到 `release` 分支触发自动打包
4. 测试通过后合并到 `main` 分支

```bash
# 示例：发布 v1.2.0
npm run git:start release v1.2.0
# 修改版本号后
npm run git:finish
# 推送到 release 分支触发打包
git push origin release/v1.2.0:release
```
