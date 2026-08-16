// 模型配置状态（persist 到 localStorage）
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getProvider, PROVIDERS } from '../config/providers';
import type { ActiveConfig } from '../ai/client';

interface ModelConfigState {
  providerId: string;
  model: string;
  /** 各厂商各自保存的 Key */
  keys: Record<string, string>;
  /** 「获取模型列表」拉取到的各厂商模型 id 列表 */
  fetchedModels: Record<string, string[]>;
  customBaseURL: string;
  customModel: string;
  setProvider: (id: string) => void;
  setModel: (m: string) => void;
  setKey: (providerId: string, key: string) => void;
  setFetchedModels: (providerId: string, models: string[]) => void;
  setCustomBaseURL: (v: string) => void;
  setCustomModel: (v: string) => void;
}

export const useModelConfig = create<ModelConfigState>()(
  persist(
    (set) => ({
      providerId: 'deepseek',
      model: PROVIDERS[0].models[0]?.id ?? '',
      keys: {},
      fetchedModels: {},
      customBaseURL: '',
      customModel: '',
      setProvider: (id) =>
        set(() => {
          const p = getProvider(id);
          return { providerId: id, model: p.models[0]?.id ?? '' };
        }),
      setModel: (model) => set({ model }),
      setKey: (providerId, key) => set((s) => ({ keys: { ...s.keys, [providerId]: key } })),
      setFetchedModels: (providerId, models) =>
        set((s) => ({ fetchedModels: { ...s.fetchedModels, [providerId]: models } })),
      setCustomBaseURL: (customBaseURL) => set({ customBaseURL }),
      setCustomModel: (customModel) => set({ customModel }),
    }),
    { name: 'ai-board-model-config' },
  ),
);

/** 取当前生效的连接配置 */
export function getActiveConfig(s: ModelConfigState): ActiveConfig {
  const p = getProvider(s.providerId);
  const isCustom = p.id === 'custom';
  return {
    baseURL: isCustom ? s.customBaseURL.trim() : p.baseURL,
    apiKey: s.keys[s.providerId] ?? '',
    model: p.editableModel ? (isCustom ? s.customModel.trim() : s.model.trim()) : s.model,
  };
}

export function isConfigured(s: ModelConfigState): boolean {
  const cfg = getActiveConfig(s);
  return Boolean(cfg.baseURL && cfg.apiKey && cfg.model);
}
