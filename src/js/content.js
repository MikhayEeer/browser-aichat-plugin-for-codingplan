// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// 防止重复注入
if (document.getElementById('ai-float-container')) {
  throw new Error('AI Float Chat already loaded');
}

// 状态管理
const state = {
  panelOpen: false,
  isDragging: false,
  dragOffset: { x: 0, y: 0 },
  ballPosition: { x: window.innerWidth - 70, y: window.innerHeight - 70 },
  panelPosition: { x: 0, y: 0 },
  config: null,
  messages: [],
  isLoading: false,
  // 划词翻译状态
  translatePopup: null,
  selectedText: '',
  isTranslating: false
};

// 创建容器
const container = document.createElement('div');
container.id = 'ai-float-container';
container.innerHTML = `
  <!-- 悬浮球 -->
  <div class="ai-float-ball" id="ai-float-ball">
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
  </div>

  <!-- 展开面板 -->
  <div class="ai-float-panel" id="ai-float-panel">
    <div class="ai-panel-header">
      <span class="ai-panel-title">AI Chat</span>
      <div class="ai-panel-actions">
        <button class="ai-panel-btn" id="ai-clear-btn" title="清空对话">清空</button>
        <button class="ai-panel-btn" id="ai-settings-btn" title="设置">设置</button>
      </div>
    </div>
    <div class="ai-chat-container" id="ai-chat-container"></div>
    <div class="ai-input-container">
      <div class="ai-input-wrapper">
        <textarea class="ai-input" id="ai-input" placeholder="输入消息..." rows="1"></textarea>
        <button class="ai-send-btn" id="ai-send-btn">发送</button>
      </div>
    </div>
  </div>
`;

document.body.appendChild(container);

// 获取元素
const ball = document.getElementById('ai-float-ball');
const panel = document.getElementById('ai-float-panel');
const chatContainer = document.getElementById('ai-chat-container');
const input = document.getElementById('ai-input');
const sendBtn = document.getElementById('ai-send-btn');
const clearBtn = document.getElementById('ai-clear-btn');
const settingsBtn = document.getElementById('ai-settings-btn');

// 初始化位置
function initPosition() {
  ball.style.left = state.ballPosition.x + 'px';
  ball.style.top = state.ballPosition.y + 'px';
  updatePanelPosition();
}

function updatePanelPosition() {
  const ballRect = ball.getBoundingClientRect();
  const panelWidth = 380;
  const panelHeight = 520;

  let x = ballRect.left - panelWidth - 20;
  let y = ballRect.top - panelHeight + 50;

  // 边界检测
  if (x < 10) x = ballRect.right + 20;
  if (x + panelWidth > window.innerWidth - 10) x = window.innerWidth - panelWidth - 10;
  if (y < 10) y = 10;
  if (y + panelHeight > window.innerHeight - 10) y = window.innerHeight - panelHeight - 10;

  panel.style.left = x + 'px';
  panel.style.top = y + 'px';
}

// 悬浮球拖拽
ball.addEventListener('mousedown', (e) => {
  state.isDragging = true;
  state.dragOffset = {
    x: e.clientX - ball.getBoundingClientRect().left,
    y: e.clientY - ball.getBoundingClientRect().top
  };
  e.preventDefault();
});

document.addEventListener('mousemove', (e) => {
  if (!state.isDragging) return;

  const x = e.clientX - state.dragOffset.x;
  const y = e.clientY - state.dragOffset.y;

  // 边界限制
  const maxX = window.innerWidth - ball.offsetWidth;
  const maxY = window.innerHeight - ball.offsetHeight;

  state.ballPosition.x = Math.max(0, Math.min(x, maxX));
  state.ballPosition.y = Math.max(0, Math.min(y, maxY));

  ball.style.left = state.ballPosition.x + 'px';
  ball.style.top = state.ballPosition.y + 'px';

  if (state.panelOpen) {
    updatePanelPosition();
  }
});

document.addEventListener('mouseup', () => {
  state.isDragging = false;
});

// 点击悬浮球切换面板
ball.addEventListener('click', (e) => {
  if (state.isDragging) return;
  state.panelOpen = !state.panelOpen;
  panel.classList.toggle('ai-panel-open', state.panelOpen);
  if (state.panelOpen) {
    updatePanelPosition();
    input.focus();
    scrollToBottom();
  }
});

// 点击外部关闭面板
document.addEventListener('click', (e) => {
  if (state.panelOpen && !container.contains(e.target)) {
    state.panelOpen = false;
    panel.classList.remove('ai-panel-open');
  }
});

