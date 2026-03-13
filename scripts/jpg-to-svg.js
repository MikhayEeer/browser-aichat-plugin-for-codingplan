const fs = require('fs');
const path = require('path');

// 检查是否安装了 imagetracerjs
let ImageTracer;
try {
  ImageTracer = require('imagetracerjs');
} catch (e) {
  console.log('请先安装 imagetracerjs: npm install imagetracerjs --save-dev');
  process.exit(1);
}

const assetsDir = path.join(__dirname, '..', 'src', 'assets');
const sourceImage = path.join(assetsDir, 'cat-has-question.jpg');
const outputSvg = path.join(assetsDir, 'cat-icon.svg');

async function convertToSvg() {
  console.log('开始将 cat-has-question.jpg 转换为 SVG...\n');
  console.log('注意: 照片类图像转换为 SVG 可能效果不佳，建议:');
  console.log('  1. 使用在线工具如 https://vectorizer.ai 获得更好效果');
  console.log('  2. 或保留 PNG 格式\n');

  try {
    // 使用 imagetracerjs 转换
    // 较低参数以获得更简洁的 SVG
    const options = {
      // 简化参数，适合简单图像
      ltres: 1,
      qtres: 1,
      pathomit: 8,
      colorsampling: 2, // 确定性采样
      numberofcolors: 16, // 减少颜色数
      mincolorratio: 0,
      colorquantcycles: 3,
      // 简化路径
      blurradius: 0,
      blurdelta: 20,
      // 输出选项
      scale: 1,
      desc: false, // 不添加描述
      viewbox: true // 使用 viewBox
    };

    await ImageTracer.imageToSVG(
      sourceImage,
      function(svgString) {
        fs.writeFileSync(outputSvg, svgString);
        console.log(`✓ 已生成 ${path.basename(outputSvg)}`);

        // 检查文件大小
        const stats = fs.statSync(outputSvg);
        const sizeKB = (stats.size / 1024).toFixed(2);
        console.log(`  文件大小: ${sizeKB} KB`);

        if (stats.size > 100 * 1024) {
          console.log('\n⚠ 警告: SVG 文件较大，建议:');
          console.log('  - 使用在线工具优化: https://svgomg.com');
          console.log('  - 或直接使用 PNG 格式');
        }
      },
      options
    );

    console.log('\n转换完成!');
    console.log('\n如需更好的 SVG 效果，推荐使用在线工具:');
    console.log('  - https://vectorizer.ai (免费，效果好)');
    console.log('  - https://convertio.co/jpg-svg/');
    console.log('  - Adobe Illustrator / Inkscape');

  } catch (err) {
    console.log('转换失败:', err.message);
    console.log('\n建议使用在线工具转换:');
    console.log('  - https://vectorizer.ai');
    console.log('  - https://convertio.co/jpg-svg/');
  }
}

convertToSvg();