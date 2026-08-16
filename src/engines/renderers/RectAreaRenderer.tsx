// 长方形面积 S = a × b 渲染器：单位网格 + 边框刻度，非整数部分用半透明格子表现
import React from 'react';
import ParamSlider from '../ParamSlider';
import { num, paramOf, useParams, type RendererProps } from '../useParams';
import styles from '../engines.module.css';

const W = 520;
const H = 340;

const RectAreaRenderer: React.FC<RendererProps> = ({ knowledge }) => {
  const { values, set } = useParams(knowledge);
  const a = Math.max(0.1, num(values.a, 6)); // 长
  const b = Math.max(0.1, num(values.b, 4)); // 宽

  // 单位格边长（像素），保证矩形始终居中放下
  const cell = Math.min((W - 140) / a, (H - 120) / b);
  const rw = a * cell;
  const rh = b * cell;
  const x0 = (W - rw) / 2;
  const y0 = (H - rh) / 2;

  // 完整单位格数量与不足一格的零头
  const ai = Math.floor(a);
  const bi = Math.floor(b);
  const fa = a - ai;
  const fb = b - bi;
  const fullCells = ai * bi;

  const defs: Array<[string, { label: string; min: number; max: number; value: number }]> = [
    ['a', { label: 'a（长）', min: 1, max: 12, value: 6 }],
    ['b', { label: 'b（宽）', min: 1, max: 12, value: 4 }],
  ];

  return (
    <div className={styles.renderer}>
      <div className={styles.plotWrap}>
        <svg width={W} height={H} style={{ display: 'block', touchAction: 'none' }}>
          <rect x={0} y={0} width={W} height={H} fill="#0d1420" rx={8} />
          {/* 完整单位格区域底色 */}
          {fullCells > 0 && (
            <rect x={x0} y={y0} width={ai * cell} height={bi * cell} fill="rgba(56,189,248,0.10)" />
          )}
          {/* 非整数零头区域：更淡的半透明填充 */}
          {fa > 1e-9 && (
            <rect x={x0 + ai * cell} y={y0} width={fa * cell} height={rh} fill="rgba(56,189,248,0.04)" />
          )}
          {fb > 1e-9 && (
            <rect x={x0} y={y0 + bi * cell} width={ai * cell} height={fb * cell} fill="rgba(56,189,248,0.04)" />
          )}
          {/* 完整部分的单位网格线 */}
          {Array.from({ length: ai + 1 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={x0 + i * cell}
              y1={y0}
              x2={x0 + i * cell}
              y2={y0 + bi * cell}
              stroke="#1e2a3d"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: bi + 1 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={x0}
              y1={y0 + i * cell}
              x2={x0 + ai * cell}
              y2={y0 + i * cell}
              stroke="#1e2a3d"
              strokeWidth={1}
            />
          ))}
          {/* 零头部分的虚线网格（表现不足一格的格子） */}
          {fa > 1e-9 && (
            <line
              x1={x0 + ai * cell}
              y1={y0}
              x2={x0 + ai * cell}
              y2={y0 + rh}
              stroke="#2a3c58"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}
          {fb > 1e-9 && (
            <line
              x1={x0}
              y1={y0 + bi * cell}
              x2={x0 + rw}
              y2={y0 + bi * cell}
              stroke="#2a3c58"
              strokeWidth={1}
              strokeDasharray="4,4"
            />
          )}
          {/* 矩形边框 */}
          <rect x={x0} y={y0} width={rw} height={rh} fill="none" stroke="#38bdf8" strokeWidth={2} />
          {/* 底边长度刻度与数字 */}
          {Array.from({ length: ai + 1 }).map((_, i) => (
            <g key={`tx${i}`}>
              <line
                x1={x0 + i * cell}
                y1={y0 + rh}
                x2={x0 + i * cell}
                y2={y0 + rh + 6}
                stroke="#4a5f82"
                strokeWidth={1.2}
              />
              <text x={x0 + i * cell} y={y0 + rh + 18} fill="#7c8db0" fontSize={10} textAnchor="middle">
                {i}
              </text>
            </g>
          ))}
          {/* 左边宽度刻度与数字 */}
          {Array.from({ length: bi + 1 }).map((_, i) => (
            <g key={`ty${i}`}>
              <line
                x1={x0 - 6}
                y1={y0 + rh - i * cell}
                x2={x0}
                y2={y0 + rh - i * cell}
                stroke="#4a5f82"
                strokeWidth={1.2}
              />
              <text x={x0 - 10} y={y0 + rh - i * cell + 3} fill="#7c8db0" fontSize={10} textAnchor="end">
                {i}
              </text>
            </g>
          ))}
          {/* 边长标注 */}
          <text x={x0 + rw / 2} y={y0 - 10} fill="#7dd3fc" fontSize={12} textAnchor="middle">
            a = {a.toFixed(2)}
          </text>
          <text x={x0 + rw + 10} y={y0 + rh / 2 + 4} fill="#7dd3fc" fontSize={12}>
            b = {b.toFixed(2)}
          </text>
        </svg>
      </div>
      <div className={styles.controls}>
        <div className={styles.formula}>
          S = a × b = {a.toFixed(2)} × {b.toFixed(2)} = {(a * b).toFixed(2)}
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
          面积 S = {(a * b).toFixed(2)}（平方单位），其中完整 1×1 单位格共 {ai} × {bi} = {fullCells} 个；
          不足一格的部分按长宽的小数部分折算，面积仍然等于 a × b。
        </div>
      </div>
    </div>
  );
};

export default RectAreaRenderer;
