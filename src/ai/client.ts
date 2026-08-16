// LLM 接入：OpenAI 兼容 chat/completions 调用、测试连接、文字/图片生成
import { SYSTEM_PROMPT, imageUserPrompt, textUserPrompt } from './prompts';

export interface ActiveConfig {
  baseURL: string;
  apiKey: string;
  model: string;
}

interface ChatMessage {
  role: 'system' | 'user';
  content:
    | string
    | Array<{ type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }>;
}

async function chatCompletion(cfg: ActiveConfig, messages: ChatMessage[], maxTokens = 4096): Promise<string> {
  const url = `${cfg.baseURL.replace(/\/+$/, '')}/chat/completions`;
  const send = (withTemperature: boolean, tokens: number) =>
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages,
        ...(withTemperature ? { temperature: 0.2 } : {}),
        max_tokens: tokens,
      }),
    });
  let res: Response;
  let withTemp = true;
  try {
    res = await send(withTemp, maxTokens);
    // 部分模型（如 kimi-k2 系列）不允许自定义 temperature，报 400 时去掉该字段重试一次
    if (res.status === 400) {
      const body = await res.clone().text().catch(() => '');
      if (/temperature/i.test(body)) {
        withTemp = false;
        res = await send(false, maxTokens);
      }
    }
  } catch {
    throw new Error('网络请求失败：可能是跨域（CORS）限制或网络不可达，请检查 BaseURL 或改用自定义兼容代理');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`接口返回 ${res.status}：${body.slice(0, 200) || res.statusText}`);
  }
  const extract = (json: unknown): { content: string; finishReason: string; hasReasoning: boolean } => {
    const choice = (json as { choices?: Array<{ message?: { content?: unknown; reasoning_content?: unknown }; finish_reason?: unknown }> })
      ?.choices?.[0];
    return {
      content: typeof choice?.message?.content === 'string' ? choice.message.content : '',
      finishReason: typeof choice?.finish_reason === 'string' ? choice.finish_reason : '',
      hasReasoning: typeof choice?.message?.reasoning_content === 'string' && Boolean(choice.message.reasoning_content),
    };
  };
  let parsed = extract(await res.json());
  // 推理模型（kimi-k3 等）可能把 max_tokens 全用在思考链上导致正文为空：放大预算重试一次
  if (!parsed.content.trim() && parsed.finishReason === 'length' && parsed.hasReasoning) {
    const bigger = Math.min(maxTokens * 4, 16384);
    try {
      const retry = await send(withTemp, bigger);
      if (retry.ok) parsed = extract(await retry.json());
    } catch {
      // 落入下方统一报错
    }
  }
  if (!parsed.content.trim()) {
    throw new Error(
      parsed.hasReasoning
        ? '该模型是推理模型，输出预算全被思考链占用，未返回正文。建议换用非推理模型（如 kimi-latest / moonshot-v1 系列）'
        : '模型返回内容为空',
    );
  }
  return parsed.content;
}

/** 拉取厂商可用模型列表（GET /models，OpenAI 兼容） */
export async function fetchModels(cfg: Pick<ActiveConfig, 'baseURL' | 'apiKey'>): Promise<string[]> {
  if (!cfg.baseURL) throw new Error('请先填写 BaseURL');
  if (!cfg.apiKey) throw new Error('请先填写 API Key');
  const url = `${cfg.baseURL.replace(/\/+$/, '')}/models`;
  let res: Response;
  try {
    res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
  } catch {
    throw new Error('网络请求失败：可能是跨域（CORS）限制或网络不可达，请检查 BaseURL 或改用自定义兼容代理');
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`接口返回 ${res.status}：${body.slice(0, 200) || res.statusText}`);
  }
  const json = await res.json();
  const data: unknown = json?.data;
  if (!Array.isArray(data)) throw new Error('模型列表格式异常（非 OpenAI 兼容 /models 响应）');
  const ids = data.map((m) => String((m as { id?: unknown })?.id ?? '')).filter(Boolean);
  if (!ids.length) throw new Error('模型列表为空');
  return ids;
}

/** 测试连接：发一个最小 chat completion 请求 */
export async function testConnection(cfg: ActiveConfig): Promise<{ ok: boolean; message: string }> {
  if (!cfg.baseURL) return { ok: false, message: '请先填写 BaseURL' };
  if (!cfg.apiKey) return { ok: false, message: '请先填写 API Key' };
  if (!cfg.model) return { ok: false, message: '请先选择或填写模型' };
  try {
    await chatCompletion(cfg, [{ role: 'user', content: 'ping，请只回复 pong' }], 1024);
    return { ok: true, message: `连接成功，模型 ${cfg.model} 可用` };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : '连接失败' };
  }
}

/** 场景一：文字生成结构化知识 JSON 原文 */
export async function generateFromText(input: string, subject: string, cfg: ActiveConfig): Promise<string> {
  return chatCompletion(cfg, [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: textUserPrompt(input, subject) },
  ]);
}

/** 场景二：框选区域 base64 图发给视觉模型 */
export async function generateFromImage(imageDataUrl: string, subject: string, cfg: ActiveConfig): Promise<string> {
  return chatCompletion(cfg, [
    { role: 'system', content: SYSTEM_PROMPT },
    {
      role: 'user',
      content: [
        { type: 'text', text: imageUserPrompt(subject) },
        { type: 'image_url', image_url: { url: imageDataUrl } },
      ],
    },
  ]);
}
