/** Lazy-load heavy export libraries only when user triggers export. */

export async function exportTableToPdf(
  title: string,
  head: string[][],
  body: (string | number)[][],
  fileName: string
) {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 15);
  autoTable(doc, { head, body, startY: 22 });
  doc.save(fileName);
}

export async function exportRowsToExcel(
  sheetName: string,
  rows: Record<string, unknown>[],
  fileName: string
) {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}
