// 知识验证层：schema 校验 + 规则表驱动的学科规则校验 + 置信度门槛
import { RENDERERS, KNOWN_TYPES } from '../engines/registry';
import type { KnowledgeJSON, KnowledgeParam, VerifyStatus } from '../types/knowledge';

export interface SchemaResult {
  data?: KnowledgeJSON;
  error?: string;
}

export interface VerifyResult {
  ok: boolean;
  status: VerifyStatus;
  reason?: string;
}

const CONFIDENCE_REJECT = 0.5;
const CONFIDENCE_VERIFIED = 0.75;

/** 各演示类型所属学科，用于学科一致性核对 */
const TYPE_SUBJECT: Record<string, string> = {
  quadratic: '数学',
  linear: '数学',
  trig: '数学',
  circle: '数学',
  rect_area: '数学',
  triangle_area: '数学',
  parallelogram_area: '数学',
  circle_area: '数学',
  exponential: '数学',
  derivative: '数学',
  gaussian: '数学',
  cubic: '数学',
  newton_second_law: '物理',
  uniform_motion: '物理',
  ohm_law: '物理',
  projectile: '物理',
  damped_oscillation: '物理',
  bohr_atom: '化学',
  chemical_balance: '化学',
  molecule_3d: '化学',
};

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** 校验 AI 返回 JSON 的 schema 结构 */
export function validateSchema(raw: unknown): SchemaResult {
  if (typeof raw !== 'object' || raw === null) return { error: '返回内容不是 JSON 对象' };
  const k = raw as Record<string, unknown>;

  if (typeof k.type !== 'string' || !k.type) return { error: '缺少 type 字段' };
  if (!KNOWN_TYPES.includes(k.type)) {
    return { error: `暂不支持的演示类型 "${k.type}"（当前支持：${KNOWN_TYPES.join(' / ')}）` };
  }
  if (typeof k.parameters !== 'object' || k.parameters === null) return { error: '缺少 parameters 字段' };

  const params: Record<string, KnowledgeParam> = {};
  for (const [key, pv] of Object.entries(k.parameters as Record<string, unknown>)) {
    if (typeof pv !== 'object' || pv === null) return { error: `参数 ${key} 结构错误` };
    const p = pv as Record<string, unknown>;
    if (!isNum(p.min) || !isNum(p.max) || !isNum(p.value)) {
      return { error: `参数 ${key} 缺少数值字段（min/max/value）` };
    }
    if (p.min >= p.max) return { error: `参数 ${key} 的取值范围无效（min 必须小于 max）` };
    // step 无意义（不小于取值范围）时忽略
    const step = isNum(p.step) && p.step > 0 && p.step < p.max - p.min ? p.step : undefined;
    const label = typeof p.label === 'string' && p.label ? p.label : key;
    params[key] = {
      label: label.length > 40 ? label.slice(0, 40) : label,
      min: p.min,
      max: p.max,
      step,
      value: Math.min(p.max, Math.max(p.min, p.value)),
      unit: typeof p.unit === 'string' ? p.unit : undefined,
      effect: typeof p.effect === 'string' ? p.effect : undefined,
    };
  }

  const data: KnowledgeJSON = {
    type: k.type,
    title: typeof k.title === 'string' ? k.title : undefined,
    formula: typeof k.formula === 'string' ? k.formula : undefined,
    subject: typeof k.subject === 'string' ? k.subject : undefined,
    parameters: params,
    variant: typeof k.variant === 'string' ? k.variant : undefined,
    understanding: typeof k.understanding === 'string' ? k.understanding : undefined,
    rules: Array.isArray(k.rules) ? (k.rules as unknown[]).filter((r): r is string => typeof r === 'string') : undefined,
    confidence: isNum(k.confidence) ? Math.min(1, Math.max(0, k.confidence)) : undefined,
  };
  return { data };
}

/**
 * 各 type 的学科规则表。
 * 返回 null 表示通过（修正但放行时直接原地修改参数后返回 null）；
 * 返回 VerifyResult 表示拒绝。
 */
