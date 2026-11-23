/**
 * Utility to parse Excel or CSV files dynamically.
 * CSV parsing is done natively (fast, zero dependency, no stream compatibility issues).
 * Excel (.xlsx/.xls) parsing uses ExcelJS loaded dynamically.
 */

function parseCSV(text) {
  if (!text) return [];
  // Strip UTF-8 BOM if present
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }

  const rows = [];
  let currentRow = [];
  let currentVal = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentVal += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      currentRow.push(currentVal.trim());
      currentVal = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++; // skip LF after CR
      }
      currentRow.push(currentVal.trim());
      currentVal = '';
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
    } else {
      currentVal += char;
    }
  }

  if (currentVal || currentRow.length > 0) {
    currentRow.push(currentVal.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  if (rows.length <= 1) return [];

  // First row is headers
  const headers = rows[0].map(h => (h || '').trim());
  const data = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowObj = {};
    let hasValue = false;
    for (let c = 0; c < headers.length; c++) {
      const header = headers[c];
      if (header) {
        const val = row[c] !== undefined ? row[c] : '';
        if (val) hasValue = true;
        rowObj[header] = val;
      }
    }
    if (hasValue) {
      data.push(rowObj);
    }
  }

  return data;
}

export async function parseSpreadsheet(file) {
  const isCsv = file.name.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const text = typeof file.text === 'function' 
      ? await file.text() 
      : new TextDecoder().decode(await file.arrayBuffer());
    return parseCSV(text);
  }

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const buffer = await file.arrayBuffer();
  await workbook.xlsx.load(buffer);

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount <= 1) {
    return [];
  }

  const rows = [];
  const headerRow = worksheet.getRow(1);
  const headers = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    headers[colNumber] = String(cell.value || '').trim();
  });

  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return;
    const rowObj = {};
    let hasValue = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const header = headers[colNumber];
      if (header) {
        let val = cell.value;
        if (val !== null && typeof val === 'object') {
          if (val.text !== undefined) val = val.text;
          else if (val.result !== undefined) val = val.result;
          else if (val instanceof Date) val = val.toISOString().slice(0, 10);
        }
        const strVal = val !== null && val !== undefined ? String(val).trim() : '';
        if (strVal) hasValue = true;
        rowObj[header] = strVal;
      }
    });
    if (hasValue) {
      rows.push(rowObj);
    }
  });

  return rows;
}
