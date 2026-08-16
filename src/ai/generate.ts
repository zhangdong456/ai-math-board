// 生成管线：AI 原文 → JSON 提取 → schema 校验 → 知识验证层 → 建演示窗口 + 右侧说明
import { extractJson } from './parse';
import { validateSchema, verifyKnowledge } from '../validation/validate';
import { useBoard } from '../store/boardStore';
import { RENDERERS } from '../engines/registry';
import type { KnowledgeJSON } from '../types/knowledge';

export interface GenOutcome {
  ok: boolean;
  message: string;
}

export function finishGeneration(rawText: string, source: string): GenOutcome {
  const board = useBoard.getState();

  let raw: unknown;
  try {
    raw = extractJson(rawText);
  } catch (e) {
    const message = e instanceof Error ? e.message : 'AI 返回内容无法解析';
    board.setLastExplain({ source, understanding: message, rules: [], status: 'pending', reason: message, time: Date.now() });
    return { ok: false, message };
  }

  const { data, error } = validateSchema(raw);
  if (!data) {
    const message = `AI 返回未通过 schema 校验：${error}`;
    board.setLastExplain({ source, understanding: message, rules: [], status: 'pending', reason: message, time: Date.now() });
    return { ok: false, message };
  }

  const verify = verifyKnowledge(data);
  const explain = {
    source,
    understanding: data.understanding || '（AI 未提供说明）',
    rules: data.rules ?? [],
    status: verify.status,
    reason: verify.reason,
    time: Date.now(),
  };
  board.setLastExplain(explain);

  if (!verify.ok) {
    return { ok: false, message: verify.reason ?? '知识验证未通过，已阻止生成' };
  }

  const title = data.title || RENDERERS[data.type]?.defaultTitle || '动态演示';
  board.addDemoWindow({ ...data, title }, verify.status, verify.reason);
  return { ok: true, message: '生成成功' };
}

/** 无 API Key 时的本地模板兜底也走同一管线 */
export function spawnTemplate(knowledge: KnowledgeJSON, source: string): void {
  const board = useBoard.getState();
  const verify = verifyKnowledge(knowledge);
  board.setLastExplain({
    source,
    understanding: knowledge.understanding ?? '',
    rules: knowledge.rules ?? [],
    status: verify.status,
    reason: verify.reason,
    time: Date.now(),
  });
  board.addDemoWindow(knowledge, verify.status, verify.reason);
}
