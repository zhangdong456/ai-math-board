// 从模型返回文本中提取 JSON 对象（容忍 markdown 代码块与前后杂文字）
export function extractJson(text: string): unknown {
  let s = text.trim();
  // 去掉 ```json ... ``` 围栏
  const fence = s.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) s = fence[1].trim();
  // 截取第一个 { 到最后一个 }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) {
    throw new Error('AI 返回内容中没有 JSON 对象');
  }
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    throw new Error('AI 返回的 JSON 无法解析，请重试');
  }
}
