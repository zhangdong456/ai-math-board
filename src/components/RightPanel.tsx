// 右侧工具区：画笔/标注工具 + AI 生成说明（AI 理解 / 核心规律 / 验证状态）
import React from 'react';
import { useUi } from '../store/uiStore';
import { useBoard } from '../store/boardStore';
import type { ToolType } from '../types/knowledge';
import styles from '../app.module.css';

const TOOLS: Array<{ id: ToolType; ico: string; name: string }> = [
  { id: 'pen', ico: '✏️', name: '画笔' },
  { id: 'rect', ico: '▭', name: '矩形' },
  { id: 'circle', ico: '◯', name: '圆形' },
  { id: 'arrow', ico: '➹', name: '箭头' },
  { id: 'eraser', ico: '🧽', name: '橡皮' },
];

const RightPanel: React.FC = () => {
  const { tool, toolActive, color, penWidth, setTool, setToolActive, setColor, setPenWidth } = useUi();
  const { undo, redo, clearStrokes, undoStack, redoStack, strokes, lastExplain } = useBoard();

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>
          画笔标注
          <label style={{ fontWeight: 400, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer' }}>
            <input type="checkbox" checked={toolActive} onChange={(e) => setToolActive(e.target.checked)} />
            启用
          </label>
        </div>
        <div className={styles.toolGrid}>
          {TOOLS.map((t) => (
            <button
              key={t.id}
              className={`${styles.toolBtn} ${toolActive && tool === t.id ? styles.active : ''}`}
              onClick={() => setTool(t.id)}
            >
              <span className={styles.ico}>{t.ico}</span>
              {t.name}
            </button>
          ))}
        </div>
        <div className={styles.toolRow}>
          <span>颜色</span>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
          <span>粗细</span>
          <input type="range" min={1} max={12} step={1} value={penWidth} onChange={(e) => setPenWidth(Number(e.target.value))} />
          <span>{penWidth}px</span>
        </div>
        <div className={styles.toolActions}>
          <button className="btn" disabled={undoStack.length === 0} onClick={undo}>
            ↩ 撤销
          </button>
          <button className="btn" disabled={redoStack.length === 0} onClick={redo}>
            ↪ 重做
          </button>
          <button className="btn danger" disabled={strokes.length === 0} onClick={clearStrokes}>
            清空
          </button>
        </div>
        <div className={styles.hint}>勾选「启用」后可在白板任意区域标注；取消勾选则恢复窗口拖动。</div>
      </div>

      <div className={`${styles.section} ${styles.sectionGrow}`}>
        <div className={styles.sectionTitle}>AI 生成说明</div>
        {lastExplain ? (
          <div className={styles.explainBox}>
            <div>
              <span className={styles.explainLabel}>来源：</span>
              <span className={styles.statusDim}>{lastExplain.source}</span>
            </div>
            <div>
              <div className={styles.explainLabel}>AI 理解</div>
              <div className={styles.explainText}>{lastExplain.understanding}</div>
            </div>
            {lastExplain.rules.length > 0 && (
              <div>
                <div className={styles.explainLabel}>核心规律</div>
                <ul className={styles.ruleList}>
                  {lastExplain.rules.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <div className={styles.explainLabel}>验证状态</div>
              <div className={lastExplain.status === 'verified' ? styles.statusOk : styles.statusErr}>
                {lastExplain.status === 'verified' ? '✅ 已验证：通过知识验证层校验' : '⚠ 待确认'}
              </div>
              {lastExplain.reason && <div className={styles.hint}>{lastExplain.reason}</div>}
            </div>
          </div>
        ) : (
          <div className={styles.hint}>
            还没有生成记录。在左侧输入知识点、上传图片框选，或点击默认模板后，这里会显示 AI 理解、核心规律与验证状态。
          </div>
        )}
      </div>
    </>
  );
};

export default RightPanel;
