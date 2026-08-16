// 化学方程式配平渲染器：aH₂ + bO₂ → cH₂O，分子图示 + 原子守恒对比
import React from 'react';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 400;

/** H₂ 分子：两个白小球相连 */
const H2: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x - 9} y1={y} x2={x + 9} y2={y} stroke="#cbd5e1" strokeWidth={2} />
    <circle cx={x - 9} cy={y} r={7} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
    <circle cx={x + 9} cy={y} r={7} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
  </g>
);

/** O₂ 分子：两个红球相连 */
const O2: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x - 10} y1={y} x2={x + 10} y2={y} stroke="#b91c1c" strokeWidth={2} />
    <circle cx={x - 10} cy={y} r={8} fill="#ef4444" stroke="#7f1d1d" strokeWidth={1} />
    <circle cx={x + 10} cy={y} r={8} fill="#ef4444" stroke="#7f1d1d" strokeWidth={1} />
  </g>
);

/** H₂O 分子：一红两白角形 */
const H2O: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <g>
    <line x1={x} y1={y + 4} x2={x - 12} y2={y - 8} stroke="#b91c1c" strokeWidth={2} />
    <line x1={x} y1={y + 4} x2={x + 12} y2={y - 8} stroke="#b91c1c" strokeWidth={2} />
    <circle cx={x} cy={y + 4} r={9} fill="#ef4444" stroke="#7f1d1d" strokeWidth={1} />
    <circle cx={x - 12} cy={y - 8} r={6} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
    <circle cx={x + 12} cy={y - 8} r={6} fill="#f8fafc" stroke="#94a3b8" strokeWidth={1} />
  </g>
);

/** 把 n 个分子排成 cols 列网格 */
function grid(n: number, cols: number, x0: number, y0: number, dx: number, dy: number) {
  return Array.from({ length: n }).map((_, i) => ({
    x: x0 + (i % cols) * dx,
    y: y0 + Math.floor(i / cols) * dy,
    key: i,
  }));
}

const ChemicalBalanceRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const h2 = Math.min(6, Math.max(1, Math.round(num(values.h2, 2))));
  const o2 = Math.min(6, Math.max(1, Math.round(num(values.o2, 1))));
  const h2o = Math.min(6, Math.max(1, Math.round(num(values.h2o, 2))));

  // 原子守恒对比
  const hLeft = 2 * h2;
  const hRight = 2 * h2o;
  const oLeft = 2 * o2;
  const oRight = h2o;
  const balanced = hLeft === hRight && oLeft === oRight;

  // 条形图：1 个原子对应的像素宽度（最大 12 个原子）
  const barX = 118;
  const barScale = (W - barX - 60) / 12;
  const bars: Array<{ label: string; left: number; right: number; y: number }> = [
    { label: 'H 原子', left: hLeft, right: hRight, y: 258 },
    { label: 'O 原子', left: oLeft, right: oRight, y: 318 },
  ];

  const defs: Array<[string, { label: string; min: number; max: number; step: number; value: number }]> = [
    ['h2', { label: 'H₂ 系数 a', min: 1, max: 6, step: 1, value: 2 }],
    ['o2', { label: 'O₂ 系数 b', min: 1, max: 6, step: 1, value: 1 }],
    ['h2o', { label: 'H₂O 系数 c', min: 1, max: 6, step: 1, value: 2 }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          {/* 反应物区 / 生成物区 */}
          <rect x={14} y={14} width={196} height={212} rx={8} fill="none" stroke="#223148" strokeWidth={1.5} strokeDasharray="5,4" />
          <rect x={310} y={14} width={196} height={212} rx={8} fill="none" stroke="#223148" strokeWidth={1.5} strokeDasharray="5,4" />
          <text x={112} y={36} fill="#7c8db0" fontSize={12} textAnchor="middle">
            反应物
          </text>
          <text x={408} y={36} fill="#7c8db0" fontSize={12} textAnchor="middle">
            生成物
          </text>
          {/* H₂ 分子群 */}
          <text x={34} y={62} fill="#9fb4d8" fontSize={11}>
            H₂ × {h2}
          </text>
          {grid(h2, 3, 50, 82, 56, 30).map((p) => (
            <H2 key={p.key} x={p.x} y={p.y} />
          ))}
          {/* O₂ 分子群 */}
          <text x={34} y={158} fill="#9fb4d8" fontSize={11}>
            O₂ × {o2}
          </text>
          {grid(o2, 3, 50, 180, 58, 32).map((p) => (
            <O2 key={p.key} x={p.x} y={p.y} />
          ))}
          {/* 反应箭头 */}
          <line x1={222} y1={118} x2={296} y2={118} stroke="#f59e0b" strokeWidth={2.5} />
          <polygon points="298,118 284,112 284,124" fill="#f59e0b" />
          <text x={260} y={106} fill="#fcd34d" fontSize={12} textAnchor="middle">
            点燃
          </text>
          {/* H₂O 分子群 */}
          <text x={330} y={62} fill="#9fb4d8" fontSize={11}>
            H₂O × {h2o}
          </text>
          {grid(h2o, 3, 348, 100, 62, 52).map((p) => (
            <H2O key={p.key} x={p.x} y={p.y} />
          ))}
          {/* 原子守恒对比条形图 */}
          <text x={20} y={248} fill="#7c8db0" fontSize={11}>
            原子守恒对比（蓝=左边反应物，橙=右边生成物）
          </text>
          {bars.map((b) => (
            <g key={b.label}>
              <text x={20} y={b.y + 13} fill="#9fb4d8" fontSize={12}>
                {b.label}
              </text>
              <rect x={barX} y={b.y} width={Math.max(3, b.left * barScale)} height={15} rx={3} fill="#38bdf8" />
              <text x={barX + b.left * barScale + 6} y={b.y + 12} fill="#7dd3fc" fontSize={11}>
                左 {b.left}
              </text>
              <rect x={barX} y={b.y + 19} width={Math.max(3, b.right * barScale)} height={15} rx={3} fill="#f59e0b" />
              <text x={barX + b.right * barScale + 6} y={b.y + 31} fill="#fcd34d" fontSize={11}>
                右 {b.right}
              </text>
            </g>
          ))}
          {/* 配平状态 */}
          <text x={20} y={378} fill={balanced ? '#6ee7b7' : '#f87171'} fontSize={13} fontWeight={700}>
            {balanced
              ? '✅ 已配平（原子守恒）'
              : `❌ 未配平：H 左${hLeft}/右${hRight}，O 左${oLeft}/右${oRight}`}
          </text>
        </svg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          {h2}H₂ + {o2}O₂ → {h2o}H₂O
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
          配平原则：反应前后每种原子的数目相等（质量守恒定律）。当 H₂、H₂O 系数相等且 O₂ 系数为其一半时配平，
          最简整数比为 2H₂ + O₂ → 2H₂O。
        </div>
      </div>
    </div>
  );
};

export default ChemicalBalanceRenderer;
