// 内置模型厂商预设：BaseURL、模型列表、视觉能力标注

export interface ModelOption {
  id: string;
  label: string;
  /** true=✅支持图片 / false=❌不支持 / 'unknown'=以厂商文档为准 */
  vision: boolean | 'unknown';
}

export interface ProviderPreset {
  id: string;
  name: string;
  baseURL: string;
  models: ModelOption[];
  /** 允许用户自行输入模型名（OpenCode / 自定义） */
  editableModel?: boolean;
  /** 该厂商已知不支持浏览器跨域直连时的提示 */
  corsWarning?: string;
  /** 「如何获取 API Key」步骤说明 */
  keyHelp: string[];
  keyUrl?: string;
}

export const PROVIDERS: ProviderPreset[] = [
  {
    id: 'deepseek',
    name: 'DeepSeek',
    baseURL: 'https://api.deepseek.com/v1',
    models: [
      { id: 'deepseek-chat', label: 'deepseek-chat', vision: false },
      { id: 'deepseek-reasoner', label: 'deepseek-reasoner', vision: false },
    ],
    keyHelp: [
      '打开 DeepSeek 开放平台 platform.deepseek.com',
      '注册 / 登录账号',
      '进入「API Keys」页面，点击「创建 API Key」',
      '复制生成的 Key 粘贴到此处',
      '点击「测试连接」验证',
    ],
    keyUrl: 'https://platform.deepseek.com/api_keys',
  },
  {
    id: 'kimi',
    name: 'Kimi（月之暗面）',
    baseURL: 'https://api.moonshot.cn/v1',
    models: [
      { id: 'kimi-latest', label: 'kimi-latest', vision: true },
      { id: 'moonshot-v1-8k-vision-preview', label: 'moonshot-v1-8k-vision-preview', vision: true },
      { id: 'moonshot-v1-32k-vision-preview', label: 'moonshot-v1-32k-vision-preview', vision: true },
      { id: 'moonshot-v1-128k-vision-preview', label: 'moonshot-v1-128k-vision-preview', vision: true },
      { id: 'moonshot-v1-8k', label: 'moonshot-v1-8k', vision: false },
      { id: 'moonshot-v1-32k', label: 'moonshot-v1-32k', vision: false },
      { id: 'moonshot-v1-128k', label: 'moonshot-v1-128k', vision: false },
    ],
    keyHelp: [
      '打开 Moonshot AI 开放平台 platform.moonshot.cn',
      '注册 / 登录账号并完成实名认证',
      '进入「API Key 管理」，点击「新建 API Key」',
      '复制生成的 Key 粘贴到此处',
      '点击「测试连接」验证',
    ],
    keyUrl: 'https://platform.moonshot.cn/console/api-keys',
  },
  {
    id: 'glm',
    name: 'GLM（智谱）',
    baseURL: 'https://open.bigmodel.cn/api/paas/v4',
    models: [
      { id: 'glm-4v', label: 'glm-4v', vision: true },
      { id: 'glm-4v-plus', label: 'glm-4v-plus', vision: true },
      { id: 'glm-4v-flash', label: 'glm-4v-flash', vision: true },
      { id: 'glm-4', label: 'glm-4', vision: false },
      { id: 'glm-4-air', label: 'glm-4-air', vision: false },
      { id: 'glm-4-flash', label: 'glm-4-flash', vision: false },
    ],
    keyHelp: [
      '打开智谱 AI 开放平台 open.bigmodel.cn',
      '注册 / 登录账号',
      '进入「API Keys」页面，点击「添加新的 API Key」',
      '复制生成的 Key 粘贴到此处',
      '点击「测试连接」验证',
    ],
    keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys',
  },
  {
    id: 'opencode-go',
    name: 'OpenCode Go',
    baseURL: 'https://opencode.ai/zen/go/v1',
    models: [],
    editableModel: true,
    corsWarning:
      '已实测：该厂商服务端未开放浏览器跨域（CORS），网页无法直连。请用 OpenAI 兼容中转代理转发后，改用「自定义」接入。',
    keyHelp: [
      '打开 opencode.ai 并登录账号',
      '进入 Zen 服务页面创建 API Key',
      '复制 Key 粘贴到此处，并填写要使用的模型名',
      '模型是否支持图片识别以厂商文档为准',
      '点击「测试连接」验证',
    ],
    keyUrl: 'https://opencode.ai',
  },
  {
    id: 'opencode-zen',
    name: 'OpenCode Zen',
    baseURL: 'https://opencode.ai/zen/v1',
    models: [],
    editableModel: true,
    corsWarning:
      '已实测：该厂商服务端未开放浏览器跨域（CORS），网页无法直连。请用 OpenAI 兼容中转代理转发后，改用「自定义」接入。',
    keyHelp: [
      '打开 opencode.ai 并登录账号',
      '进入 Zen 服务页面创建 API Key',
      '复制 Key 粘贴到此处，并填写要使用的模型名',
      '模型是否支持图片识别以厂商文档为准',
      '点击「测试连接」验证',
    ],
    keyUrl: 'https://opencode.ai',
  },
  {
    id: 'custom',
    name: '自定义（OpenAI 兼容）',
    baseURL: '',
    models: [],
    editableModel: true,
    keyHelp: [
      '填写你的 OpenAI 兼容接口 BaseURL（如自建代理地址）',
      '填写接口提供的 API Key',
      '填写模型名，是否支持图片以该接口文档为准',
      '点击「测试连接」验证',
    ],
  },
];

export function getProvider(id: string): ProviderPreset {
  return PROVIDERS.find((p) => p.id === id) ?? PROVIDERS[0];
}

export function getModelOption(providerId: string, modelId: string): ModelOption | undefined {
  return getProvider(providerId).models.find((m) => m.id === modelId);
}

/** 当前所选模型是否明确支持图片识别（预设之外的模型按命名启发式推测） */
export function modelSupportsVision(providerId: string, modelId: string): boolean | 'unknown' {
  const p = getProvider(providerId);
  if (p.editableModel) return 'unknown';
  const preset = getModelOption(providerId, modelId);
  if (preset) return preset.vision;
  return guessVision(providerId, modelId);
}

/** 推测「获取模型列表」拉到的模型的视觉能力：优先匹配预设，其次按命名启发式 */
export function guessVision(providerId: string, modelId: string): boolean | 'unknown' {
  const preset = getModelOption(providerId, modelId);
  if (preset) return preset.vision;
  if (/vision|[-_]vl[-_\d]|4v|omni/i.test(modelId)) return true;
  return 'unknown';
}