const TYPE_RULES: Record<string, (k: KnowledgeJSON) => VerifyResult | null> = {
  // 二次函数：a ≠ 0（取值范围不能恒为 0），且初始值不能为 0
  quadratic(k) {
    const a = k.parameters.a;
    if (a.min >= 0 && a.max <= 0) {
      return { ok: false, status: 'pending', reason: '二次函数要求 a ≠ 0，AI 给出的 a 取值范围恒为 0，不符合定义' };
    }
    if (a.value === 0) a.value = a.max > 0 ? Math.min(1, a.max) : Math.max(-1, a.min);
    // 开口方向由渲染器直接根据 a 的符号绘制，天然保证一致
    return null;
  },

  // 圆：r > 0
  circle(k) {
    const r = k.parameters.r;
    if (r.max <= 0) return { ok: false, status: 'pending', reason: '圆的半径必须为正数' };
    if (r.min <= 0) r.min = 0.1;
    if (r.value <= 0) r.value = Math.min(1, r.max);
    return null;
  },

  // 牛顿第二定律：质量必须为正
  newton_second_law(k) {
    const m = k.parameters.m;
    if (m.max <= 0) return { ok: false, status: 'pending', reason: '质量必须为正数' };
    if (m.min <= 0) m.min = 0.1;
    if (m.value <= 0) m.value = Math.min(1, m.max);
    return null;
  },

  // 矩形面积：长宽必须为正
  rect_area(k) {
    return positiveLengths(k, ['a', 'b']);
  },

  // 三角形面积：底、高必须为正
  triangle_area(k) {
    return positiveLengths(k, ['base', 'height']);
  },

  // 平行四边形面积：底、高必须为正
  parallelogram_area(k) {
    return positiveLengths(k, ['base', 'height']);
  },

  // 圆面积与割圆术：r > 0；n 为 3~64 的整数
  circle_area(k) {
    const r = k.parameters.r;
    if (r.max <= 0) return { ok: false, status: 'pending', reason: '圆的半径必须为正数' };
    if (r.min <= 0) r.min = 0.1;
    if (r.value <= 0) r.value = Math.min(1, r.max);
    const n = k.parameters.n;
    n.value = Math.round(clamp(n.value, 3, 64));
    n.min = Math.max(3, Math.round(n.min));
    n.max = Math.min(64, Math.round(n.max));
    return null;
  },

  // 指数函数：底数 a > 0 且 a ≠ 1
  exponential(k) {
    const a = k.parameters.a;
    if (a.max <= 0) return { ok: false, status: 'pending', reason: '底数必须为正数' };
    if (a.min <= 0) a.min = 0.05;
    if (a.value === 1) a.value = 2;
    if (a.value <= 0) a.value = Math.min(2, a.max);
    return null;
  },

  // 导数：复用 quadratic 的 a ≠ 0 规则；x0 ∈ [-10, 10]；h ∈ [-2, 2]
  derivative(k) {
    const quad = TYPE_RULES.quadratic(k);
    if (quad) return quad;
    const x0 = k.parameters.x0;
    x0.value = clamp(x0.value, -10, 10);
    const h = k.parameters.h;
    h.value = clamp(h.value, -2, 2);
    return null;
  },

  // 匀变速直线运动：时间 t ≥ 0
  uniform_motion(k) {
    return nonNegativeTime(k);
  },

  // 平抛运动：时间 t ≥ 0；重力加速度 g > 0
  projectile(k) {
    const t = nonNegativeTime(k);
    if (t) return t;
    const g = k.parameters.g;
    if (g.max <= 0) return { ok: false, status: 'pending', reason: '重力加速度必须为正数' };
    if (g.min <= 0) g.min = 0.1;
    if (g.value <= 0) g.value = Math.min(9.8, g.max);
    return null;
  },

  // 欧姆定律：电阻必须为正
  ohm_law(k) {
    const R = k.parameters.R;
    if (R.max <= 0) return { ok: false, status: 'pending', reason: '电阻必须为正数' };
    if (R.min <= 0) R.min = 0.1;
    if (R.value <= 0) R.value = Math.min(1, R.max);
    return null;
  },

  // 玻尔原子模型：原子序数 Z 为 1~20 的整数
  bohr_atom(k) {
    const Z = k.parameters.Z;
    Z.value = Math.round(clamp(Z.value, 1, 20));
    Z.min = Math.max(1, Math.round(Z.min));
    Z.max = Math.min(20, Math.round(Z.max));
    return null;
  },

  // 化学方程式配平：系数为不小于 1 的整数
  chemical_balance(k) {
    for (const key of ['h2', 'o2', 'h2o']) {
      const p = k.parameters[key];
      p.value = Math.max(1, Math.round(p.value));
      if (p.min < 1) p.min = 1;
    }
    return null;
  },

  // 分子 3D：variant 必须是支持的分子种类，否则回退 CH4
  molecule_3d(k) {
    if (!k.variant || !['CH4', 'H2O', 'CO2', 'NH3'].includes(k.variant)) k.variant = 'CH4';
    return null;
  },

  // 高斯钟形曲线：峰高 a 与宽度 sigma 必须为正
  gaussian(k) {
    for (const key of ['a', 'sigma']) {
      const p = k.parameters[key];
      if (p.max <= 0) return { ok: false, status: 'pending', reason: '高斯曲线的峰高 a 与宽度 σ 必须为正数' };
      if (p.min <= 0) p.min = 0.1;
      if (p.value <= 0) p.value = Math.min(1, p.max);
    }
    return null;
  },

  // 三次函数：复用 quadratic 的 a ≠ 0 规则
  cubic(k) {
    return TYPE_RULES.quadratic(k);
  },

  // 阻尼振动：t ≥ 0；A、omega 必须为正；beta 不小于 0
  damped_oscillation(k) {
    const t = nonNegativeTime(k);
    if (t) return t;
    for (const key of ['A', 'omega']) {
      const p = k.parameters[key];
      if (p.max <= 0) return { ok: false, status: 'pending', reason: '初始振幅 A 与角频率 ω 必须为正数' };
      if (p.min <= 0) p.min = 0.1;
      if (p.value <= 0) p.value = Math.min(1, p.max);
    }
    const beta = k.parameters.beta;
    if (beta.min < 0) beta.min = 0;
    if (beta.value < 0) beta.value = 0;
    return null;
  },
};

