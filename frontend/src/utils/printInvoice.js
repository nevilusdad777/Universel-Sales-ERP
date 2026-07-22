/**
 * printInvoice.js
 * Opens a fresh browser window containing only a professional A4 invoice
 * and triggers the print dialog. Completely isolated from the React app DOM.
 */

const fmtCurrency = (n) =>
  `&#x20B9;${parseFloat(n || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '&mdash;';

const isOverdue = (inv) => {
  if (!inv.dueDate) return false;
  const paid = (inv.payments || []).reduce((s, p) => s + parseFloat(p.amount), 0);
  return new Date(inv.dueDate) < new Date() && paid < parseFloat(inv.grandTotal);
};

export function printInvoice(invoice) {
  const cust = invoice.order?.customer || {};
  const order = invoice.order || {};
  const items = order.items || [];
  const payments = invoice.payments || [];

  const totalPaid = payments.reduce((s, p) => s + parseFloat(p.amount), 0);
  const balance = parseFloat(invoice.grandTotal) - totalPaid;
  const overdue = isOverdue(invoice);

  // ── Line Items Rows ──────────────────────────────────────────────────────────
  const itemRows = items
    .map(
      (item) => `
        <tr>
          <td>
            <div class="product-name">${item.product?.name || `Product #${item.productId}`}</div>
            <div class="product-sku">${item.product?.sku || ''}</div>
          </td>
          <td class="center">${item.quantity}</td>
          <td class="right">${fmtCurrency(item.unitPrice)}</td>
          <td class="center">${item.product?.gstPercentage ?? '&mdash;'}%</td>
          <td class="right bold">${fmtCurrency(parseFloat(item.unitPrice) * item.quantity)}</td>
        </tr>`
    )
    .join('');

  // ── Payment History Rows ─────────────────────────────────────────────────────
  const paymentRows =
    payments.length === 0
      ? `<tr><td colspan="3" class="center" style="color:#888;padding:8px">No payments recorded yet</td></tr>`
      : payments
          .map(
            (p) => `
          <tr>
            <td>${fmtDate(p.paymentDate)}</td>
            <td>${(p.paymentMode || '').replace('_', ' ')}${p.transactionRef ? ` &bull; Ref: ${p.transactionRef}` : ''}</td>
            <td class="right" style="color:#15803d;font-weight:600">${fmtCurrency(p.amount)}</td>
          </tr>`
          )
          .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Invoice ${invoice.invoiceNo}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 11pt;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 16mm 16mm 12mm 16mm;
      background: #fff;
    }

    /* ── Header ───────────────────────────────────────────── */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12pt;
      border-bottom: 2pt solid #004ac6;
      margin-bottom: 14pt;
    }

    .company-block h1 {
      font-size: 20pt;
      font-weight: 800;
      color: #004ac6;
      letter-spacing: -0.5px;
      line-height: 1;
    }

    .company-block .subtitle {
      font-size: 8pt;
      color: #545f73;
      margin-top: 2pt;
    }

    .invoice-meta {
      text-align: right;
    }

    .invoice-meta .invoice-number {
      font-size: 14pt;
      font-weight: 700;
      color: #004ac6;
    }

    .invoice-meta table {
      margin-top: 5pt;
      border: none;
      width: auto;
    }

    .invoice-meta table td {
      border: none;
      padding: 1pt 0 1pt 10pt;
      font-size: 9pt;
      text-align: right;
    }

    .invoice-meta table td:first-child {
      color: #545f73;
      text-align: left;
      padding-left: 0;
    }

    .invoice-meta .overdue {
      color: #b91c1c;
      font-weight: 700;
    }

    /* ── Bill To / Order Ref ──────────────────────────────── */
    .info-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      margin-bottom: 14pt;
    }

    .info-card {
      background: #f8f9fb;
      border: 0.5pt solid #dde1ea;
      border-radius: 4pt;
      padding: 9pt 11pt;
    }

    .info-card .section-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #004ac6;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 5pt;
    }

    .info-card .name {
      font-size: 11pt;
      font-weight: 700;
      color: #191b23;
      margin-bottom: 3pt;
    }

    .info-card .detail {
      font-size: 8.5pt;
      color: #545f73;
      line-height: 1.6;
    }

    /* ── Tables ───────────────────────────────────────────── */
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 10pt;
    }

    thead th {
      background: #004ac6;
      color: #fff;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      padding: 6pt 8pt;
      text-align: left;
    }

    tbody tr:nth-child(even) td {
      background: #f8f9fb;
    }

    tbody tr td {
      padding: 6pt 8pt;
      font-size: 9pt;
      color: #191b23;
      border-bottom: 0.5pt solid #e1e2ed;
    }

    .product-name { font-weight: 600; }
    .product-sku  { font-size: 7.5pt; color: #737686; margin-top: 1pt; }

    .center { text-align: center; }
    .right  { text-align: right; }
    .bold   { font-weight: 700; }

    /* ── Bottom Grid ──────────────────────────────────────── */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12pt;
      margin-top: 4pt;
    }

    .section-label {
      font-size: 7.5pt;
      font-weight: 700;
      color: #004ac6;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-bottom: 6pt;
    }

    /* ── Payments Table ───────────────────────────────────── */
    .payments-table thead th {
      background: #3b4a6b;
    }

    /* ── Summary Block ────────────────────────────────────── */
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }

    .summary-table td {
      padding: 4pt 6pt;
      font-size: 9pt;
      border: none;
      background: transparent;
      border-bottom: none;
    }

    .summary-table td:first-child {
      color: #545f73;
    }

    .summary-table td:last-child {
      text-align: right;
      font-weight: 600;
    }

    .summary-table tr.separator td {
      border-top: 1pt solid #c3c6d7;
      padding-top: 6pt;
    }

    .summary-table tr.grand-total td {
      font-size: 12pt;
      font-weight: 800;
      color: #004ac6;
      border-top: 1.5pt solid #004ac6;
      padding-top: 6pt;
    }

    .summary-table tr.balance td {
      font-size: 11pt;
      font-weight: 800;
      color: ${balance > 0 ? '#b91c1c' : '#15803d'};
    }

    .summary-table tr.paid td {
      color: #15803d;
    }

    /* ── Footer ───────────────────────────────────────────── */
    .footer {
      border-top: 1pt solid #dde1ea;
      margin-top: 16pt;
      padding-top: 8pt;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .footer .thank-you {
      font-size: 9pt;
      color: #545f73;
    }

    .footer .company-contact {
      font-size: 8pt;
      color: #737686;
      text-align: right;
    }

    /* ── Print ────────────────────────────────────────────── */
    @media print {
      body { margin: 0; }
      .page { width: 100%; padding: 10mm; }
      @page { size: A4; margin: 10mm; }
    }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="company-block">
      <h1>&#9646; Universal Sales ERP</h1>
      <div class="subtitle">Enterprise Edition &bull; universalsaleserp.com</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-number">INVOICE</div>
      <table>
        <tr>
          <td>Invoice No</td>
          <td><strong>${invoice.invoiceNo}</strong></td>
        </tr>
        <tr>
          <td>Order Ref</td>
          <td>${order.orderNo || '&mdash;'}</td>
        </tr>
        <tr>
          <td>Issue Date</td>
          <td>${fmtDate(invoice.invoiceDate)}</td>
        </tr>
        <tr>
          <td>Due Date</td>
          <td class="${overdue ? 'overdue' : ''}">${fmtDate(invoice.dueDate)}${overdue ? ' &#x26A0; Overdue' : ''}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Bill To + Order Info -->
  <div class="info-grid">
    <div class="info-card">
      <div class="section-label">Billed To</div>
      <div class="name">${cust.companyName || cust.name || '&mdash;'}</div>
      <div class="detail">
        ${cust.companyName && cust.name ? `Attn: ${cust.name}<br>` : ''}
        ${cust.address ? `${cust.address}<br>` : ''}
        ${cust.city ? `${cust.city}${cust.state ? ', ' + cust.state : ''} ${cust.pincode || ''}` : ''}
        ${cust.gstNumber ? `<br>GST: ${cust.gstNumber}` : ''}
        ${cust.phoneNumber ? `<br>Ph: ${cust.phoneNumber}` : ''}
        ${cust.email ? `<br>${cust.email}` : ''}
      </div>
    </div>
    <div class="info-card">
      <div class="section-label">Order Details</div>
      <div class="name">${order.orderNo || '&mdash;'}</div>
      <div class="detail">
        Status: ${order.status || '&mdash;'}<br>
        ${order.shippingAddress ? `Ship To: ${order.shippingAddress}` : ''}
      </div>
    </div>
  </div>

  <!-- Line Items -->
  <div class="section-label">Items</div>
  <table>
    <thead>
      <tr>
        <th>Product / SKU</th>
        <th class="center" style="width:50px">Qty</th>
        <th class="right" style="width:90px">Unit Price</th>
        <th class="center" style="width:55px">GST %</th>
        <th class="right" style="width:95px">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows || `<tr><td colspan="5" class="center" style="color:#888">No items</td></tr>`}
    </tbody>
  </table>

  <!-- Bottom: Payments + Summary side by side -->
  <div class="bottom-grid">

    <!-- Payment History -->
    <div>
      <div class="section-label">Payment History</div>
      <table class="payments-table">
        <thead>
          <tr>
            <th style="width:80px">Date</th>
            <th>Mode / Reference</th>
            <th class="right" style="width:85px">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${paymentRows}
        </tbody>
      </table>
    </div>

    <!-- Financial Summary -->
    <div>
      <div class="section-label">Summary</div>
      <table class="summary-table">
        <tr>
          <td>Subtotal</td>
          <td>${fmtCurrency(invoice.subTotal)}</td>
        </tr>
        ${
          parseFloat(invoice.discount) > 0
            ? `<tr><td>Discount</td><td>&minus; ${fmtCurrency(invoice.discount)}</td></tr>`
            : ''
        }
        <tr>
          <td>GST</td>
          <td>${fmtCurrency(invoice.gst)}</td>
        </tr>
        <tr class="separator grand-total">
          <td>Grand Total</td>
          <td>${fmtCurrency(invoice.grandTotal)}</td>
        </tr>
        ${
          totalPaid > 0
            ? `<tr class="paid"><td>Total Paid</td><td>&minus; ${fmtCurrency(totalPaid)}</td></tr>`
            : ''
        }
        <tr class="separator balance">
          <td>Balance Due</td>
          <td>${fmtCurrency(balance)}</td>
        </tr>
      </table>
    </div>
  </div>

  <!-- Footer -->
  <div class="footer">
    <div class="thank-you">
      &#x1F4AC; Thank you for your business!<br>
      Please include the invoice number on all correspondence.
    </div>
    <div class="company-contact">
      Universal Sales ERP &bull; Enterprise Edition<br>
      contact@universalsaleserp.com
    </div>
  </div>

</div>
</body>
</html>`;

  // Open isolated print window
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) {
    alert('Please allow pop-ups to print invoices.');
    return;
  }
  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for fonts/images to settle, then print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Close after dialog is dismissed
    printWindow.onafterprint = () => printWindow.close();
  };
}
