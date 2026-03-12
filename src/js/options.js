// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// DOM 元素
const apiTypeSelect = document.getElementById('apiType');
const baseUrlInput = document.getElementById('baseUrl');
const apiKeyInput = document.getElementById('apiKey');
const maxTokensInput = document.getElementById('maxTokens');

// 模型管理
const modelList = document.getElementById('modelList');
const modelNameInput = document.getElementById('modelName');
const modelValueInput = document.getElementById('modelValue');
const addModelBtn = document.getElementById('addModelBtn');

// 按钮
const saveApiBtn = document.getElementById('saveApiBtn');
const testBtn = document.getElementById('testBtn');
const saveModelBtn = document.getElementById('saveModelBtn');
const saveAppearanceBtn = document.getElementById('saveAppearanceBtn');

// 状态显示
const apiStatusDiv = document.getElementById('apiStatus');
const modelStatusDiv = document.getElementById('modelStatus');

// 外观设置
const themeOptions = document.querySelectorAll('.theme-option');
const iconOptions = document.querySelectorAll('.icon-option[data-icon]');
const iconUpload = document.getElementById('iconUpload');
const customIconPreview = document.getElementById('customIconPreview');
const customIconImg = document.getElementById('customIconImg');
const customIconName = document.getElementById('customIconName');
const removeCustomIconBtn = document.getElementById('removeCustomIcon');

// 当前配置
let currentConfig = {
  baseUrl: '',
  apiKey: '',
  apiType: 'openai',
  maxTokens: 2048,
  models: [],
  selectedModel: ''
};

let currentAppearance = {
  theme: 'blue',
  icon: 'globe',
  customIcon: null
};

// 加载配置
async function loadConfig() {
  const response = await browser.runtime.sendMessage({ action: 'getConfig' });
  if (response.success && response.data) {
    currentConfig = { ...currentConfig, ...response.data };

    apiTypeSelect.value = currentConfig.apiType || 'openai';
    baseUrlInput.value = currentConfig.baseUrl || '';
    apiKeyInput.value = currentConfig.apiKey || '';
    maxTokensInput.value = currentConfig.maxTokens || 2048;

    renderModelList();
  }

  // 加载外观配置
  const appearanceResponse = await browser.runtime.sendMessage({ action: 'getAppearance' });
  if (appearanceResponse.success && appearanceResponse.data) {
    currentAppearance = { ...currentAppearance, ...appearanceResponse.data };

    themeOptions.forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === currentAppearance.theme);
    });

    if (currentAppearance.customIcon) {
      iconOptions.forEach(opt => opt.classList.remove('active'));
      showCustomIconPreview(currentAppearance.customIcon);
    } else {
      iconOptions.forEach(opt => {
        opt.classList.toggle('active', opt.dataset.icon === currentAppearance.icon);
      });
      customIconPreview.classList.remove('show');
    }
  }
}

// 渲染模型列表
function renderModelList() {
  if (!currentConfig.models || currentConfig.models.length === 0) {
    modelList.innerHTML = '<div class="model-empty">暂无模型，请添加</div>';
    return;
  }

  modelList.innerHTML = currentConfig.models.map((model, index) => `
    <div class="model-item ${currentConfig.selectedModel === model.id ? 'selected' : ''}" data-index="${index}">
      <div class="model-info">
        <div class="model-name">${escapeHtml(model.name)}</div>
        <div class="model-value">${escapeHtml(model.model)}</div>
      </div>
      <div class="model-actions">
        <button class="btn btn-small btn-secondary select-model-btn" data-id="${model.id}">
          ${currentConfig.selectedModel === model.id ? '当前' : '选择'}
        </button>
        <button class="btn btn-small btn-danger delete-model-btn" data-index="${index}">删除</button>
      </div>
    </div>
  `).join('');

  // 绑定事件
  document.querySelectorAll('.select-model-btn').forEach(btn => {
    btn.addEventListener('click', () => selectModel(btn.dataset.id));
  });

  document.querySelectorAll('.delete-model-btn').forEach(btn => {
    btn.addEventListener('click', () => deleteModel(parseInt(btn.dataset.index)));
  });
}

// 转义 HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// 添加模型
function addModel() {
  const name = modelNameInput.value.trim();
  const model = modelValueInput.value.trim();

  if (!name || !model) {
    showStatus(modelStatusDiv, '请填写模型名称和 ID', 'error');
    return;
  }

  const id = 'model_' + Date.now();
  currentConfig.models = currentConfig.models || [];
  currentConfig.models.push({ id, name, model });

  // 如果是第一个模型，自动选中
  if (currentConfig.models.length === 1) {
    currentConfig.selectedModel = id;
  }

  modelNameInput.value = '';
  modelValueInput.value = '';

  renderModelList();
  showStatus(modelStatusDiv, '模型已添加，请点击保存', 'success');
}

// 选择模型
function selectModel(id) {
  currentConfig.selectedModel = id;
  renderModelList();
}

// 删除模型
function deleteModel(index) {
  const deletedId = currentConfig.models[index].id;
  currentConfig.models.splice(index, 1);

  // 如果删除的是当前选中的模型
  if (currentConfig.selectedModel === deletedId) {
    currentConfig.selectedModel = currentConfig.models.length > 0 ? currentConfig.models[0].id : '';
  }

  renderModelList();
}

