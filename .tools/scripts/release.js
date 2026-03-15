#!/usr/bin/env node

/**
 * 自动发布脚本
 * 使用方法: node .tools/scripts/release.js [patch|minor|major]
 * 默认: patch
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const tauriConfigPath = path.join(rootDir, 'uidp-editor/src-tauri/tauri.conf.json');

const bumpType = process.argv[2] || 'patch';

if (!['patch', 'minor', 'major'].includes(bumpType)) {
  console.error('❌ 版本类型必须是 patch、minor 或 major');
  process.exit(1);
}

// 读取当前版本
const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
const currentVersion = tauriConfig.version;

console.log(`📦 当前版本: ${currentVersion}`);
console.log(`🚀 发布类型: ${bumpType}`);

// 解析版本号
const [major, minor, patch] = currentVersion.split('.').map(Number);

// 计算新版本
let newVersion;
if (bumpType === 'major') {
  newVersion = `${major + 1}.0.0`;
} else if (bumpType === 'minor') {
  newVersion = `${major}.${minor + 1}.0`;
} else {
  newVersion = `${major}.${minor}.${patch + 1}`;
}

console.log(`📝 新版本: ${newVersion}`);

// 确认发布
console.log('\n⚠️  即将执行以下操作:');
console.log(`  1. 更新版本号: ${currentVersion} → ${newVersion}`);
console.log(`  2. 提交更改`);
console.log(`  3. 创建标签: v${newVersion}`);
console.log(`  4. 推送到 origin (触发 GitHub Actions 自动打包发布)`);
console.log('');

// 更新 tauri.conf.json
tauriConfig.version = newVersion;
fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n');
console.log('✅ 已更新 tauri.conf.json');

// Git 操作
try {
  // 检查是否有未提交的更改
  const status = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf8' });
  if (status.trim()) {
    console.log('📋 提交版本更新...');
    execSync('git add .', { cwd: rootDir });
    execSync(`git commit -m "chore: bump version to ${newVersion}"`, { cwd: rootDir });
  }

  // 创建标签
  console.log(`🏷️  创建标签 v${newVersion}...`);
  execSync(`git tag -a v${newVersion} -m "Release v${newVersion}"`, { cwd: rootDir });

  // 推送
  console.log('📤 推送到 origin...');
  execSync('git push origin HEAD', { cwd: rootDir });
  execSync(`git push origin v${newVersion}`, { cwd: rootDir });

  console.log('');
  console.log('✨ 发布成功!');
  console.log(`   标签: v${newVersion}`);
  console.log(`   查看发布进度: https://github.com/lemonkiller/uidp/actions`);
  console.log(`   发布页面: https://github.com/lemonkiller/uidp/releases`);

} catch (error) {
  console.error('❌ 发布失败:', error.message);
  process.exit(1);
}
