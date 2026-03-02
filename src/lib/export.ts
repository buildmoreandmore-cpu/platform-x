import * as XLSX from 'xlsx';

interface ExportOptions {
  filename: string;
  sheetName?: string;
}

/**
 * Export an array of objects to a formatted Excel file.
 * Supports single sheet or multi-sheet workbooks.
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  { filename, sheetName = 'Sheet1' }: ExportOptions
) {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = getColumnWidths(data);
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export multiple sheets into one workbook.
 */
export function exportMultiSheet(
  sheets: { name: string; data: Record<string, unknown>[] }[],
  filename: string
) {
  const wb = XLSX.utils.book_new();
  for (const sheet of sheets) {
    const ws = XLSX.utils.json_to_sheet(sheet.data);
    ws['!cols'] = getColumnWidths(sheet.data);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31)); // Excel 31-char limit
  }
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

/**
 * Export to CSV (simpler, universal compatibility).
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
) {
  const ws = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getColumnWidths(data: Record<string, unknown>[]): XLSX.ColInfo[] {
  if (data.length === 0) return [];
  const keys = Object.keys(data[0]);
  return keys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => String(row[key] ?? '').length)
    );
    return { wch: Math.min(maxLen + 2, 50) };
  });
}
