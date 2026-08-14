import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Box, Card, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper,
  IconButton, Tooltip, Grid, Checkbox, Chip, TablePagination, Tabs, Tab,
  ToggleButton, ToggleButtonGroup, Avatar, Divider, keyframes, CircularProgress
} from "@mui/material";
import {
  FileText, Plus, Edit, Search, History, Trash2, FileSpreadsheet,
  LayoutGrid, List, Calendar, MapPin, Phone, Clock, CreditCard, MessageSquare
} from "lucide-react";
import { exportBillsPDF, exportBillsExcel } from "../../utils/billsExport";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";
import { YouTubeTableSkeleton, YouTubeCardGridSkeleton, YouTubeSpinner } from "../../components/YouTubeSkeletonLoader";
import HarvesterModalLoader from "../../components/HarvesterModalLoader";

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
  status: number; // 0 = PENDING, 1 = COMPLETED
}

interface BillPayment {
  id: number;
  billId: number;
  amount: number;
  paymentDate: string;
  remarks: string | null;
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

const pulseDot = keyframes`
  0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(45, 212, 191, 0.7); }
  70% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 0 6px rgba(45, 212, 191, 0); }
  100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(45, 212, 191, 0); }
`;


const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export const Bills: React.FC = () => {
  const dispatch = useDispatch();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // View mode: "card" (default) or "table"
  const [viewType, setViewType] = useState<"card" | "table">("card");

  // Tab control: "CLASS" or "KARTAR"
  const [activeTab, setActiveTab] = useState<"CLASS" | "KARTAR">("KARTAR");


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

  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  
  // Selected items & lists
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");
  const [confirmType, setConfirmType] = useState<"STATUS" | "DELETE_BILL" | "DELETE_PAYMENT">("STATUS");
  const [confirmColor, setConfirmColor] = useState<"primary" | "error">("primary");
  const [confirmActionText, setConfirmActionText] = useState("Yes, Confirm");

  // Pending Actions Data
  const [pendingStatusToggle, setPendingStatusToggle] = useState<{ bill: Bill; newStatus: number } | null>(null);
  const [pendingDeleteBillId, setPendingDeleteBillId] = useState<number | null>(null);
  const [pendingDeletePaymentId, setPendingDeletePaymentId] = useState<number | null>(null);
  const [paymentsHistory, setPaymentsHistory] = useState<BillPayment[]>([]);

  const todayStr = new Date().toISOString().split("T")[0];

  // Forms states
  const [createForm, setCreateForm] = useState({
    date: todayStr,
    place: "",
    customerName: "",
    contactNumber: "",
    timeHours: "",
    totalAmount: "",
    advance: "",
    balance: "0",
    remarks: ""
  });

  const [editForm, setEditForm] = useState({
    date: todayStr,
    place: "",
    customerName: "",
    contactNumber: "",
    timeHours: "",
    totalAmount: "",
    advance: "",
    balance: "0",
    remarks: "",
    status: 0
  });

  const [paymentForm, setPaymentForm] = useState({
    amountReceived: "",
    remarks: ""
  });
  const [paymentCalculatedBalance, setPaymentCalculatedBalance] = useState(0);

  // Dynamic API base depending on selected machine tab
  const apiBase = activeTab === "CLASS" ? "/api/class-bills" : "/api/kartar-bills";

  // Label for period being viewed/exported
  const periodLabel = filterState.isOverall
    ? "All-Time"
    : `${MONTH_NAMES[filterState.month - 1]} ${filterState.year}`;

  const fetchBills = async () => {
    try {
      setLoading(true);
      let url = `${apiBase}?page=${page}&limit=${rowsPerPage}&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load bills");
      const data = await res.json();
      setBills(data.data);
      setTotalCount(data.total);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching bills", severity: "error" }));
    } finally {
      setLoading(false);
    }
  };

  // Company name for PDF header (from profile)
  const [companyName, setCompanyName] = useState("HARVESTER MANAGEMENT SYSTEM");
  useEffect(() => {
    fetch("/api/auth/profile").then(r => r.json()).then(d => {
      if (d.companyName) setCompanyName(d.companyName.toUpperCase());
    }).catch(() => {});
  }, []);

  // Re-fetch when page, rows per page, search, active tab, month or overall mode changes
  useEffect(() => {
    fetchBills();
  }, [page, rowsPerPage, searchQuery, activeTab, filterState]);

  // Export Loading States
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  // Handle export PDF
  const handleExportPDF = async () => {
    try {
      setExportingPdf(true);
      let url = `${apiBase}?limit=all&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" })); return;
      }
      await exportBillsPDF(data.data, activeTab, companyName, periodLabel);
      dispatch(showToast({ message: "PDF report downloaded successfully!", severity: "success" }));
    } catch (err: any) {
      if (err.message === "NO_DATA") dispatch(showToast({ message: "No records to export", severity: "warning" }));
      else dispatch(showToast({ message: err.message || "Failed to export PDF", severity: "error" }));
    } finally {
      setExportingPdf(false);
    }
  };

