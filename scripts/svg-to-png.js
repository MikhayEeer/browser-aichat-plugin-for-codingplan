/**
 * SVG 转 PNG 转换脚本
 *
 * 使用方法:
 * 1. 安装依赖: npm install sharp
 * 2. 运行: node scripts/svg-to-png.js
 *
 * 或者手动转换:
 * - 使用在线工具如 https://cloudconvert.com/svg-to-png
 * - 使用 Figma/Sketch 等设计工具导出
 */

const fs = require('fs');
const path = require('path');

// 检查是否有 sharp 库
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('未安装 sharp 库，请使用以下方法之一转换:');
  console.log('');
  console.log('方法 1: 安装 sharp 并运行此脚本');
  console.log('  npm install sharp');
  console.log('  node scripts/svg-to-png.js');
  console.log('');
  console.log('方法 2: 使用在线工具');
  console.log('  https://cloudconvert.com/svg-to-png');
  console.log('  https://convertio.co/svg-png/');
  console.log('');
  console.log('方法 3: 使用设计工具导出');
  console.log('  Figma / Sketch / Illustrator 导出 PNG');
  process.exit(0);
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');

const conversions = [
  { svg: 'icon16.svg', png: 'icon16.png', size: 16 },
  { svg: 'icon48.svg', png: 'icon48.png', size: 48 },
  { svg: 'icon128.svg', png: 'icon128.png', size: 128 },
  { svg: 'float-icon.svg', png: 'float-icon.png', size: 48 }
];

async function convert() {
  console.log('开始转换 SVG 到 PNG...\n');

  for (const item of conversions) {
    const svgPath = path.join(assetsDir, item.svg);
    const pngPath = path.join(assetsDir, item.png);

    if (!fs.existsSync(svgPath)) {
      console.log(`跳过 ${item.svg} - 文件不存在`);
      continue;
    }

    try {
      await sharp(svgPath)
        .resize(item.size, item.size)
        .png()
        .toFile(pngPath);

      console.log(`✓ ${item.svg} -> ${item.png} (${item.size}x${item.size})`);
    } catch (err) {
      console.log(`✗ ${item.svg} 转换失败:`, err.message);
    }
  }

  console.log('\n转换完成!');
}

convert();