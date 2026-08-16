// 演示窗口内容：按 type 分发到渲染器，显示知识验证状态
import React from 'react';
import type { BoardWindow } from '../types/knowledge';
import { RENDERERS } from '../engines/registry';
import styles from '../board/board.module.css';

const DemoWindow: React.FC<{ win: BoardWindow }> = ({ win }) => {
  const k = win.knowledge;
  if (!k) return <div style={{ padding: 16, color: '#8ea3c5' }}>演示数据缺失</div>;
  const entry = RENDERERS[k.type];
  if (!entry)
    return <div style={{ padding: 16, color: '#fca5a5' }}>未知演示类型：{k.type}</div>;
  const C = entry.component;
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div
        className={`${styles.badge} ${win.verifyStatus === 'verified' ? styles.badgeOk : styles.badgeWarn}`}
        style={{ position: 'absolute', top: 6, left: 8, zIndex: 4 }}
        title={win.verifyReason ?? (win.verifyStatus === 'verified' ? '通过知识验证层校验' : '')}
      >
        {win.verifyStatus === 'verified' ? '✅ 已验证' : '⚠ 待确认'}
      </div>
      <C knowledge={k} />
    </div>
  );
};

// win 对象引用在未修改时保持不变（updateWindow 只替换被改窗口），浅比较即可生效
export default React.memo(DemoWindow);
