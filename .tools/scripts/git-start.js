#!/usr/bin/env node
/**
 * Git 开发前工作流脚本
 * 功能：自动切换到 develop 分支，拉取最新代码，创建新的功能分支
 *
 * 使用方法：
 *   node scripts/git-start.js <分支类型> <功能名称>
 *
 * 示例：
 *   node scripts/git-start.js feature user-login
 *   node scripts/git-start.js bugfix fix-memory-leak
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const BRANCH_TYPES = ['feature', 'bugfix', 'hotfix', 'release'];

function exec(command, options = {}) {
  try {
    return execSync(command, { encoding: 'utf-8', stdio: 'pipe', ...options });
  } catch (error) {
    console.error(`命令执行失败: ${command}`);
    console.error(error.stderr || error.message);
    process.exit(1);
  }
}

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  console.log('🚀 Git 开发前工作流\n');

  // 检查是否在 git 仓库中
  try {
    exec('git rev-parse --git-dir');
  } catch {
    console.error('❌ 当前目录不是 Git 仓库');
    process.exit(1);
  }

  // 检查工作区是否干净
  const status = exec('git status --porcelain');
  if (status.trim()) {
    console.error('❌ 工作区有未提交的更改，请先提交或暂存');
    console.log('\n当前更改:');
    console.log(exec('git status -s'));
    process.exit(1);
  }

  // 获取分支类型
  let branchType = process.argv[2];
  if (!branchType) {
    console.log('分支类型:');
    BRANCH_TYPES.forEach((type, index) => {
      console.log(`  ${index + 1}. ${type}`);
    });
    const typeIndex = await question('\n请选择分支类型 (1-4): ');
    branchType = BRANCH_TYPES[parseInt(typeIndex) - 1];
  }

  if (!BRANCH_TYPES.includes(branchType)) {
    console.error(`❌ 无效的分支类型: ${branchType}`);
    console.error(`支持的分支类型: ${BRANCH_TYPES.join(', ')}`);
    process.exit(1);
  }

  // 获取功能名称
  let featureName = process.argv[3];
  if (!featureName) {
    featureName = await question('\n请输入功能/问题名称 (如: user-login): ');
  }

  if (!featureName) {
    console.error('❌ 功能名称不能为空');
    process.exit(1);
  }

  // 规范化功能名称
  featureName = featureName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const branchName = `${branchType}/${featureName}`;

  console.log(`\n📋 工作流配置:`);
  console.log(`   分支类型: ${branchType}`);
  console.log(`   功能名称: ${featureName}`);
  console.log(`   完整分支名: ${branchName}`);

  const confirm = await question('\n确认开始工作流? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消');
    process.exit(0);
  }

  console.log('\n⏳ 开始执行工作流...\n');

  // 1. 切换到 develop 分支（hotfix 从 main 创建）
  const baseBranch = branchType === 'hotfix' ? 'main' : 'develop';
  console.log(`📌 切换到 ${baseBranch} 分支...`);
  exec(`git checkout ${baseBranch}`, { stdio: 'inherit' });

  // 2. 拉取最新代码
  console.log(`\n📥 拉取 ${baseBranch} 最新代码...`);
  exec(`git pull origin ${baseBranch}`, { stdio: 'inherit' });

  // 3. 创建新分支
  console.log(`\n🌿 创建新分支: ${branchName}...`);
  exec(`git checkout -b ${branchName}`, { stdio: 'inherit' });

  console.log(`\n✅ 工作流完成！`);
  console.log(`   当前分支: ${branchName}`);
  console.log(`   可以开始开发了！`);

  rl.close();
}

main().catch((error) => {
  console.error('❌ 发生错误:', error.message);
  rl.close();
  process.exit(1);
});
