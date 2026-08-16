# 对话进展记录（progress.md）

> 用途：新开对话时快速恢复进度。长期稳定的项目事实以 `project_context.md` 为准，需求以 `PRD.md` 为准。

## 当前阶段

M1+M2+M3+M4 均已完成，build 通过（tsc 零错误）。M4（演示同比缩放 + 动画自动播放 + 3 个新渲染器 + 通义千问厂商 + 科幻 UI）已用 bsk 驱动真实浏览器做自动化冒烟验证通过；M1~M3 仍待真实浏览器人工验收，真实 LLM 联调未做（无 API Key）。

## 已完成事项

1. 通读原始需求 `数理化AI黑板.md`，通过两轮提问确认全部关键决策（见下）
2. 编写 `PRD.md`（需求唯一权威来源，后续需求变更先改它再开发）
3. 完成 M1 全部功能开发（React 18 + Vite + TS + Zustand + CSS Modules）：
   - 三栏布局（左 AI 操作区 / 中白板 / 右画笔+AI 说明区）
   - 白板窗口系统：拖动、八向调大小、最大化/最小化/关闭、置顶、多窗口、新窗口强制落在可视区域内
   - 场景一文字生成闭环：LLM → 结构化 JSON → schema 校验 → 引擎渲染
   - 场景二图片框选闭环：上传 → 红色高对比框选 → 裁剪发视觉模型 → 校验 → 渲染 → 新窗口置顶
   - 5 种参数化渲染器：二次函数、一次函数、三角函数、圆、F=ma
   - 6 个默认模板，无 Key 可用
   - 模型配置：5 内置厂商（DeepSeek/Kimi/GLM/OpenCode Go/OpenCode Zen）+ 自定义，自动填 BaseURL、vision 能力标注、Key 密码框+显隐、测试连接、获取 Key 说明
   - 画笔标注层：画笔/矩形/圆形/箭头/橡皮/撤销/重做/清空
   - localStorage 持久化（模型配置 + 窗口 + 笔画），写满自动降级
4. M1 全量审查（10 项验收清单全过），修复 4 个运行期 bug：
   - 窗口标题栏按钮 pointerdown 冒泡导致误拖动（WindowFrame.tsx）
   - 持久化恢复窗口在小视口下跑出屏幕，加 clampWindowToViewport（boardStore.ts）
   - 图片框选 setState updater 内副作用（ImageWindow.tsx）
   - StrictMode 下笔画重复入库（AnnotationLayer.tsx）
5. `npm run build` 通过（TS 零错误）；dev server curl 冒烟 HTTP 200
6. 排查「Kimi / OpenCode Go 测试连接失败」（curl 实测五厂商）：
   - DeepSeek / Kimi / GLM 的 CORS 预检全部正常，浏览器直连可用 → Kimi 失败原因锁定为 Key 本身（无效/欠费/未实名）或用户浏览器网络，待用户提供 UI 上的具体错误文案或 Key 复测
   - OpenCode Go / Zen 服务端无 CORS 支持（预检 404、响应无 ACAO 头），纯网页**无法直连**，UI 已加 ⚠ 提示，需中转代理走「自定义」
7. 新增「获取模型列表」功能：`GET {BaseURL}/models` 拉取模型 → 点击选择（视觉能力按预设+命名启发式标注），所有厂商可用，结果持久化；build 通过
8. 修复 Kimi 400 报错「invalid temperature: only 1 is allowed」：kimi-k2 系列不允许自定义 temperature，`chatCompletion` 遇到含 temperature 字样的 400 时自动去掉该字段重试一次（src/ai/client.ts），build 通过
9. 修复 kimi-k3「模型返回内容为空」：k3 是推理模型，小 max_tokens 全被思考链（reasoning_content）占用、正文为空且 finish_reason=length（已用用户 Key curl 复现并验证）。修复：正文为空+finish_reason=length+有 reasoning 时自动 4 倍预算重试（上限 16384）；默认 maxTokens 1500→4096；测试连接 8→1024；仍为空则提示「推理模型预算被思考链占用，建议换非推理模型」。curl 验证 k3@1024 正常返回，build 通过。顺带修复：拉取列表选中的非预设模型在图片场景被误判 ❌ 拦截的问题——`modelSupportsVision` 找不到预设时改为走 `guessVision` 启发式
10. 完成 M2 内容扩充 + M3 体验打磨，build 通过（tsc 零错误）、dev 冒烟 HTTP 200：
    - M2 新增 12 种渲染器：矩形面积（单位网格）、三角形面积（等底等高）、平行四边形割补、圆面积与割圆术（内接正 n 边形逼近 π）、指数函数、导数几何意义（割线逼近切线）、匀变速直线运动（v-t 图面积=位移）、欧姆定律（量程自适应）、平抛运动（速度分量分解）、玻尔原子模型（Z 1~20）、氢氧燃烧配平（原子守恒条形对比）、分子 3D 球棍模型（纯 SVG 手写旋转投影+画家算法，无 3D 库，CH4/H2O/CO2/NH3 由 KnowledgeJSON 新增可选字段 `variant` 选择）；registry 注册全部 17 类型，prompts.ts 同步参数约定
    - M2 默认模板 6 → 22（数学 12 / 物理 6 / 化学 4）；验证层重构为规则表驱动（TYPE_RULES：正长度夹取/拒绝、取整、范围夹取、variant 回退等）+ 新增 TYPE_SUBJECT 学科↔类型一致性检查（不一致→pending 提示不阻塞）
    - M3 学科过滤模板列表（"其他"显示全部）；左右侧栏可折叠（uiStore leftOpen/rightOpen 不持久化，折叠后留 20px 竖排把手条，首屏 <900px 自动折叠）
    - M3 窗口智能排列：boardStore 新增 arrangeTile（⌈√n⌉ 网格平铺）/ arrangeCascade（居中+32px 级联），header 加「▦ 平铺」「▤ 级联」按钮
    - M3 性能：WindowFrame 拖动/缩放 rAF 节流（endDrag 提交终态）、DemoWindow/ImageWindow 包 React.memo、AnnotationLayer 草稿改 useRef + rAF 合并重绘（pointermove 不再触发 React 渲染）
    - M3 触屏：全局 touch-action: manipulation + 去点按高亮；pointer:coarse 下加大 resize 手柄/标题栏按钮/滑块 thumb/模板项热区，输入框 14px 防 iOS 缩放
