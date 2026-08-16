# AI 数理化演示白板（AI Math Board）

把数理化静态公式/图片知识点，通过 AI 转换成白板上**可交互的动态演示**。

看到知识点 → 框选/输入 → AI 理解 → 自动生成可拖参数的动态演示 → 在白板上讲解。

**在线体验**：https://zhangdong456.github.io/ai-math-board/

## 功能特性

- **文字生成演示**：输入知识点（如"y = ax² + bx + c，展示参数变化"），AI 输出结构化 JSON，本地引擎渲染可交互演示
- **图片框选识别**：上传教材截图，红色框选目标区域，多模态 AI 识别后生成演示
- **22 个内置模板**（无需 API Key 即可体验）：
  - 数学 ×12：二次/一次/三角函数、圆、矩形/三角形/平行四边形面积演示、圆面积与割圆术、指数函数、导数几何意义（割线逼近切线）
  - 物理 ×6：F=ma、匀变速直线运动（v-t 图面积=位移）、自由落体、欧姆定律、平抛运动（含月球重力）
  - 化学 ×4：玻尔原子模型、氢氧燃烧配平（原子守恒）、分子 3D 球棍模型（CH₄/H₂O/CO₂/NH₃，纯 SVG 手写 3D 投影）
- **知识验证层**：schema 校验 + 学科规则库 + 置信度门槛，AI 输出不可靠时拒绝生成并提示
- **白板窗口系统**：多窗口拖动/八向缩放/最大最小化/置顶，一键平铺/级联智能排列
- **画笔标注**：画笔/矩形/圆形/箭头/橡皮/撤销重做，覆盖整个白板
- **模型配置**：内置 DeepSeek / Kimi / GLM 等厂商预设，自动填 BaseURL、视觉能力标注、测试连接、拉取模型列表；也支持任意 OpenAI 兼容接口
- **体验细节**：平板触屏适配（大触控热区、可折叠侧栏）、窗口拖动 rAF 节流、localStorage 持久化（刷新不丢失）

## 快速开始

```bash
npm install
npm run dev      # 开发，默认 http://localhost:5173
npm run build    # 构建到 dist/（tsc 零错误才算通过）
```

不配置 API Key 也能用：直接点左侧「默认演示引擎」里的模板。

要用 AI 生成功能：点左下角「模型配置」，选厂商填 Key（Key 只存在你自己浏览器的 localStorage，不会上传）。

## 技术栈

- React 18 + TypeScript + Vite 5
- Zustand 4（persist 持久化到 localStorage）
- 纯前端架构：浏览器直连 LLM API，无后端
- AI **不生成代码**：只输出结构化 JSON，本地渲染器按 type 分发渲染（幻觉可控）
- 白板/窗口/标注全部自绘（SVG + Canvas），无 UI 组件库、无 3D 库

## 目录结构

```
src/
  ai/           # LLM 接入：client / prompts / parse / generate
  board/        # 白板：窗口系统、标注层
  components/   # 左右面板、模型配置弹窗
  config/       # 厂商预设
  engines/      # 演示引擎：registry / templates / 17 种渲染器
  store/        # Zustand 状态（窗口、标注、模型配置、UI）
  styles/       # 全局样式
  types/        # 结构化知识 JSON 的 TS 类型（核心契约）
  validation/   # 知识验证层（规则表驱动）
  windows/      # 图片窗口、演示窗口
```

## 部署

GitHub Actions 自动部署到 GitHub Pages：push 到 `main` 分支即触发构建发布（见 `.github/workflows/deploy.yml`）。

## 说明

- API Key 明文存 localStorage，仅限个人本机使用场景，请勿在公共电脑上配置
- 需求权威来源见 `PRD.md`，开发进展见 `progress.md`