  // Handle export Excel
  const handleExportExcel = async () => {
    try {
      setExportingExcel(true);
      let url = `${apiBase}?limit=all&search=${encodeURIComponent(searchQuery)}`;
      if (!filterState.isOverall) {
        url += `&month=${filterState.month}&year=${filterState.year}`;
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to load data");
      const data = await res.json();
      if (!data.data || data.data.length === 0) {
        dispatch(showToast({ message: "No records to export", severity: "warning" })); return;
      }
      exportBillsExcel(data.data, activeTab, periodLabel);
      dispatch(showToast({ message: "Excel report downloaded successfully!", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Failed to export Excel", severity: "error" }));
    } finally {
      setExportingExcel(false);
    }
  };

  // Handle Tab Switch
  const handleTabChange = (event: React.SyntheticEvent, newValue: "CLASS" | "KARTAR") => {
    setActiveTab(newValue);
    setPage(0);
    setSearchQuery("");
  };

  // Open / Close Create
  const handleOpenCreate = () => {
    setCreateForm({
      date: todayStr,
      place: "",
      customerName: "",
      contactNumber: "",
      timeHours: "",
      totalAmount: "",
      advance: "",
      balance: "0",
      remarks: ""
    });
    setIsCreateOpen(true);
  };

  const handleCloseCreate = () => {
    setIsCreateOpen(false);
  };

  // Open / Close Edit
  const handleOpenEdit = (bill: Bill) => {
    setSelectedBill(bill);
    setEditForm({
      date: new Date(bill.date).toISOString().split("T")[0],
      place: bill.place,
      customerName: bill.customerName,
      contactNumber: bill.contactNumber,
      timeHours: bill.timeHours.toString(),
      totalAmount: bill.totalAmount.toString(),
      advance: bill.advance.toString(),
      balance: bill.balance.toString(),
      remarks: bill.remarks || "",
      status: bill.status
    });
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedBill(null);
  };

  // Open / Close Confirm Modal
  const handleCloseConfirm = () => {
    setIsConfirmOpen(false);
    setPendingStatusToggle(null);
    setPendingDeleteBillId(null);
    setPendingDeletePaymentId(null);
  };

  // Open / Close Payment Modal
  const handleOpenPayment = (bill: Bill) => {
    setSelectedBill(bill);
    setPaymentForm({
      amountReceived: "",
      remarks: ""
    });
    setPaymentCalculatedBalance(Number(bill.balance));
    setIsPaymentOpen(true);
  };

  const handleClosePayment = () => {
    setIsPaymentOpen(false);
    setSelectedBill(null);
  };

  // Open / Close History Modal
  const handleOpenHistory = async (bill: Bill) => {
    setSelectedBill(bill);
    setFetchingHistory(true);
    setIsHistoryOpen(true);
    try {
      const res = await fetch(`${apiBase}/${bill.id}/payments`);
      if (!res.ok) throw new Error("Failed to load payment history");
      const data = await res.json();
      setPaymentsHistory(data);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching history", severity: "error" }));
    } finally {
      setFetchingHistory(false);
    }
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedBill(null);
    setPaymentsHistory([]);
  };

  // Handle inputs changes with auto balance calculation (Balance = Total - Advance)
  const handleCreateChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCreateForm(prev => {
      let val = value;
      if (name === "contactNumber") {
        val = value.replace(/\D/g, "").slice(0, 10);
      }
      const next = { ...prev, [name]: val };
      if (name === "totalAmount" || name === "advance") {
        const tot = parseFloat(next.totalAmount || "0");
        const adv = parseFloat(next.advance || "0");
        next.balance = (tot - adv).toString();
      }
      return next;
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditForm(prev => {
      let val = value;
      if (name === "contactNumber") {
        val = value.replace(/\D/g, "").slice(0, 10);
      }
      const next = { ...prev, [name]: val };
      if (name === "totalAmount" || name === "advance") {
        const tot = parseFloat(next.totalAmount || "0");
        const adv = parseFloat(next.advance || "0");
        next.balance = (tot - adv).toString();
      }
      return next;
    });
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => {
      const next = { ...prev, [name]: value };
      if (name === "amountReceived" && selectedBill) {
        const received = parseFloat(value || "0");
        const newBal = Number(selectedBill.balance) - received;
        setPaymentCalculatedBalance(newBal >= 0 ? newBal : 0);
      }
      return next;
    });
  };

  // Submit Create
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (createForm.contactNumber.trim() && !/^\d{10}$/.test(createForm.contactNumber)) {
      dispatch(showToast({ message: "Contact number must be exactly 10 digits", severity: "error" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(apiBase, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create bill");

      // Refresh list to pull new record and count correctly
      fetchBills();
      dispatch(showToast({ message: "Bill created successfully!", severity: "success" }));
      handleCloseCreate();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error creating bill", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Submit Edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    if (editForm.contactNumber.trim() && !/^\d{10}$/.test(editForm.contactNumber)) {
      dispatch(showToast({ message: "Contact number must be exactly 10 digits", severity: "error" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${selectedBill.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update bill");

      // Update item locally to avoid layout reload flicker
      setBills(prev => prev.map(b => (b.id === selectedBill.id ? data : b)));
      dispatch(showToast({ message: "Bill updated successfully!", severity: "success" }));
      handleCloseEdit();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error updating bill", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Submit Payment Received (Logs detailed history in BillPayment)
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBill) return;
    const received = parseFloat(paymentForm.amountReceived || "0");
    if (isNaN(received) || received <= 0) {
      dispatch(showToast({ message: "Please enter a valid amount", severity: "error" }));
      return;
    }
    if (received > Number(selectedBill.balance)) {
      dispatch(showToast({ message: "Payment amount cannot exceed remaining balance", severity: "error" }));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${selectedBill.id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: received,
          remarks: paymentForm.remarks
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to record payment");

      setBills(prev => prev.map(b => (b.id === selectedBill.id ? data : b)));
      dispatch(showToast({ message: `Successfully recorded payment of ₹${received.toLocaleString()}`, severity: "success" }));
      handleClosePayment();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error recording payment", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Delete a specific payment transaction and reverse it in the bill data
  const handleDeletePayment = (paymentId: number) => {
    setPendingDeletePaymentId(paymentId);
    setConfirmTitle("Are you sure?");
    setConfirmMessage("Do you want to delete this payment record? This will increase the customer's remaining balance.");
    setConfirmType("DELETE_PAYMENT");
    setConfirmColor("error");
    setConfirmActionText("Yes, Delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDeletePayment = async () => {
    if (pendingDeletePaymentId === null || !selectedBill) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${selectedBill.id}/payments/${pendingDeletePaymentId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete payment record");

      // Update local history modal list
      setPaymentsHistory(prev => prev.filter(p => p.id !== pendingDeletePaymentId));

      // Sync backend bill update to the list table
      setBills(prev => prev.map(b => (b.id === selectedBill.id ? data : b)));

      // Sync backend bill details to the local selected bill view
      setSelectedBill(data);

      dispatch(showToast({ message: "Payment log deleted successfully!", severity: "success" }));
      handleCloseConfirm();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error deleting payment", severity: "error" }));
    } finally {
      setSaving(false);
      setPendingDeletePaymentId(null);
    }
  };

  // Delete a specific bill (deletes either Kartar or Class bill)
  const handleDeleteBill = (billId: number) => {
    setPendingDeleteBillId(billId);
    setConfirmTitle("Are you sure?");
    setConfirmMessage(`Do you want to permanently delete this ${activeTab === "KARTAR" ? "Kartar" : "Class"} Bill? This will also delete all of its payment history and cannot be undone.`);
    setConfirmType("DELETE_BILL");
    setConfirmColor("error");
    setConfirmActionText("Yes, Delete");
    setIsConfirmOpen(true);
  };

  const handleConfirmDeleteBill = async () => {
    if (pendingDeleteBillId === null) return;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${pendingDeleteBillId}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete bill");

      // Remove from list
      setBills(prev => prev.filter(b => b.id !== pendingDeleteBillId));

      dispatch(showToast({ message: "Bill deleted successfully!", severity: "success" }));
      handleCloseConfirm();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error deleting bill", severity: "error" }));
    } finally {
      setSaving(false);
      setPendingDeleteBillId(null);
    }
  };

  const handleStatusToggle = (bill: Bill) => {
    const newStatus = bill.status === 0 ? 1 : 0;
    const msg = newStatus === 1
      ? `Do you want to mark the bill of customer "${bill.customerName}" as Completed?`
      : `Do you want to change the status of customer "${bill.customerName}" back to Pending?`;
 
    setPendingStatusToggle({ bill, newStatus });
    setConfirmTitle("Are you sure?");
    setConfirmMessage(msg);
    setConfirmType("STATUS");
    setConfirmColor("primary");
    setConfirmActionText("Yes, Confirm");
    setIsConfirmOpen(true);
  };

  // Applies status update after confirmation inside modal
  const handleConfirmStatusToggle = async () => {
    if (!pendingStatusToggle) return;
    const { bill, newStatus } = pendingStatusToggle;
    setSaving(true);
    try {
      const res = await fetch(`${apiBase}/${bill.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to toggle status");

      setBills(prev => prev.map(b => (b.id === bill.id ? { ...b, status: newStatus } : b)));
      dispatch(showToast({
        message: `Status updated to ${newStatus === 1 ? "COMPLETED" : "PENDING"}`,
        severity: "success"
      }));
      handleCloseConfirm();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error toggling status", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSubmit = () => {
    if (confirmType === "STATUS") {
      handleConfirmStatusToggle();
    } else if (confirmType === "DELETE_BILL") {
      handleConfirmDeleteBill();
    } else if (confirmType === "DELETE_PAYMENT") {
      handleConfirmDeletePayment();
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: { xs: 1.5, sm: 2 } }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: "linear-gradient(90deg, #2dd4bf, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontSize: { xs: "1.2rem", sm: "1.5rem" }
            }}
          >
            <FileText style={{ color: "#0d9488" }} size={22} />
            Bills Registry
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: { xs: "none", sm: "block" }, mt: 0.3 }}>
            Log bills, track total amount, advance & balance payments, and manage pending statuses.
          </Typography>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          <Button
            variant="outlined"
            color="primary"
            disabled={exportingExcel}
            startIcon={exportingExcel ? <CircularProgress size={14} color="inherit" /> : <FileSpreadsheet size={15} />}
            onClick={handleExportExcel}
            sx={{ py: 0.6, px: { xs: 1.2, sm: 2 }, fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap", fontSize: { xs: "11px", sm: "13px" } }}
          >
            {exportingExcel ? "Exporting..." : "Excel"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={exportingPdf}
            startIcon={exportingPdf ? <CircularProgress size={14} color="inherit" /> : <FileText size={15} />}
            onClick={handleExportPDF}
            sx={{ py: 0.6, px: { xs: 1.2, sm: 2 }, fontWeight: 700, borderRadius: 2, whiteSpace: "nowrap", fontSize: { xs: "11px", sm: "13px" } }}
          >
            {exportingPdf ? "Exporting..." : "PDF"}
          </Button>
        </Box>
      </Box>

      {/* Tabs Navigation */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          mb: { xs: 1.5, sm: 2 },
          borderBottom: 1,
          borderColor: "divider",
          minHeight: { xs: 38, sm: 48 },
          "& .MuiTab-root": { fontWeight: 700, fontSize: { xs: "12px", sm: "14px" }, py: { xs: 0.8, sm: 1.5 }, minHeight: { xs: 38, sm: 48 } }
        }}
      >
        <Tab value="KARTAR" label="Kartar Bills" />
        <Tab value="CLASS" label="Class Bills" />
      </Tabs>

      {/* Action Bar: Combined Search (70%) & Create Button (30%) in one row + MonthFilterBar */}
      <Grid container spacing={1.5} alignItems="center" sx={{ mb: { xs: 1.5, sm: 2.5 } }}>
        <Grid item xs={12} md={7}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={8} sm={8}>
              <TextField
                placeholder="Search customer, place..."
                variant="outlined"
                size="small"
                fullWidth
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                InputProps={{
                  startAdornment: <Search size={16} style={{ marginRight: 6, color: "#94a3b8" }} />
                }}
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: 2,
                  "& .MuiOutlinedInput-root": { borderRadius: 2 }
                }}
              />
            </Grid>
            <Grid item xs={4} sm={4}>
              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<Plus size={15} />}
                onClick={handleOpenCreate}
                sx={{
                  py: 0.8,
                  px: { xs: 0.8, sm: 1.5 },
                  fontWeight: 800,
                  borderRadius: 2,
                  whiteSpace: "nowrap",
                  fontSize: { xs: "11px", sm: "13px" },
                  boxShadow: "0 4px 14px rgba(13, 148, 136, 0.35)",
                  "&:hover": { boxShadow: "0 6px 20px rgba(13, 148, 136, 0.5)" }
                }}
              >
                <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
                  {activeTab === "CLASS" ? "Create Class" : "Create Kartar"}
                </Box>
                <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
                  + Create
                </Box>
              </Button>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12} md={5}>
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

      {/* Main Content: Card View vs Table View */}
      {loading && bills.length === 0 ? (
        viewType === "card" ? <YouTubeCardGridSkeleton count={6} /> : <YouTubeTableSkeleton rows={6} columns={10} />
      ) : viewType === "card" ? (
        /* CARD VIEW CONTAINER */
        <Box>
          {bills.length === 0 ? (
            <Card sx={{ p: 6, textAlign: "center", borderRadius: 3, bgcolor: "background.paper", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Typography color="text.secondary" variant="body1" sx={{ fontWeight: 600 }}>
                {searchQuery ? "No matching records found." : "No bills found for this tab. Create a new bill to begin."}
              </Typography>
            </Card>
          ) : (
            <Grid container spacing={2.5}>
              {bills.map((bill, idx) => {
                const isCompleted = bill.status === 1;
                const balanceNum = Number(bill.balance || 0);

                return (
                  <Grid item xs={12} sm={6} lg={4} key={bill.id}>                    <Card
                      sx={{
                        borderRadius: 3.5,
                        bgcolor: "background.paper",
                        border: "1px solid",
                        borderColor: isCompleted ? "rgba(46, 125, 50, 0.3)" : "rgba(211, 47, 47, 0.3)",
                        overflow: "hidden",
                        position: "relative",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        height: "100%",
                        boxShadow: isCompleted
                          ? "0 6px 24px rgba(46, 125, 50, 0.08)"
                          : "0 6px 24px rgba(211, 47, 47, 0.08)",
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
                          boxShadow: isCompleted
                            ? "0 16px 36px rgba(46, 125, 50, 0.22), 0 0 16px rgba(46, 125, 50, 0.15)"
                            : "0 16px 36px rgba(211, 47, 47, 0.22), 0 0 16px rgba(211, 47, 47, 0.15)",
                          borderColor: isCompleted ? "success.main" : "error.main",
                          "&::after": {
                            left: "150%"
                          },
                          "& .avatar-icon": {
                            transform: "scale(1.1) rotate(6deg)"
                          },
                          "& .pay-btn": {
                            transform: "scale(1.04)"
                          }
                        },
                      }}
                    >
                      {/* Top Animated Shimmer Status Bar Indicator */}
                      <Box
                        sx={{
                          height: 4.5,
                          width: "100%",
                          background: isCompleted
                            ? "linear-gradient(90deg, #10b981, #34d399, #059669, #10b981)"
                            : "linear-gradient(90deg, #ef4444, #f87171, #dc2626, #ef4444)",
                          backgroundSize: "200% 100%",
                          animation: `${shimmerBar} 4s linear infinite`
                        }}
                      />

                      <Box sx={{ p: 2.5 }}>
                        {/* Header: Avatar, Name, Status & Checkbox */}
                        <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={1} sx={{ mb: 2 }}>
                          <Box display="flex" alignItems="center" gap={1.5} sx={{ minWidth: 0 }}>
                            <Avatar
                              className="avatar-icon"
                              sx={{
                                width: 44,
                                height: 44,
                                fontWeight: 800,
                                fontSize: "17px",
                                bgcolor: isCompleted ? "rgba(46, 125, 50, 0.15)" : "rgba(211, 47, 47, 0.15)",
                                color: isCompleted ? "success.main" : "error.main",
                                border: "2px solid",
                                borderColor: isCompleted ? "success.light" : "error.light",
                                transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                                flexShrink: 0
                              }}
                            >
                              {bill.customerName ? bill.customerName.charAt(0).toUpperCase() : "B"}
                            </Avatar>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography
                                variant="subtitle1"
                                sx={{
                                  fontWeight: 800,
                                  lineHeight: 1.2,
                                  color: isCompleted ? "success.main" : "text.primary",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {bill.customerName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                Entry #{page * rowsPerPage + idx + 1}
                              </Typography>
                            </Box>
                          </Box>

                          <Box display="flex" alignItems="center" gap={0.5} flexShrink={0}>
                            <Chip
                              label={isCompleted ? "COMPLETED" : "PENDING"}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                fontSize: "10px",
                                height: 22,
                                bgcolor: isCompleted ? "rgba(46, 125, 50, 0.12)" : "rgba(211, 47, 47, 0.12)",
                                color: isCompleted ? "success.main" : "error.main",
                                border: "1px solid",
                                borderColor: isCompleted ? "success.light" : "error.light"
                              }}
                            />
                            <Tooltip title={isCompleted ? "Mark as Pending" : "Mark as Completed"} arrow>
                              <Checkbox
                                checked={isCompleted}
                                onChange={() => handleStatusToggle(bill)}
                                color="success"
                                size="small"
                                sx={{ p: 0.5 }}
                              />
                            </Tooltip>
                          </Box>
                        </Box>

                        {/* Metadata Grid */}
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
                                {Number(bill.timeHours).toFixed(2)} hrs
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>

                        {/* Financial Box */}
                        <Box
                          sx={{
                            p: 1.8,
                            borderRadius: 2.5,
                            bgcolor: "rgba(255, 255, 255, 0.03)",
                            border: "1px solid rgba(255, 255, 255, 0.07)",
                            mb: bill.remarks ? 1.5 : 0,
                            transition: "all 0.25s ease",
                            "&:hover": {
                              bgcolor: "rgba(255, 255, 255, 0.06)",
                              borderColor: "rgba(255, 255, 255, 0.14)"
                            }
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
                              <Tooltip title="Click to record payment" arrow>
                                <Box
                                  onClick={() => handleOpenPayment(bill)}
                                  sx={{
                                    cursor: "pointer",
                                    borderRadius: 1.5,
                                    py: 0.2,
                                    px: 0.5,
                                    transition: "all 0.2s",
                                    "&:hover": { bgcolor: "rgba(255, 255, 255, 0.08)", transform: "scale(1.05)" }
                                  }}
                                >
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: "block", fontSize: "11px" }}>
                                    Balance
                                  </Typography>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 900,
                                      fontSize: "14px",
                                      color: balanceNum > 0 && !isCompleted ? "error.main" : "success.main",
                                    }}
                                  >
                                    ₹{balanceNum.toLocaleString()}
                                  </Typography>
                                </Box>
                              </Tooltip>
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

                      {/* Card Action Footer */}
                      <Box
                        sx={{
                          px: 2,
                          py: 1.2,
                          bgcolor: "rgba(0, 0, 0, 0.15)",
                          borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <Button
                          className="pay-btn"
                          variant="contained"
                          size="small"
                          color={balanceNum > 0 ? "primary" : "inherit"}
                          startIcon={<CreditCard size={14} />}
                          onClick={() => handleOpenPayment(bill)}
                          sx={{
                            fontWeight: 700,
                            fontSize: "11.5px",
                            py: 0.5,
                            px: 1.8,
                            borderRadius: 2,
                            textTransform: "none",
                            transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                            boxShadow: balanceNum > 0 ? "0 4px 14px rgba(13, 148, 136, 0.3)" : "none",
                            "&:hover": {
                              boxShadow: balanceNum > 0 ? "0 6px 20px rgba(13, 148, 136, 0.5)" : "none"
                            }
                          }}
                        >
                          {balanceNum > 0 ? "Pay" : "Payment"}
                        </Button>

                        <Box display="flex" gap={0.5}>
                          <Tooltip title="Payment History" arrow>
                            <IconButton size="small" color="info" onClick={() => handleOpenHistory(bill)}>
                              <History size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Edit Bill" arrow>
                            <IconButton size="small" color="primary" onClick={() => handleOpenEdit(bill)}>
                              <Edit size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete Bill" arrow>
                            <IconButton size="small" color="error" onClick={() => handleDeleteBill(bill.id)}>
                              <Trash2 size={16} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>
                    </Card>
                  </Grid>
                );
              })}
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
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, width: 52 }}>#</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Place</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Customer Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Time (Hours)</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Total Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Advance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Complete</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bills.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? "No matching records found." : "No bills found for this tab. Create a new bill to begin."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill, idx) => {
                    const isCompleted = bill.status === 1;
                    return (
                      <TableRow key={bill.id} hover>
                        <TableCell sx={{ color: "text.secondary", fontSize: "12px" }}>{page * rowsPerPage + idx + 1}</TableCell>
                        <TableCell>{new Date(bill.date).toLocaleDateString("en-IN")}</TableCell>
                        <TableCell>{bill.place}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: isCompleted ? "success.main" : "error.main" }}>
                          {bill.customerName}
                        </TableCell>
                        <TableCell>{bill.contactNumber}</TableCell>
                        <TableCell>{Number(bill.timeHours).toFixed(2)}</TableCell>
                        <TableCell>₹{Number(bill.totalAmount).toLocaleString()}</TableCell>
                        <TableCell>₹{Number(bill.advance).toLocaleString()}</TableCell>
                        <Tooltip title="Click to record payment" arrow>
                          <TableCell
                            onClick={() => handleOpenPayment(bill)}
                            sx={{
                              cursor: "pointer",
                              textDecoration: "underline",
                              textDecorationStyle: "dashed",
                              "&:hover": { color: "primary.main", bgcolor: "rgba(255,255,255,0.02)" },
                              color: bill.balance > 0 && !isCompleted ? "error.main" : "text.primary",
                              fontWeight: 700
                            }}
                          >
                            ₹{Number(bill.balance).toLocaleString()}
                          </TableCell>
                        </Tooltip>
                        <TableCell>
                          <Chip
                            label={isCompleted ? "COMPLETED" : "PENDING"}
                            size="small"
                            sx={{
                              fontWeight: 700,
                              bgcolor: isCompleted ? "rgba(46, 125, 50, 0.12)" : "rgba(211, 47, 47, 0.12)",
                              color: isCompleted ? "success.main" : "error.main",
                              border: "1px solid",
                              borderColor: isCompleted ? "success.light" : "error.light"
                            }}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Checkbox
                            checked={isCompleted}
                            onChange={() => handleStatusToggle(bill)}
                            color="success"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Box display="flex" justifyContent="flex-end" gap={0.5}>
                            <Tooltip title="Payment History" arrow>
                              <IconButton size="small" color="info" onClick={() => handleOpenHistory(bill)}>
                                <History size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Edit Bill" arrow>
                              <IconButton size="small" color="primary" onClick={() => handleOpenEdit(bill)}>
                                <Edit size={16} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete Bill" arrow>
                              <IconButton size="small" color="error" onClick={() => handleDeleteBill(bill.id)}>
                                <Trash2 size={16} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
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
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}


      {/* Create Dialog Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} fullWidth maxWidth="sm" sx={{ position: "relative" }}>
        <HarvesterModalLoader loading={saving} message="Creating bill entry..." />
        <DialogTitle sx={{ fontWeight: 800 }}>Create {activeTab === "CLASS" ? "Class" : "Kartar"} Bill</DialogTitle>
        <form onSubmit={handleCreateSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={dayjs(createForm.date)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setCreateForm(prev => ({ ...prev, date: newValue.format("YYYY-MM-DD") }));
                      }
                    }}
                    maxDate={dayjs(todayStr)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Place" name="place" fullWidth required value={createForm.place} onChange={handleCreateChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Customer Name" name="customerName" fullWidth required value={createForm.customerName} onChange={handleCreateChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Contact Number" name="contactNumber" fullWidth placeholder="10-digit mobile (Optional)" value={createForm.contactNumber} onChange={handleCreateChange} inputProps={{ maxLength: 10, inputMode: "numeric" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Time (Hours)" type="number" name="timeHours" fullWidth required value={createForm.timeHours} onChange={handleCreateChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Total Amount" type="number" name="totalAmount" fullWidth required value={createForm.totalAmount} onChange={handleCreateChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Advance" type="number" name="advance" fullWidth required value={createForm.advance} onChange={handleCreateChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Balance" type="number" name="balance" fullWidth disabled value={createForm.balance} sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#f87171", fontWeight: 700 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" name="remarks" fullWidth multiline rows={2} value={createForm.remarks} onChange={handleCreateChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseCreate} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Dialog Modal */}
      <Dialog open={isEditOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm" sx={{ position: "relative" }}>
        <HarvesterModalLoader loading={saving} message="Saving bill changes..." />
        <DialogTitle sx={{ fontWeight: 800 }}>Edit {activeTab === "CLASS" ? "Class" : "Kartar"} Bill</DialogTitle>
        <form onSubmit={handleEditSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Date"
                    value={dayjs(editForm.date)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setEditForm(prev => ({ ...prev, date: newValue.format("YYYY-MM-DD") }));
                      }
                    }}
                    maxDate={dayjs(todayStr)}
                    format="DD/MM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      }
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Place" name="place" fullWidth required value={editForm.place} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Customer Name" name="customerName" fullWidth required value={editForm.customerName} onChange={handleEditChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Contact Number" name="contactNumber" fullWidth placeholder="10-digit mobile (Optional)" value={editForm.contactNumber} onChange={handleEditChange} inputProps={{ maxLength: 10, inputMode: "numeric" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Time (Hours)" type="number" name="timeHours" fullWidth required value={editForm.timeHours} onChange={handleEditChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Total Amount" type="number" name="totalAmount" fullWidth required value={editForm.totalAmount} onChange={handleEditChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Advance" type="number" name="advance" fullWidth required value={editForm.advance} onChange={handleEditChange} inputProps={{ step: "any" }} />
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Balance" type="number" name="balance" fullWidth disabled value={editForm.balance} sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#f87171", fontWeight: 700 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" name="remarks" fullWidth multiline rows={2} value={editForm.remarks} onChange={handleEditChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseEdit} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Confirmation Custom Dialog Modal */}
      <Dialog open={isConfirmOpen} onClose={handleCloseConfirm} maxWidth="xs" fullWidth sx={{ position: "relative" }}>
        <HarvesterModalLoader loading={saving} message="Processing request..." />
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>{confirmTitle}</DialogTitle>
        <DialogContent dividers sx={{ py: 3.5 }}>
          <Typography variant="body1" sx={{ color: "text.primary" }}>
            {confirmMessage}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseConfirm} color="inherit">Cancel</Button>
          <Button onClick={handleConfirmSubmit} variant="contained" color={confirmColor} autoFocus disabled={saving}>
            {saving ? "Processing..." : confirmActionText}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Record Payment Dialog Modal */}
      <Dialog open={isPaymentOpen} onClose={handleClosePayment} fullWidth maxWidth="xs" sx={{ position: "relative" }}>
        <HarvesterModalLoader loading={saving} message="Recording payment..." />
        <DialogTitle sx={{ fontWeight: 800 }}>Record Payment</DialogTitle>
        <form onSubmit={handlePaymentSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Customer: <strong>{selectedBill?.customerName}</strong>
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Current Balance" type="text" fullWidth disabled value={`₹${Number(selectedBill?.balance || 0).toLocaleString()}`} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="New Balance (After Payment)" type="text" fullWidth disabled value={`₹${paymentCalculatedBalance.toLocaleString()}`} sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#10b981", fontWeight: 700 } }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Amount Received" type="number" name="amountReceived" fullWidth required value={paymentForm.amountReceived} onChange={handlePaymentChange} inputProps={{ step: "any", min: "0.01", max: selectedBill?.balance }} placeholder="Enter amount collected..." autoFocus />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks / Payment Notes" name="remarks" fullWidth multiline rows={2} value={paymentForm.remarks} onChange={handlePaymentChange} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleClosePayment} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving Payment..." : "Save Payment"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Payment History Dialog Modal */}
      <Dialog open={isHistoryOpen} onClose={handleCloseHistory} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>Payment History - {selectedBill?.customerName}</DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {fetchingHistory ? (
            <YouTubeSpinner label="Loading history..." />
          ) : paymentsHistory.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">No payment entries found for this bill.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Amount Paid</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentsHistory.map((pmt) => (
                    <TableRow key={pmt.id} hover>
                      <TableCell>{new Date(pmt.paymentDate).toLocaleDateString("en-IN")}</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: "success.main" }}>
                        ₹{Number(pmt.amount).toLocaleString()}
                      </TableCell>
                      <TableCell>{pmt.remarks || "—"}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Delete Payment Record" arrow>
                          <IconButton size="small" color="error" onClick={() => handleDeletePayment(pmt.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={handleCloseHistory} variant="contained" color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Bills;
