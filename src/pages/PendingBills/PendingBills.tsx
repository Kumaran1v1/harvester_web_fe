import React, { useState, useEffect } from "react";
import {
  Box, Card, Typography, Button, TextField, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, TablePagination, Grid,
  ToggleButton, ToggleButtonGroup, Avatar, keyframes, CircularProgress
} from "@mui/material";
import {
  CreditCard, Search, FileSpreadsheet, FileText, LayoutGrid, List,
  Calendar, MapPin, Phone, Clock, MessageSquare
} from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";
import { exportPendingBillsPDF, exportPendingBillsExcel } from "../../utils/pendingBillsExport";
import { YouTubeTableSkeleton, YouTubeCardGridSkeleton } from "../../components/YouTubeSkeletonLoader";

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

import { MonthFilterBar, MonthFilterState } from "../../components/MonthFilterBar";

const cardPopIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(30px) scale(0.92);
  }
  60% {
    transform: translateY(-4px) scale(1.015);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const shimmerBar = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;


const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const PendingBills: React.FC = () => {
  const dispatch = useDispatch();
  const [pendingBills, setPendingBills] = useState<PendingBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("HARVESTER MANAGEMENT SYSTEM");

  // View mode: "card" (default) or "table"
  const [viewType, setViewType] = useState<"card" | "table">("card");

  // Search, Month & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterState, setFilterState] = useState<MonthFilterState>({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    isOverall: true,
  });

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(50);
  const [totalCount, setTotalCount] = useState(0);

  const periodLabel = filterState.isOverall
    ? "All-Time"
    : `${MONTH_NAMES[filterState.month - 1]} ${filterState.year}`;

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
      let url = `/api/pending-bills?page=${page}&limit=${rowsPerPage}&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
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
  }, [page, rowsPerPage, searchQuery, filterState]);

  // Export Loading States
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Export to CSV (Excel formatted download)
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      let url = `/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load data for export");
      const data = await res.json();
      const exportData: PendingBill[] = data.data;
      if (exportData.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" })); return;
      }
      exportPendingBillsExcel(exportData);
      dispatch(showToast({ message: "Excel report downloaded successfully!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Failed to export Excel", severity: "error" }));
    } finally {
      setExportingExcel(false);
    }
  };

  // Export to PDF using html2pdf.js
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      let url = `/api/pending-bills?limit=all&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
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
    } finally {
      setExportingPdf(false);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 1.5, sm: 2.5 }, gap: 1, overflow: "hidden" }}>
        <Box sx={{ minWidth: 0, flexShrink: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 0.8,
              background: "linear-gradient(90deg, #2dd4bf, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.1rem", sm: "1.5rem" },
              whiteSpace: "nowrap"
            }}
          >
            <CreditCard style={{ color: "#0d9488", flexShrink: 0 }} size={20} />
            Pending Bills
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" }, mt: 0.3 }}>
            View outstanding customer debts and balance payments across Class and Kartar machines.
          </Typography>
        </Box>

        <Box display="flex" gap={{ xs: 0.5, sm: 0.8 }} alignItems="center" flexShrink={0}>
          <Button
            variant="outlined"
            color="primary"
            disabled={exportingExcel}
            startIcon={exportingExcel ? <CircularProgress size={14} color="inherit" /> : <FileSpreadsheet size={14} />}
            onClick={handleExportExcel}
            sx={{
              py: 0.5,
              px: { xs: 0.8, sm: 1.8 },
              fontWeight: 700,
              borderRadius: 2,
              whiteSpace: "nowrap",
              fontSize: { xs: "10.5px", sm: "13px" },
              minWidth: "auto"
            }}
          >
            {exportingExcel ? "Exporting..." : "Excel"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={exportingPdf}
            startIcon={exportingPdf ? <CircularProgress size={14} color="inherit" /> : <FileText size={14} />}
            onClick={handleExportPDF}
            sx={{
              py: 0.5,
              px: { xs: 0.8, sm: 1.8 },
              fontWeight: 700,
              borderRadius: 2,
              whiteSpace: "nowrap",
              fontSize: { xs: "10.5px", sm: "13px" },
              minWidth: "auto"
            }}
          >
            {exportingPdf ? "Exporting..." : "PDF"}
          </Button>
        </Box>
      </Box>

      {/* Action Bar: Search Input & Responsive MonthFilterBar */}
      <Grid container spacing={1.5} alignItems="center" sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
        <Grid item xs={12} md={5}>
          <TextField
            placeholder="Search by customer, place, contact..."
            variant="outlined"
            size="small"
            fullWidth
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            InputProps={{ startAdornment: <Search size={16} style={{ marginRight: 8, color: "#94a3b8" }} /> }}
            sx={{
              bgcolor: "background.paper",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": { borderRadius: 2 }
            }}
          />
        </Grid>

        <Grid item xs={12} md={7}>
          <MonthFilterBar
            filterState={filterState}
            onChange={(newState) => {
              setFilterState(newState);
              setPage(0);
            }}
          />
        </Grid>
      </Grid>

      {/* Active Period Indicator & View Switcher Toggle */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="nowrap" gap={1} sx={{ mb: { xs: 1.5, sm: 2 }, px: 0.5 }}>
        <Typography variant="body2" sx={{ fontWeight: 700, color: "text.secondary", fontSize: { xs: "12px", sm: "14px" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          <strong style={{ color: "#0d9488" }}>{periodLabel}</strong> ({totalCount} record{totalCount === 1 ? "" : "s"})
        </Typography>

        <ToggleButtonGroup
          value={viewType}
          exclusive
          onChange={(_, next) => { if (next) setViewType(next); }}
          size="small"
          aria-label="View mode toggle"
          sx={{
            bgcolor: "background.paper",
            borderRadius: 2,
            p: 0.2,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            border: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            "& .MuiToggleButton-root": {
              px: { xs: 1.2, sm: 1.8 },
              py: 0.5,
              fontWeight: 700,
              fontSize: { xs: "11px", sm: "12px" },
              textTransform: "none",
              gap: 0.6,
              borderRadius: 1.5,
              border: "none",
              color: "text.secondary",
              "&.Mui-selected": {
                bgcolor: "primary.main",
                color: "#fff",
                "&:hover": {
                  bgcolor: "primary.dark",
                }
              }
            }
          }}
        >
          <ToggleButton value="card" aria-label="Card View">
            <LayoutGrid size={14} />
            Card
          </ToggleButton>
          <ToggleButton value="table" aria-label="Table View">
            <List size={14} />
            Table
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Pending Bills Content: Card View vs Table View */}
      {loading && pendingBills.length === 0 ? (
        viewType === "card" ? <YouTubeCardGridSkeleton count={6} /> : <YouTubeTableSkeleton rows={6} columns={8} />
      ) : viewType === "card" ? (
        /* CARD VIEW CONTAINER */
        <Box>
          {pendingBills.length === 0 ? (
            <Card sx={{ p: 6, textAlign: "center", borderRadius: 3, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 600 }}>
                {searchQuery ? "No matching pending bill records found." : "No pending bills found."}
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {pendingBills.map((bill, idx) => (
                <Grid item xs={12} sm={6} lg={4} key={bill.id}>
                  <Card
                    sx={{
                      borderRadius: 3.5,
                      bgcolor: "background.paper",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      overflow: "hidden",
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      boxShadow: "0 6px 24px rgba(239, 68, 68, 0.08)",
                      animation: `${cardPopIn} 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards`,
                      animationDelay: `${idx * 0.05}s`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        top: 0,
                        left: "-100%",
                        width: "60%",
                        height: "100%",
                        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)",
                        transform: "skewX(-20deg)",
                        transition: "left 0.75s ease-in-out",
                        pointerEvents: "none"
                      },
                      "&:hover": {
                        transform: "translateY(-6px) scale(1.015)",
                        boxShadow: "0 16px 36px rgba(239, 68, 68, 0.22), 0 0 16px rgba(239, 68, 68, 0.15)",
                        borderColor: "error.main",
                        "&::after": {
                          left: "150%"
                        },
                        "& .avatar-icon": {
                          transform: "scale(1.1) rotate(6deg)"
                        }
                      },
                    }}
                  >
                    {/* Top Animated Shimmer Bar Accent */}
                    <Box
                      sx={{
                        height: 4.5,
                        width: "100%",
                        background: "linear-gradient(90deg, #ef4444, #f87171, #dc2626, #ef4444)",
                        backgroundSize: "200% 100%",
                        animation: `${shimmerBar} 4s linear infinite`
                      }}
                    />

                    <Box sx={{ p: 2.5 }}>
                      {/* Header: Customer Name & Machine Type Chip */}
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 2 }}>
                        <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                          <Avatar
                            className="avatar-icon"
                            sx={{
                              width: 44,
                              height: 44,
                              fontWeight: 800,
                              fontSize: "17px",
                              bgcolor: "rgba(211, 47, 47, 0.15)",
                              color: "error.main",
                              border: "2px solid rgba(211, 47, 47, 0.3)",
                              transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                              flexShrink: 0
                            }}
                          >
                            {bill.customerName ? bill.customerName.charAt(0).toUpperCase() : "P"}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography
                              variant="subtitle1"
                              sx={{
                                fontWeight: 800,
                                lineHeight: 1.2,
                                color: "text.primary",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                            >
                              {bill.customerName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                              Pending Entry #{page * rowsPerPage + idx + 1}
                            </Typography>
                          </Box>
                        </Box>

                        <Chip
                          label={bill.machineType === "CLASS" ? "Class" : "Kartar"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "10px",
                            height: 22,
                            bgcolor: bill.machineType === "CLASS" ? "rgba(3, 105, 161, 0.12)" : "rgba(67, 56, 202, 0.12)",
                            color: bill.machineType === "CLASS" ? "#0369a1" : "#4338ca",
                            border: "1px solid",
                            borderColor: bill.machineType === "CLASS" ? "rgba(3,105,161,0.3)" : "rgba(67,56,202,0.3)",
                            flexShrink: 0
                          }}
                        />
                      </Box>

                      {/* Details Grid */}
                      <Grid container spacing={1.5} sx={{ mb: 2 }}>
                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Calendar size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "13px" }}>
                              {new Date(bill.date).toLocaleDateString("en-IN")}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <MapPin size={14} style={{ color: "#0d9488", flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "13px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {bill.place}
                            </Typography>
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Phone size={14} style={{ color: "#3b82f6", flexShrink: 0 }} />
                            {bill.contactNumber ? (
                              <Typography
                                component="a"
                                href={`tel:${bill.contactNumber}`}
                                variant="body2"
                                sx={{
                                  fontWeight: 600,
                                  fontSize: "13px",
                                  color: "primary.main",
                                  textDecoration: "none",
                                  "&:hover": { textDecoration: "underline" }
                                }}
                              >
                                {bill.contactNumber}
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "13px" }}>
                                N/A
                              </Typography>
                            )}
                          </Box>
                        </Grid>

                        <Grid item xs={6}>
                          <Box display="flex" alignItems="center" gap={0.8}>
                            <Clock size={14} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "13px" }}>
                              {Number(bill.timeHours || 0).toFixed(2)} hrs
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Financial Highlight Container */}
                      <Box
                        sx={{
                          p: 1.8,
                          borderRadius: 2.5,
                          bgcolor: "rgba(239, 68, 68, 0.05)",
                          border: "1px solid rgba(239, 68, 68, 0.15)",
                          mb: bill.remarks ? 1.5 : 0
                        }}
                      >
                        <Grid container spacing={1} textAlign="center">
                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", fontSize: "11px" }}>
                              Total
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary", fontSize: "13px" }}>
                              ₹{Number(bill.totalAmount).toLocaleString()}
                            </Typography>
                          </Grid>

                          <Grid item xs={4}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", fontSize: "11px" }}>
                              Advance
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: "info.main", fontSize: "13px" }}>
                              ₹{Number(bill.advance).toLocaleString()}
                            </Typography>
                          </Grid>

                          <Grid item xs={4}>
                            <Typography variant="caption" color="error.main" sx={{ fontWeight: 800, display: "block", fontSize: "11px" }}>
                              Balance Due
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: "error.main", fontSize: "14px" }}>
                              ₹{Number(bill.balanceAmount).toLocaleString()}
                            </Typography>
                          </Grid>
                        </Grid>
                      </Box>

                      {/* Remarks Callout */}
                      {bill.remarks && (
                        <Box
                          sx={{
                            p: 1.2,
                            mt: 1.5,
                            borderRadius: 2,
                            bgcolor: "rgba(148, 163, 184, 0.08)",
                            border: "1px solid rgba(148, 163, 184, 0.15)",
                            display: "flex",
                            gap: 1,
                            alignItems: "flex-start"
                          }}
                        >
                          <MessageSquare size={14} style={{ color: "#94a3b8", flexShrink: 0, marginTop: 2 }} />
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: "11.5px", lineHeight: 1.3 }}>
                            {bill.remarks}
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}

          {/* Card View Pagination */}
          <Box sx={{ mt: 3 }}>
            <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", width: "100%" }}>
              <TablePagination
                rowsPerPageOptions={[10, 25, 50]}
                component="div"
                count={totalCount}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(_, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Card>
          </Box>
        </Box>
      ) : (
        /* TABLE VIEW CONTAINER */
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
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          />
        </Card>
      )}
    </Box>
  );
};

export default PendingBills;