/** 长度类参数必须为正的通用规则 */
function positiveLengths(k: KnowledgeJSON, keys: string[]): VerifyResult | null {
  for (const key of keys) {
    const p = k.parameters[key];
    if (p.max <= 0) return { ok: false, status: 'pending', reason: '长度必须为正数' };
    if (p.min <= 0) p.min = 0.1;
    if (p.value <= 0) p.value = Math.min(1, p.max);
  }
  return null;
}

/** 时间参数 t ≥ 0 的通用规则 */
function nonNegativeTime(k: KnowledgeJSON): VerifyResult | null {
  const t = k.parameters.t;
  if (t.min < 0) t.min = 0;
  if (t.value < 0) t.value = 0;
  return null;
}

/** 学科规则校验 + 置信度判断 */
export function verifyKnowledge(k: KnowledgeJSON): VerifyResult {
  const entry = RENDERERS[k.type];
  if (!entry) return { ok: false, status: 'pending', reason: `没有 ${k.type} 的渲染器` };

  // 必需参数齐全
  for (const key of entry.requiredParams) {
    if (!k.parameters[key]) {
      return { ok: false, status: 'pending', reason: `缺少必需参数 ${key}，无法安全渲染` };
    }
  }

  // 各 type 的学科规则
  const rule = TYPE_RULES[k.type];
  if (rule) {
    const result = rule(k);
    if (result) return result;
  }

  // 学科一致性核对（不阻塞，仅提示）
  const expected = TYPE_SUBJECT[k.type];
  if (
    k.subject &&
    ['数学', '物理', '化学'].includes(k.subject) &&
    expected &&
    k.subject !== expected
  ) {
    return {
      ok: true,
      status: 'pending',
      reason: `学科标注（${k.subject}）与演示类型所属学科（${expected}）不一致，建议人工核对`,
    };
  }

  // 置信度门槛
  const conf = k.confidence ?? 0.5;
  if (conf < CONFIDENCE_REJECT) {
    return {
      ok: false,
      status: 'pending',
      reason: `AI 置信度过低（${conf.toFixed(2)} < ${CONFIDENCE_REJECT}），识别结果不可靠，已阻止生成。请换更清晰的图片或补充文字描述后重试`,
    };
  }

  if (conf < CONFIDENCE_VERIFIED) {
    return {
      ok: true,
      status: 'pending',
      reason: `AI 置信度 ${conf.toFixed(2)}，识别结果可能存在误差，建议人工核对参数与规律说明`,
    };
  }
  return { ok: true, status: 'verified' };
}
