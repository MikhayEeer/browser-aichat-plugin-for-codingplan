// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// API 配置存储
const DEFAULT_CONFIG = {
  baseUrl: '',
  apiKey: '',
  model: '',
  maxTokens: 2048
};

// 获取配置
async function getConfig() {
  const result = await browser.storage.sync.get('apiConfig');
  return result.apiConfig || DEFAULT_CONFIG;
}

// 保存配置
async function saveConfig(config) {
  await browser.storage.sync.set({ apiConfig: config });
}

// 获取对话历史
async function getChatHistory() {
  const result = await browser.storage.local.get('chatHistory');
  return result.chatHistory || [];
}

// 保存对话历史
async function saveChatHistory(history) {
  await browser.storage.local.set({ chatHistory: history });
}

// 清空对话历史
async function clearChatHistory() {
  await browser.storage.local.remove('chatHistory');
}

// 调用 AI API
async function callAI(messages, config) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: messages,
      max_tokens: config.maxTokens,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 翻译文本
async function translateText(text, config) {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the following English text to Chinese. Only output the translation result, no explanations.'
        },
        {
          role: 'user',
          content: text
        }
      ],
      max_tokens: 2000,
      stream: false
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

// 监听来自 content script 的消息
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // 保持消息通道开放
});

async function handleMessage(message, sender, sendResponse) {
  try {
    switch (message.action) {
      case 'getConfig':
        const config = await getConfig();
        sendResponse({ success: true, data: config });
        break;

      case 'saveConfig':
        await saveConfig(message.config);
        sendResponse({ success: true });
        break;

      case 'getHistory':
        const history = await getChatHistory();
        sendResponse({ success: true, data: history });
        break;

      case 'saveHistory':
        await saveChatHistory(message.history);
        sendResponse({ success: true });
        break;

      case 'clearHistory':
        await clearChatHistory();
        sendResponse({ success: true });
        break;

      case 'chat':
        const chatConfig = await getConfig();
        if (!chatConfig.baseUrl || !chatConfig.apiKey || !chatConfig.model) {
          sendResponse({ success: false, error: '请先配置 API' });
          break;
        }
        const reply = await callAI(message.messages, chatConfig);
        sendResponse({ success: true, data: reply });
        break;

      case 'translate':
        const translateConfig = await getConfig();
        if (!translateConfig.baseUrl || !translateConfig.apiKey || !translateConfig.model) {
          sendResponse({ success: false, error: '请先配置 API' });
          break;
        }
        const translation = await translateText(message.text, translateConfig);
        sendResponse({ success: true, data: translation });
        break;

      default:
        sendResponse({ success: false, error: 'Unknown action' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 创建右键菜单
browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: 'ai-float-chat-send',
    title: '发送到 AI Chat',
    contexts: ['selection']
  });
});

// 右键菜单点击处理
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ai-float-chat-send' && info.selectionText) {
    // 发送消息到当前页面的 content script
    try {
      await browser.tabs.sendMessage(tab.id, {
        action: 'sendSelection',
        text: info.selectionText
      });
    } catch (e) {
      // 页面可能未加载 content script
      console.error('Failed to send selection:', e);
    }
  }
});