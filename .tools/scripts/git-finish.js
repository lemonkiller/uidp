#!/usr/bin/env node
/**
 * Git 开发后工作流脚本
 * 功能：自动提交更改、推送到远程仓库
 *
 * 使用方法：
 *   node scripts/git-finish.js [commit-message]
 *
 * 示例：
 *   node scripts/git-finish.js "feat(auth): 添加用户登录功能"
 *   node scripts/git-finish.js
 */

import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const COMMIT_TYPES = [
  { type: 'feat', desc: '新功能' },
  { type: 'fix', desc: '修复bug' },
  { type: 'docs', desc: '文档更新' },
  { type: 'style', desc: '代码格式调整' },
  { type: 'refactor', desc: '代码重构' },
  { type: 'perf', desc: '性能优化' },
  { type: 'test', desc: '测试相关' },
  { type: 'chore', desc: '构建/工具/依赖更新' }
];

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
  console.log('🚀 Git 开发后工作流\n');

  // 检查是否在 git 仓库中
  try {
    exec('git rev-parse --git-dir');
  } catch {
    console.error('❌ 当前目录不是 Git 仓库');
    process.exit(1);
  }

  // 获取当前分支
  const currentBranch = exec('git branch --show-current').trim();
  console.log(`📌 当前分支: ${currentBranch}`);

  // 检查是否有更改要提交
  const status = exec('git status --porcelain');
  if (!status.trim()) {
    console.log('\n⚠️ 工作区没有更改需要提交');

    // 检查是否有未推送的提交
    const unpushed = exec(`git log origin/${currentBranch}..${currentBranch} --oneline 2>nul || echo ""`).trim();
    if (unpushed) {
      console.log('\n📤 有未推送的提交:');
      console.log(unpushed);

      const pushConfirm = await question('\n是否推送到远程? (y/n): ');
      if (pushConfirm.toLowerCase() === 'y') {
        console.log(`\n📤 推送到 origin/${currentBranch}...`);
        exec(`git push origin ${currentBranch}`, { stdio: 'inherit' });
        console.log('\n✅ 推送完成！');
      }
    }

    rl.close();
    return;
  }

  // 显示当前更改
  console.log('\n📋 当前更改:');
  console.log(exec('git status -s'));

  // 获取提交类型
  let commitType = '';
  const argMessage = process.argv[2];

  // 如果命令行提供了完整提交信息，解析它
  if (argMessage) {
    const match = argMessage.match(/^(\w+)(\(.+\))?:/);
    if (match) {
      commitType = match[1];
    }
  }

  if (!commitType) {
    console.log('\n提交类型:');
    COMMIT_TYPES.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.type.padEnd(8)} - ${item.desc}`);
    });
    const typeIndex = await question('\n请选择提交类型 (1-8): ');
    commitType = COMMIT_TYPES[parseInt(typeIndex) - 1]?.type;
  }

  if (!commitType) {
    console.error('❌ 无效的提交类型');
    process.exit(1);
  }

  // 获取 scope
  let scope = '';
  if (!argMessage || !argMessage.includes('(')) {
    scope = await question('\n请输入 scope (模块/组件名，可选，直接回车跳过): ');
  } else {
    const match = argMessage.match(/\((.+?)\)/);
    if (match) scope = match[1];
  }

  // 获取提交描述
  let subject = '';
  if (argMessage) {
    const match = argMessage.match(/:\s*(.+)$/);
    if (match) subject = match[1];
  }

  if (!subject) {
    subject = await question('\n请输入提交描述: ');
  }

  if (!subject) {
    console.error('❌ 提交描述不能为空');
    process.exit(1);
  }

  // 构建提交信息
  const scopeStr = scope ? `(${scope})` : '';
  const commitMessage = `${commitType}${scopeStr}: ${subject}`;

  console.log(`\n📋 提交信息:`);
  console.log(`   ${commitMessage}`);

  // 询问是否需要详细描述
  const needBody = await question('\n是否需要添加详细描述? (y/n): ');
  let fullMessage = commitMessage;

  if (needBody.toLowerCase() === 'y') {
    console.log('\n请输入详细描述 (多行，输入空行结束):');
    const lines = [];
    while (true) {
      const line = await question('');
      if (line === '' && lines.length > 0 && lines[lines.length - 1] === '') {
        lines.pop();
        break;
      }
      lines.push(line);
    }
    if (lines.length > 0) {
      fullMessage = `${commitMessage}\n\n${lines.join('\n')}`;
    }
  }

  const confirm = await question('\n确认提交? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('已取消');
    rl.close();
    return;
  }

  console.log('\n⏳ 开始执行工作流...\n');

  // 1. 添加所有更改
  console.log('📦 添加更改到暂存区...');
  exec('git add .', { stdio: 'inherit' });

  // 2. 提交
  console.log('\n📝 创建提交...');
  exec(`git commit -m "${fullMessage}"`, { stdio: 'inherit' });

  // 3. 推送
  console.log(`\n📤 推送到 origin/${currentBranch}...`);
  exec(`git push origin ${currentBranch}`, { stdio: 'inherit' });

  console.log('\n✅ 工作流完成！');
  console.log(`   提交: ${commitMessage}`);
  console.log(`   分支: ${currentBranch}`);

  // 提示创建 PR
  console.log('\n💡 提示:');
  console.log('   如需创建 Pull Request，请访问远程仓库页面');

  rl.close();
}

main().catch((error) => {
  console.error('❌ 发生错误:', error.message);
  rl.close();
  process.exit(1);
});
