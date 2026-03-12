# Browser AI Chat Plugin for Coding Plan

一个开放的 AI 对话悬浮窗浏览器扩展，专为 Coding Plan 设计，支持自定义 API 配置。

## 功能特性

- 🔵 **悬浮球 + 展开面板** - 可拖拽的悬浮球，点击展开对话面板
- ⚙️ **开放 API 配置** - 自定义 BaseURL / API Key / Model，支持任意 OpenAI 兼容 API
- 🖱️ **右键菜单发送** - 选中页面文本，右键快速发送到对话
- 🌐 **划词翻译** - 选中文本自动翻译（英→中），支持发送到对话继续讨论
- 💬 **多轮对话历史** - 自动保存对话记录
- 🌐 **跨浏览器支持** - Chrome / Edge / Firefox

## 安装

### Chrome / Edge

1. 打开 `chrome://extensions/` 或 `edge://extensions/`
2. 启用「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目文件夹

### Firefox

1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `manifest.json` 文件

## 配置

1. 点击扩展图标或悬浮球打开设置
2. 填写 API 配置：
   - **Base URL**: API 服务地址（如 `https://api.openai.com/v1`）
   - **API Key**: 你的 API 密钥
   - **Model**: 模型名称（如 `gpt-4o-mini`）
3. 点击「测试连接」验证配置
4. 保存设置

## 使用

- **打开对话**: 点击页面右下角的悬浮球
- **拖拽**: 按住悬浮球拖动到任意位置
- **发送消息**: 输入文本后按 Enter 或点击发送按钮
- **右键发送**: 选中页面文本 → 右键 → 发送到 AI Chat
- **划词翻译**: 选中文本 → 点击翻译按钮 → 查看翻译结果

## 支持的 API 服务

理论上支持所有 OpenAI 兼容的 API：

- OpenAI
- Anthropic (需兼容层)
- DeepSeek
- OpenRouter
- 本地模型 (Ollama, LM Studio 等)
- 其他第三方服务

## 项目结构

```
browser-aichat-plugin-for-codingplan/
├── manifest.json          # 扩展配置
├── src/
│   ├── js/
│   │   ├── background.js  # 后台服务
│   │   ├── content.js     # 内容脚本
│   │   └── options.js     # 设置页面脚本
│   ├── css/
│   │   └── float.css      # 悬浮窗样式
│   ├── assets/
│   │   ├── icon16.png
│   │   ├── icon48.png
│   │   └── icon128.png
│   └── options.html       # 设置页面
└── README.md
```

## 注意事项

- API Key 存储在浏览器本地，不会上传到任何服务器
- 对话历史存储在浏览器本地存储中
- 部分网站可能限制内容脚本注入

## License

MIT