// 加载配置和历史
async function loadData() {
  try {
    const [configRes, historyRes] = await Promise.all([
      browser.runtime.sendMessage({ action: 'getConfig' }),
      browser.runtime.sendMessage({ action: 'getHistory' })
    ]);

    state.config = configRes.success ? configRes.data : null;
    state.messages = historyRes.success ? historyRes.data : [];

    renderMessages();
    checkConfig();
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

// 检查配置
function checkConfig() {
  if (!state.config || !state.config.baseUrl || !state.config.apiKey || !state.config.model) {
    chatContainer.innerHTML = `
      <div class="ai-not-configured">
        <div class="ai-welcome-icon">
          <svg viewBox="0 0 24 24" width="48" height="48">
            <path fill="#667eea" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
          </svg>
        </div>
        <h3 class="ai-welcome-title">欢迎使用 AI Float Chat</h3>
        <p class="ai-welcome-desc">本插件不提供 AI 服务，请配置你自己的 API</p>
        <div class="ai-setup-steps">
          <div class="ai-step">
            <span class="ai-step-num">1</span>
            <span>准备一个 OpenAI 兼容的 API Key</span>
          </div>
          <div class="ai-step">
            <span class="ai-step-num">2</span>
            <span>点击下方按钮配置 Base URL 和密钥</span>
          </div>
          <div class="ai-step">
            <span class="ai-step-num">3</span>
            <span>测试连接成功后即可使用</span>
          </div>
        </div>
        <button class="ai-config-btn" id="ai-open-settings">开始配置</button>
        <p class="ai-supported-apis">
          支持：OpenAI / Claude / DeepSeek / OpenRouter / 本地模型
        </p>
      </div>
    `;
    document.getElementById('ai-open-settings')?.addEventListener('click', openSettings);
    return false;
  }
  return true;
}

// 渲染消息
function renderMessages() {
  if (state.messages.length === 0) {
    chatContainer.innerHTML = '';
    return;
  }

  chatContainer.innerHTML = state.messages.map(msg => `
    <div class="ai-message ai-${msg.role}">
      ${formatMessage(msg.content)}
    </div>
  `).join('');
}

// 格式化消息（简单的代码块处理）
function formatMessage(content) {
  return content
    .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>');
}

// 滚动到底部
function scrollToBottom() {
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

// 添加消息
function addMessage(role, content) {
  state.messages.push({ role, content });
  browser.runtime.sendMessage({ action: 'saveHistory', history: state.messages });
  renderMessages();
  scrollToBottom();
}

// 显示加载动画
function showLoading() {
  const loadingDiv = document.createElement('div');
  loadingDiv.className = 'ai-message ai-assistant ai-loading-msg';
  loadingDiv.innerHTML = '<div class="ai-loading"><span></span><span></span><span></span></div>';
  chatContainer.appendChild(loadingDiv);
  scrollToBottom();
}

// 隐藏加载动画
function hideLoading() {
  const loadingMsg = chatContainer.querySelector('.ai-loading-msg');
  if (loadingMsg) loadingMsg.remove();
}

// 发送消息
async function sendMessage() {
  const content = input.value.trim();
  if (!content || state.isLoading) return;

  if (!checkConfig()) return;

  state.isLoading = true;
  sendBtn.disabled = true;

  // 添加用户消息
  addMessage('user', content);
  input.value = '';
  input.style.height = 'auto';

  // 显示加载
  showLoading();

  try {
    const response = await browser.runtime.sendMessage({
      action: 'chat',
      messages: state.messages
    });

    hideLoading();

    if (response.success) {
      addMessage('assistant', response.data);
    } else {
      addMessage('assistant', `错误: ${response.error}`);
    }
  } catch (e) {
    hideLoading();
    addMessage('assistant', `请求失败: ${e.message}`);
  } finally {
    state.isLoading = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

// 清空对话
async function clearChat() {
  if (!confirm('确定要清空所有对话记录吗？')) return;

  state.messages = [];
  await browser.runtime.sendMessage({ action: 'clearHistory' });
  chatContainer.innerHTML = '';
  checkConfig();
}

// 打开设置
function openSettings() {
  browser.runtime.sendMessage({ action: 'openOptions' });
  // 打开扩展设置页面
  if (typeof browser !== 'undefined' && browser.runtime) {
    browser.runtime.openOptionsPage();
  }
}

// 输入框自动高度
input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
});

// 回车发送（Shift+回车换行）
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// 按钮事件
sendBtn.addEventListener('click', sendMessage);
clearBtn.addEventListener('click', clearChat);
settingsBtn.addEventListener('click', openSettings);

// 监听右键菜单发送
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'sendSelection' && message.text) {
    // 打开面板
    state.panelOpen = true;
    panel.classList.add('ai-panel-open');
    updatePanelPosition();

    // 填充选中的文本
    input.value = message.text;
    input.focus();
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 120) + 'px';
  }
  return true;
});

// 初始化
initPosition();
loadData();

// 窗口大小变化时调整位置
window.addEventListener('resize', () => {
  const maxX = window.innerWidth - ball.offsetWidth;
  const maxY = window.innerHeight - ball.offsetHeight;

  if (state.ballPosition.x > maxX) {
    state.ballPosition.x = maxX;
    ball.style.left = maxX + 'px';
  }
  if (state.ballPosition.y > maxY) {
    state.ballPosition.y = maxY;
    ball.style.top = maxY + 'px';
  }

  if (state.panelOpen) {
    updatePanelPosition();
  }
});

// ============ 划词翻译功能 ============

