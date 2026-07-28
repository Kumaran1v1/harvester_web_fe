import React, { useState, useEffect } from "react";
import {
  Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, TablePagination
} from "@mui/material";
import { CreditCard, Search, FileSpreadsheet, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";

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

export const PendingBills: React.FC = () => {
  const dispatch = useDispatch();
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchPendingBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pending-bills?page=${page}&limit=${rowsPerPage}&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load pending bills");
      const data = await res.json();
      setPendingBills(data.data);
      setTotalCount(data.total);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching pending bills", severity: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingBills();
  }, [page, rowsPerPage, searchQuery]);

  // Dynamically load html2pdf from CDN when requested
  const loadHtml2Pdf = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).html2pdf) {
        resolve((window as any).html2pdf);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
      script.onload = () => {
        if ((window as any).html2pdf) {
          resolve((window as any).html2pdf);
        } else {
          reject(new Error("PDF generation library was loaded but is not available globally"));
        }
      };
      script.onerror = () => reject(new Error("Failed to load PDF generation library from CDN"));
      document.body.appendChild(script);
    });
  };

  // Export to CSV (Excel formatted download)
  const handleExportExcel = async () => {
    try {
      const res = await fetch(`/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load data for export");
      const data = await res.json();
      const exportData: PendingBill[] = data.data;

      if (exportData.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" }));
        return;
      }

      // Generate CSV string
      const headers = ["Date", "Customer Name", "Contact Number", "Place", "Machine Type", "Total Amount", "Advance", "Balance Amount", "Remarks"];
      const rows = exportData.map(b => [
        new Date(b.date).toLocaleDateString(),
        b.customerName,
        b.contactNumber,
        b.place,
        b.machineType === "CLASS" ? "Class Machine" : "Kartar Machine",
        b.totalAmount,
        b.advance,
        b.balanceAmount,
        b.remarks || ""
      ]);

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))].join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pending_bills_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      dispatch(showToast({ message: "Excel report exported successfully!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Failed to export Excel", severity: "error" }));
    }
  };

  // Export to PDF using html2pdf.js for Direct File download
  const handleExportPDF = async () => {
    try {
      // Ensure html2pdf is loaded
      const html2pdfLib = await loadHtml2Pdf();
      if (!html2pdfLib) throw new Error("PDF generation library is not available");

      const res = await fetch(`/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load data for export");
      const data = await res.json();
      const exportData: PendingBill[] = data.data;

      if (exportData.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" }));
        return;
      }

      // Calculate totals
      const totalAmountSum = exportData.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const totalAdvanceSum = exportData.reduce((acc, curr) => acc + curr.advance, 0);
      const totalBalanceSum = exportData.reduce((acc, curr) => acc + curr.balanceAmount, 0);

      // Create off-screen container element
      const element = document.createElement("div");
      element.style.padding = "20px";
      element.style.backgroundColor = "#ffffff";
      element.style.color = "#1e293b";
      element.style.fontFamily = "'Inter', sans-serif";

      element.innerHTML = `
        <div style="border: 2px solid #cbd5e1; border-radius: 8px; padding: 24px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
          <!-- Header Banner -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #cbd5e1; padding-bottom: 16px; margin-bottom: 20px;">
            <div>
              <h1 style="font-family: 'Outfit', sans-serif; font-size: 24px; font-weight: 800; margin: 0; color: #0d9488; letter-spacing: -0.5px;">
                HARVESTER MANAGEMENT SYSTEM
              </h1>
              <p style="font-size: 13px; color: #64748b; margin: 2px 0 0 0; font-weight: 500;">
                Outstanding Debts & Pending Payments Statement
              </p>
            </div>
            <div style="text-align: right;">
              <span style="display: inline-block; padding: 6px 12px; font-weight: 700; font-size: 12px; color: #b91c1c; background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 6px; text-transform: uppercase;">
                Pending Statement
              </span>
            </div>
          </div>

          <!-- Report Metadata -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; background-color: #f8fafc; padding: 16px; border: 1px solid #e2e8f0; border-radius: 6px; margin-bottom: 24px;">
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Statement Date</span>
              <strong style="font-size: 14px; color: #0f172a;">${new Date().toLocaleDateString()}</strong>
            </div>
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Search Filters</span>
              <strong style="font-size: 14px; color: #0f172a;">${searchQuery ? `"${searchQuery}"` : "All Records"}</strong>
            </div>
            <div>
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 600; display: block;">Total Debtors</span>
              <strong style="font-size: 14px; color: #0f172a;">${exportData.length} customers</strong>
            </div>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #0f172a; color: #ffffff;">
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: left; font-size: 12px; font-weight: 700;">Date</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: left; font-size: 12px; font-weight: 700;">Customer</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: left; font-size: 12px; font-weight: 700;">Contact</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: left; font-size: 12px; font-weight: 700;">Place</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: left; font-size: 12px; font-weight: 700;">Machine</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: right; font-size: 12px; font-weight: 700;">Total Amount</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: right; font-size: 12px; font-weight: 700;">Advance Paid</th>
                <th style="padding: 10px; border: 1px solid #1e293b; text-align: right; font-size: 12px; font-weight: 700;">Remaining Balance</th>
              </tr>
            </thead>
            <tbody>
              ${exportData.map(b => `
                <tr style="border-bottom: 1px solid #e2e8f0; font-size: 12px;">
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${new Date(b.date).toLocaleDateString()}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; font-weight: 700; color: #0f172a;">${b.customerName}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${b.contactNumber}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">${b.place}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0;">
                    <span style="padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 700; text-transform: uppercase; background-color: ${b.machineType === "CLASS" ? "#e0f2fe" : "#e0e7ff"}; color: ${b.machineType === "CLASS" ? "#0369a1" : "#4338ca"};">
                      ${b.machineType === "CLASS" ? "Class" : "Kartar"}
                    </span>
                  </td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">₹${Number(b.totalAmount).toLocaleString()}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right;">₹${Number(b.advance).toLocaleString()}</td>
                  <td style="padding: 8px 10px; border: 1px solid #e2e8f0; text-align: right; color: #b91c1c; font-weight: 700;">₹${Number(b.balanceAmount).toLocaleString()}</td>
                </tr>
              `).join("")}
              <!-- Totals row -->
              <tr style="background-color: #f1f5f9; font-weight: 800; font-size: 12px; color: #0f172a;">
                <td colspan="5" style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">GRAND TOTALS:</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">₹${totalAmountSum.toLocaleString()}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right;">₹${totalAdvanceSum.toLocaleString()}</td>
                <td style="padding: 10px; border: 1px solid #cbd5e1; text-align: right; color: #b91c1c;">₹${totalBalanceSum.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <!-- Footer statement -->
          <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #94a3b8; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
            Generated automatically by Harvester Portal Admin Center. Keep securely for auditing.
          </div>
        </div>
      `;

      // Options for html2pdf
      const opt = {
        margin: 10,
        filename: `pending_bills_statement_${new Date().toISOString().split("T")[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };

      // Run generator and save using resolved library instance
      await html2pdfLib().set(opt).from(element).save();
      dispatch(showToast({ message: "PDF report downloaded successfully!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Failed to export PDF", severity: "error" }));
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
            <CreditCard style={{ color: "#0d9488" }} />
            Pending Bills
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            View outstanding customer debts and balance payments across Class and Kartar machines.
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button variant="outlined" color="primary" startIcon={<FileSpreadsheet size={16} />} onClick={handleExportExcel} sx={{ py: 0.8, px: 2, fontWeight: 700, flex: { xs: 1, sm: "initial" } }}>
            Excel
          </Button>
          <Button variant="contained" color="primary" startIcon={<FileText size={16} />} onClick={handleExportPDF} sx={{ py: 0.8, px: 2, fontWeight: 700, flex: { xs: 1, sm: "initial" } }}>
            PDF
          </Button>
        </Box>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by customer, place, contact..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          sx={{ maxWidth: { xs: "100%", sm: 380 } }}
          InputProps={{
            startAdornment: <Search size={18} style={{ marginRight: 8, color: "#94a3b8" }} />
          }}
        />
      </Box>

      {/* Pending Bills Table */}
      {loading && pendingBills.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress size={44} />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <TableContainer component={Paper} sx={{ bgcolor: "background.paper", overflowX: "auto" }}>
            <Table sx={{ minWidth: 1000 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Place</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Machine Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Advance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? "No matching records found." : "No pending bills found."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingBills.map((bill) => (
                    <TableRow key={bill.id} hover>
                      <TableCell>{new Date(bill.date).toLocaleDateString()}</TableCell>
                      <TableCell>{bill.place}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{bill.customerName}</TableCell>
                      <TableCell>{bill.contactNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={bill.machineType === "CLASS" ? "Class" : "Kartar"}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: bill.machineType === "CLASS" ? "rgba(3, 105, 161, 0.12)" : "rgba(67, 56, 202, 0.12)",
                            color: bill.machineType === "CLASS" ? "sky.main" : "indigo.main",
                            border: "1px solid",
                            borderColor: bill.machineType === "CLASS" ? "sky.light" : "indigo.light"
                          }}
                        />
                      </TableCell>
                      <TableCell>₹{Number(bill.totalAmount).toLocaleString()}</TableCell>
                      <TableCell>₹{Number(bill.advance).toLocaleString()}</TableCell>
                      <TableCell sx={{ color: "error.main", fontWeight: 700 }}>
                        ₹{Number(bill.balanceAmount).toLocaleString()}
                      </TableCell>
                      <TableCell>{bill.remarks || "—"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={totalCount}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}
    </Box>
  );
};

export default PendingBills;
