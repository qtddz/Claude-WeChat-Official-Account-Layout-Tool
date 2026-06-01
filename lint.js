#!/usr/bin/env node
/**
 * Claude 排版工具自动审查脚本
 * 用于验证 HTML 文件的结构完整性和关键功能
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILE = path.join(__dirname, 'index.html');
const BACKUP_FILE = path.join(__dirname, 'index.html.backup');

// 审查规则
const RULES = {
  // 1. 检查关键 HTML 结构
  htmlStructure: {
    name: 'HTML 结构完整性',
    checks: [
      { pattern: /<html[^>]*>/, desc: '存在 <html> 标签' },
      { pattern: /<\/html>/, desc: '存在 </html> 标签' },
      { pattern: /<head>/, desc: '存在 <head> 标签' },
      { pattern: /<\/head>/, desc: '存在 </head> 标签' },
      { pattern: /<body>/, desc: '存在 <body> 标签' },
      { pattern: /<\/body>/, desc: '存在 </body> 标签' },
    ]
  },
  
  // 2. 检查关键 JavaScript 函数
  criticalFunctions: {
    name: '关键功能函数',
    checks: [
      { pattern: /function\s+parseMarkdown\s*\(/, desc: 'parseMarkdown 函数存在' },
      { pattern: /function\s+handleImageDrop\s*\(/, desc: 'handleImageDrop 函数存在' },
      { pattern: /function\s+initImageDragUpload\s*\(/, desc: 'initImageDragUpload 函数存在' },
      { pattern: /function\s+copyHTML\s*\(/, desc: 'copyHTML 函数存在' },
      { pattern: /function\s+generateExportHTML\s*\(/, desc: 'generateExportHTML 函数存在' },
      { pattern: /const\s+ImageStore\s*=/, desc: 'ImageStore 对象存在' },
      { pattern: /function\s+convertBlobUrlsToBase64\s*\(/, desc: 'convertBlobUrlsToBase64 函数存在' },
    ]
  },
  
  // 3. 检查关键 DOM 元素
  criticalElements: {
    name: '关键 DOM 元素',
    checks: [
      { pattern: /id="markdown-input"/, desc: '存在 markdown-input 元素' },
      { pattern: /id="article-preview"/, desc: '存在 article-preview 元素' },
      { pattern: /id="preview-container"/, desc: '存在 preview-container 元素' },
    ]
  },
  
  // 4. 检查语法错误（简单检查）
  syntaxCheck: {
    name: '基础语法检查',
    checks: [
      { pattern: /const\s+THEMES\s*=/, desc: 'THEMES 定义存在' },
      { pattern: /<\/style>\s*[\s\S]{0,50}<\/head>/, desc: '样式标签正确关闭' },
    ]
  },
  
  // 5. 检查新功能实现
  newFeatureCheck: {
    name: '新功能实现检查',
    checks: [
      { pattern: /img:\/\//, desc: '使用了 img:// 短引用格式' },
      { pattern: /URL\.createObjectURL/, desc: '使用了 Blob URL' },
      { pattern: /resolveMarkdown/, desc: '存在 resolveMarkdown 方法' },
      { pattern: /blobUrlToBase64/, desc: '存在 blobUrlToBase64 方法' },
    ]
  }
};

function runLint() {
  console.log('🔍 开始审查 Claude 排版工具...\n');
  
  // 读取文件
  let content;
  try {
    content = fs.readFileSync(TARGET_FILE, 'utf-8');
  } catch (e) {
    console.error('❌ 无法读取目标文件:', e.message);
    return { passed: false, error: '文件读取失败' };
  }
  
  let totalChecks = 0;
  let passedChecks = 0;
  const errors = [];
  
  // 运行所有规则
  for (const [ruleName, rule] of Object.entries(RULES)) {
    console.log(`📋 ${rule.name}`);
    
    for (const check of rule.checks) {
      totalChecks++;
      if (check.pattern.test(content)) {
        passedChecks++;
        console.log(`  ✅ ${check.desc}`);
      } else {
        errors.push(`${rule.name}: ${check.desc}`);
        console.log(`  ❌ ${check.desc}`);
      }
    }
    console.log('');
  }
  
  // 统计结果
  const passRate = (passedChecks / totalChecks * 100).toFixed(1);
  console.log(`📊 审查结果: ${passedChecks}/${totalChecks} 通过 (${passRate}%)`);
  
  if (errors.length > 0) {
    console.log('\n❌ 未通过的检查项:');
    errors.forEach(err => console.log(`   - ${err}`));
    return { passed: false, errors };
  }
  
  console.log('\n✅ 所有检查通过！');
  return { passed: true };
}

function rollback() {
  console.log('\n🔄 审查未通过，正在回滚到备份版本...');
  
  try {
    if (!fs.existsSync(BACKUP_FILE)) {
      console.error('❌ 备份文件不存在，无法回滚');
      return false;
    }
    
    fs.copyFileSync(BACKUP_FILE, TARGET_FILE);
    console.log('✅ 已回滚到备份版本');
    return true;
  } catch (e) {
    console.error('❌ 回滚失败:', e.message);
    return false;
  }
}

function main() {
  const result = runLint();
  
  if (!result.passed) {
    console.log('\n⚠️  审查未通过，准备回滚...');
    const rollbackSuccess = rollback();
    
    if (rollbackSuccess) {
      console.log('\n💡 请修复以下问题后重新修改:');
      result.errors.forEach(err => console.log(`   - ${err}`));
      process.exit(1);
    } else {
      console.error('\n❌ 回滚失败，请手动检查文件状态');
      process.exit(2);
    }
  }
  
  console.log('\n🎉 审查通过，修改已确认');
  process.exit(0);
}

main();