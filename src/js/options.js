// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// DOM 元素
const apiTypeSelect = document.getElementById('apiType');
const baseUrlInput = document.getElementById('baseUrl');
const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const maxTokensInput = document.getElementById('maxTokens');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const statusDiv = document.getElementById('status');

// 外观设置
const saveAppearanceBtn = document.getElementById('saveAppearanceBtn');
const themeOptions = document.querySelectorAll('.theme-option');
const iconOptions = document.querySelectorAll('.icon-option[data-icon]');
const iconUpload = document.getElementById('iconUpload');
const customIconPreview = document.getElementById('customIconPreview');
const customIconImg = document.getElementById('customIconImg');
const customIconName = document.getElementById('customIconName');
const removeCustomIconBtn = document.getElementById('removeCustomIcon');

// 当前外观配置
let currentTheme = 'purple';
let currentIcon = 'globe';
let customIconData = null;

// 加载配置
async function loadConfig() {
  const response = await browser.runtime.sendMessage({ action: 'getConfig' });
  if (response.success && response.data) {
    apiTypeSelect.value = response.data.apiType || 'openai';
    baseUrlInput.value = response.data.baseUrl || '';
    apiKeyInput.value = response.data.apiKey || '';
    modelInput.value = response.data.model || '';
    maxTokensInput.value = response.data.maxTokens || 2048;
  }

  // 加载外观配置
  const appearanceResponse = await browser.runtime.sendMessage({ action: 'getAppearance' });
  if (appearanceResponse.success && appearanceResponse.data) {
    currentTheme = appearanceResponse.data.theme || 'purple';
    currentIcon = appearanceResponse.data.icon || 'globe';
    customIconData = appearanceResponse.data.customIcon || null;

    // 应用主题
    themeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === currentTheme);
    });

    // 应用图标
    if (customIconData) {
      iconOptions.forEach(opt => opt.classList.remove('active'));
      showCustomIconPreview(customIconData);
    } else {
      iconOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.icon === currentIcon);
      });
      customIconPreview.classList.remove('show');
    }
  }
}

// 保存配置
async function saveConfig() {
  const config = {
    apiType: apiTypeSelect.value,
    baseUrl: baseUrlInput.value.trim().replace(/\/$/, ''),
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim(),
    maxTokens: parseInt(maxTokensInput.value) || 2048
  };

  if (!config.baseUrl || !config.apiKey || !config.model) {
    showStatus('请填写所有必填字段', 'error');
    return;
  }

  const response = await browser.runtime.sendMessage({
    action: 'saveConfig',
    config: config
  });

  if (response.success) {
    showStatus('保存成功！', 'success');
  } else {
    showStatus('保存失败: ' + response.error, 'error');
  }
}

// 测试连接
async function testConnection() {
  const config = {
    apiType: apiTypeSelect.value,
    baseUrl: baseUrlInput.value.trim().replace(/\/$/, ''),
    apiKey: apiKeyInput.value.trim(),
    model: modelInput.value.trim(),
    maxTokens: 100
  };

  if (!config.baseUrl || !config.apiKey || !config.model) {
    showStatus('请先填写所有必填字段', 'error');
    return;
  }

  showStatus('测试中...', 'success');
  testBtn.disabled = true;

  try {
    const response = await browser.runtime.sendMessage({
      action: 'chat',
      messages: [{ role: 'user', content: 'Hi' }],
      config: config
    });

    if (response.success) {
      showStatus('连接成功！模型响应正常', 'success');
    } else {
      showStatus('连接失败: ' + response.error, 'error');
    }
  } catch (e) {
    showStatus('连接失败: ' + e.message, 'error');
  } finally {
    testBtn.disabled = false;
  }
}

// 显示状态
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = 'status ' + type;
  statusDiv.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}

// 主题选择
themeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    themeOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentTheme = opt.dataset.theme;
  });
});

// 图标选择
iconOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    iconOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentIcon = opt.dataset.icon;
    customIconData = null;
    customIconPreview.classList.remove('show');
  });
});

// 上传自定义图标
iconUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 检查文件大小 (限制 50KB)
  if (file.size > 50 * 1024) {
    alert('图片太大，请选择小于 50KB 的图片');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const dataUrl = event.target.result;

    // 压缩图片
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const size = 48;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, size, size);
      const compressedData = canvas.toDataURL('image/png', 0.8);

      customIconData = compressedData;
      iconOptions.forEach(o => o.classList.remove('active'));
      showCustomIconPreview(compressedData, file.name);
    };
    img.src = dataUrl;
  };
  reader.readAsDataURL(file);
});

// 显示自定义图标预览
function showCustomIconPreview(dataUrl, name = '自定义图标') {
  customIconImg.src = dataUrl;
  customIconName.textContent = name;
  customIconPreview.classList.add('show');
}

// 移除自定义图标
removeCustomIconBtn.addEventListener('click', () => {
  customIconData = null;
  customIconPreview.classList.remove('show');
  iconOptions[0].click(); // 选择第一个预设图标
});

// 保存外观设置
async function saveAppearance() {
  const appearance = {
    theme: currentTheme,
    icon: currentIcon,
    customIcon: customIconData
  };

  const response = await browser.runtime.sendMessage({
    action: 'saveAppearance',
    appearance: appearance
  });

  if (response.success) {
    // 通知所有标签页更新外观
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          action: 'updateAppearance',
          appearance: appearance
        });
      } catch (e) {
        // 忽略无法发送的标签页
      }
    }
    showStatus('外观设置已保存！', 'success');
  } else {
    showStatus('保存失败: ' + response.error, 'error');
  }
}

// 快速填充模板
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const base = btn.dataset.base;
    const model = btn.dataset.model;

    if (type) apiTypeSelect.value = type;
    if (base) baseUrlInput.value = base;
    if (model) modelInput.value = model;
  });
});

// 事件监听
saveBtn.addEventListener('click', saveConfig);
testBtn.addEventListener('click', testConnection);
saveAppearanceBtn.addEventListener('click', saveAppearance);

// 初始化
loadConfig();