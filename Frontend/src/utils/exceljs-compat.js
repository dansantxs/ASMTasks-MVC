'use client';

function aoa_to_sheet(data) {
  return { _data: data, '!merges': [] };
}

function book_new() {
  return { _sheets: [] };
}

function book_append_sheet(workbook, worksheet, sheetName) {
  workbook._sheets.push({ name: sheetName, sheet: worksheet });
}

async function writeFile(workbook, filename) {
  const ExcelJS = (await import('exceljs')).default;
  const wb = new ExcelJS.Workbook();

  for (const { name, sheet } of workbook._sheets) {
    const ws = wb.addWorksheet(name);
    ws.addRows(sheet._data);

    for (const merge of sheet['!merges'] ?? []) {
      ws.mergeCells(merge.s.r + 1, merge.s.c + 1, merge.e.r + 1, merge.e.c + 1);
    }
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const XLSX = {
  utils: { aoa_to_sheet, book_new, book_append_sheet },
  writeFile,
};

export default XLSX;
