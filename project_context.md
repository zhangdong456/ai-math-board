# 项目上下文（project_context.md）

AI 动态知识演示白板：把数理化静态公式/图片知识点，通过 AI 转换成白板上可交互的动态演示。需求唯一权威来源是 `PRD.md`（改需求先改 PRD）；对话进度见 `progress.md`。

## 1. 技术栈

- React 18 + TypeScript + Vite 5（`npm run dev` 开发 / `npm run build` = `tsc -b && vite build`，TS 零错误才算过）
- 状态管理：Zustand 4（`persist` 中间件持久化到 localStorage）
- 样式：CSS Modules（`*.module.css`）+ `src/styles/global.css`
- 无后端、无路由、无 UI 组件库；白板/窗口/标注全部自绘（SVG + Canvas）
- 关键依赖仅：`react`、`react-dom`、`zustand`

## 2. 目录结构与职责

```
src/
  App.tsx                 # 三栏布局总装（左操作区/中白板/右工具区）
  main.tsx                # 入口，已开 StrictMode
  types/knowledge.ts      # 结构化知识 JSON 的 TS 类型（核心契约，改动要同步 prompt/校验/渲染；含可选字段 variant，用于同类型内选择变体，如分子 3D 的 CH4/H2O/CO2/NH3）
  config/providers.ts     # LLM 厂商预设：BaseURL、模型列表、vision 能力标注
  ai/
    client.ts             # OpenAI 兼容 chat/completions 调用 + 测试连接
    prompts.ts            # 强制模型只输出结构化 JSON 的 system prompt
    parse.ts              # 从模型回复提取 JSON（容忍 markdown 围栏）
    generate.ts           # 文字生成 / 图片识别两条链路编排
  validation/validate.ts  # 知识验证层：schema 校验 + 规则表（TYPE_RULES）+ 学科一致性（TYPE_SUBJECT）+ 置信度门槛
  engines/
    registry.ts           # type → 渲染器 分发（新增演示类型在此注册）
    templates.ts          # 默认演示模板（无 API Key 可用）
    PlotArea.tsx          # 通用 SVG 坐标系 + FitSvg（viewBox 自适应缩放容器，所有渲染器统一走它）
    ParamSlider.tsx       # 参数滑块
    useParams.ts          # 演示参数状态 hook
    useAutoPlay.ts        # 动画自动播放 hook（rAF 驱动参数 pingpong/loop 扫描）
    AutoPlayButton.tsx    # 自动播放按钮（▶/⏸）
    renderers/            # 各类型渲染器 ×20：Quadratic/Linear/Trig/Circle/Newton（M1）+ RectArea/TriangleArea/ParallelogramArea/CircleArea/Exponential/Derivative/UniformMotion/OhmLaw/Projectile/BohrAtom/ChemicalBalance/Molecule3D（M2，Molecule3D 为纯 SVG 手写旋转投影+画家算法，无 3D 库）+ Gaussian/Cubic/DampedOscillation（M4）
  board/
    Board.tsx             # 白板容器：视口管理、窗口渲染、标注层挂载
    WindowFrame.tsx       # 窗口外壳：拖动/八向调大小/最大化/最小化/关闭/置顶
    AnnotationLayer.tsx   # 画笔标注 Canvas 覆盖层（画笔/图形/橡皮/撤销重做）
  windows/
    ImageWindow.tsx       # 图片窗口 + 红色框选 + 裁剪发 AI
    DemoWindow.tsx        # 演示窗口：渲染器 + AI 理解/规律/验证状态
  components/
    LeftPanel.tsx         # 左栏：文本输入/学科/生成/上传/模板列表
    RightPanel.tsx        # 右栏：画笔工具 + AI 生成说明
    ModelConfigModal.tsx  # 模型配置面板（厂商/Key/测试连接/vision 标注）
  store/
    modelConfigStore.ts   # 模型配置（persist key: ai-board-model-config）
    boardStore.ts         # 窗口+笔画状态（persist key: ai-board-state）；含 arrangeTile/arrangeCascade 智能排列
    uiStore.ts            # 面板开关等临时 UI 状态（leftOpen/rightOpen 不持久化）
```

## 3. 关键约定

