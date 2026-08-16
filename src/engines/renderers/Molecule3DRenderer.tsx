// 分子 3D 球棍模型渲染器：纯 SVG 手写 3D 投影（旋转 + 正交投影 + 画家算法），滑块旋转视角
import React from 'react';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import type { KnowledgeJSON } from '../../types/knowledge';
import styles from '../engines.module.css';

const W = 520;
const H = 360;

type Vec3 = [number, number, number];
type ElementKey = 'C' | 'H' | 'O' | 'N';

interface Atom {
  el: ElementKey;
  p: Vec3;
}

interface Bond {
  a: number;
  b: number;
  /** 键级：CO2 为双键 */
  order: 1 | 2;
}

// 原子配色与基圆半径
const ATOM_STYLE: Record<ElementKey, { color: string; r: number; text: string }> = {
  C: { color: '#9aa4b2', r: 17, text: '#0d1420' },
  H: { color: '#f8fafc', r: 10, text: '#0d1420' },
  O: { color: '#ef4444', r: 16, text: '#ffffff' },
  N: { color: '#3b82f6', r: 16, text: '#ffffff' },
};

const D2R = Math.PI / 180;

// 内置分子表（键长单位自定，结构正确）
const MOLECULES: Record<string, { name: string; desc: string; atoms: Atom[]; bonds: Bond[] }> = {
  // CH4：C 中心 + 4 个 H 正四面体顶点（键角 109.5°）
  CH4: {
    name: '甲烷',
    desc: '正四面体结构，键角 109.5°',
    atoms: [
      { el: 'C', p: [0, 0, 0] },
      { el: 'H', p: [0.64, 0.64, 0.64] },
      { el: 'H', p: [0.64, -0.64, -0.64] },
      { el: 'H', p: [-0.64, 0.64, -0.64] },
      { el: 'H', p: [-0.64, -0.64, 0.64] },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
      { a: 0, b: 4, order: 1 },
    ],
  },
  // H2O：O 中心 + 2 个 H，键角 104.5°
  H2O: {
    name: '水',
    desc: 'V 形（角形）结构，键角 104.5°',
    atoms: [
      { el: 'O', p: [0, 0.35, 0] },
      { el: 'H', p: [0.96 * Math.sin(52.25 * D2R), 0.35 - 0.96 * Math.cos(52.25 * D2R), 0] },
      { el: 'H', p: [-0.96 * Math.sin(52.25 * D2R), 0.35 - 0.96 * Math.cos(52.25 * D2R), 0] },
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
    ],
  },
  // CO2：直线形 O=C=O
  CO2: {
    name: '二氧化碳',
    desc: '直线形结构，键角 180°（C=O 双键）',
    atoms: [
      { el: 'C', p: [0, 0, 0] },
      { el: 'O', p: [1.16, 0, 0] },
      { el: 'O', p: [-1.16, 0, 0] },
    ],
    bonds: [
      { a: 0, b: 1, order: 2 },
      { a: 0, b: 2, order: 2 },
    ],
  },
  // NH3：N 中心 + 3 个 H，三角锥，键角 107°
  NH3: {
    name: '氨气',
    desc: '三角锥形结构，键角 107°',
    atoms: [
      { el: 'N', p: [0, 0.38, 0] },
      // H-N-H 键角 107° ⇒ 键与对称轴夹角约 68.2°
      ...([0, 120, 240] as const).map((deg) => ({
        el: 'H' as ElementKey,
        p: [
          1.01 * Math.sin(68.2 * D2R) * Math.cos(deg * D2R),
          0.38 - 1.01 * Math.cos(68.2 * D2R),
          1.01 * Math.sin(68.2 * D2R) * Math.sin(deg * D2R),
        ] as Vec3,
      })),
    ],
    bonds: [
      { a: 0, b: 1, order: 1 },
      { a: 0, b: 2, order: 1 },
      { a: 0, b: 3, order: 1 },
    ],
  },
};

/** 先绕 X 轴、再绕 Y 轴旋转 */
function rotate(p: Vec3, rx: number, ry: number): Vec3 {
  const [x, y, z] = p;
  const y1 = y * Math.cos(rx) - z * Math.sin(rx);
  const z1 = y * Math.sin(rx) + z * Math.cos(rx);
  const x2 = x * Math.cos(ry) + z1 * Math.sin(ry);
  const z2 = -x * Math.sin(ry) + z1 * Math.cos(ry);
  return [x2, y1, z2];
}

