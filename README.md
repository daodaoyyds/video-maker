# AI视频生成器 (Video Maker)

## 项目简介
基于扣子智能体工作流的AI视频生成工具，帮助用户快速生成符合行业要求的营销视频片段。

## 项目结构

```
video-maker/
├── README.md           # 项目说明
├── PRD.md             # 产品需求文档
├── docs/              # 文档目录
│   ├── api/           # API接口文档
│   └── design/        # 设计稿
├── src/               # 源代码
│   ├── components/    # React组件
│   ├── pages/         # 页面（5步流程）
│   ├── hooks/         # 自定义Hooks
│   ├── stores/        # 状态管理
│   ├── utils/         # 工具函数
│   └── styles/        # 样式文件
├── api/               # Vercel API代理
├── assets/            # 静态资源
└── scripts/           # 脚本文件
```

## 5步流程

| 步骤 | 页面 | 功能 | API状态 |
|------|------|------|---------|
| 1 | Step1BasicInfo | 基础信息（产品名、4/8/12秒时长、比例） | - |
| 2 | Step2ProductResearch | 产品调研 + TA画像 | ✅ 已对接 |
| 3 | Step3ScriptProposal | 脚本提案（4选1） | ✅ 已对接 |
| 4 | Step6PromptPreview | 提示词预览（3部分） | ✅ 已对接 |
| 5 | Step7VideoResult | 视频生成（Cloudsway） | ✅ 已对接 |

## 开发计划

### Phase 1: 基础框架搭建 ✅
- [x] 项目目录创建
- [x] React + TypeScript 项目初始化
- [x] Ant Design 集成
- [x] 路由配置

### Phase 2: Step 1 - 基础信息输入 ✅
- [x] 创建表单组件
- [x] 图片上传功能
- [x] 表单验证
- [x] 数据存储

### Phase 3: Step 2 - 产品调研 ✅
- [x] 产品调研页面（对接扣子智能体）
- [x] 结果展示页面
- [x] TA画像选择
- [x] 场景/情节尺度选择

### Phase 4: Step 3 - 脚本提案 ✅
- [x] 脚本卡片展示
- [x] 脚本选择

### Phase 5: Step 4 - 提示词预览 ✅
- [x] 完整提示词展示
- [x] 产品分析展示
- [x] 提示词编辑功能
- [x] 复制功能

### Phase 6: Step 5 - 视频生成 ✅
- [x] 视频生成页面（对接Cloudsway）
- [x] 进度展示UI
- [x] 视频预览区域

### Phase 7: 对接智能体 ✅
- [x] 智能体1（产品调研）
- [x] 智能体2（TA画像）
- [x] 智能体3（脚本提案）
- [x] 智能体4（剧情脚本生成）
- [x] Cloudsway视频生成

### Phase 8: 优化与部署
- [ ] 响应式适配
- [ ] 性能优化
- [ ] 部署上线

## 技术栈

- **前端框架**: React 18 + TypeScript
- **UI组件库**: Ant Design 5.x
- **状态管理**: Zustand
- **路由**: React Router 6
- **构建工具**: Vite

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（需同时启动API服务器）
npm run dev
node dev-server.mjs

# 构建
npm run build
```

## 贡献者

- 产品方案: 用户568802
- 开发: 网站开发大师

## 更新日志

### 2026-03-17
- 简化为5步流程
- 对接4个扣子智能体
- 对接Cloudsway视频生成
- 视频时长改为4/8/12秒

### 2026-03-15
- 项目立项
- 完成PRD文档
- 创建项目目录结构
