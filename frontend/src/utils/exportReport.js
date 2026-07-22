/**
 * printReport.js
 * Utility to print clean PDF reports and export CSV files.
 */

export const exportToCSV = (filename, headers, rows) => {
  const csvRows = [];
  // Add Header Row
  csvRows.push(headers.map(h => `"${h.label.replace(/"/g, '""')}"`).join(','));

  // Add Data Rows
  rows.forEach(row => {
    const values = headers.map(h => {
      const val = h.accessor ? h.accessor(row) : row[h.key];
      const stringVal = val === null || val === undefined ? '' : String(val);
      return `"${stringVal.replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(csvRows.join('\n'));
  const link = document.createElement('a');
  link.setAttribute('href', csvContent);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const printReportPDF = (reportTitle, headers, rows, summaryStats = []) => {
  const printWin = window.open('', '_blank');
  if (!printWin) return;

  const now = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${reportTitle} - Universal Sales ERP</title>
      <style>
        @page { size: A4 portrait; margin: 15mm; }
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; font-size: 12px; color: #191b23; margin: 0; padding: 0; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-b: 2px solid #004ac6; padding-bottom: 12px; margin-bottom: 16px; }
        .company-title { font-size: 20px; font-weight: bold; color: #004ac6; margin: 0; }
        .report-title { font-size: 16px; font-weight: bold; color: #191b23; margin-top: 4px; }
        .meta { text-align: right; font-size: 11px; color: #545f73; }
        
        .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
        .summary-card { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px; }
        .summary-card .label { font-size: 10px; text-transform: uppercase; color: #64748b; font-weight: 600; }
        .summary-card .value { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 2px; }

        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #f1f5f9; color: #475569; font-weight: 600; text-align: left; padding: 8px 10px; font-size: 11px; text-transform: uppercase; border-bottom: 1px solid #cbd5e1; }
        td { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .text-right { text-align: right; }
        .font-mono { font-family: monospace; }
        .footer { margin-top: 24px; text-align: center; font-size: 10px; color: #94a3b8; border-t: 1px solid #e2e8f0; padding-top: 8px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company-title">Universal Sales ERP</div>
          <div class="report-title">${reportTitle}</div>
        </div>
        <div class="meta">
          <div><strong>Generated:</strong> ${now}</div>
          <div><strong>Total Records:</strong> ${rows.length}</div>
        </div>
      </div>

      ${summaryStats.length > 0 ? `
        <div class="summary-grid">
          ${summaryStats.map(s => `
            <div class="summary-card">
              <div class="label">${s.label}</div>
              <div class="value">${s.value}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}

      <table>
        <thead>
          <tr>
            ${headers.map(h => `<th class="${h.align === 'right' ? 'text-right' : ''}">${h.label}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.map(row => `
            <tr>
              ${headers.map(h => {
                const val = h.accessor ? h.accessor(row) : row[h.key];
                return `<td class="${h.align === 'right' ? 'text-right font-mono' : ''}">${val === null || val === undefined ? '—' : val}</td>`;
              }).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Generated automatically by Universal Sales ERP System &bull; Page 1 of 1
      </div>

      <script>
        window.onload = function() {
          window.print();
          window.onafterprint = function() { window.close(); };
        };
      </script>
    </body>
    </html>
  `;

  printWin.document.write(html);
  printWin.document.close();
};
