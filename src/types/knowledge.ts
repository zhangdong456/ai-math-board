// 结构化知识描述（AI 输出的 JSON schema）与白板窗口模型

/** 单个可调参数 */
export interface KnowledgeParam {
  /** 显示名，如 "a（二次项系数）" */
  label: string;
  min: number;
  max: number;
  step?: number;
  /** 初始值 */
  value: number;
  unit?: string;
  /** 参数对演示的影响说明 */
  effect?: string;
}

/** AI 产出的结构化知识 JSON（本地演示引擎的唯一输入） */
export interface KnowledgeJSON {
  /** 演示类型，对应 engines/registry 中的渲染器 */
  type: string;
  title?: string;
  formula?: string;
  subject?: string;
  parameters: Record<string, KnowledgeParam>;
  /** 演示变体（如 molecule_3d 的分子种类 CH4/H2O/CO2/NH3） */
  variant?: string;
  /** AI 理解 */
  understanding?: string;
  /** 核心规律 */
  rules?: string[];
  /** 置信度 0~1 */
  confidence?: number;
}

export type VerifyStatus = 'verified' | 'pending';

export interface BoardWindow {
  id: string;
  kind: 'image' | 'demo';
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  z: number;
  minimized: boolean;
  maximized: boolean;
  /** 最大化/最小化前的位置尺寸，用于还原 */
  prevBounds?: { x: number; y: number; w: number; h: number };
  /** kind=image：压缩后的 dataURL */
  imageUrl?: string;
  /** kind=demo：结构化知识 JSON */
  knowledge?: KnowledgeJSON;
  verifyStatus?: VerifyStatus;
  verifyReason?: string;
}

export type ToolType = 'pen' | 'rect' | 'circle' | 'arrow' | 'eraser';

export interface StrokePoint {
  x: number;
  y: number;
}

export interface Stroke {
  id: string;
  tool: ToolType;
  color: string;
  width: number;
  /** pen/eraser 为路径点列；rect/circle/arrow 为 [起点, 终点] */
  points: StrokePoint[];
}

/** 右侧「AI 生成说明」展示内容 */
export interface AiExplain {
  source: string;
  understanding: string;
  rules: string[];
  status: VerifyStatus;
  reason?: string;
  time: number;
}
