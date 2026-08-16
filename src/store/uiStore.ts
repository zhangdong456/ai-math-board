// 界面即时状态：画笔工具、颜色粗细、配置面板开关、学科选择（不持久化）
import { create } from 'zustand';
import type { ToolType } from '../types/knowledge';

interface UiState {
  tool: ToolType;
  /** 标注模式开关：开启后标注层接管白板指针事件 */
  toolActive: boolean;
  color: string;
  penWidth: number;
  configOpen: boolean;
  subject: string;
  /** 左右侧栏展开状态（不持久化） */
  leftOpen: boolean;
  rightOpen: boolean;
  setTool: (t: ToolType) => void;
  setToolActive: (v: boolean) => void;
  setColor: (c: string) => void;
  setPenWidth: (w: number) => void;
  setConfigOpen: (v: boolean) => void;
  setSubject: (s: string) => void;
  toggleLeft: () => void;
  toggleRight: () => void;
}

export const useUi = create<UiState>()((set) => ({
  tool: 'pen',
  toolActive: false,
  color: '#f43f5e',
  penWidth: 3,
  configOpen: false,
  subject: '数学',
  leftOpen: true,
  rightOpen: true,
  setTool: (tool) => set({ tool, toolActive: true }),
  setToolActive: (toolActive) => set({ toolActive }),
  setColor: (color) => set({ color }),
  setPenWidth: (penWidth) => set({ penWidth }),
  setConfigOpen: (configOpen) => set({ configOpen }),
  setSubject: (subject) => set({ subject }),
  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
}));
