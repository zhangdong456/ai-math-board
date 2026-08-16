// 我的模板库：把 AI 生成（或内置模板）的演示收藏为本地模板，按学科归档，persist 到 localStorage
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { KnowledgeJSON } from '../types/knowledge';
import { RENDERERS } from '../engines/registry';

export interface CustomTemplate {
  id: string;
  name: string;
  subject: string;
  knowledge: KnowledgeJSON;
  createdAt: number;
}

const VALID_SUBJECTS = ['数学', '物理', '化学'];

/** 用类型+变体+参数做指纹，避免重复收藏同一份演示 */
export function fingerprintOf(k: KnowledgeJSON): string {
  return JSON.stringify({ type: k.type, variant: k.variant ?? null, parameters: k.parameters });
}

interface CustomTemplateState {
  customTemplates: CustomTemplate[];
  /** 收藏一份演示知识；重复收藏时返回已存在提示 */
  saveTemplate: (k: KnowledgeJSON) => { ok: boolean; message: string };
  removeTemplate: (id: string) => void;
}

export const useCustomTemplates = create<CustomTemplateState>()(
  persist(
    (set, get) => ({
      customTemplates: [],

      saveTemplate: (k) => {
        const fp = fingerprintOf(k);
        if (get().customTemplates.some((t) => fingerprintOf(t.knowledge) === fp)) {
          return { ok: false, message: '该演示已在我的模板中，无需重复添加' };
        }
        const name = k.title ?? RENDERERS[k.type]?.defaultTitle ?? k.type;
        const subject = k.subject && VALID_SUBJECTS.includes(k.subject) ? k.subject : '其他';
        const tpl: CustomTemplate = {
          id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name,
          subject,
          knowledge: k,
          createdAt: Date.now(),
        };
        set((s) => ({ customTemplates: [tpl, ...s.customTemplates] }));
        return { ok: true, message: `已添加到我的模板（${subject}）` };
      },

      removeTemplate: (id) =>
        set((s) => ({ customTemplates: s.customTemplates.filter((t) => t.id !== id) })),
    }),
    { name: 'ai-board-custom-templates' },
  ),
);
