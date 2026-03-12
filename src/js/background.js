// 兼容 Firefox
if (typeof browser === 'undefined') {
  globalThis.browser = chrome;
}

// API 配置存储
const DEFAULT_CONFIG = {
  baseUrl: '',
  apiKey: '',
  apiType: 'openai',  // openai | anthropic
  maxTokens: 2048,
  models: [],         // 模型列表 [{id, name, model}]
  selectedModel: ''   // 当前选中的模型 ID
};

// 默认外观配置
const DEFAULT_APPEARANCE = {
  theme: 'blue',
  icon: 'globe',
  customIcon: null
};

// 主题配色
const THEMES = {
  purple: { primary: '#667eea', secondary: '#764ba2' },
  blue: { primary: '#2196F3', secondary: '#1976D2' },
  green: { primary: '#4CAF50', secondary: '#388E3C' },
  orange: { primary: '#FF9800', secondary: '#F57C00' },
  red: { primary: '#F44336', secondary: '#D32F2F' },
  pink: { primary: '#E91E63', secondary: '#C2185B' }
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

// 获取外观配置
async function getAppearance() {
  const result = await browser.storage.local.get('appearance');
  return result.appearance || DEFAULT_APPEARANCE;
}

// 保存外观配置
async function saveAppearance(appearance) {
  await browser.storage.local.set({ appearance: appearance });
}

// 获取选中的模型
function getSelectedModel(config) {
  if (!config || !config.models || config.models.length === 0) {
    return '';
  }

  const selectedId = config.selectedModel;
  const selected = config.models.find(m => m.id === selectedId);
  return selected ? selected.model : config.models[0].model;
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
  const apiType = config.apiType || 'openai';

  if (apiType === 'anthropic') {
    return await callAnthropicAPI(messages, config);
  }
  return await callOpenAIAPI(messages, config);
}

// OpenAI 兼容 API 调用
async function callOpenAIAPI(messages, config) {
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

// Anthropic API 调用
async function callAnthropicAPI(messages, config) {
  // Anthropic 不支持 system 在 messages 里，需要单独提取
  let systemPrompt = '';
  const filteredMessages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else {
      filteredMessages.push(msg);
    }
  }

  const response = await fetch(`${config.baseUrl}/v1/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: config.model,
      max_tokens: config.maxTokens,
      system: systemPrompt || undefined,
      messages: filteredMessages
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// 翻译文本
async function translateText(text, config) {
  const messages = [
    {
      role: 'system',
      content: 'You are a professional translator. Translate the following English text to Chinese. Only output the translation result, no explanations.'
    },
    {
      role: 'user',
      content: text
    }
  ];

  // 复用 callAI，但使用较小的 max_tokens
  const translateConfig = { ...config, maxTokens: 2000 };
  return await callAI(messages, translateConfig);
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
        // 支持传入配置（用于测试）或使用已保存的配置
        let chatConfig = message.config || await getConfig();

        // 获取模型
        const model = message.model || getSelectedModel(chatConfig);

        if (!chatConfig.baseUrl || !chatConfig.apiKey || !model) {
          sendResponse({ success: false, error: '请先配置 API 和模型' });
          break;
        }

        // 创建带有模型的配置
        const configWithModel = { ...chatConfig, model };
        const reply = await callAI(message.messages, configWithModel);
        sendResponse({ success: true, data: reply });
        break;

      case 'translate':
        let translateConfig = await getConfig();
        const translateModel = getSelectedModel(translateConfig);

        if (!translateConfig.baseUrl || !translateConfig.apiKey || !translateModel) {
          sendResponse({ success: false, error: '请先配置 API 和模型' });
          break;
        }

        const configForTranslate = { ...translateConfig, model: translateModel };
        const translation = await translateText(message.text, configForTranslate);
        sendResponse({ success: true, data: translation });
        break;

      case 'getAppearance':
        const appearance = await getAppearance();
        sendResponse({ success: true, data: appearance });
        break;

      case 'saveAppearance':
        await saveAppearance(message.appearance);
        sendResponse({ success: true });
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
    title: '发送到 miniQuestion',
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