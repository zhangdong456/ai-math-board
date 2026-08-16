// 模型配置面板：选厂商自动填 BaseURL、模型列表（视觉能力标注）、Key 密码框、测试连接、获取 Key 步骤
import React, { useState } from 'react';
import { useUi } from '../store/uiStore';
import { useModelConfig } from '../store/modelConfigStore';
import { PROVIDERS, getProvider, guessVision } from '../config/providers';
import { testConnection, fetchModels } from '../ai/client';
import styles from '../app.module.css';

function visionMark(v: boolean | 'unknown') {
  if (v === true) return <span className={styles.visionOk}>✅ 支持图片</span>;
  if (v === false) return <span className={styles.visionNo}>❌ 不支持图片</span>;
  return <span className={styles.visionUnknown}>以厂商文档为准</span>;
}

const ModelConfigModal: React.FC = () => {
  const open = useUi((s) => s.configOpen);
  const setOpen = useUi((s) => s.setConfigOpen);
  const cfg = useModelConfig();
  const [showKey, setShowKey] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<{ ok: boolean; message: string } | null>(null);
  const [fetching, setFetching] = useState(false);
  const [fetchMsg, setFetchMsg] = useState<{ ok: boolean; message: string } | null>(null);

  if (!open) return null;

  const provider = getProvider(cfg.providerId);
  const isCustom = provider.id === 'custom';
  const key = cfg.keys[cfg.providerId] ?? '';
  const effectiveBaseURL = isCustom ? cfg.customBaseURL.trim() : provider.baseURL;
  const effectiveModel = provider.editableModel ? (isCustom ? cfg.customModel : cfg.model) : cfg.model;
  const fetched = cfg.fetchedModels[cfg.providerId] ?? [];

  const onFetchModels = async () => {
    setFetching(true);
    setFetchMsg(null);
    try {
      const ids = await fetchModels({ baseURL: effectiveBaseURL, apiKey: key });
      cfg.setFetchedModels(cfg.providerId, ids);
      setFetchMsg({ ok: true, message: `获取成功，共 ${ids.length} 个模型` });
    } catch (e) {
      setFetchMsg({ ok: false, message: e instanceof Error ? e.message : '获取失败' });
    }
    setFetching(false);
  };

  const onTest = async () => {
    setTesting(true);
    setTestMsg(null);
    const result = await testConnection({
      baseURL: isCustom ? cfg.customBaseURL.trim() : provider.baseURL,
      apiKey: key,
      model: effectiveModel,
    });
    setTestMsg(result);
    setTesting(false);
  };

  return (
    <div className={styles.modalMask} onPointerDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div className={styles.modal}>
        <div className={styles.modalTitle}>
          AI 模型配置
          <button className="btn ghost" onClick={() => setOpen(false)}>
            ✕ 关闭
          </button>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>第一步：选择厂商</div>
          <div className={styles.providerGrid}>
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                className={`${styles.providerBtn} ${p.id === cfg.providerId ? styles.active : ''}`}
                onClick={() => {
                  cfg.setProvider(p.id);
                  setTestMsg(null);
                }}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>API BaseURL（选厂商自动填写{isCustom ? '，自定义可修改' : ''}）</div>
          {isCustom ? (
            <input
              type="text"
              placeholder="https://your-openai-compatible-endpoint/v1"
              value={cfg.customBaseURL}
              onChange={(e) => cfg.setCustomBaseURL(e.target.value)}
            />
          ) : (
            <input type="text" value={provider.baseURL} readOnly />
          )}
          {provider.corsWarning && <div className={styles.hint}>⚠ {provider.corsWarning}</div>}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>第二步：选择模型（优先推荐 ✅ 支持图片识别的多模态模型）</div>
          <div className={styles.keyRow}>
            <button className="btn" disabled={fetching} onClick={onFetchModels}>
              {fetching ? '获取中…' : '获取模型列表'}
            </button>
            {fetchMsg && (
              <span className={fetchMsg.ok ? styles.statusOk : styles.statusErr} style={{ fontSize: 12.5 }}>
                {fetchMsg.message}
              </span>
            )}
          </div>
          {fetched.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 180, overflowY: 'auto' }}>
              {fetched.map((id) => (
                <div
                  key={id}
                  className={`${styles.modelItem} ${effectiveModel === id ? styles.active : ''}`}
                  onClick={() => {
                    if (isCustom) cfg.setCustomModel(id);
                    else cfg.setModel(id);
                    setTestMsg(null);
                  }}
                >
                  <span style={{ flex: 1 }}>{id}</span>
                  {visionMark(guessVision(cfg.providerId, id))}
                </div>
              ))}
            </div>
          )}
          {provider.editableModel ? (
            <>
              <input
                type="text"
                placeholder="或手动输入模型名，如 gpt-4o / glm-4v …"
                value={isCustom ? cfg.customModel : cfg.model}
                onChange={(e) => (isCustom ? cfg.setCustomModel(e.target.value) : cfg.setModel(e.target.value))}
              />
              <div className={styles.hint}>该厂商模型是否支持图片识别，{visionMark('unknown')}，图片框选场景请自行确认。</div>
            </>
          ) : (
            fetched.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {provider.models.map((m) => (
                  <div
                    key={m.id}
                    className={`${styles.modelItem} ${cfg.model === m.id ? styles.active : ''}`}
                    onClick={() => {
                      cfg.setModel(m.id);
                      setTestMsg(null);
                    }}
                  >
                    <span style={{ flex: 1 }}>{m.label}</span>
                    {visionMark(m.vision)}
                  </div>
                ))}
              </div>
            )
          )}
        </div>

        <div className={styles.field}>
          <div className={styles.fieldLabel}>第三步：填写 API Key（仅存本机 localStorage，请勿在公共电脑使用）</div>
          <div className={styles.keyRow}>
            <input
              type={showKey ? 'text' : 'password'}
              placeholder="sk-..."
              value={key}
              onChange={(e) => cfg.setKey(cfg.providerId, e.target.value)}
            />
            <button className="btn" onClick={() => setShowKey((v) => !v)}>
              {showKey ? '隐藏' : '显示'}
            </button>
          </div>
        </div>

        <div className={styles.field}>
          <button className="btn ghost" style={{ alignSelf: 'flex-start' }} onClick={() => setShowHelp((v) => !v)}>
            {showHelp ? '▾' : '▸'} 如何获取 API Key？
          </button>
          {showHelp && (
            <div className={styles.helpBox}>
              <ol>
                {provider.keyHelp.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
              {provider.keyUrl && (
                <div>
                  平台地址：<a href={provider.keyUrl} target="_blank" rel="noreferrer">{provider.keyUrl}</a>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className="btn primary" disabled={testing} onClick={onTest}>
            {testing ? '测试中…' : '测试连接'}
          </button>
          {testMsg && (
            <span className={testMsg.ok ? styles.statusOk : styles.statusErr} style={{ fontSize: 12.5 }}>
              {testMsg.ok ? '✅ ' : '❌ '}
              {testMsg.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelConfigModal;
