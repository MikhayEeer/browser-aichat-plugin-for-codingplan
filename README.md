# Browser AI Chat Plugin

一个轻量的 AI 对话悬浮窗浏览器扩展，支持任意 OpenAI 兼容 API。

## 为什么做这个

现有 AI 悬浮窗/侧边栏插件（Monica、Sider、MaxAI 等）存在以下问题：

- **API 限制**：只能使用官方或合作方 API，无法接入自己的 Coding Plan
- **功能臃肿**：堆砌大量用不到的功能，学习成本高
- **隐私风险**：数据经手第三方服务器
- **账号体系**：强迫注册登录

本插件的定位是**主工具的补充**，而非替代。适合以下场景：

| 场景 | 说明 |
|------|------|
| 快速翻译 | 划词即译，无需切换页面 |
| 简单问答 | 临时问题，用完即走 |
| 代码片段询问 | 右键发送，快速理解 |
| API 测试 | 验证自定义 API 连通性 |

## 特性

- **开放 API 配置** - 自定义 BaseURL / API Key / Model
- **悬浮球交互** - 可拖拽，点击展开对话面板
- **划词翻译** - 选中文本自动翻译（英→中）
- **右键发送** - 选中页面文本快速发送到对话
- **跨浏览器** - Chrome / Edge / Firefox

## 安装

**Chrome / Edge**
1. 打开 `chrome://extensions/`（或 `edge://extensions/`）
2. 启用「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目文件夹

**Firefox**
1. 打开 `about:debugging#/runtime/this-firefox`
2. 点击「临时载入附加组件」
3. 选择 `manifest.json` 文件

## 配置

首次使用需配置 API：

| 字段 | 说明 | 示例 |
|------|------|------|
| Base URL | API 服务地址 | `https://api.openai.com/v1` |
| API Key | 你的密钥 | `sk-...` |
| Model | 模型名称 | `gpt-4o-mini` |

支持的 API 服务：OpenAI、DeepSeek、OpenRouter、本地模型（Ollama、LM Studio）等所有 OpenAI 兼容 API。

## 使用

- **打开对话**：点击页面右下角悬浮球
- **拖拽位置**：按住悬浮球拖动
- **发送消息**：输入后按 Enter
- **划词翻译**：选中文本 → 点击翻译按钮
- **右键发送**：选中文本 → 右键 → 发送到 AI Chat

## 安全

- API Key 存储在浏览器本地，不上传任何服务器
- 请求直发用户配置的 API，无中间商
- 开源代码，可自行审计

## License

MIT