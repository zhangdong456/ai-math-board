// 演示窗口内容：按 type 分发到渲染器，显示知识验证状态 + 收藏为我的模板
import React from 'react';
import type { BoardWindow } from '../types/knowledge';
import { RENDERERS } from '../engines/registry';
import { fingerprintOf, useCustomTemplates } from '../store/customTemplateStore';
import styles from '../board/board.module.css';

const DemoWindow: React.FC<{ win: BoardWindow }> = ({ win }) => {
  const k = win.knowledge;
  const customTemplates = useCustomTemplates((s) => s.customTemplates);
  const saveTemplate = useCustomTemplates((s) => s.saveTemplate);
  if (!k) return <div style={{ padding: 16, color: '#8ea3c5' }}>演示数据缺失</div>;
  const entry = RENDERERS[k.type];
  if (!entry)
    return <div style={{ padding: 16, color: '#fca5a5' }}>未知演示类型：{k.type}</div>;
  const C = entry.component;
  const saved = customTemplates.some((t) => fingerprintOf(t.knowledge) === fingerprintOf(k));
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'absolute', top: 6, left: 8, zIndex: 4, display: 'flex', gap: 6 }}>
        <div
          className={`${styles.badge} ${win.verifyStatus === 'verified' ? styles.badgeOk : styles.badgeWarn}`}
          title={win.verifyReason ?? (win.verifyStatus === 'verified' ? '通过知识验证层校验' : '')}
        >
          {win.verifyStatus === 'verified' ? '✅ 已验证' : '⚠ 待确认'}
        </div>
        <button
          type="button"
          className={`${styles.badge} ${styles.saveTplBtn} ${saved ? styles.saveTplBtnSaved : ''}`}
          title={saved ? '已在我的模板库中，可在左侧模板列表直接打开' : '把当前演示保存到我的模板库（按学科归档，本地持久化）'}
          disabled={saved}
          onClick={() => saveTemplate(k)}
        >
          {saved ? '★ 已收藏' : '☆ 存为模板'}
        </button>
      </div>
      <C knowledge={k} />
    </div>
  );
};

// win 对象引用在未修改时保持不变（updateWindow 只替换被改窗口），浅比较即可生效
// 注：收藏的增删会改变 customTemplates 引用，memo 浅比较仍能正确触发重渲染
export default React.memo(DemoWindow);
