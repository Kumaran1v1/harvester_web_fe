interface PendingBill {
  id: string;
  dbId: number;
  date: string;
  place: string;
  customerName: string;
  contactNumber: string;
  timeHours: number;
  totalAmount: number;
  advance: number;
  balanceAmount: number;
  remarks: string | null;
  machineType: "CLASS" | "KARTAR";
}

const loadHtml2Pdf = (): Promise<any> => {
  return new Promise((resolve, reject) => {
    if ((window as any).html2pdf) { resolve((window as any).html2pdf); return; }
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    script.onload = () =>
      (window as any).html2pdf ? resolve((window as any).html2pdf) : reject(new Error("html2pdf not found"));
    script.onerror = () => reject(new Error("Failed to load PDF library"));
    document.body.appendChild(script);
  });
};

export const exportPendingBillsPDF = async (
  exportData: PendingBill[],
  searchQuery: string,
  companyName: string
): Promise<void> => {
  const html2pdfLib = await loadHtml2Pdf();
  if (exportData.length === 0) throw new Error("NO_DATA");

  const totalAmountSum = exportData.reduce((a, b) => a + b.totalAmount, 0);
  const totalAdvanceSum = exportData.reduce((a, b) => a + b.advance, 0);
  const totalBalanceSum = exportData.reduce((a, b) => a + b.balanceAmount, 0);
  const today = new Date().toLocaleDateString("en-IN");

  const rowsHtml = exportData.map((b, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    const machineBg = b.machineType === "CLASS" ? "#e0f2fe" : "#e0e7ff";
    const machineColor = b.machineType === "CLASS" ? "#0369a1" : "#4338ca";
    const machineLabel = b.machineType === "CLASS" ? "Class" : "Kartar";
    const dateStr = new Date(b.date).toLocaleDateString("en-IN");
    const contact = b.contactNumber || "—";
    const remarks = b.remarks || "—";
    return `<tr style="border-bottom:1px solid #e2e8f0;background:${bg};font-size:10px;">
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;color:#64748b;">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${dateStr}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${b.customerName}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${contact}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${b.place}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;">
        <span style="padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:${machineBg};color:${machineColor};">${machineLabel}</span>
      </td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;">${Number(b.timeHours || 0).toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;">&#8377;${Number(b.totalAmount).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;">&#8377;${Number(b.advance).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;color:#b91c1c;font-weight:700;">&#8377;${Number(b.balanceAmount).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${remarks}</td>
    </tr>`;
  }).join("");

  const html = `
  <div style="border:2px solid #cbd5e1;border-radius:8px;padding:24px;background:#fff;color:#1e293b;font-family:'Inter',sans-serif;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #cbd5e1;padding-bottom:14px;margin-bottom:18px;">
      <div>
        <h1 style="font-size:20px;font-weight:800;margin:0;color:#0d9488;">${companyName}</h1>
        <p style="font-size:12px;color:#64748b;margin:3px 0 0 0;font-weight:500;">Outstanding Debts &amp; Pending Payments Statement</p>
      </div>
      <span style="padding:6px 12px;font-weight:700;font-size:11px;color:#b91c1c;background:#fef2f2;border:1px solid #fee2e2;border-radius:6px;">PENDING STATEMENT</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;background:#f8fafc;padding:14px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:20px;">
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Statement Date</span><strong style="font-size:13px;color:#0f172a;">${today}</strong></div>
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Search Filters</span><strong style="font-size:13px;color:#0f172a;">${searchQuery ? '"' + searchQuery + '"' : "All Records"}</strong></div>
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Total Debtors</span><strong style="font-size:13px;color:#0f172a;">${exportData.length} customers</strong></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">#</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Date</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Customer</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Contact</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Place</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">Machine</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">Time (Hrs)</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Total Amount</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Advance Paid</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Remaining Balance</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="background:#f1f5f9;font-weight:800;font-size:11px;color:#0f172a;">
          <td colspan="7" style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">GRAND TOTALS:</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">&#8377;${totalAmountSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">&#8377;${totalAdvanceSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;color:#b91c1c;">&#8377;${totalBalanceSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;"></td>
        </tr>
      </tbody>
    </table>
    <div style="text-align:center;font-size:10px;color:#94a3b8;border-top:1px dashed #cbd5e1;padding-top:10px;">
      Generated automatically by ${companyName}. Keep securely for auditing.
    </div>
  </div>`;

  const element = document.createElement("div");
  element.style.padding = "20px";
  element.style.backgroundColor = "#ffffff";
  element.innerHTML = html;

  const opt = {
    margin: 8,
    filename: `pending_bills_statement_${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
  };
  await html2pdfLib().set(opt).from(element).save();
};

export const exportPendingBillsExcel = (
  exportData: PendingBill[]
): void => {
  const headers = ["S.No", "Date", "Customer Name", "Contact Number", "Place", "Machine Type", "Time (Hours)", "Total Amount", "Advance", "Balance Amount", "Remarks"];
  const rows = exportData.map((b, i) => [
    i + 1,
    new Date(b.date).toLocaleDateString("en-IN"),
    b.customerName, b.contactNumber || "", b.place,
    b.machineType === "CLASS" ? "Class Machine" : "Kartar Machine",
    Number(b.timeHours || 0).toFixed(2),
    b.totalAmount, b.advance, b.balanceAmount,
    b.remarks || ""
  ]);
  const csvContent = "data:text/csv;charset=utf-8,"
    + [headers.join(","), ...rows.map(r => r.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `pending_bills_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
