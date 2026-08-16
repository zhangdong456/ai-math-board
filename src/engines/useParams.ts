// 渲染器共用的参数状态 Hook 与样式
import { useMemo, useState } from 'react';
import type { KnowledgeJSON, KnowledgeParam } from '../types/knowledge';

export interface RendererProps {
  knowledge: KnowledgeJSON;
}

/** 从 knowledge.parameters 初始化本地参数状态，拖滑块实时改值 */
export function useParams(knowledge: KnowledgeJSON) {
  const initial = useMemo(() => {
    const o: Record<string, number> = {};
    for (const [k, p] of Object.entries(knowledge.parameters ?? {})) o[k] = p.value;
    return o;
  }, [knowledge]);
  const [values, setValues] = useState<Record<string, number>>(initial);
  const set = (key: string, v: number) => setValues((s) => ({ ...s, [key]: v }));
  return { values, set };
}

export function paramOf(k: KnowledgeJSON, key: string, fallback: KnowledgeParam): KnowledgeParam {
  return k.parameters?.[key] ?? fallback;
}

export function num(v: number | undefined, fallback: number): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : fallback;
}
