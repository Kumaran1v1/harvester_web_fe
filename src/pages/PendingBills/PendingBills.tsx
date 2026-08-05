import React, { useState, useEffect } from "react";
import {
  Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress, Chip, TablePagination
} from "@mui/material";
import { CreditCard, Search, FileSpreadsheet, FileText } from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";
import { exportPendingBillsPDF, exportPendingBillsExcel } from "../../utils/pendingBillsExport";

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
  const [companyName, setCompanyName] = useState("HARVESTER MANAGEMENT SYSTEM");

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  // Load company name from profile
  useEffect(() => {
    fetch("/api/auth/profile")
      .then(r => r.json())
      .then(d => { if (d.companyName) setCompanyName(d.companyName.toUpperCase()); })
      .catch(() => {});
  }, []);

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

  // Export to CSV (Excel formatted download)
  const handleExportExcel = async () => {
    try {
      const res = await fetch(`/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load data for export");
      const data = await res.json();
      const exportData: PendingBill[] = data.data;
      if (exportData.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" })); return;
      }
      exportPendingBillsExcel(exportData);
      dispatch(showToast({ message: "Excel report exported successfully!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Failed to export Excel", severity: "error" }));
    }
  };

  // Export to PDF using html2pdf.js
  const handleExportPDF = async () => {
    try {
      const res = await fetch(`/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error("Failed to load data for export");
      const data = await res.json();
      const exportData: PendingBill[] = data.data;
      if (exportData.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" })); return;
      }
      await exportPendingBillsPDF(exportData, searchQuery, companyName);
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
          <Button variant="outlined" color="primary" startIcon={<FileSpreadsheet size={16} />} onClick={handleExportExcel}
            sx={{ py: 0.8, px: 2, fontWeight: 700, flex: { xs: 1, sm: "initial" }, borderRadius: 2 }}>
            Excel
          </Button>
          <Button variant="outlined" color="error" startIcon={<FileText size={16} />} onClick={handleExportPDF}
            sx={{ py: 0.8, px: 2, fontWeight: 700, flex: { xs: 1, sm: "initial" }, borderRadius: 2 }}>
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
          onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
          sx={{ maxWidth: { xs: "100%", sm: 380 } }}
          InputProps={{ startAdornment: <Search size={18} style={{ marginRight: 8, color: "#94a3b8" }} /> }}
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
                  <TableCell sx={{ fontWeight: 700, width: 52 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Place</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Machine Type</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Time (Hours)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Advance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingBills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? "No matching records found." : "No pending bills found."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingBills.map((bill, idx) => (
                    <TableRow key={bill.id} hover>
                      <TableCell sx={{ color: "text.secondary", fontSize: "12px" }}>{page * rowsPerPage + idx + 1}</TableCell>
                      <TableCell>{new Date(bill.date).toLocaleDateString("en-IN")}</TableCell>
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
                            color: bill.machineType === "CLASS" ? "#0369a1" : "#4338ca",
                            border: "1px solid",
                            borderColor: bill.machineType === "CLASS" ? "rgba(3,105,161,0.3)" : "rgba(67,56,202,0.3)"
                          }}
                        />
                      </TableCell>
                      <TableCell align="center">{Number(bill.timeHours || 0).toFixed(2)}</TableCell>
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
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Card>
      )}
    </Box>
  );
};

export default PendingBills;