// 创建翻译弹窗
function createTranslatePopup() {
  const popup = document.createElement('div');
  popup.className = 'ai-translate-popup';
  popup.id = 'ai-translate-popup';
  popup.innerHTML = `
    <div class="ai-translate-header">
      <span class="ai-translate-title">翻译</span>
      <button class="ai-translate-close" id="ai-translate-close">×</button>
    </div>
    <div class="ai-translate-content" id="ai-translate-content">
      <div class="ai-translate-text" id="ai-translate-original"></div>
      <div class="ai-translate-result" id="ai-translate-result">
        <div class="ai-translate-loading">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
    <div class="ai-translate-footer">
      <button class="ai-translate-btn" id="ai-translate-send">发送到对话</button>
    </div>
  `;
  return popup;
}

// 显示翻译按钮（选中文本后）
function showTranslateButton(x, y, text) {
  // 移除已有的按钮
  hideTranslateButton();

  const btn = document.createElement('div');
  btn.className = 'ai-translate-trigger';
  btn.id = 'ai-translate-trigger';
  btn.innerHTML = '🌐 翻译';
  btn.style.left = x + 'px';
  btn.style.top = (y + 10) + 'px';

  document.body.appendChild(btn);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    showTranslatePopup(x, y, text);
    hideTranslateButton();
  });
}

// 隐藏翻译按钮
function hideTranslateButton() {
  const btn = document.getElementById('ai-translate-trigger');
  if (btn) btn.remove();
}

// 显示翻译弹窗
async function showTranslatePopup(x, y, text) {
  // 移除已有的弹窗
  hideTranslatePopup();

  const popup = createTranslatePopup();
  document.body.appendChild(popup);
  state.translatePopup = popup;
  state.selectedText = text;

  // 设置位置
  const popupWidth = 320;
  const popupHeight = 200;
  let popupX = x;
  let popupY = y + 30;

  // 边界检测
  if (popupX + popupWidth > window.innerWidth - 10) {
    popupX = window.innerWidth - popupWidth - 10;
  }
  if (popupY + popupHeight > window.innerHeight - 10) {
    popupY = y - popupHeight - 10;
  }

  popup.style.left = popupX + 'px';
  popup.style.top = popupY + 'px';

  // 显示原文
  const originalDiv = document.getElementById('ai-translate-original');
  originalDiv.textContent = text;

  // 绑定事件
  document.getElementById('ai-translate-close').addEventListener('click', hideTranslatePopup);
  document.getElementById('ai-translate-send').addEventListener('click', () => {
    sendToChat(text);
    hideTranslatePopup();
  });

  // 执行翻译
  await doTranslate(text);
}

// 隐藏翻译弹窗
function hideTranslatePopup() {
  if (state.translatePopup) {
    state.translatePopup.remove();
    state.translatePopup = null;
  }
}

// 执行翻译
async function doTranslate(text) {
  if (state.isTranslating) return;

  const resultDiv = document.getElementById('ai-translate-result');
  if (!resultDiv) return;

  state.isTranslating = true;

  try {
    // 检查配置
    if (!state.config || !state.config.baseUrl || !state.config.apiKey || !state.config.model) {
      resultDiv.innerHTML = '<span class="ai-translate-error">请先配置 API</span>';
      return;
    }

    const response = await browser.runtime.sendMessage({
      action: 'translate',
      text: text
    });

    if (response.success) {
      resultDiv.innerHTML = `<span class="ai-translate-success">${response.data}</span>`;
    } else {
      resultDiv.innerHTML = `<span class="ai-translate-error">翻译失败: ${response.error}</span>`;
    }
  } catch (e) {
    resultDiv.innerHTML = `<span class="ai-translate-error">请求失败: ${e.message}</span>`;
  } finally {
    state.isTranslating = false;
  }
}

// 发送到对话面板
function sendToChat(text) {
  // 打开面板
  state.panelOpen = true;
  panel.classList.add('ai-panel-open');
  updatePanelPosition();

  // 填充文本
  input.value = text;
  input.focus();
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 120) + 'px';
}

// 监听鼠标松开事件（划词）
let mouseUpTimer = null;
document.addEventListener('mouseup', (e) => {
  // 忽略在扩展容器内的点击
  if (container.contains(e.target)) return;
  if (state.translatePopup && state.translatePopup.contains(e.target)) return;

  // 延迟处理，等待选区完成
  clearTimeout(mouseUpTimer);
  mouseUpTimer = setTimeout(() => {
    const selection = window.getSelection();
    const text = selection.toString().trim();

    if (text && text.length > 0 && text.length < 5000) {
      // 获取选区位置
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      // 显示翻译按钮
      showTranslateButton(rect.left, rect.bottom, text);
    } else {
      hideTranslateButton();
    }
  }, 10);
});

// 点击其他地方隐藏翻译按钮和弹窗
document.addEventListener('mousedown', (e) => {
  if (state.translatePopup && !state.translatePopup.contains(e.target)) {
    hideTranslatePopup();
  }
  if (e.target.id !== 'ai-translate-trigger') {
    hideTranslateButton();
  }
});

// 滚动时隐藏
window.addEventListener('scroll', () => {
  hideTranslateButton();
  hideTranslatePopup();
}, true);