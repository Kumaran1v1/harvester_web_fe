interface Bill {
  id: number;
  date: string;
  place: string;
  customerName: string;
  contactNumber: string;
  timeHours: number;
  totalAmount: number;
  advance: number;
  balance: number;
  remarks: string | null;
  status: number;
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

export const exportBillsPDF = async (
  exportData: Bill[],
  activeTab: "CLASS" | "KARTAR",
  companyName: string,
  periodLabel: string = "Overall (All-Time)"
): Promise<void> => {
  const html2pdfLib = await loadHtml2Pdf();
  if (exportData.length === 0) throw new Error("NO_DATA");

  const totalAmountSum = exportData.reduce((a, b) => a + b.totalAmount, 0);
  const totalAdvanceSum = exportData.reduce((a, b) => a + b.advance, 0);
  const totalBalanceSum = exportData.reduce((a, b) => a + b.balance, 0);
  const tabLabel = activeTab === "CLASS" ? "Class Machine" : "Kartar Machine";
  const today = new Date().toLocaleDateString("en-IN");

  const rowsHtml = exportData.map((b, i) => {
    const bg = i % 2 === 0 ? "#ffffff" : "#f8fafc";
    const balColor = b.balance > 0 ? "#b91c1c" : "#065f46";
    const statusBg = b.status === 1 ? "#dcfce7" : "#fee2e2";
    const statusColor = b.status === 1 ? "#15803d" : "#b91c1c";
    const statusLabel = b.status === 1 ? "DONE" : "PENDING";
    const dateStr = new Date(b.date).toLocaleDateString("en-IN");
    const contact = b.contactNumber || "—";
    const remarks = b.remarks || "—";
    return `<tr style="border-bottom:1px solid #e2e8f0;background:${bg};font-size:10px;">
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;color:#64748b;">${i + 1}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${dateStr}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;font-weight:700;color:#0f172a;">${b.customerName}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${contact}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${b.place}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;">${Number(b.timeHours || 0).toFixed(2)}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;">&#8377;${Number(b.totalAmount).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;">&#8377;${Number(b.advance).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:right;color:${balColor};font-weight:700;">&#8377;${Number(b.balance).toLocaleString()}</td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;text-align:center;"><span style="padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700;background:${statusBg};color:${statusColor};">${statusLabel}</span></td>
      <td style="padding:6px 8px;border:1px solid #e2e8f0;">${remarks}</td>
    </tr>`;
  }).join("");

  const html = `
  <div style="border:2px solid #cbd5e1;border-radius:8px;padding:24px;background:#fff;color:#1e293b;font-family:'Inter',sans-serif;">
    <div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #cbd5e1;padding-bottom:14px;margin-bottom:18px;">
      <div>
        <h1 style="font-size:20px;font-weight:800;margin:0;color:#0d9488;">${companyName}</h1>
        <p style="font-size:12px;color:#64748b;margin:3px 0 0 0;font-weight:500;">${tabLabel} Bills Registry (${periodLabel})</p>
      </div>
      <span style="padding:6px 12px;font-weight:700;font-size:11px;color:#065f46;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:6px;">BILLS STATEMENT</span>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:14px;background:#f8fafc;padding:14px;border:1px solid #e2e8f0;border-radius:6px;margin-bottom:20px;">
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Statement Date</span><strong style="font-size:13px;color:#0f172a;">${today}</strong></div>
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Period</span><strong style="font-size:13px;color:#0d9488;">${periodLabel}</strong></div>
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Machine Type</span><strong style="font-size:13px;color:#0f172a;">${tabLabel}</strong></div>
      <div><span style="font-size:10px;text-transform:uppercase;color:#64748b;font-weight:600;display:block;">Total Records</span><strong style="font-size:13px;color:#0f172a;">${exportData.length} bills</strong></div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
      <thead>
        <tr style="background:#0f172a;color:#fff;">
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">#</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Date</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Customer</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Contact</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Place</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">Time (Hrs)</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Total</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Advance</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:right;font-size:11px;">Balance</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:center;font-size:11px;">Status</th>
          <th style="padding:8px;border:1px solid #1e293b;text-align:left;font-size:11px;">Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${rowsHtml}
        <tr style="background:#f1f5f9;font-weight:800;font-size:11px;color:#0f172a;">
          <td colspan="6" style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">GRAND TOTALS:</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">&#8377;${totalAmountSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;">&#8377;${totalAdvanceSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;text-align:right;color:#b91c1c;">&#8377;${totalBalanceSum.toLocaleString()}</td>
          <td style="padding:9px 10px;border:1px solid #cbd5e1;" colspan="2"></td>
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
    filename: `${activeTab.toLowerCase()}_bills_${periodLabel.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "landscape" }
  };
  await html2pdfLib().set(opt).from(element).save();
};

export const exportBillsExcel = (
  exportData: Bill[],
  activeTab: "CLASS" | "KARTAR",
  periodLabel: string = "Overall (All-Time)"
): void => {
  const headers = ["S.No", "Date", "Customer Name", "Contact", "Place", "Time (Hours)", "Total Amount", "Advance", "Balance", "Status", "Remarks"];
  const rows = exportData.map((b, i) => [
    i + 1,
    new Date(b.date).toLocaleDateString("en-IN"),
    b.customerName, b.contactNumber || "", b.place,
    Number(b.timeHours || 0).toFixed(2),
    b.totalAmount, b.advance, b.balance,
    b.status === 1 ? "Completed" : "Pending",
    b.remarks || ""
  ]);
  const csvContent = "data:text/csv;charset=utf-8,"
    + [headers.join(","), ...rows.map(r => r.map(v => `"${v.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
  const link = document.createElement("a");
  link.setAttribute("href", encodeURI(csvContent));
  link.setAttribute("download", `${activeTab.toLowerCase()}_bills_${periodLabel.toLowerCase().replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link); link.click(); document.body.removeChild(link);
};
