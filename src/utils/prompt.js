/**
 * 跨境平台专用 Listing 生成 Prompt 模板
 * 面向 Ozon（俄语为主）与 Shein Choice（英文为主）
 */

export const promptTemplates = {
  ozon: `你是资深 Ozon 跨境运营专家。请根据下面的产品信息，生成 Ozon 平台的商品上架文案。
要求：
1. 标题使用俄语，符合 Ozon 搜索规则，核心关键词前置，控制长度在 150 字符内。
2. 五点描述，每条用俄语，突出一个独立卖点，具体、可感知，避免空洞形容词。
3. 生成 10~15 个俄语搜索关键词，逗号分隔。
4. 避免平台禁词与夸大宣传用语。

产品信息：
{{productInfo}}

输出格式（严格按以下标记）：
#标题
<俄语标题>
#五点描述
1. <描述>
2. <描述>
3. <描述>
4. <描述>
5. <描述>
#关键词
<关键词1>,<关键词2>,...`,

  shein: `你是 Shein Choice 平台资深运营专家。请根据下面的产品信息，生成 Shein 商品 Listing。
要求：
1. 标题使用英文，简洁，适配 Shein 搜索算法，长度 40~80 字符。
2. 生成 5 条产品卖点描述，每条英文，突出差异点与使用场景。
3. 生成 10~15 个英文搜索关键词，逗号分隔。
4. 语言自然、无语法错误，符合欧美消费者表达习惯。

产品信息：
{{productInfo}}

输出格式（严格按以下标记）：
#标题
<英文标题>
#五点描述
1. <描述>
2. <描述>
3. <描述>
4. <描述>
5. <描述>
#关键词
<关键词1>,<关键词2>,...`
}

/**
 * 根据模板生成最终 prompt
 * @param {string} tplKey  'ozon' | 'shein'
 * @param {string} productInfo 序列化后的产品信息
 */
export function getPrompt(tplKey, productInfo) {
  const tpl = promptTemplates[tplKey]
  if (!tpl) throw new Error(`未知的模板: ${tplKey}`)
  return tpl.replace('{{productInfo}}', productInfo)
}

/**
 * 竞品评论分析专用 prompt（RAG 召回片段 + 用户问题）
 */
export function getRagPrompt(question, contextChunks) {
  return `你是跨境电商选品与竞品分析专家。请基于以下从竞品评论中检索到的相关片段，回答用户的问题。
要求：
1. 只依据提供的片段回答，不要编造片段中没有的信息。
2. 归纳出差评痛点、爆款卖点、以及建议改进点。
3. 用中文回答，条理清晰，可分类列出。

检索到的相关评论片段：
${contextChunks}

用户问题：${question}
`
}