- **AI 不直接生成代码/动画**：只输出 `types/knowledge.ts` 定义的结构化 JSON，本地引擎渲染。新增演示类型 = 加类型 + 写 renderer + `registry.ts` 注册 + `templates.ts` 加模板 + prompt 补充说明
- **渲染器 SVG 一律走 FitSvg/PlotArea**（viewBox + 宽高 100%），禁止固定像素 `width/height`，否则窗口放大后坐标系不变（M4 修复过的坑）
- **自动播放接入模式**：`useAutoPlay(param.min, param.max, v => set(key, v), {mode/periodMs/step})` + `<AutoPlayButton>`；时间/旋转类用 loop，系数类用 pingpong，整数参数传 step；滑块 onChange 必须经 `manual`（先 `auto.stop()` 再 set）
- 所有交互用 **pointer events** + `touch-action:none`（兼容触屏），禁止只用 mouse events
- 框选框必须高对比度红色（`#ff2233`），禁止浅色
- 新窗口必须经 `boardStore.ts` 的 `placeInViewport` 落位，严禁出现在视口外
- 持久化：仅 zustand persist 两个 key；`boardStore` 用 `partialize` 排除撤销栈；localStorage 写满时自动丢弃图片 dataURL 降级保存布局
- UI 文案全中文；滚动条用自定义细样式（global.css）
- React StrictMode 已开启：**setState updater 内禁止写副作用**（已在 ImageWindow/AnnotationLayer 踩过两次坑）
- 不做 git commit（用户未授权）

## 4. 已完成功能清单（M1 + M2 + M3）

| 功能 | 主要文件 |
|---|---|
| 三栏布局 | `src/App.tsx`, `src/app.module.css` |
| 窗口系统（拖动/调大小/最大最小化/置顶/视口内落位） | `src/board/WindowFrame.tsx`, `src/store/boardStore.ts` |
| 文字生成闭环（输入→LLM→JSON→校验→渲染） | `src/components/LeftPanel.tsx`, `src/ai/*`, `src/validation/validate.ts` |
| 图片上传 + 红色框选 + 视觉识别生成 | `src/windows/ImageWindow.tsx`, `src/ai/generate.ts` |
| 5 种可交互渲染器（二次/一次/三角/圆/F=ma） | `src/engines/renderers/*.tsx` |
| 默认演示模板 ×6（无 Key 可用） | `src/engines/templates.ts` |
| 模型配置（5 内置厂商+自定义，自动 BaseURL，vision 标注，测试连接，获取模型列表，Key 密码框） | `src/components/ModelConfigModal.tsx`, `src/config/providers.ts`, `src/ai/client.ts`(fetchModels) |
| 画笔标注（画笔/矩形/圆形/箭头/橡皮/撤销/重做/清空） | `src/board/AnnotationLayer.tsx`, `src/components/RightPanel.tsx` |
| 知识验证层（schema+规则+置信度，验证状态展示） | `src/validation/validate.ts`, `src/windows/DemoWindow.tsx` |
| localStorage 持久化（配置+窗口+笔画，刷新恢复） | `src/store/modelConfigStore.ts`, `src/store/boardStore.ts` |
| **M2**：新渲染器 ×12（面积演示/割圆术/指数/导数/匀变速/欧姆/平抛/玻尔原子/配平/分子3D） | `src/engines/renderers/*.tsx`, `src/engines/registry.ts` |
| **M2**：默认模板 6 → 22（数学 12 / 物理 6 / 化学 4）；KnowledgeJSON 新增可选 `variant` 字段 | `src/engines/templates.ts`, `src/types/knowledge.ts`, `src/ai/prompts.ts` |
| **M2**：验证层规则表驱动（TYPE_RULES）+ 学科↔类型一致性检查（TYPE_SUBJECT，不一致→pending 不阻塞） | `src/validation/validate.ts` |
| **M3**：学科过滤模板列表 + 侧栏可折叠（窄屏自动折叠） | `src/components/LeftPanel.tsx`, `src/App.tsx`, `src/store/uiStore.ts` |
| **M3**：窗口智能排列（平铺 arrangeTile / 级联 arrangeCascade） | `src/store/boardStore.ts`, `src/App.tsx` |
| **M3**：性能优化（窗口拖动缩放 rAF 节流、DemoWindow/ImageWindow React.memo、画笔草稿 useRef + rAF 合并重绘） | `src/board/WindowFrame.tsx`, `src/windows/*.tsx`, `src/board/AnnotationLayer.tsx` |
| **M3**：触屏打磨（touch-action、加大热区/按钮/滑块、输入框 14px 防 iOS 缩放） | `src/styles/global.css` |
| **M4**：坐标系随窗口同比缩放（FitSvg/viewBox 改造全部 20 种渲染器） | `src/engines/PlotArea.tsx`, `src/engines/renderers/*.tsx` |
| **M4**：动画自动播放（useAutoPlay + AutoPlayButton，16 种渲染器接入，拖滑块即停） | `src/engines/useAutoPlay.ts`, `src/engines/AutoPlayButton.tsx`, `src/engines/renderers/*.tsx` |
| **M4**：新渲染器 ×3（高斯钟形/三次函数/阻尼振动），模板 22 → 25，渲染类型 17 → 20 | `src/engines/renderers/{Gaussian,Cubic,DampedOscillation}Renderer.tsx`, `registry.ts`, `templates.ts`, `validate.ts`, `prompts.ts` |
| **M4**：内置厂商新增通义千问（阿里百炼，curl 实测 CORS 可直连） | `src/config/providers.ts` |
| **M4**：深空科幻 UI（极光背景、霓虹辉光、入场/悬停动效、reduced-motion 适配） | `src/styles/global.css`, `src/app.module.css`, `src/board/board.module.css` |

