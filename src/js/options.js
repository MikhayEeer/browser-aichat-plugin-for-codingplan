// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// DOM 元素
const baseUrlInput = document.getElementById('baseUrl');
const apiKeyInput = document.getElementById('apiKey');
const modelInput = document.getElementById('model');
const maxTokensInput = document.getElementById('maxTokens');
const saveBtn = document.getElementById('saveBtn');
const testBtn = document.getElementById('testBtn');
const statusDiv = document.getElementById('status');

// 加载配置
async function loadConfig() {
  const response = await browser.runtime.sendMessage({ action: 'getConfig' });
  if (response.success && response.data) {
    baseUrlInput.value = response.data.baseUrl || '';
    apiKeyInput.value = response.data.apiKey || '';
    modelInput.value = response.data.model || '';
    maxTokensInput.value = response.data.maxTokens || 2048;
  }
}

// 保存配置
async function saveConfig() {
  const config = {
    baseUrl: baseUrlInput.value.trim().replace(/\/$/, ''), // 移除末尾斜杠
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
      messages: [{ role: 'user', content: 'Hi' }]
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

// 快速填充模板
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const base = btn.dataset.base;
    const model = btn.dataset.model;

    if (base) baseUrlInput.value = base;
    if (model) modelInput.value = model;
  });
});

// 事件监听
saveBtn.addEventListener('click', saveConfig);
testBtn.addEventListener('click', testConnection);

// 初始化
loadConfig();