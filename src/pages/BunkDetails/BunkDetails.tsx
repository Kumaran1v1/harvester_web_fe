import React, { useState, useEffect, useMemo } from "react";
import {
  Box, Card, Typography, Button, TextField, Paper, CircularProgress,
  IconButton, Tooltip, Grid, Chip, Divider, Dialog, DialogTitle,
  DialogContent, DialogActions
} from "@mui/material";
import { Fuel, Plus, Trash2, CheckCircle2, Clock, CalendarDays, ChevronLeft, ChevronRight, Wallet, DollarSign, ArrowRight } from "lucide-react";
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

  // Live Totals for Selected Date
  const totalPurchases = useMemo(() => activePurchases.reduce((sum, p) => sum + p.amount, 0), [activePurchases]);
  const totalPayments = useMemo(() => activePayments.reduce((sum, p) => sum + p.amount, 0), [activePayments]);
  const pendingBalance = Math.max(0, totalPurchases - totalPayments);
  const isFullyPaid = pendingBalance === 0;

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
    if (pendingBalance <= 0) return;
    setNewPaymentAmt(pendingBalance.toString());
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
              Single date daily refuel & payment settlement register.
            </Typography>
          </Box>
        </Box>

        {/* Date Selector Navigation Bar */}
        <Paper sx={{ p: 0.8, px: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, borderRadius: 3, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)" }}>
          <IconButton size="small" onClick={handlePrevDay}>
            <ChevronLeft size={20} />
          </IconButton>

          <Box display="flex" alignItems="center" gap={0.5}>
            <CalendarDays size={18} style={{ color: "#2dd4bf" }} />
            <TextField
              type="date"
              size="small"
              variant="standard"
              InputProps={{ disableUnderline: true, inputProps: { max: todayStr } }}
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              sx={{ input: { fontWeight: 800, fontSize: "0.88rem", color: "text.primary", cursor: "pointer", p: 0 } }}
            />
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

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" flexGrow={1} minHeight="50vh">
          <CircularProgress size={44} />
        </Box>
      ) : (
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
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(13, 148, 136, 0.08)", border: "1px solid rgba(13, 148, 136, 0.15)" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Total Diesel Purchased
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "text.primary", mt: 0.5, fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
                    ₹{totalPurchases.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Total Paid to Bunk
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: "#10b981", mt: 0.5, fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
                    ₹{totalPayments.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ p: 1.8, borderRadius: 2.5, bgcolor: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.15)" }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, fontSize: "11px" }}>
                    Pending Balance Due
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: pendingBalance > 0 ? "#f59e0b" : "#10b981", mt: 0.5, fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
                    ₹{pendingBalance.toLocaleString()}
                  </Typography>
                </Box>
              </Grid>
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
                  {pendingBalance > 0 && (
                    <Button size="small" variant="contained" color="success" onClick={handlePayFullBalance} sx={{ fontSize: "11px", fontWeight: 800, textTransform: "none", py: 0.3 }}>
                      Pay Full Balance (₹{pendingBalance.toLocaleString()})
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
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{pmt.time}</Typography>
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
                        inputProps={{ step: "any", min: "0" }}
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
                        disabled={saving}
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
      )}

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
