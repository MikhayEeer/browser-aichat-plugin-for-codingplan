// 生成图标的 Node.js 脚本
// 运行方式: node generate-icons.js

const fs = require('fs');
const { createCanvas } = require('canvas');

// 如果没有 canvas 模块，可以使用纯 JavaScript 的替代方案
// npm install canvas

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // 渐变背景
  const grad = ctx.createLinearGradient(0, 0, size, size);
  grad.addColorStop(0, '#667eea');
  grad.addColorStop(1, '#764ba2');

  // 圆形背景
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // AI 文字
  ctx.fillStyle = 'white';
  ctx.font = `bold ${size * 0.5}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('AI', size/2, size/2 + size * 0.05);

  return canvas.toBuffer('image/png');
}

try {
  [16, 48, 128].forEach(size => {
    const buffer = generateIcon(size);
    fs.writeFileSync(`src/assets/icon${size}.png`, buffer);
    console.log(`Generated icon${size}.png`);
  });
} catch (e) {
  console.log('请先安装 canvas 模块: npm install canvas');
  console.log('或者手动打开 src/assets/generate-icons.html 下载图标');
}