内置厂商 BaseURL：DeepSeek `https://api.deepseek.com/v1`；Kimi `https://api.moonshot.cn/v1`；GLM `https://open.bigmodel.cn/api/paas/v4`；通义千问（阿里百炼）`https://dashscope.aliyuncs.com/compatible-mode/v1`；OpenCode Go `https://opencode.ai/zen/go/v1`；OpenCode Zen `https://opencode.ai/zen/v1`。vision 标注：DeepSeek 全 ❌；Kimi vision-preview 系列与 kimi-latest ✅；GLM glm-4v 系列 ✅；通义千问 qwen-vl 系列 ✅（qwen-plus/turbo/max/long ❌）。

## 5. 待办与下一步

1. 真实浏览器人工验收 M1~M4（两大核心场景 + M2 新模板/渲染器 + M3 折叠/排列/触屏 + M4 自动播放/同比缩放/科幻 UI；M4 已过 bsk 自动化冒烟）
2. 通义千问真实 Key 端到端联调（接口已 curl 实测可直连，缺 Key）
3. Kimi 连接失败复测（等用户提供 UI 错误文案或 Key）
4. OpenCode Go / Zen 接入：用户自搭中转走「自定义」，或加本地 Node 代理脚本（破坏纯前端形态，待用户决策）
5. 真实 LLM 联调（文字 + 图片识别），验证 JSON 稳定性（重点：M2/M4 新类型的参数约定与 variant 输出是否稳定）
6. 远期：Electron 套壳桌面端

## 6. 已知坑点与注意事项

- **StrictMode 双调用**：setState updater 必须是纯函数，副作用（入库、弹消息）要移出 updater
- 窗口标题栏按钮需 `onPointerDown` stopPropagation，否则冒泡触发窗口拖动
- 持久化恢复的窗口位置必须按当前视口夹取（`clampWindowToViewport`），否则大屏存、小屏开窗口消失
- `CircleRenderer` 用 `min(pxPerUnitX, pxPerUnitY)` 保持正圆，与坐标网格 x 向有 ~9% 比例差（有意取舍）
- `TrigRenderer` 滑块仅 webkit 样式，Firefox 下 thumb 是默认样式（功能正常）
- 窗口最小化还原只还原尺寸不还原位置（有意为之）
- 部分模型（kimi-k2 系列等）不允许自定义 temperature，会报 400「invalid temperature: only 1 is allowed」：`chatCompletion` 已做自动降级（去掉 temperature 重试），新增请求参数时注意同类兼容性
- 推理模型（kimi-k3 等）会把 max_tokens 全用在思考链（reasoning_content）上，正文为空且 finish_reason=length：`chatCompletion` 检测到该特征自动 4 倍预算重试（上限 16384），默认 maxTokens=4096、测试连接=1024；结构化 JSON 生成场景建议用户选非推理模型（推理模型慢且贵）
- 纯前端直连 LLM 受各厂商 CORS 限制（已 curl 实测）：DeepSeek / Kimi / GLM / 通义千问（阿里百炼，预检 ACAO:*）预检正常可直连；**OpenCode Go / Zen 服务端无 CORS（预检 404、无 ACAO 头），网页无法直连**——API 本身正常（带错误 Key 会明确返回 401），纯粹是浏览器跨域限制；CLI/桌面端工具（如 deepseekharness）走 Node 直连无此限制。providers.ts 已加 `corsWarning` 提示，需中转代理走「自定义」
- 自动播放用 rAF 驱动：**标签页隐藏时 rAF 暂停，动画停走属预期**（回前台自动恢复）；用 bsk 等工具验证时若 Agent Window 被遮挡（visibilityState=hidden），需 shim `requestAnimationFrame` 才能看到参数变化
- 白板背景曾踩坑：`background` 简写与 `background-image` 分开写会互相覆盖导致径向辉光丢失，M4 已合并为单条多图层 `background-image`
- 「获取模型列表」= `client.ts` 的 `fetchModels`（GET /models），结果存 `modelConfigStore.fetchedModels`（persist）；fetched 模型的 vision 标注走 `providers.ts` 的 `guessVision` 启发式
- API Key 明文存 localStorage，仅适用个人本机场景，UI 已注明
- localStorage ~5MB：多张大图靠压缩 dataURL + 写满降级策略兜底
- 并排子代理并行开发时，`registry.ts` 等共享文件的引用瞬态报错（一个代理还在写、另一个已引用）属预期，等全部落盘后 tsc 复验即可

---

最后更新：2026-08-16（M2+M3+M4 完成）
