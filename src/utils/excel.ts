import * as XLSX from 'xlsx'

/**
 * 将对象数组导出为 xlsx / csv
 * @param rows 数据行
 * @param filename 文件名（不含扩展名）
 * @param sheetName 工作表名
 */
export const exportSheet = (rows: Record<string, unknown>[], filename: string, sheetName = 'Sheet1'): void => {
  // xlsx 内置类型对 json_to_sheet 入参较宽松，此处做一次窄化断言以贴合实际数据形态
  const ws = XLSX.utils.json_to_sheet(rows as unknown as Record<string, unknown>[])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  XLSX.writeFile(wb, `${filename}.xlsx`)
}

/** 导出为 CSV（带 BOM，Excel 打开不乱码） */
export const exportCsv = (rows: Record<string, unknown>[], filename: string): void => {
  const ws = XLSX.utils.json_to_sheet(rows as unknown as Record<string, unknown>[])
  const csv = XLSX.utils.sheet_to_csv(ws)
  // 加 BOM 保证 UTF-8 中文在 Excel 正常显示
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${filename}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

/**
 * 从 File 对象解析表格内容为对象数组
 */
export const parseFileToRows = (file: File): Promise<Record<string, unknown>[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const wb = XLSX.read(data, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        resolve(rows as unknown as Record<string, unknown>[])
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = (e) => reject(e)
    reader.readAsArrayBuffer(file)
  })
}

/**
 * 从 File 对象解析纯文本（评论 CSV 等）
 */
export const parseTextFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsText(file, 'utf-8')
  })
}
