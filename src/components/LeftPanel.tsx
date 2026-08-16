// 左侧 AI 操作区：文字生成、学科选择、图片上传、模板列表（内置 + 我的收藏）、模型配置入口
import React, { useRef, useState } from 'react';
import { useUi } from '../store/uiStore';
import { useBoard } from '../store/boardStore';
import { useModelConfig, getActiveConfig, isConfigured } from '../store/modelConfigStore';
import { useCustomTemplates } from '../store/customTemplateStore';
import { generateFromText } from '../ai/client';
import { finishGeneration, spawnTemplate } from '../ai/generate';
import { TEMPLATES } from '../engines/templates';
import styles from '../app.module.css';

const SUBJECTS = ['数学', '物理', '化学', '其他'];

/** 上传图片压缩为 dataURL（最长边 1280，JPEG 0.82），控制 localStorage 体积 */
function fileToCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, 1280 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * ratio);
      canvas.height = Math.round(img.naturalHeight * ratio);
      const ctx = canvas.getContext('2d');
      URL.revokeObjectURL(url);
      if (!ctx) return reject(new Error('图片处理失败'));
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('图片读取失败，请换一张图片'));
    };
    img.src = url;
  });
}

const LeftPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'dim'; text: string }>({
    kind: 'dim',
    text: '输入知识点或上传图片，也可以直接点下方模板',
  });
  const fileRef = useRef<HTMLInputElement>(null);
  const subject = useUi((s) => s.subject);
  const setSubject = useUi((s) => s.setSubject);
  const setConfigOpen = useUi((s) => s.setConfigOpen);
  const addImageWindow = useBoard((s) => s.addImageWindow);
  const configured = useModelConfig(isConfigured);
  const customTemplates = useCustomTemplates((s) => s.customTemplates);
  const removeTemplate = useCustomTemplates((s) => s.removeTemplate);
  // 我的模板（收藏）排在内置模板之前；「其他」显示全部，否则按学科过滤
  const allTpls = [
    ...customTemplates.map((t) => ({ id: t.id, name: t.name, subject: t.subject, knowledge: t.knowledge, mine: true })),
    ...TEMPLATES.map((t) => ({ ...t, mine: false })),
  ];
  const filteredTpls = subject === '其他' ? allTpls : allTpls.filter((t) => t.subject === subject);

  const onGenerate = async () => {
    const input = text.trim();
    if (!input) {
      setMsg({ kind: 'err', text: '请先输入知识点或演示要求' });
      return;
    }
    const cfgState = useModelConfig.getState();
    if (!isConfigured(cfgState)) {
      setMsg({ kind: 'err', text: '未配置 API Key，无法使用 AI 生成。请先完成模型配置，或使用下方默认模板' });
      setConfigOpen(true);
      return;
    }
    setBusy(true);
    setMsg({ kind: 'dim', text: 'AI 正在理解并生成结构化知识…' });
    try {
      const raw = await generateFromText(input, subject, getActiveConfig(cfgState));
      const outcome = finishGeneration(raw, `文字生成：${input.slice(0, 30)}`);
      setMsg(outcome.ok ? { kind: 'ok', text: outcome.message } : { kind: 'err', text: outcome.message });
    } catch (e) {
      setMsg({ kind: 'err', text: e instanceof Error ? e.message : '生成失败' });
    } finally {
      setBusy(false);
    }
  };

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToCompressedDataUrl(file);
      addImageWindow(dataUrl);
      setMsg({ kind: 'ok', text: '图片已加入白板，请在图片窗口内框选目标区域' });
    } catch (err) {
      setMsg({ kind: 'err', text: err instanceof Error ? err.message : '图片读取失败' });
    }
  };

  return (
    <>
      <div className={styles.section}>
        <div className={styles.sectionTitle}>AI 操作区</div>
        <select value={subject} onChange={(e) => setSubject(e.target.value)}>
          {SUBJECTS.map((s) => (
            <option key={s} value={s}>
              学科：{s}
            </option>
          ))}
        </select>
        <textarea
          rows={4}
          placeholder={'例如：y=ax²+bx+c，展示参数变化对函数图像的影响\n或：演示牛顿第二定律中质量和加速度对力的影响'}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="btn primary" disabled={busy} onClick={onGenerate}>
          {busy ? '生成中…' : '✨ AI 生成动态演示'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onUpload} />
        <button className="btn" onClick={() => fileRef.current?.click()}>
          📷 上传图片（框选识别）
        </button>
        <div
          className={`${styles.statusLine} ${
            msg.kind === 'ok' ? styles.statusOk : msg.kind === 'err' ? styles.statusErr : styles.statusDim
          }`}
        >
          {msg.text}
        </div>
      </div>

      <div className={`${styles.section} ${styles.sectionGrow}`}>
        <div className={styles.sectionTitle} title="内置演示模板无需 API Key；「我的」为收藏的 AI 生成演示，存本地">
          演示模板 · {subject === '其他' ? '全部' : subject}
          {customTemplates.length > 0 && (
            <span className={styles.tplMineCount}>我的 {customTemplates.length}</span>
          )}
        </div>
        {filteredTpls.length === 0 && (
          <div className={styles.hint}>该学科暂无模板，可输入文字生成后点窗口上的「☆ 存为模板」收藏</div>
        )}
        {filteredTpls.map((t) => (
          <div
            key={t.id}
            className={styles.tplItem}
            onClick={() => {
              spawnTemplate(t.knowledge, `${t.mine ? '我的模板' : '默认模板'}：${t.name}`);
              setMsg({ kind: 'ok', text: `已生成「${t.name}」演示窗口` });
            }}
          >
            <span className={styles.tplName}>{t.name}</span>
            {t.mine && <span className={styles.tplMine}>我的</span>}
            <span className={styles.tplSubject}>{t.subject}</span>
            {t.mine && (
              <button
                type="button"
                className={styles.tplDel}
                title="从我的模板中删除"
                onClick={(e) => {
                  e.stopPropagation();
                  removeTemplate(t.id);
                  setMsg({ kind: 'dim', text: `已删除我的模板「${t.name}」` });
                }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      <div className={styles.section}>
        <button className="btn" onClick={() => setConfigOpen(true)}>
          ⚙ 模型配置{configured ? '（已配置）' : '（未配置 Key）'}
        </button>
        <div className={styles.hint}>API Key 仅保存在本机浏览器 localStorage，请勿在公共电脑使用。</div>
      </div>
    </>
  );
};

export default LeftPanel;
