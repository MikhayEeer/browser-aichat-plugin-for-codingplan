const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 检查 sharp 是否安装
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('正在安装 sharp...');
  execSync('npm install sharp', { stdio: 'inherit' });
  sharp = require('sharp');
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');
// 优先使用 PNG，如果没有则使用 JPG
const sourcePng = path.join(assetsDir, 'cat-has-question.png');
const sourceJpg = path.join(assetsDir, 'cat-has-question.jpg');
const sourceImage = fs.existsSync(sourcePng) ? sourcePng : sourceJpg;

async function convertImage() {
  console.log(`开始转换 ${path.basename(sourceImage)}...\n`);

  const conversions = [
    { output: 'icon16.png', size: 16 },
    { output: 'icon48.png', size: 48 },
    { output: 'icon128.png', size: 128 },
    { output: 'float-icon.png', size: 48 }
  ];

  // 先获取原图信息
  const image = sharp(sourceImage);
  const metadata = await image.metadata();
  console.log(`原图尺寸: ${metadata.width}x${metadata.height}`);
  console.log(`原图格式: ${metadata.format}\n`);

  for (const item of conversions) {
    const outputPath = path.join(assetsDir, item.output);

    try {
      // 对于小尺寸图标，需要特别处理以确保清晰
      await sharp(sourceImage)
        .resize(item.size, item.size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 } // 透明背景
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ 已生成 ${item.output} (${item.size}x${item.size})`);
    } catch (err) {
      console.log(`✗ ${item.output} 生成失败:`, err.message);
    }
  }

  console.log('\n转换完成!');
  console.log('\n提示: 如需圆形裁剪或其他效果，请修改脚本中的 resize 参数');
}

convertImage().catch(console.error);