// 保存 API 配置
async function saveApiConfig() {
  currentConfig.apiType = apiTypeSelect.value;
  currentConfig.baseUrl = baseUrlInput.value.trim().replace(/\/$/, '');
  currentConfig.apiKey = apiKeyInput.value.trim();

  if (!currentConfig.baseUrl || !currentConfig.apiKey) {
    showStatus(apiStatusDiv, '请填写 Base URL 和 API Key', 'error');
    return;
  }

  const response = await browser.runtime.sendMessage({
    action: 'saveConfig',
    config: currentConfig
  });

  if (response.success) {
    showStatus(apiStatusDiv, 'API 配置已保存', 'success');
  } else {
    showStatus(apiStatusDiv, '保存失败: ' + response.error, 'error');
  }
}

// 测试连接
async function testConnection() {
  const testConfig = {
    ...currentConfig,
    baseUrl: baseUrlInput.value.trim().replace(/\/$/, ''),
    apiKey: apiKeyInput.value.trim(),
    apiType: apiTypeSelect.value
  };

  if (!testConfig.baseUrl || !testConfig.apiKey) {
    showStatus(apiStatusDiv, '请先填写 API 配置', 'error');
    return;
  }

  if (!testConfig.models || testConfig.models.length === 0) {
    showStatus(apiStatusDiv, '请先添加至少一个模型', 'error');
    return;
  }

  const testModel = testConfig.models[0].model;
  showStatus(apiStatusDiv, '测试中...', 'success');
  testBtn.disabled = true;

  try {
    const response = await browser.runtime.sendMessage({
      action: 'chat',
      messages: [{ role: 'user', content: 'Hi' }],
      config: { ...testConfig, model: testModel }
    });

    if (response.success) {
      showStatus(apiStatusDiv, '连接成功！', 'success');
    } else {
      showStatus(apiStatusDiv, '连接失败: ' + response.error, 'error');
    }
  } catch (e) {
    showStatus(apiStatusDiv, '连接失败: ' + e.message, 'error');
  } finally {
    testBtn.disabled = false;
  }
}

// 保存模型配置
async function saveModelConfig() {
  if (!currentConfig.models || currentConfig.models.length === 0) {
    showStatus(modelStatusDiv, '请至少添加一个模型', 'error');
    return;
  }

  currentConfig.maxTokens = parseInt(maxTokensInput.value) || 2048;

  const response = await browser.runtime.sendMessage({
    action: 'saveConfig',
    config: currentConfig
  });

  if (response.success) {
    // 通知所有标签页更新配置
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          action: 'updateConfig',
          config: currentConfig
        });
      } catch (e) {}
    }
    showStatus(modelStatusDiv, '模型配置已保存', 'success');
  } else {
    showStatus(modelStatusDiv, '保存失败: ' + response.error, 'error');
  }
}

// 显示状态
function showStatus(element, message, type) {
  element.textContent = message;
  element.className = 'status ' + type;
  element.style.display = 'block';

  if (type === 'success') {
    setTimeout(() => {
      element.style.display = 'none';
    }, 3000);
  }
}

// 主题选择
themeOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    themeOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentAppearance.theme = opt.dataset.theme;
  });
});

// 图标选择
iconOptions.forEach(opt => {
  opt.addEventListener('click', () => {
    iconOptions.forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
    currentAppearance.icon = opt.dataset.icon;
    currentAppearance.customIcon = null;
    customIconPreview.classList.remove('show');
  });
});

// 上传自定义图标
iconUpload.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  if (file.size > 50 * 1024) {
    alert('图片太大，请选择小于 50KB 的图片');
    return;
  }

  const reader = new FileReader();
  reader.onload = (event) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 48;
      canvas.height = 48;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, 48, 48);
      const dataUrl = canvas.toDataURL('image/png', 0.8);

      currentAppearance.customIcon = dataUrl;
      iconOptions.forEach(o => o.classList.remove('active'));
      showCustomIconPreview(dataUrl, file.name);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

function showCustomIconPreview(dataUrl, name = '自定义图标') {
  customIconImg.src = dataUrl;
  customIconName.textContent = name;
  customIconPreview.classList.add('show');
}

removeCustomIconBtn.addEventListener('click', () => {
  currentAppearance.customIcon = null;
  customIconPreview.classList.remove('show');
  iconOptions[0].click();
});

// 保存外观
async function saveAppearance() {
  const response = await browser.runtime.sendMessage({
    action: 'saveAppearance',
    appearance: currentAppearance
  });

  if (response.success) {
    const tabs = await browser.tabs.query({});
    for (const tab of tabs) {
      try {
        await browser.tabs.sendMessage(tab.id, {
          action: 'updateAppearance',
          appearance: currentAppearance
        });
      } catch (e) {}
    }
    showStatus(modelStatusDiv, '外观设置已保存', 'success');
  }
}

// 快速填充
document.querySelectorAll('.template-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.type;
    const base = btn.dataset.base;

    if (type) apiTypeSelect.value = type;
    if (base) baseUrlInput.value = base;
  });
});

// 事件监听
addModelBtn.addEventListener('click', addModel);
saveApiBtn.addEventListener('click', saveApiConfig);
testBtn.addEventListener('click', testConnection);
saveModelBtn.addEventListener('click', saveModelConfig);
saveAppearanceBtn.addEventListener('click', saveAppearance);

// 回车添加模型
modelValueInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addModel();
});

// 初始化
loadConfig();