11. 完成 M4 演示力与视觉升级（用户 7 项新需求，build 通过 tsc 零错误）：
    - 坐标系同比放大：根因是渲染器 SVG 固定 520×360 像素。PlotArea 改为内部使用新增 FitSvg（viewBox + preserveAspectRatio + 宽高 100%），8 个裸 SVG 渲染器同步换 FitSvg，全部 20 种渲染器随窗口缩放（含文字刻度）
    - 动画自动播放：新增 useAutoPlay（rAF 驱动，pingpong 往返/loop 循环/整数 step）+ AutoPlayButton，16 种渲染器接入（化学配平不加）；手动拖滑块自动停止播放
    - 新渲染器 ×3：高斯钟形曲线 gaussian（a/mu/sigma，拐点 μ±σ 标注）、三次函数 cubic（极值点判别式标注）、阻尼振动 damped_oscillation（包络线 ±A·e^(−βt)+时间循环）；registry/TYPE_RULES/TYPE_SUBJECT/prompts/templates 同步，模板 22 → 25
    - 内置厂商新增通义千问（阿里百炼）：`https://dashscope.aliyuncs.com/compatible-mode/v1`，模型 qwen-plus/turbo/max/long（❌）+ qwen-vl-plus/max（✅）；curl 实测 CORS 预检 ACAO:* 可直连、假 Key 返回标准 401（OpenAI 兼容）
    - 科幻 UI：顶栏 52px + 霓虹能量线 + logo 流光、白板极光背景漂移（顺带修复原 background/background-image 互相覆盖导致辉光丢失的 bug）、窗口霓虹描边 + popIn 入场、弹窗 fadeIn+popIn、按钮/模板项/工具钮悬停浮起辉光、区块标题霓虹条、prefers-reduced-motion 全站降级
    - bsk 真实浏览器自动化冒烟：模板列表出现新模板；高斯窗口 ✅ 已验证 + 自动播放按钮；shim rAF 后 σ 滑块值随时间变化（0.7→2.6）；窗口最大化后 SVG 546×325→698×497 同比放大；配置弹窗出现通义千问、BaseURL 自动填充、vl 模型 ✅ 标注正确（bsk 截图 readback 失败，未留截图，验证均走 DOM/evaluate）

## 关键决策（用户已确认，勿轻易推翻）

- 产品形态：纯网页，响应式适配平板；桌面端后续 Electron 套壳
- 技术栈：React + Vite + TypeScript；状态管理 Zustand（persist 持久化）
- 架构：纯前端直连 LLM API，Key 存 localStorage，无后端
- AI 生成方式：AI 只输出结构化 JSON，本地引擎渲染（准确性 > 可解释性 > 动画效果）
- 交付策略：核心闭环优先，默认模板逐步扩充
- 内置厂商：DeepSeek、Kimi、GLM、通义千问（阿里百炼）、OpenCode Go、OpenCode Zen + 自定义 OpenAI 兼容接口
- 阿里百炼 BaseURL：`https://dashscope.aliyuncs.com/compatible-mode/v1`（curl 实测 CORS 可直连）
- OpenCode Go BaseURL：`https://opencode.ai/zen/go/v1`；OpenCode Zen：`https://opencode.ai/zen/v1`（均已联网核实）

## 未完成待办

- [ ] 用户在真实浏览器人工验收 M1~M4（`npm run dev`）：两大核心场景 + M2 新模板/渲染器 + M3 侧栏折叠/智能排列/触屏 + M4 自动播放/同比缩放/科幻 UI，反馈 UI/交互问题（M4 已过 bsk 自动化冒烟，仍建议人工过目视觉效果）
- [ ] 通义千问真实 Key 联调：接口连通性已 curl 实测（CORS ✅、401 格式 ✅），但无真实 Key，「测试连接」与生成链路未端到端跑通，等用户提供 Key 复测
- [ ] Kimi 连接失败复测：等用户提供测试连接时 UI 显示的具体错误文案（或直接给一个 Key 让我 curl 复测）
- [ ] OpenCode Go / Zen 接入方案决策：自建 OpenAI 兼容中转后走「自定义」，或让我写一个本地小代理脚本（会引入一个需常开的 Node 进程，打破纯前端形态）
- [ ] 真实 LLM 联调（需用户提供任一厂商 Key 自测）：文字生成 + 图片框选识别，重点验证 JSON 输出稳定性（含 M2 12 个新类型与 M4 的 gaussian/cubic/damped_oscillation 参数约定）
- [ ] 已知小瑕疵（不阻塞，见 project_context.md「已知坑点」）

## 如何继续

新开对话第一句说：**「请先读取 project_context.md 了解项目背景，然后帮我……」**