const Molecule3DRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const rotX = Math.min(180, Math.max(-180, num(values.rotX, -20)));
  const rotY = Math.min(180, Math.max(-180, num(values.rotY, 30)));

  // 分子选择：variant 字段为并行添加的可选字段，防御式读取
  const variant = (knowledge as KnowledgeJSON & { variant?: string }).variant ?? 'CH4';
  const mol = MOLECULES[variant] ?? MOLECULES.CH4;

  const rx = rotX * D2R;
  const ry = rotY * D2R;
  const cx = W / 2;
  const cy = H / 2 + 8;
  const S = 105; // 3D 单位 → 屏幕像素

  // 旋转 + 正交投影（z 越大越靠近观察者）
  const proj = mol.atoms.map((a) => {
    const [x, y, z] = rotate(a.p, rx, ry);
    return { el: a.el, sx: cx + x * S, sy: cy - y * S, z };
  });
  // 深度缩放：近大远小、近亮远暗
  const depthScale = (z: number) => Math.min(1.35, Math.max(0.65, 1 + z * 0.18));
  const depthAlpha = (z: number) => Math.min(1, Math.max(0.45, 0.72 + z * 0.22));

  // 化学键按平均深度排序（远的先画，画家算法）
  const bonds = mol.bonds
    .map((b) => ({ ...b, z: (proj[b.a].z + proj[b.b].z) / 2 }))
    .sort((p, q) => p.z - q.z);
  // 原子按深度排序，后画近处原子以覆盖连线端点
  const atoms = proj.map((p, i) => ({ ...p, i })).sort((p, q) => p.z - q.z);

  const defs: Array<[string, { label: string; min: number; max: number; step: number; value: number; unit: string }]> = [
    ['rotX', { label: 'rotX（绕 X 轴）', min: -180, max: 180, step: 1, value: -20, unit: '°' }],
    ['rotY', { label: 'rotY（绕 Y 轴）', min: -180, max: 180, step: 1, value: 30, unit: '°' }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          <text x={20} y={30} fill="#e2ecfb" fontSize={14} fontWeight={700}>
            {mol.name}（{variant}）
          </text>
          <text x={20} y={50} fill="#7c8db0" fontSize={11}>
            {mol.desc} · 拖动滑块旋转视角
          </text>
          {/* 化学键（双键画两条平行线） */}
          {bonds.map((b, i) => {
            const pa = proj[b.a];
            const pb = proj[b.b];
            const dx = pb.sx - pa.sx;
            const dy = pb.sy - pa.sy;
            const len = Math.hypot(dx, dy) || 1;
            const px = (-dy / len) * 3.5;
            const py = (dx / len) * 3.5;
            const w = 4.5 * depthScale(b.z);
            const op = depthAlpha(b.z);
            const offsets: Array<[number, number]> = b.order === 2 ? [[px, py], [-px, -py]] : [[0, 0]];
            return offsets.map(([ox, oy], k) => (
              <line
                key={`${i}-${k}`}
                x1={pa.sx + ox}
                y1={pa.sy + oy}
                x2={pb.sx + ox}
                y2={pb.sy + oy}
                stroke="#8ea2c0"
                strokeWidth={b.order === 2 ? w * 0.6 : w}
                strokeLinecap="round"
                opacity={op}
              />
            ));
          })}
          {/* 原子球（近大远小、近亮远暗） */}
          {atoms.map((a) => {
            const st = ATOM_STYLE[a.el];
            const r = st.r * depthScale(a.z);
            return (
              <g key={a.i} opacity={depthAlpha(a.z)}>
                <circle cx={a.sx} cy={a.sy} r={r} fill={st.color} stroke="#0d1420" strokeWidth={1.5} />
                <text
                  x={a.sx}
                  y={a.sy + r * 0.36}
                  fill={st.text}
                  fontSize={Math.max(9, r * 0.72)}
                  fontWeight={700}
                  textAnchor="middle"
                >
                  {a.el}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          {variant} · {mol.name} · 旋转角（{rotX.toFixed(0)}°, {rotY.toFixed(0)}°）
        </div>
        {defs.map(([key, fb]) => (
          <ParamSlider
            key={key}
            name={key}
            param={paramOf(knowledge, key, fb)}
            value={num(values[key], fb.value)}
            onChange={(v) => set(key, v)}
          />
        ))}
        <div className={styles.readout}>
          {mol.name}（{variant}）：{mol.desc}。球棍模型中球表示原子、棍表示化学键；旋转时近处原子更大更亮、
          远处更小更暗，体现空间纵深。
        </div>
      </div>
    </div>
  );
};

export default Molecule3DRenderer;
