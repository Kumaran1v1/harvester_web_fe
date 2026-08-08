import React, { useState, useEffect, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Box, Card, Typography, Button, TextField, Paper, CircularProgress,
  IconButton, Tooltip, Grid, Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions, Tabs, Tab, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Collapse
} from "@mui/material";
import { Fuel, Plus, Trash2, CheckCircle2, Clock, CalendarDays, ChevronLeft, ChevronRight, Wallet, DollarSign, ArrowRight, FileDown, History, TrendingDown, TrendingUp, ChevronDown, ChevronUp } from "lucide-react";
import html2pdf from "html2pdf.js";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";

interface PurchaseItem {
  id: string;
  amount: number;
  time: string;
}

interface PaymentItem {
  id: string;
  amount: number;
  time: string;
  remarks?: string;
}

interface FuelRecord {
  id: number;
  date: string;
  fuelAmount: number;
  paidAmount: number;
  balance: number;
  paymentStatus: "PAID" | "PENDING";
  purchasesJson?: string | null;
  paymentsJson?: string | null;
}

export const BunkDetails: React.FC = () => {
  const dispatch = useDispatch();
  const [records, setRecords] = useState<FuelRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const getCurrentTimeString = () => {
    return new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
  };

  // Form Inputs for Adding a Purchase
  const [newPurchaseAmt, setNewPurchaseAmt] = useState("");
  const [newPurchaseTime, setNewPurchaseTime] = useState(getCurrentTimeString());

  // Form Inputs for Adding a Payment
  const [newPaymentAmt, setNewPaymentAmt] = useState("");
  const [newPaymentTime, setNewPaymentTime] = useState(getCurrentTimeString());



  // PDF Report modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportFromDate, setReportFromDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [reportToDate, setReportToDate] = useState(todayStr);

  const fetchRecords = async () => {
    try {
      const res = await fetch("/api/bunk-details");
      if (!res.ok) throw new Error("Failed to load fuel purchase records");
      const data: FuelRecord[] = await res.json();
      setRecords(data);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching bunk records", severity: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // Find record for the currently selected date
  const activeRecord = useMemo(() => {
    return records.find(r => new Date(r.date).toISOString().split("T")[0] === selectedDate) || null;
  }, [records, selectedDate]);

  // Parsed Itemized Purchases for Active Record
  const activePurchases: PurchaseItem[] = useMemo(() => {
    if (!activeRecord) return [];
    if (activeRecord.purchasesJson) {
      try { return JSON.parse(activeRecord.purchasesJson); } catch (e) {}
    }
    if (Number(activeRecord.fuelAmount) > 0) {
      return [{ id: "1", amount: Number(activeRecord.fuelAmount), time: "09:00 AM" }];
    }
    return [];
  }, [activeRecord]);

  // Parsed Itemized Payments for Active Record
  const activePayments: PaymentItem[] = useMemo(() => {
    if (!activeRecord) return [];
    if (activeRecord.paymentsJson) {
      try { return JSON.parse(activeRecord.paymentsJson); } catch (e) {}
    }
    if (activeRecord.paymentStatus === "PAID" && Number(activeRecord.paidAmount || activeRecord.fuelAmount) > 0) {
      return [{ id: "1", amount: Number(activeRecord.paidAmount || activeRecord.fuelAmount), time: "06:00 PM" }];
    }
    return [];
  }, [activeRecord]);

  // Live Totals across all history
  const totalPurchasesOverall = useMemo(() => records.reduce((sum, r) => sum + Number(r.fuelAmount || 0), 0), [records]);
  const totalPaymentsOverall = useMemo(() => records.reduce((sum, r) => sum + Number(r.paidAmount || 0), 0), [records]);
  const overallPendingBalance = useMemo(() => Math.max(0, totalPurchasesOverall - totalPaymentsOverall), [totalPurchasesOverall, totalPaymentsOverall]);

  // Live Totals for Selected Date
  const totalPurchases = useMemo(() => activePurchases.reduce((sum, p) => sum + p.amount, 0), [activePurchases]);
  const totalPayments = useMemo(() => activePayments.reduce((sum, p) => sum + p.amount, 0), [activePayments]);
  const pendingBalance = Math.max(0, totalPurchases - totalPayments);
  const isFullyPaid = pendingBalance === 0;

  // Chronological FIFO Status & Balance Resolution for every record
  const recordsWithFifoMap = useMemo(() => {
    const sortedAsc = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let remainingPaymentPool = totalPaymentsOverall;

    const resultMap = new Map<number, { fifoCovered: number; fifoBalance: number; fifoStatus: "PAID" | "PENDING" }>();

    for (const r of sortedAsc) {
      const fuel = Number(r.fuelAmount || 0);
      const covered = Math.min(fuel, remainingPaymentPool);
      remainingPaymentPool -= covered;
      const fifoBalance = Math.max(0, fuel - covered);
      const fifoStatus = fifoBalance === 0 ? "PAID" : "PENDING";
      resultMap.set(r.id, { fifoCovered: covered, fifoBalance, fifoStatus });
    }

    return resultMap;
  }, [records, totalPaymentsOverall]);

  // Active view: "daily" | "history"
  const [activeView, setActiveView] = useState<"daily" | "history">("daily");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // History search filter
  const [historySearch, setHistorySearch] = useState("");

  // Sorted all records desc for history tab
  const sortedHistoryRecords = useMemo(() => {
    const sorted = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!historySearch.trim()) return sorted;
    const q = historySearch.toLowerCase();
    return sorted.filter(r => new Date(r.date).toLocaleDateString("en-IN").includes(q) || r.balance.toString().includes(q));
  }, [records, historySearch]);

  // Overall stats across all history
  const historyTotals = useMemo(() => {
    let pendingCount = 0;
    let paidCount = 0;
    records.forEach(r => {
      const fifo = recordsWithFifoMap.get(r.id);
      if (fifo && fifo.fifoBalance > 0) {
        pendingCount++;
      } else {
        paidCount++;
      }
    });

    return {
      totalPurchased: totalPurchasesOverall,
      totalPaid: totalPaymentsOverall,
      pendingCount,
      paidCount,
    };
  }, [records, totalPurchasesOverall, totalPaymentsOverall, recordsWithFifoMap]);

  // Save / Sync Record Helper
  const syncRecord = async (updatedPurchases: PurchaseItem[], updatedPayments: PaymentItem[]) => {
    const calcPurchases = updatedPurchases.reduce((sum, p) => sum + p.amount, 0);
    const calcPayments = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const calcBalance = Math.max(0, calcPurchases - calcPayments);

    const payload = {
      date: selectedDate,
      fuelAmount: calcPurchases,
      paidAmount: calcPayments,
      balance: calcBalance,
      paymentStatus: calcBalance === 0 ? "PAID" : "PENDING",
      purchasesJson: JSON.stringify(updatedPurchases),
      paymentsJson: JSON.stringify(updatedPayments)
    };

    setSaving(true);
    try {
      const res = await fetch("/api/bunk-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update daily bunk sheet");

      setRecords(prev => {
        const dStr = new Date(data.date).toISOString().split("T")[0];
        const filtered = prev.filter(r => new Date(r.date).toISOString().split("T")[0] !== dStr);
        return [data, ...filtered];
      });
      dispatch(showToast({ message: "Bunk sheet updated!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error updating record", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Add a Diesel Purchase Entry
  const handleAddPurchase = () => {
    const val = parseFloat(newPurchaseAmt);
    if (isNaN(val) || val <= 0) {
      dispatch(showToast({ message: "Please enter a valid purchase amount", severity: "error" }));
      return;
    }
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      amount: val,
      time: newPurchaseTime.trim() || getCurrentTimeString()
    };
    const updated = [...activePurchases, newItem];
    syncRecord(updated, activePayments);
    setNewPurchaseAmt("");
    setNewPurchaseTime(getCurrentTimeString());
  };

  // Delete Entry Confirmation Modal State
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    type: "purchase" | "payment" | null;
    id: string | null;
    amount: number;
    time: string;
  }>({ open: false, type: null, id: null, amount: 0, time: "" });

  const promptDeletePurchase = (p: PurchaseItem) => {
    setDeleteModal({
      open: true,
      type: "purchase",
      id: p.id,
      amount: p.amount,
      time: p.time
    });
  };

  const promptDeletePayment = (pmt: PaymentItem) => {
    setDeleteModal({
      open: true,
      type: "payment",
      id: pmt.id,
      amount: pmt.amount,
      time: pmt.time
    });
  };

  const handleConfirmDeleteEntry = () => {
    if (!deleteModal.id || !deleteModal.type) return;
    if (deleteModal.type === "purchase") {
      const updated = activePurchases.filter(p => p.id !== deleteModal.id);
      syncRecord(updated, activePayments);
    } else if (deleteModal.type === "payment") {
      const updated = activePayments.filter(p => p.id !== deleteModal.id);
      syncRecord(activePurchases, updated);
    }
    setDeleteModal({ open: false, type: null, id: null, amount: 0, time: "" });
  };

  // Add a Bunk Payment Entry
  const handleAddPayment = () => {
    const val = parseFloat(newPaymentAmt);
    if (isNaN(val) || val <= 0) {
      dispatch(showToast({ message: "Please enter a valid payment amount", severity: "error" }));
      return;
    }
    if (overallPendingBalance <= 0) {
      dispatch(showToast({ message: "No pending debt to pay! Overall pending balance is ₹0.", severity: "error" }));
      return;
    }
    if (val > overallPendingBalance) {
      dispatch(showToast({
        message: `Payment amount (₹${val.toLocaleString()}) cannot exceed overall pending balance of ₹${overallPendingBalance.toLocaleString()}`,
        severity: "error"
      }));
      return;
    }
    const newItem: PaymentItem = {
      id: Date.now().toString(),
      amount: val,
      time: newPaymentTime.trim() || getCurrentTimeString()
    };
    const updated = [...activePayments, newItem];
    syncRecord(activePurchases, updated);
    setNewPaymentAmt("");
    setNewPaymentTime(getCurrentTimeString());
  };

  // Fill Full Balance Shortcut
  const handlePayFullBalance = () => {
    if (overallPendingBalance <= 0) return;
    setNewPaymentAmt(overallPendingBalance.toString());
  };

  const handleDownloadReport = () => {
    // Filter and sort records in date range
    const filteredRecords = records
      .filter((r) => {
        const rDateStr = new Date(r.date).toISOString().split("T")[0];
        return rDateStr >= reportFromDate && rDateStr <= reportToDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (filteredRecords.length === 0) {
      dispatch(showToast({ message: "No records found in selected date range.", severity: "warning" }));
      return;
    }

    // Calculate summary stats
    let totalPurchased = 0;
    let totalPaid = 0;

    const tableRows = filteredRecords.map((r) => {
      totalPurchased += Number(r.fuelAmount || 0);
      totalPaid += Number(r.paidAmount || 0);

      const dateStr = new Date(r.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      
      // Purchases JSON parsing
      let purchases: PurchaseItem[] = [];
      if (r.purchasesJson) {
        try { purchases = JSON.parse(r.purchasesJson); } catch (e) {}
      }
      let purchasesStr = "";
      if (purchases.length > 0) {
        const listStr = purchases.map(p => `₹${p.amount.toLocaleString()} (${p.time})`).join("<br/>");
        if (purchases.length >= 2) {
          const sum = purchases.reduce((s, p) => s + p.amount, 0);
          purchasesStr = `${listStr}<div style="border-top:1px dashed #cbd5e1;margin-top:4px;padding-top:2px;font-weight:700;font-size:11px;color:#475569;">Total: ₹${sum.toLocaleString()}</div>`;
        } else {
          purchasesStr = listStr;
        }
      } else {
        purchasesStr = `₹${Number(r.fuelAmount || 0).toLocaleString()}`;
      }

      // Payments JSON parsing
      let payments: (PaymentItem & { remarks?: string })[] = [];
      if (r.paymentsJson) {
        try { payments = JSON.parse(r.paymentsJson); } catch (e) {}
      }
      let paymentsStr = "";
      if (payments.length > 0) {
        const listStr = payments.map(p => `₹${p.amount.toLocaleString()} (${p.time})`).join("<br/>");
        if (payments.length >= 2) {
          const sum = payments.reduce((s, p) => s + p.amount, 0);
          paymentsStr = `${listStr}<div style="border-top:1px dashed #cbd5e1;margin-top:4px;padding-top:2px;font-weight:700;font-size:11px;color:#16a34a;">Total: ₹${sum.toLocaleString()}</div>`;
        } else {
          paymentsStr = listStr;
        }
      } else {
        paymentsStr = Number(r.paidAmount || 0) > 0 ? `₹${Number(r.paidAmount || 0).toLocaleString()}` : "—";
      }

      return `
        <tr style="border-bottom:1px solid #e2e8f0; font-size:12px;">
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;font-weight:600;">${dateStr}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">${purchasesStr}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;vertical-align:top;line-height:1.5;">${paymentsStr}</td>
        </tr>
      `;
    }).join("");

    const totalPending = Math.max(0, totalPurchased - totalPaid);
    const fromDateFormatted = new Date(reportFromDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const toDateFormatted = new Date(reportToDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

    const html = `
      <div style="font-family:'Inter',Arial,sans-serif;padding:32px;max-width:800px;margin:auto;color:#1e293b;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;border-bottom:2px solid #e2e8f0;padding-bottom:16px;">
          <div>
            <h1 style="margin:0;font-size:22px;font-weight:900;color:#0f172a;letter-spacing:-0.5px;">Bunk Refuel & Payment Statement</h1>
            <p style="margin:6px 0 0;color:#64748b;font-size:13px;font-weight:600;">Date Range: ${fromDateFormatted} to ${toDateFormatted}</p>
          </div>
          <div style="text-align:right;">
            <p style="margin:0;color:#64748b;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-weight:700;">Generated On</p>
            <strong style="font-size:13px;color:#0f172a;">${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</strong>
          </div>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:32px;">
          <div style="flex:1;background:#eff6ff;border-radius:8px;padding:14px;border:1px solid #dbeafe;text-align:center;">
            <div style="font-size:10px;color:#2563eb;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Total Purchases</div>
            <div style="font-size:22px;font-weight:900;color:#1e40af;margin-top:4px;">₹${totalPurchased.toLocaleString()}</div>
          </div>
          <div style="flex:1;background:#f0fdf4;border-radius:8px;padding:14px;border:1px solid #dcfce7;text-align:center;">
            <div style="font-size:10px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Total Paid to Bunk</div>
            <div style="font-size:22px;font-weight:900;color:#14532d;margin-top:4px;">₹${totalPaid.toLocaleString()}</div>
          </div>
          <div style="flex:1;background:#fef2f2;border-radius:8px;padding:14px;border:1px solid #fee2e2;text-align:center;">
            <div style="font-size:10px;color:#dc2626;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">Overall Pending</div>
            <div style="font-size:22px;font-weight:900;color:#7f1d1d;margin-top:4px;">₹${totalPending.toLocaleString()}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:20px;">
          <thead>
            <tr style="background:#f8fafc;border-bottom:2px solid #cbd5e1;">
              <th style="padding:12px 10px;text-align:left;font-size:11px;color:#475569;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;width:20%;">Date</th>
              <th style="padding:12px 10px;text-align:left;font-size:11px;color:#475569;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Diesel Purchases</th>
              <th style="padding:12px 10px;text-align:left;font-size:11px;color:#475569;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;width:40%;">Payments History</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </div>
    `;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    html2pdf()
      .set({
        margin: 10,
        filename: `Bunk_Statement_${reportFromDate}_to_${reportToDate}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(container)
      .save()
      .then(() => {
        document.body.removeChild(container);
        setIsReportModalOpen(false);
      });
  };



  // Date Shift Handlers
  const handleDateChange = (newDateStr: string) => {
    if (newDateStr > todayStr) {
      dispatch(showToast({ message: "Cannot select a future date.", severity: "warning" }));
      return;
    }
    setSelectedDate(newDateStr);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    const nextStr = d.toISOString().split("T")[0];
    if (nextStr > todayStr) {
      dispatch(showToast({ message: "Cannot navigate to future date.", severity: "warning" }));
      return;
    }
    setSelectedDate(nextStr);
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: "auto", display: "flex", flexDirection: "column", gap: { xs: 2, sm: 3 }, pb: 4 }}>
      {/* Header & Date Controller Navigation */}
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Fuel style={{ color: "#0d9488", width: 28, height: 28 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              Daily Bunk Register Sheet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
              Single date daily refuel & payment settlement register or overall day-by-day history.
            </Typography>
          </Box>
        </Box>

        {/* View Mode Navigation Tabs & Action Buttons */}
        <Box display="flex" alignItems="center" gap={1.5} sx={{ alignSelf: { xs: "stretch", sm: "auto" }, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" }, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" } }}>
          <Tabs
            value={activeView}
            onChange={(e, val) => setActiveView(val)}
            variant="fullWidth"
            sx={{
              minHeight: 40,
              bgcolor: "background.paper",
              borderRadius: 3,
              p: 0.5,
              width: { xs: "100%", sm: "auto" },
              border: "1px solid rgba(255,255,255,0.08)",
              "& .MuiTab-root": { minHeight: 36, py: 0.5, px: { xs: 1, sm: 2 }, borderRadius: 2, fontWeight: 800, fontSize: { xs: "0.75rem", sm: "0.82rem" }, textTransform: "none" }
            }}
          >
            <Tab value="daily" label="Daily Register" icon={<CalendarDays size={16} />} iconPosition="start" />
            <Tab value="history" label={`History (${records.length})`} icon={<History size={16} />} iconPosition="start" />
          </Tabs>

          <Button
            variant="outlined"
            color="primary"
            startIcon={<FileDown size={18} />}
            onClick={() => setIsReportModalOpen(true)}
            sx={{ fontWeight: 805, borderRadius: 3, py: 0.9, px: 2, textTransform: "none", fontSize: "0.85rem", width: { xs: "100%", sm: "auto" } }}
          >
            PDF Report
          </Button>
        </Box>
      </Box>

      {/* Date Navigator Header - Shown only in Daily View */}
      {activeView === "daily" && (
        <Box display="flex" justifyContent="flex-end">
          <Paper sx={{ p: 0.8, px: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderRadius: 3, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)", width: { xs: "100%", sm: "auto" } }}>
            <IconButton size="small" onClick={handlePrevDay}>
              <ChevronLeft size={20} />
            </IconButton>

            <Box display="flex" alignItems="center" gap={0.5}>
              <CalendarDays size={18} style={{ color: "#2dd4bf" }} />
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  value={dayjs(selectedDate)}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleDateChange(newValue.format("YYYY-MM-DD"));
                    }
                  }}
                  maxDate={dayjs(todayStr)}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      variant: "standard",
                      InputProps: { disableUnderline: true },
                      sx: {
                        input: {
                          fontWeight: 800,
                          fontSize: "0.88rem",
                          color: "text.primary",
                          cursor: "pointer",
                          p: 0,
                          width: 95
                        }
                      }
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>

            <IconButton size="small" onClick={handleNextDay} disabled={selectedDate >= todayStr}>
              <ChevronRight size={20} />
            </IconButton>

            {selectedDate !== todayStr && (
              <Button size="small" variant="outlined" color="primary" onClick={() => setSelectedDate(todayStr)} sx={{ py: 0.2, px: 1, fontSize: "10px", fontWeight: 700, minWidth: "auto" }}>
                Today
              </Button>
            )}
          </Paper>
        </Box>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1} minHeight="50vh">
          <CircularProgress size={44} />
        </Box>
      ) : activeView === "daily" ? (
        /* MAIN PAGE BANNER CARD FOR SELECTED DATE */
        <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 3.5, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "background.paper", boxShadow: "0 12px 40px rgba(0,0,0,0.3)", flexGrow: 1, display: "flex", flexDirection: "column", gap: 2.5 }}>
          {/* Banner Top Header & Live Stats Bar */}
          <Box sx={{ p: { xs: 2, sm: 2.5 }, borderRadius: 3, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  label={new Date(selectedDate).toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
                  sx={{ fontWeight: 800, fontSize: "0.8rem", bgcolor: "rgba(13, 148, 136, 0.15)", color: "#2dd4bf", py: 1.5 }}
                />
                {selectedDate === todayStr && (
                  <Chip label="TODAY" color="primary" size="small" sx={{ fontWeight: 900, fontSize: "9px" }} />
                )}
              </Box>

              <Chip
                label={isFullyPaid ? "FULLY PAID" : `PENDING CREDIT ₹${pendingBalance.toLocaleString()}`}
                color={isFullyPaid ? "success" : "warning"}
                sx={{ fontWeight: 900, fontSize: "0.8rem", py: 1.5 }}
              />
            </Box>

            {/* Stats Row Banner */}
            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={3}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.15)", minHeight: "96px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                      Overall Pending Balance
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, mt: 0.5, color: "#ef4444", fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                      ₹{overallPendingBalance.toLocaleString()}
                    </Typography>
                  </Box>
                  {/* {overallPendingBalance > 0 && (
                    <Button
                      variant="contained"
                      color="error"
                      size="small"
                      onClick={() => setIsBulkPaymentOpen(true)}
                      sx={{ mt: 1, py: 0.2, fontSize: "10px", fontWeight: 800, textTransform: "none", width: "100%" }}
                    >
                      Clear Debt (FIFO)
                    </Button>
                  )} */}
                </Box>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(13, 148, 136, 0.08)", border: "1px solid rgba(13, 148, 136, 0.15)", minHeight: "96px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Total Diesel Purchased Today
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                    ₹{totalPurchases.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              {/* <Grid item xs={12} sm={3}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)", minHeight: "96px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Total Paid to Bunk
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#10b981", mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                    ₹{totalPayments.toLocaleString()}
                  </Typography>
                </Box>
              </Grid> */}
              {/* <Grid item xs={12} sm={3}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.15)", minHeight: "96px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Pending Balance Due
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: pendingBalance > 0 ? "#f59e0b" : "#10b981", mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                    ₹{pendingBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Grid> */}
            </Grid>
          </Box>

          {/* TWO MAIN CARDS SIDE-BY-SIDE: DIESEL PURCHASES & PAYMENTS */}
          <Grid container spacing={3} sx={{ flexGrow: 1 }}>
            {/* PANEL 1: DIESEL PURCHASES */}
            <Grid item xs={12} md={6} display="flex" flexDirection="column">
              <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(13, 148, 136, 0.2)", bgcolor: "rgba(13, 148, 136, 0.03)", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#2dd4bf", display: "flex", alignItems: "center", gap: 1 }}>
                    <Fuel size={20} /> 1. Diesel Refuels Today
                  </Typography>
                  <Chip label={`${activePurchases.length} entries`} size="small" variant="outlined" sx={{ fontWeight: 700 }} />
                </Box>

                {/* Purchases List */}
                <Box sx={{ flexGrow: 1, mb: 2, maxHeight: 280, overflowY: "auto" }}>
                  {activePurchases.length === 0 ? (
                    <Box py={4} textAlign="center">
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        No diesel purchases logged for this date yet. Use the inputs below to add a refuel entry.
                      </Typography>
                    </Box>
                  ) : (
                    activePurchases.map((p) => (
                      <Box key={p.id} display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, px: 2, mb: 1.2, borderRadius: 2.5, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.06)" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Clock size={16} style={{ color: "#94a3b8" }} />
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{p.time}</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "text.primary" }}>
                            ₹{p.amount.toLocaleString()}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => promptDeletePurchase(p)} disabled={saving}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Add Purchase Quick Row */}
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: "1px dashed rgba(13, 148, 136, 0.4)" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, mb: 1 }}>
                    + Add New Refuel Amount (₹)
                  </Typography>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={6}>
                      <TextField
                        label="Amount (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="e.g. 5000"
                        value={newPurchaseAmt}
                        onChange={(e) => setNewPurchaseAmt(e.target.value)}
                        inputProps={{ step: "any", min: "0" }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Entry Time"
                        type="text"
                        size="small"
                        fullWidth
                        placeholder="e.g. 10:30 AM"
                        value={newPurchaseTime}
                        onChange={(e) => setNewPurchaseTime(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        startIcon={<Plus size={16} />}
                        onClick={handleAddPurchase}
                        disabled={saving}
                        sx={{ fontWeight: 800, py: 1 }}
                      >
                        {saving ? "Saving..." : "Add Diesel Entry"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>

            {/* PANEL 2: PAYMENTS PAID TO BUNK */}
            <Grid item xs={12} md={6} display="flex" flexDirection="column">
              <Card sx={{ p: 2.5, borderRadius: 3, border: "1px solid rgba(16, 185, 129, 0.2)", bgcolor: "rgba(16, 185, 129, 0.03)", flexGrow: 1, display: "flex", flexDirection: "column" }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#10b981", display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircle2 size={20} /> 2. Payments Paid to Bunk
                  </Typography>
                  {overallPendingBalance > 0 && (
                    <Button size="small" variant="contained" color="success" onClick={handlePayFullBalance} sx={{ fontSize: "11px", fontWeight: 800, textTransform: "none", py: 0.3 }}>
                      Pay Overall Pending Debt (₹{overallPendingBalance.toLocaleString()})
                    </Button>
                  )}
                </Box>

                {/* Payments List */}
                <Box sx={{ flexGrow: 1, mb: 2, maxHeight: 280, overflowY: "auto" }}>
                  {activePayments.length === 0 ? (
                    <Box py={4} textAlign="center">
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                        No payments recorded for this date yet. Record a payment below when paid to bunk.
                      </Typography>
                    </Box>
                  ) : (
                    activePayments.map((pmt) => (
                      <Box key={pmt.id} display="flex" justifyContent="space-between" alignItems="center" sx={{ p: 1.5, px: 2, mb: 1.2, borderRadius: 2.5, bgcolor: "background.paper", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                        <Box display="flex" alignItems="center" gap={1.5}>
                          <Clock size={16} style={{ color: "#10b981" }} />
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>{pmt.time}</Typography>
                            {pmt.remarks && (
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "10px", mt: 0.2, fontWeight: 600 }}>
                                {pmt.remarks}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#10b981" }}>
                            ₹{pmt.amount.toLocaleString()}
                          </Typography>
                          <IconButton size="small" color="error" onClick={() => promptDeletePayment(pmt)} disabled={saving}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>

                {/* Add Payment Quick Row */}
                <Box sx={{ p: 2, borderRadius: 3, bgcolor: "background.paper", border: "1px dashed rgba(16, 185, 129, 0.4)" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, mb: 1 }}>
                    + Payment Paid to Bunk (₹)
                  </Typography>
                  <Grid container spacing={1.5} alignItems="center">
                    <Grid item xs={6}>
                      <TextField
                        label="Paid Amount (₹)"
                        type="number"
                        size="small"
                        fullWidth
                        placeholder="e.g. 5000"
                        value={newPaymentAmt}
                        onChange={(e) => setNewPaymentAmt(e.target.value)}
                        error={Boolean(newPaymentAmt && (parseFloat(newPaymentAmt) > overallPendingBalance || parseFloat(newPaymentAmt) <= 0))}
                        helperText={
                          newPaymentAmt && parseFloat(newPaymentAmt) > overallPendingBalance
                            ? `Cannot exceed overall debt ₹${overallPendingBalance.toLocaleString()}`
                            : `Max allowed: ₹${overallPendingBalance.toLocaleString()}`
                        }
                        inputProps={{ step: "any", min: "0", max: overallPendingBalance }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Payment Time"
                        type="text"
                        size="small"
                        fullWidth
                        placeholder="e.g. 06:00 PM"
                        value={newPaymentTime}
                        onChange={(e) => setNewPaymentTime(e.target.value)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<Plus size={16} />}
                        onClick={handleAddPayment}
                        disabled={saving || overallPendingBalance <= 0 || Boolean(newPaymentAmt && parseFloat(newPaymentAmt) > overallPendingBalance)}
                        sx={{ fontWeight: 800, py: 1 }}
                      >
                        {saving ? "Saving..." : "Payment Paid"}
                      </Button>
                    </Grid>
                  </Grid>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </Card>
      ) : (
        /* DAY-BY-DAY OVERALL HISTORY VIEW */
        <Box display="flex" flexDirection="column" gap={3}>
          {/* Summary Stat Cards */}
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
             <Grid item xs={6} sm={3}>
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: { xs: "9px", sm: "11px" } }}>
                  Pending Debt
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#ef4444", mt: 0.5, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  ₹{overallPendingBalance.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "rgba(13, 148, 136, 0.08)", border: "1px solid rgba(13, 148, 136, 0.2)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: { xs: "9px", sm: "11px" } }}>
                  Total Refuel
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#2dd4bf", mt: 0.5, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  ₹{historyTotals.totalPurchased.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: { xs: "9px", sm: "11px" } }}>
                  Total Paid
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#10b981", mt: 0.5, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  ₹{historyTotals.totalPaid.toLocaleString()}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 3, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: { xs: "9px", sm: "11px" } }}>
                  Bunk Days
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "text.primary", mt: 0.5, fontSize: { xs: "1rem", sm: "1.25rem" } }}>
                  {records.length} Days
                </Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Day-by-Day Interactive Table Card */}
          <Card sx={{ borderRadius: 3.5, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "background.paper", overflow: "hidden" }}>
            <Box p={2.5} display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} sx={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              <Box display="flex" alignItems="center" gap={1}>
                <History style={{ color: "#2dd4bf" }} size={22} />
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  Day-by-Day Bunk Register History
                </Typography>
              </Box>

              <TextField
                placeholder="Search date, amount..."
                size="small"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                sx={{ maxWidth: 300, width: "100%" }}
              />
            </Box>

            {/* Desktop Table View (md and up) */}
            <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: "rgba(255,255,255,0.02)" }}>
                    <TableCell sx={{ fontWeight: 700, width: 48 }}></TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Refuels (Purchased)</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Payments Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortedHistoryRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">
                          {historySearch ? "No matching history records found." : "No bunk records found."}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedHistoryRecords.map((r, idx) => {
                      const dStr = new Date(r.date).toISOString().split("T")[0];
                      const dateObj = new Date(r.date);
                      const formattedDate = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
                      const isExpanded = expandedRow === r.id;
                      const fifoInfo = recordsWithFifoMap.get(r.id) || { fifoBalance: Number(r.balance || 0), fifoStatus: r.paymentStatus };
                      const bal = fifoInfo.fifoBalance;
                      const isPaid = fifoInfo.fifoStatus === "PAID";

                      let purchases: PurchaseItem[] = [];
                      if (r.purchasesJson) {
                        try { purchases = JSON.parse(r.purchasesJson); } catch (e) {}
                      }
                      let payments: PaymentItem[] = [];
                      if (r.paymentsJson) {
                        try { payments = JSON.parse(r.paymentsJson); } catch (e) {}
                      }

                      return (
                        <React.Fragment key={r.id}>
                          <TableRow hover sx={{ "& > *": { borderBottom: "unset" } }}>
                            <TableCell>
                              <IconButton
                                aria-label="expand row"
                                size="small"
                                onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                              >
                                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </IconButton>
                            </TableCell>
                            <TableCell sx={{ color: "text.secondary", fontSize: "12px" }}>{idx + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 700 }}>{formattedDate}</TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: "text.primary" }}>
                                ₹{Number(r.fuelAmount || 0).toLocaleString()}
                              </Typography>
                              {purchases.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {purchases.length} refuel {purchases.length === 1 ? "entry" : "entries"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: "#10b981" }}>
                                ₹{Number(r.paidAmount || 0).toLocaleString()}
                              </Typography>
                              {payments.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  {payments.length} payment {payments.length === 1 ? "entry" : "entries"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={isPaid ? "PAID" : "PENDING"}
                                color={isPaid ? "success" : "warning"}
                                size="small"
                                sx={{ fontWeight: 900, fontSize: "10px" }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => {
                                  setSelectedDate(dStr);
                                  setActiveView("daily");
                                }}
                                sx={{ fontWeight: 700, fontSize: "11px", textTransform: "none", borderRadius: 2 }}
                              >
                                View / Edit Day
                              </Button>
                            </TableCell>
                          </TableRow>

                          {/* Collapsible Expanded Details */}
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
                              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2, p: 2, borderRadius: 2.5, bgcolor: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                                  <Typography variant="subtitle2" gutterBottom component="div" sx={{ fontWeight: 800, color: "#2dd4bf" }}>
                                    Detailed Breakdown for {formattedDate}
                                  </Typography>
                                  <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                                        Refuels Logged ({purchases.length})
                                      </Typography>
                                      {purchases.length === 0 ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>No entries logged</Typography>
                                      ) : (
                                        purchases.map(p => (
                                          <Box key={p.id} display="flex" justifyContent="space-between" sx={{ py: 0.5, borderBottom: "1px dashed rgba(255,255,255,0.06)" }}>
                                            <Typography variant="caption">{p.time}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700 }}>₹{p.amount.toLocaleString()}</Typography>
                                          </Box>
                                        ))
                                      )}
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", mb: 1 }}>
                                        Payments Logged ({payments.length})
                                      </Typography>
                                      {payments.length === 0 ? (
                                        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>No payments logged</Typography>
                                      ) : (
                                        payments.map(p => (
                                          <Box key={p.id} display="flex" justifyContent="space-between" sx={{ py: 0.5, borderBottom: "1px dashed rgba(255,255,255,0.06)" }}>
                                            <Typography variant="caption">{p.time} {p.remarks && !p.remarks.includes("Bulk Payment") ? `(${p.remarks})` : ""}</Typography>
                                            <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>₹{p.amount.toLocaleString()}</Typography>
                                          </Box>
                                        ))
                                      )}
                                    </Grid>
                                  </Grid>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Mobile Card List View (xs to md screens) */}
            <Box sx={{ display: { xs: "flex", md: "none" }, flexDirection: "column", gap: 1.5, p: 1.5 }}>
              {sortedHistoryRecords.length === 0 ? (
                <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                  {historySearch ? "No matching records found." : "No bunk records found."}
                </Typography>
              ) : (
                sortedHistoryRecords.map((r, idx) => {
                  const dStr = new Date(r.date).toISOString().split("T")[0];
                  const dateObj = new Date(r.date);
                  const formattedDate = dateObj.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
                  const isExpanded = expandedRow === r.id;
                  const fifoInfo = recordsWithFifoMap.get(r.id) || { fifoBalance: Number(r.balance || 0), fifoStatus: r.paymentStatus };
                  const bal = fifoInfo.fifoBalance;
                  const isPaid = fifoInfo.fifoStatus === "PAID";

                  let purchases: PurchaseItem[] = [];
                  if (r.purchasesJson) { try { purchases = JSON.parse(r.purchasesJson); } catch (e) {} }
                  let payments: PaymentItem[] = [];
                  if (r.paymentsJson) { try { payments = JSON.parse(r.paymentsJson); } catch (e) {} }

                  return (
                    <Card
                      key={r.id}
                      sx={{
                        borderRadius: 3,
                        p: 1.8,
                        border: "1px solid",
                        borderColor: !isPaid ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)",
                        bgcolor: "background.paper",
                        boxShadow: "0 4px 20px rgba(0,0,0,0.2)"
                      }}
                    >
                      {/* Card Header: Date & Status Chip */}
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "text.secondary", bgcolor: "rgba(255,255,255,0.06)", px: 0.8, py: 0.2, borderRadius: 1.5 }}>
                            #{idx + 1}
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, fontSize: "0.85rem" }}>
                            {formattedDate}
                          </Typography>
                        </Box>
                        <Chip
                          label={isPaid ? "PAID" : "PENDING"}
                          color={isPaid ? "success" : "warning"}
                          size="small"
                          sx={{ fontWeight: 900, fontSize: "9px" }}
                        />
                      </Box>

                      <Divider sx={{ my: 1, borderColor: "rgba(255,255,255,0.06)" }} />

                      {/* Grid Stats inside Mobile Card */}
                      <Grid container spacing={1} sx={{ my: 0.5 }}>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "9px", fontWeight: 700 }}>
                            Refuel
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "#2dd4bf", fontSize: "0.82rem" }}>
                            ₹{Number(r.fuelAmount || 0).toLocaleString()}
                          </Typography>
                        </Grid>

                        <Grid item xs={6}>
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: "9px", fontWeight: 700 }}>
                            Paid
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: "#10b981", fontSize: "0.82rem" }}>
                            ₹{Number(r.paidAmount || 0).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>

                      {/* Collapsible Breakdown if toggle clicked */}
                      {isExpanded && (
                        <Box sx={{ mt: 1.5, pt: 1.5, borderTop: "1px dashed rgba(255,255,255,0.1)", bgcolor: "rgba(255,255,255,0.02)", p: 1.5, borderRadius: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#2dd4bf", display: "block", mb: 0.8 }}>
                            Refuels Logged ({purchases.length})
                          </Typography>
                          {purchases.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: "italic", mb: 1 }}>No refuel entries</Typography>
                          ) : (
                            purchases.map(p => (
                              <Box key={p.id} display="flex" justifyContent="space-between" sx={{ py: 0.3 }}>
                                <Typography variant="caption">{p.time}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700 }}>₹{p.amount.toLocaleString()}</Typography>
                              </Box>
                            ))
                          )}

                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#10b981", display: "block", mt: 1, mb: 0.5 }}>
                            Payments Logged ({payments.length})
                          </Typography>
                          {payments.length === 0 ? (
                            <Typography variant="caption" color="text.secondary" display="block" sx={{ fontStyle: "italic" }}>No payment entries</Typography>
                          ) : (
                            payments.map(p => (
                              <Box key={p.id} display="flex" justifyContent="space-between" sx={{ py: 0.3 }}>
                                <Typography variant="caption">{p.time} {p.remarks && !p.remarks.includes("Bulk Payment") ? `(${p.remarks})` : ""}</Typography>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: "#10b981" }}>₹{p.amount.toLocaleString()}</Typography>
                              </Box>
                            ))
                          )}
                        </Box>
                      )}

                      {/* Action Row */}
                      <Box display="flex" gap={1} mt={1.5}>
                        <Button
                          size="small"
                          variant="outlined"
                          color="inherit"
                          onClick={() => setExpandedRow(isExpanded ? null : r.id)}
                          startIcon={isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          sx={{ flex: 1, fontSize: "11px", fontWeight: 700, textTransform: "none", borderRadius: 2 }}
                        >
                          {isExpanded ? "Hide" : "Details"}
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => {
                            setSelectedDate(dStr);
                            setActiveView("daily");
                          }}
                          sx={{ flex: 1, fontSize: "11px", fontWeight: 800, textTransform: "none", borderRadius: 2 }}
                        >
                          View / Edit Day
                        </Button>
                      </Box>
                    </Card>
                  );
                })
              )}
            </Box>
          </Card>
        </Box>
      )}

      {/* Date Range Report Selector Modal */}
      <Dialog open={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>
          Export Bunk Report
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, fontWeight: 500 }}>
            Choose a date range to generate and download the refuel and payment history statement report in PDF format.
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="From Date"
                  value={dayjs(reportFromDate)}
                  onChange={(newValue) => {
                    if (newValue) {
                      setReportFromDate(newValue.format("YYYY-MM-DD"));
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="To Date"
                  value={dayjs(reportToDate)}
                  onChange={(newValue) => {
                    if (newValue) {
                      setReportToDate(newValue.format("YYYY-MM-DD"));
                    }
                  }}
                  format="DD/MM/YYYY"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      size: "small"
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setIsReportModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDownloadReport} variant="contained" color="primary">
            Download PDF
          </Button>
        </DialogActions>
      </Dialog>


      {/* Delete Entry Confirmation Dialog Modal */}
      <Dialog open={deleteModal.open} onClose={() => setDeleteModal(prev => ({ ...prev, open: false }))} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800, color: "error.main" }}>
          Delete {deleteModal.type === "purchase" ? "Diesel Refuel" : "Bunk Payment"} Entry
        </DialogTitle>
        <DialogContent dividers sx={{ p: 3 }}>
          <Typography variant="body1">
            Are you sure you want to delete this {deleteModal.type === "purchase" ? "refuel entry" : "payment entry"} of <strong>₹{deleteModal.amount.toLocaleString()}</strong> at <strong>{deleteModal.time}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDeleteModal(prev => ({ ...prev, open: false }))} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDeleteEntry} variant="contained" color="error" disabled={saving}>
            {saving ? "Deleting..." : "Delete Entry"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BunkDetails;
