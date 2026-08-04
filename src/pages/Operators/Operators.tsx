import React, { useState, useEffect, useMemo } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Box, Card, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  IconButton, Tooltip, Grid, Tabs, Tab, ButtonGroup, Chip,
  FormControl, InputLabel, Select, MenuItem, Divider
} from "@mui/material";
import { Users, Plus, Trash2, History, Banknote, Search, ChevronLeft, ChevronRight, Pencil, FileDown } from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";
import html2pdf from "html2pdf.js";

interface Operator {
  id: number;
  operatorName: string;
  mobile: string;
  presentDays: number;
  absentDays: number;
  totalSalaryPaid: number;
  earnedSalary: number;
  attendances: { id: number; date: string; status: string; dailyWage: number | null }[];
}

interface AttendanceLog {
  id: number;
  operatorId: number;
  date: string;
  status: string; // PRESENT or ABSENT
  farmerName: string | null;
  dailyWage: number | null;
}

interface PaymentHistory {
  id: number;
  amount: number;
  paymentDate: string;
  remarks: string | null;
}

export const Operators: React.FC = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0); // 0 = Attendance Grid, 1 = Salary & Wages

  // Shared Data States
  const [operators, setOperators] = useState<Operator[]>([]);
  const [attendances, setAttendances] = useState<AttendanceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // View Mode: WEEK (7-Day) vs MONTH (Entire Month View) - Default: WEEK
  const [viewMode, setViewMode] = useState<"WEEK" | "MONTH">("WEEK");

  // Week Starting state for 7-day grid sheet
  const [weekStart, setWeekStart] = useState<string>(() => {
    return dayjs().subtract(6, "day").format("YYYY-MM-DD");
  });

  // Selected Month state for Entire Month view (YYYY-MM format)
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });

  // Salary Month state for Salary & Wages Summary view (YYYY-MM format)
  const [salaryMonth, setSalaryMonth] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });

  const currentMonthStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }, []);

  const isCurrentSalaryMonth = salaryMonth === currentMonthStr;

  const handleShiftSalaryMonth = (direction: number) => {
    const [year, month] = salaryMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + direction, 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    const targetMonthStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
    if (direction > 0 && targetMonthStr > currentMonthStr) {
      dispatch(showToast({ message: "Cannot navigate to future month.", severity: "warning" }));
      return;
    }
    setSalaryMonth(targetMonthStr);
  };

  // Generate list of past 12 months for Select dropdown filter
  const monthDropdownOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const monthNum = String(d.getMonth() + 1).padStart(2, "0");
      const value = `${year}-${monthNum}`;
      const label = d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      options.push({ value, label });
    }
    return options;
  }, []);

  // Compute filtered operator summary statistics for the selected salaryMonth
  const salaryMonthOperators = useMemo(() => {
    return operators.map((op) => {
      const monthAttendances = (op.attendances || []).filter(att => {
        const attDateStr = dayjs(att.date).format("YYYY-MM-DD");
        return attDateStr.substring(0, 7) === salaryMonth;
      });

      const presentDays = monthAttendances.filter(a => a.status === "PRESENT").length;
      const absentDays = monthAttendances.filter(a => a.status === "ABSENT").length;
      
      const totalSalaryPaid = monthAttendances.reduce((sum, att) => {
        return sum + (att.dailyWage !== null && att.dailyWage !== undefined ? Number(att.dailyWage) : 0);
      }, 0);

      return {
        ...op,
        presentDays,
        absentDays,
        totalSalaryPaid,
        attendances: monthAttendances
      };
    });
  }, [operators, salaryMonth]);

  // Search state for salary profiles
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [isEditOperatorOpen, setIsEditOperatorOpen] = useState(false);
  const [editOperatorForm, setEditOperatorForm] = useState({ operatorName: "", mobile: "" });
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [fetchingHistory, setFetchingHistory] = useState(false);
  const [paymentsHistory, setPaymentsHistory] = useState<PaymentHistory[]>([]);

  // Cell Attendance state
  const [isCellAttendanceOpen, setIsCellAttendanceOpen] = useState(false);
  const [cellData, setCellData] = useState<{
    operatorId: number;
    operatorName: string;
    date: Date;
    status: string;
    dailyWage: string;
  } | null>(null);

  const todayStr = dayjs().format("YYYY-MM-DD");

  // Forms
  const [operatorForm, setOperatorForm] = useState({
    operatorName: "",
    mobile: ""
  });

  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentDate: todayStr,
    remarks: ""
  });

  // Fetch all operators (used for wage summary tab & dropdown selectors)
  const fetchOperators = async () => {
    try {
      const res = await fetch(`/api/operators?search=${activeTab === 1 ? encodeURIComponent(searchQuery) : ""}`);
      if (!res.ok) throw new Error("Failed to load operators list");
      const data = await res.json();
      setOperators(data);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching operators", severity: "error" }));
    }
  };

  // Fetch grid data for week or month date range
  const fetchAttendanceGrid = async () => {
    try {
      setLoading(true);
      let startDateStr = "";
      let endDateStr = "";

      if (viewMode === "WEEK") {
        startDateStr = weekStart;
        endDateStr = dayjs(weekStart).add(6, "day").format("YYYY-MM-DD");
      } else {
        // ENTIRE MONTH VIEW
        const [year, month] = selectedMonth.split("-").map(Number);
        const pad = (n: number) => String(n).padStart(2, "0");
        startDateStr = `${year}-${pad(month)}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        endDateStr = `${year}-${pad(month)}-${pad(lastDay)}`;
      }

      const res = await fetch(`/api/operators/attendance-grid?startDate=${startDateStr}&endDate=${endDateStr}`);
      if (!res.ok) throw new Error("Failed to load attendance grid");
      const data = await res.json();
      setAttendances(data.attendances);
      setOperators(data.operators);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error fetching attendance grid", severity: "error" }));
    } finally {
      setLoading(false);
    }
  };

  // Trigger loads depending on tab switch, viewMode, week/month selections or search
  useEffect(() => {
    if (activeTab === 0) {
      fetchAttendanceGrid();
    } else {
      setLoading(true);
      fetchOperators().finally(() => setLoading(false));
    }
  }, [activeTab, viewMode, weekStart, selectedMonth, searchQuery]);

  // Generate date range array (7 days for WEEK mode, 28-31 days for MONTH mode)
  const datesRange = useMemo(() => {
    const dates: Date[] = [];
    if (viewMode === "WEEK") {
      const [y, m, d] = weekStart.split("-").map(Number);
      const startDt = new Date(y, m - 1, d);
      for (let i = 0; i < 7; i++) {
        const current = new Date(startDt);
        current.setDate(startDt.getDate() + i);
        dates.push(current);
      }
    } else {
      const [year, month] = selectedMonth.split("-").map(Number);
      const totalDays = new Date(year, month, 0).getDate();
      for (let day = 1; day <= totalDays; day++) {
        dates.push(new Date(year, month - 1, day));
      }
    }
    return dates;
  }, [viewMode, weekStart, selectedMonth]);

  // Shift week start back or forward by 7 days
  const handleShiftWeek = (days: number) => {
    setWeekStart(dayjs(weekStart).add(days, "day").format("YYYY-MM-DD"));
  };

  // Shift month back or forward by 1 month
  const handleShiftMonth = (deltaMonths: number) => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const d = new Date(year, month - 1 + deltaMonths, 1);
    const pad = (n: number) => String(n).padStart(2, "0");
    setSelectedMonth(`${d.getFullYear()}-${pad(d.getMonth() + 1)}`);
  };

  // Tab switch handler
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setSearchQuery("");
  };

  // Helper: Find attendance log for operator & date
  const getCellAttendance = (operatorId: number, date: Date) => {
    // Use local yyyy-mm-dd string for reliable comparison (avoids timezone offset from toISOString)
    const pad = (n: number) => String(n).padStart(2, "0");
    const localDateStr = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
    return attendances.find(att => {
      const attDate = new Date(att.date);
      const attLocalStr = `${attDate.getFullYear()}-${pad(attDate.getMonth() + 1)}-${pad(attDate.getDate())}`;
      return att.operatorId === operatorId && attLocalStr === localDateStr;
    });
  };

  // Helper: check if a date is in the future (after today)
  const isFutureDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // allow up to end of today
    return date > today;
  };

  // Open Cell Attendance Dialog
  const handleCellClick = (opId: number, opName: string, date: Date) => {
    // Block future date entries
    if (isFutureDate(date)) {
      dispatch(showToast({ message: "Cannot mark attendance for a future date.", severity: "warning" }));
      return;
    }

    const att = getCellAttendance(opId, date);

    let currentWage = "";
    if (att) {
      if (att.dailyWage !== null && att.dailyWage !== undefined) {
        currentWage = att.dailyWage.toString();
      } else {
        currentWage = "";
      }
    } else {
      currentWage = "";
    }

    const initialStatus = (att && att.status && att.status !== "UNMARKED") ? att.status : "PRESENT";

    setCellData({
      operatorId: opId,
      operatorName: opName,
      date: date,
      status: initialStatus,
      dailyWage: currentWage
    });
    setIsCellAttendanceOpen(true);
  };

  const handleCellSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cellData) return;
    setSaving(true);
    try {
      const res = await fetch("/api/operators/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: cellData.operatorId,
          date: dayjs(cellData.date).format("YYYY-MM-DD"),
          status: cellData.status,
          dailyWage: cellData.status !== "UNMARKED" && cellData.dailyWage ? cellData.dailyWage : ""
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update attendance cell");

      fetchAttendanceGrid();
      dispatch(showToast({ message: "Attendance cell updated successfully", severity: "success" }));
      setIsCellAttendanceOpen(false);
      setCellData(null);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error updating cell", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // ── Operator CRUD Handlers ──
  const handleOpenAddOperator = () => {
    setOperatorForm({ operatorName: "", mobile: "" });
    setIsAddOperatorOpen(true);
  };
  const handleCloseAddOperator = () => setIsAddOperatorOpen(false);

  const handleOperatorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const cleaned = value.replace(/\D/g, "").slice(0, 10);
      setOperatorForm(prev => ({ ...prev, mobile: cleaned }));
    } else {
      setOperatorForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{10}$/.test(operatorForm.mobile)) {
      dispatch(showToast({ message: "Mobile number must be exactly 10 digits", severity: "error" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/operators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(operatorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create operator profile");

      fetchOperators();
      dispatch(showToast({ message: "Operator profile created successfully!", severity: "success" }));
      handleCloseAddOperator();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error creating operator", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOperator = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this operator? This will permanently delete their profile, attendances, and payment history!")) return;

    try {
      const res = await fetch(`/api/operators/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete operator profile");

      setOperators(prev => prev.filter(op => op.id !== id));
      dispatch(showToast({ message: "Operator profile deleted successfully", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error deleting operator", severity: "error" }));
    }
  };

  const handleEditOperatorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;
    if (!/^\d{10}$/.test(editOperatorForm.mobile)) {
      dispatch(showToast({ message: "Mobile number must be exactly 10 digits", severity: "error" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/operators/${selectedOperator.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editOperatorForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update operator");

      if (activeTab === 0) fetchAttendanceGrid(); else fetchOperators();
      dispatch(showToast({ message: "Operator updated successfully!", severity: "success" }));
      setIsEditOperatorOpen(false);
      setSelectedOperator(null);
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error updating operator", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // ── Salary Payments Handlers ──
  const handleOpenPayment = (op: Operator) => {
    setSelectedOperator(op);
    setPaymentForm({
      amount: "",
      paymentDate: todayStr,
      remarks: ""
    });
    setIsPaymentOpen(true);
  };
  const handleClosePayment = () => {
    setIsPaymentOpen(false);
    setSelectedOperator(null);
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperator) return;
    const amountVal = parseFloat(paymentForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      dispatch(showToast({ message: "Please enter a valid amount", severity: "error" }));
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/operators/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operatorId: selectedOperator.id,
          ...paymentForm
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to log salary payment");

      fetchOperators();
      dispatch(showToast({ message: "Salary payment logged successfully!", severity: "success" }));
      handleClosePayment();
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error logging payment", severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadReport = (op: Operator) => {
    const totalPaid = Number(op.totalSalaryPaid ?? op.earnedSalary);
    const matchedOption = monthDropdownOptions.find(opt => opt.value === salaryMonth);
    const monthLabel = matchedOption ? matchedOption.label : salaryMonth;

    const rows = (op.attendances || []).map(att => {
      const dateStr = new Date(att.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
      const salary = att.dailyWage !== null && att.dailyWage !== undefined && att.dailyWage > 0
        ? `\u20b9${Number(att.dailyWage).toLocaleString()}` : "\u2014";
      const statusColor = att.status === "PRESENT" ? "#10b981" : "#ef4444";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;">${dateStr}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;">
          <span style="background:${statusColor};color:#fff;padding:2px 10px;border-radius:12px;font-size:11px;font-weight:700;">${att.status}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:${att.dailyWage && att.dailyWage > 0 ? '#10b981' : '#94a3b8'};">${salary}</td>
      </tr>`;
    }).join("");

    const html = `
      <div style="font-family:'Inter',Arial,sans-serif;padding:32px;max-width:700px;margin:auto;color:#1e293b;">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;">
          <div>
            <h1 style="margin:0;font-size:22px;font-weight:800;color:#0f172a;">Operator Salary Report</h1>
            <p style="margin:4px 0 0;color:#64748b;font-size:13px;">For Period: <strong>${monthLabel}</strong> | Generated on ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}</p>
          </div>
          <div style="text-align:right;">
            <div style="font-weight:700;font-size:16px;">${op.operatorName}</div>
            <div style="color:#64748b;font-size:13px;">${op.mobile}</div>
          </div>
        </div>

        <div style="display:flex;gap:16px;margin-bottom:28px;">
          <div style="flex:1;background:#f0fdf4;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Present Days</div>
            <div style="font-size:28px;font-weight:800;color:#10b981;">${op.presentDays}</div>
          </div>
          <div style="flex:1;background:#fef2f2;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Absent Days</div>
            <div style="font-size:28px;font-weight:800;color:#ef4444;">${op.absentDays}</div>
          </div>
          <div style="flex:1;background:#eff6ff;border-radius:10px;padding:16px;text-align:center;">
            <div style="font-size:11px;color:#64748b;font-weight:600;text-transform:uppercase;letter-spacing:1px;">Total Salary Paid</div>
            <div style="font-size:28px;font-weight:800;color:#2563eb;">\u20b9${totalPaid.toLocaleString()}</div>
          </div>
        </div>

        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <thead>
            <tr style="background:#f8fafc;">
              <th style="padding:10px 12px;text-align:left;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Date</th>
              <th style="padding:10px 12px;text-align:center;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Status</th>
              <th style="padding:10px 12px;text-align:right;font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;border-bottom:2px solid #e2e8f0;">Salary Paid</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
          <tfoot>
            <tr style="background:#f8fafc;">
              <td colspan="2" style="padding:12px;font-weight:800;font-size:14px;">Total</td>
              <td style="padding:12px;text-align:right;font-weight:800;font-size:14px;color:#10b981;">\u20b9${totalPaid.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>`;

    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container);

    html2pdf()
      .set({
        margin: 0,
        filename: `${op.operatorName.replace(/\s+/g, "_")}_salary_report.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
      })
      .from(container)
      .save()
      .then(() => document.body.removeChild(container));

    dispatch(showToast({ message: `Downloading ${op.operatorName}'s report...`, severity: "info" }));
  };

  const handleOpenHistory = (op: Operator) => {
    setSelectedOperator(op);
    setIsHistoryOpen(true);
  };

  const handleCloseHistory = () => {
    setIsHistoryOpen(false);
    setSelectedOperator(null);
    setPaymentsHistory([]);
  };

  const handleDeletePayment = async (paymentId: number) => {
    if (!selectedOperator) return;
    if (!window.confirm("Are you sure you want to delete this payment record? This will adjust their unpaid wage balance.")) return;

    try {
      const res = await fetch(`/api/operators/salary/${paymentId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete payment record");

      setPaymentsHistory(prev => prev.filter(p => p.id !== paymentId));
      fetchOperators();
      dispatch(showToast({ message: "Payment entry deleted successfully", severity: "success" }));
    } catch (err: any) {
      dispatch(showToast({ message: err.message || "Error deleting payment", severity: "error" }));
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
            <Users style={{ color: "#0d9488" }} />
            Operator Records
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Manage operator profiles, mark daily attendances, and record salary wage payments.
          </Typography>
        </Box>
        {activeTab === 0 && (
          <Button variant="contained" color="primary" startIcon={<Plus size={18} />} onClick={handleOpenAddOperator} sx={{ py: 1, px: 3, fontWeight: 700 }}>
            Add Operator
          </Button>
        )}
      </Box>

      {/* Tabs Layout: Attendance Grid Sheet vs Salary Wages Summary */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { fontWeight: 700, fontSize: { xs: "13px", sm: "14px" } }
        }}
      >
        <Tab value={0} label="Attendance Log Sheet" />
        <Tab value={1} label="Salary & Wages Summary" />
      </Tabs>

      {/* RENDER ACTIVE TAB */}
      {activeTab === 0 ? (
        /* ==========================================
           TAB 0: ATTENDANCE GRID SHEET (MONTH & WEEK MODES)
           ========================================== */
        <Box>
          {/* Header Controls: Compact Select Dropdown Filter (Week View vs Month View) */}
          <Box display="flex" alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" sx={{ mb: 3, background: "rgba(255,255,255,0.03)", p: { xs: 1.5, sm: 2 }, borderRadius: 2.5, border: "1px solid rgba(255,255,255,0.08)", flexDirection: { xs: "column", sm: "row" }, gap: 1.5 }}>
            {/* View Select Toggle Group */}
            <Box display="flex" alignItems="center" sx={{ width: { xs: "100%", sm: "auto" } }}>
              <ButtonGroup size="small" variant="outlined" color="primary" fullWidth sx={{ borderRadius: 2 }}>
                <Button
                  onClick={() => setViewMode("WEEK")}
                  variant={viewMode === "WEEK" ? "contained" : "outlined"}
                  sx={{ fontWeight: 800, textTransform: "none", py: 0.8 }}
                >
                  Week View (7 Days)
                </Button>
                <Button
                  onClick={() => setViewMode("MONTH")}
                  variant={viewMode === "MONTH" ? "contained" : "outlined"}
                  sx={{ fontWeight: 800, textTransform: "none", py: 0.8 }}
                >
                  Month View
                </Button>
              </ButtonGroup>
            </Box>

            {/* Date / Month Navigation Shift Controls */}
            {viewMode === "MONTH" ? (
              <Box display="flex" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-end" }} gap={1} sx={{ width: { xs: "100%", sm: "auto" }, flexWrap: "wrap" }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton onClick={() => handleShiftMonth(-1)} size="small" color="primary">
                    <ChevronLeft size={20} />
                  </IconButton>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: "12px", sm: "14px" } }}>
                    Month Shift
                  </Typography>
                  <IconButton onClick={() => handleShiftMonth(1)} size="small" color="primary">
                    <ChevronRight size={20} />
                  </IconButton>
                </Box>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Selected Month"
                    views={["year", "month"]}
                    value={dayjs(selectedMonth)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setViewMode("MONTH");
                        setSelectedMonth(newValue.format("YYYY-MM"));
                      }
                    }}
                    minDate={dayjs().subtract(2, "year").startOf("year")}
                    maxDate={dayjs()}
                    format="MMM YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { width: { xs: "100%", sm: 160 }, flex: { xs: 1, sm: "initial" } }
                      },
                      popper: {
                        placement: "bottom-end",
                        modifiers: [
                          {
                            name: "preventOverflow",
                            options: {
                              boundary: "viewport"
                            }
                          }
                        ]
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent={{ xs: "space-between", sm: "flex-end" }} gap={1} sx={{ width: { xs: "100%", sm: "auto" }, flexWrap: "wrap" }}>
                <Box display="flex" alignItems="center" gap={0.5}>
                  <IconButton onClick={() => handleShiftWeek(-7)} size="small" color="primary">
                    <ChevronLeft size={20} />
                  </IconButton>
                  <Typography variant="body2" sx={{ fontWeight: 800, fontSize: { xs: "12px", sm: "14px" } }}>
                    Week Shift
                  </Typography>
                  <IconButton onClick={() => handleShiftWeek(7)} size="small" color="primary">
                    <ChevronRight size={20} />
                  </IconButton>
                </Box>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Week Starting From"
                    value={dayjs(weekStart)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setWeekStart(newValue.format("YYYY-MM-DD"));
                      }
                    }}
                    format="DD/MMM/YYYY"
                    slotProps={{
                      textField: {
                        size: "small",
                        sx: { width: { xs: "100%", sm: 160 }, flex: { xs: 1, sm: "initial" } }
                      },
                      popper: {
                        placement: "bottom-end",
                        modifiers: [
                          {
                            name: "preventOverflow",
                            options: {
                              boundary: "viewport"
                            }
                          }
                        ]
                      }
                    }}
                  />
                </LocalizationProvider>
              </Box>
            )}
          </Box>

          {loading && operators.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
              <CircularProgress size={44} />
            </Box>
          ) : (
            <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <TableContainer component={Paper} sx={{ bgcolor: "background.paper", overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                <Table sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, width: 170, minWidth: 150, bgcolor: "background.paper", position: "sticky", left: 0, zIndex: 3, borderRight: "2px solid rgba(255,255,255,0.1)" }}>Operator Name</TableCell>
                      {datesRange.map((dt: Date, idx: number) => {
                        const dayName = dt.toLocaleDateString("en-US", { weekday: "short" });
                        const dateStr = dt.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
                        const future = isFutureDate(dt);
                        return (
                          <TableCell key={idx} align="center" sx={{ fontWeight: 800, minWidth: 80, opacity: future ? 0.35 : 1 }}>
                            {dayName}<br/>
                            <span style={{ fontSize: "10px", color: future ? "#64748b" : "#94a3b8" }}>{dateStr}</span>
                            {future && <span style={{ display: "block", fontSize: "9px", color: "#64748b", marginTop: 2 }}>🔒</span>}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {operators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">
                            No operators found. Please add profiles in the "Salary & Wages" tab first.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      operators.map((op) => (
                        <TableRow key={op.id} hover>
                          <TableCell sx={{ fontWeight: 700, bgcolor: "background.paper", position: "sticky", left: 0, zIndex: 2, borderRight: "2px solid rgba(255,255,255,0.1)", minWidth: 150 }}>
                            <Box display="flex" alignItems="center" justifyContent="space-between" gap={0.5}>
                              <Box>
                                <Typography sx={{ fontWeight: 700, fontSize: "0.85rem" }}>{op.operatorName}</Typography>
                                <Typography variant="caption" display="block" color="text.secondary">{op.mobile}</Typography>
                              </Box>
                              <Tooltip title="Edit Operator" arrow>
                                <IconButton
                                  size="small"
                                  onClick={(e) => { e.stopPropagation(); setSelectedOperator(op); setEditOperatorForm({ operatorName: op.operatorName, mobile: op.mobile }); setIsEditOperatorOpen(true); }}
                                  sx={{ opacity: 0.5, "&:hover": { opacity: 1, color: "primary.main" } }}
                                >
                                  <Pencil size={13} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                          {datesRange.map((dt: Date, idx: number) => {
                            const att = getCellAttendance(op.id, dt);
                            const future = isFutureDate(dt);
                            return (
                              <TableCell
                                key={idx}
                                align="center"
                                onClick={() => handleCellClick(op.id, op.operatorName, dt)}
                                sx={{
                                  cursor: future ? "not-allowed" : "pointer",
                                  opacity: future ? 0.3 : 1,
                                  transition: "background-color 0.2s",
                                  borderRight: "1px solid rgba(255,255,255,0.03)",
                                  bgcolor: future ? "rgba(0,0,0,0.08)" : "transparent",
                                  "&:hover": future ? {} : {
                                    bgcolor: "rgba(13, 148, 136, 0.08)"
                                  }
                                }}
                              >
                                {att ? (
                                    att.status === "PRESENT" ? (
                                      <Box display="flex" flexDirection="column" alignItems="center">
                                        <Chip
                                          label="P"
                                          size="small"
                                          color="success"
                                          sx={{ fontWeight: 900, fontSize: "11px", height: "20px", px: 0.5 }}
                                        />
                                        {att.dailyWage !== null && att.dailyWage !== undefined && Number(att.dailyWage) > 0 && (
                                          <Typography variant="caption" sx={{ fontSize: "10px", mt: 0.5, fontWeight: 600, color: "#10b981" }}>
                                            ₹{Number(att.dailyWage).toLocaleString()}
                                          </Typography>
                                        )}
                                      </Box>
                                    ) : (
                                      <Box display="flex" flexDirection="column" alignItems="center">
                                        <Chip
                                          label="A"
                                          size="small"
                                          color="error"
                                          sx={{ fontWeight: 900, fontSize: "11px", height: "20px", px: 0.5 }}
                                        />
                                        {att.dailyWage !== null && att.dailyWage !== undefined && Number(att.dailyWage) > 0 && (
                                          <Typography variant="caption" sx={{ fontSize: "10px", mt: 0.5, fontWeight: 600, color: "#f87171" }}>
                                            ₹{Number(att.dailyWage).toLocaleString()}
                                          </Typography>
                                        )}
                                      </Box>
                                    )
                                  ) : (
                                    <span style={{ color: "#475569", fontWeight: 500 }}>—</span>
                                  )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      ) : (
        /* ==========================================
           TAB 1: OPERATOR SALARY WAGES SUMMARY
           ========================================== */
        <Box>
          <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3, gap: 2 }}>
            <TextField
              placeholder="Search operators by name or mobile..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ width: { xs: "100%", sm: 320 } }}
              InputProps={{
                startAdornment: <Search size={18} style={{ marginRight: 8, color: "#94a3b8" }} />
              }}
            />

            {/* Salary Month Selector & Navigation Row */}
            <Box display="flex" alignItems="center" gap={1.5} sx={{ alignSelf: { xs: "stretch", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <IconButton onClick={() => handleShiftSalaryMonth(-1)} size="small" color="primary">
                  <ChevronLeft size={20} />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: 800, fontSize: "14px" }}>
                  Salary Month
                </Typography>
                <IconButton 
                  onClick={() => handleShiftSalaryMonth(1)} 
                  size="small" 
                  color="primary"
                  disabled={isCurrentSalaryMonth}
                >
                  <ChevronRight size={20} />
                </IconButton>
              </Box>

              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DatePicker
                  label="Select Month"
                  views={["year", "month"]}
                  value={dayjs(salaryMonth)}
                  onChange={(newValue) => {
                    if (newValue) {
                      setSalaryMonth(newValue.format("YYYY-MM"));
                    }
                  }}
                  minDate={dayjs().subtract(2, "year").startOf("year")}
                  maxDate={dayjs(currentMonthStr)}
                  format="MMM YYYY"
                  slotProps={{
                    textField: {
                      size: "small",
                      sx: { width: { xs: "100%", sm: 160 } }
                    },
                    popper: {
                      placement: "bottom-end",
                      modifiers: [
                        {
                          name: "preventOverflow",
                          options: {
                            boundary: "viewport"
                          }
                        }
                      ]
                    }
                  }}
                />
              </LocalizationProvider>
            </Box>
          </Box>

          {loading && operators.length === 0 ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
              <CircularProgress size={44} />
            </Box>
          ) : (
            <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
              <TableContainer component={Paper} sx={{ bgcolor: "background.paper", overflowX: "auto" }}>
                <Table sx={{ minWidth: 750 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Operator Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Mobile</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Present Days</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Absent Days</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Total Salary Paid</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salaryMonthOperators.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary">
                            {searchQuery ? "No matching operators found." : "No operators found. Use 'Add Operator' in the Attendance tab."}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      salaryMonthOperators.map((op) => (
                        <TableRow key={op.id} hover>
                          <TableCell sx={{ fontWeight: 700 }}>{op.operatorName}</TableCell>
                          <TableCell>{op.mobile}</TableCell>
                          <TableCell align="center">
                            <Chip label={`${op.presentDays} days`} size="small" color="success" variant="outlined" />
                          </TableCell>
                          <TableCell align="center">
                            <Chip label={`${op.absentDays} days`} size="small" color="error" variant="outlined" />
                          </TableCell>
                          <TableCell>
                            <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#10b981" }}>
                              ₹{Number(op.totalSalaryPaid ?? op.earnedSalary).toLocaleString()}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Box display="flex" justifyContent="center" gap={0.5}>
                              <Tooltip title="View Day-wise Salary History" arrow>
                                <IconButton size="small" color="info" onClick={() => handleOpenHistory(op)}>
                                  <History size={16} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download Operator Report (PDF)" arrow>
                                <IconButton size="small" color="success" onClick={() => handleDownloadReport(op)}>
                                  <FileDown size={16} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Card>
          )}
        </Box>
      )}

      {/* ── MODALS & POPUPS ── */}

      {/* Grid Cell Attendance Dialog Modal */}
      <Dialog open={isCellAttendanceOpen} onClose={() => setIsCellAttendanceOpen(false)} fullWidth maxWidth="xs">
        {cellData && (
          <form onSubmit={handleCellSubmit}>
            <DialogTitle sx={{ fontWeight: 800 }}>
              Mark Attendance
            </DialogTitle>
            <DialogContent dividers sx={{ p: 3 }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12}>
                  <TextField label="Operator Name" fullWidth disabled value={cellData.operatorName} />
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Selected Date" fullWidth disabled value={cellData.date.toLocaleDateString("en-IN")} />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" sx={{ fontWeight: 700, mb: 1, color: "text.secondary" }}>
                    Attendance Status
                  </Typography>
                  <ButtonGroup fullWidth color="primary">
                    <Button
                      type="button"
                      variant={cellData.status === "PRESENT" ? "contained" : "outlined"}
                      onClick={() => setCellData(prev => prev ? { ...prev, status: "PRESENT" } : null)}
                      sx={{
                        bgcolor: cellData.status === "PRESENT" ? "success.main" : "transparent",
                        borderColor: "success.main",
                        color: cellData.status === "PRESENT" ? "#ffffff" : "success.main",
                        "&:hover": { bgcolor: cellData.status === "PRESENT" ? "success.dark" : "rgba(46, 125, 50, 0.04)" }
                      }}
                    >
                      PRESENT
                    </Button>
                    <Button
                      type="button"
                      variant={cellData.status === "ABSENT" ? "contained" : "outlined"}
                      onClick={() => setCellData(prev => prev ? { ...prev, status: "ABSENT" } : null)}
                      sx={{
                        bgcolor: cellData.status === "ABSENT" ? "error.main" : "transparent",
                        borderColor: "error.main",
                        color: cellData.status === "ABSENT" ? "#ffffff" : "error.main",
                        "&:hover": { bgcolor: cellData.status === "ABSENT" ? "error.dark" : "rgba(211, 47, 47, 0.04)" }
                      }}
                    >
                      ABSENT
                    </Button>
                    <Button
                      type="button"
                      variant={cellData.status === "UNMARKED" ? "contained" : "outlined"}
                      onClick={() => setCellData(prev => prev ? { ...prev, status: "UNMARKED" } : null)}
                      sx={{
                        bgcolor: cellData.status === "UNMARKED" ? "grey.700" : "transparent",
                        borderColor: "grey.700",
                        color: cellData.status === "UNMARKED" ? "#ffffff" : "grey.500"
                      }}
                    >
                      CLEAR
                    </Button>
                  </ButtonGroup>
                </Grid>
                {/* Salary / Daily Wage Input — always visible */}
                <Grid item xs={12}>
                  <TextField
                    label="Salary Amount for this day (₹)"
                    type="number"
                    fullWidth
                    placeholder="Enter daily salary amount..."
                    value={cellData.dailyWage}
                    onChange={(e) => setCellData(prev => prev ? { ...prev, dailyWage: e.target.value } : null)}
                    inputProps={{ step: "any", min: "0" }}
                    helperText="Enter the salary earned for this attendance entry"
                  />
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setIsCellAttendanceOpen(false)} color="inherit">Cancel</Button>
              <Button type="submit" variant="contained" color="primary" disabled={saving}>
                {saving ? "Saving..." : "Save Entry"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {/* Add Operator Profile Dialog Modal */}
      <Dialog open={isAddOperatorOpen} onClose={handleCloseAddOperator} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Add Operator</DialogTitle>
        <form onSubmit={handleOperatorSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Operator Name" name="operatorName" fullWidth required value={operatorForm.operatorName} onChange={handleOperatorChange} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mobile Number"
                  name="mobile"
                  fullWidth
                  required
                  placeholder="10-digit mobile number"
                  value={operatorForm.mobile}
                  onChange={handleOperatorChange}
                  inputProps={{ maxLength: 10, inputMode: "numeric" }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseAddOperator} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Operator"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Operator Dialog Modal */}
      <Dialog open={isEditOperatorOpen} onClose={() => setIsEditOperatorOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Edit Operator</DialogTitle>
        <form onSubmit={handleEditOperatorSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Operator Name"
                  fullWidth
                  required
                  value={editOperatorForm.operatorName}
                  onChange={(e) => setEditOperatorForm(prev => ({ ...prev, operatorName: e.target.value }))}
                  autoFocus
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Mobile Number"
                  fullWidth
                  required
                  placeholder="10-digit mobile number"
                  value={editOperatorForm.mobile}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setEditOperatorForm(prev => ({ ...prev, mobile: cleaned }));
                  }}
                  inputProps={{ maxLength: 10, inputMode: "numeric" }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={() => setIsEditOperatorOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="primary" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Record Salary Payment Dialog Modal */}
      <Dialog open={isPaymentOpen} onClose={handleClosePayment} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 800 }}>Record Payment - {selectedOperator?.operatorName}</DialogTitle>
        <form onSubmit={handlePaymentSubmit}>
          <DialogContent dividers sx={{ p: 3 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Operator" type="text" fullWidth disabled value={selectedOperator?.operatorName || ""} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Total Salary Paid" type="text" fullWidth disabled value={`₹${Number(selectedOperator?.totalSalaryPaid ?? selectedOperator?.earnedSalary ?? 0).toLocaleString()}`} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Payment Amount (₹)" type="number" name="amount" fullWidth required value={paymentForm.amount} onChange={handlePaymentChange} inputProps={{ step: "any", min: "0.01" }} placeholder="Enter salary paid amount..." autoFocus />
              </Grid>
              <Grid item xs={12}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <DatePicker
                    label="Payment Date"
                    value={dayjs(paymentForm.paymentDate)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setPaymentForm(prev => ({ ...prev, paymentDate: newValue.format("YYYY-MM-DD") }));
                      }
                    }}
                    maxDate={dayjs(todayStr)}
                    format="DD/MMM/YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        required: true
                      },
                      popper: {
                        placement: "bottom-end",
                        modifiers: [
                          {
                            name: "preventOverflow",
                            options: {
                              boundary: "viewport"
                            }
                          }
                        ]
                      }
                    }}
                  />
                </LocalizationProvider>
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

      {/* Day-wise Salary History Dialog */}
      <Dialog open={isHistoryOpen} onClose={handleCloseHistory} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 800 }}>
          Day-wise Salary History — {selectedOperator?.operatorName}
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {!selectedOperator || !selectedOperator.attendances || selectedOperator.attendances.length === 0 ? (
            <Box py={6} textAlign="center">
              <Typography color="text.secondary">No attendance entries found for this operator.</Typography>
            </Box>
          ) : (
            <>
              <TableContainer component={Paper} sx={{ boxShadow: "none", bgcolor: "background.paper" }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Salary Paid</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedOperator.attendances.map((att) => (
                      <TableRow key={att.id} hover>
                        <TableCell>{new Date(att.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</TableCell>
                        <TableCell align="center">
                          <Chip
                            label={att.status}
                            size="small"
                            color={att.status === "PRESENT" ? "success" : "error"}
                            variant="filled"
                            sx={{ fontWeight: 700, fontSize: "11px" }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: att.dailyWage && att.dailyWage > 0 ? "#10b981" : "text.secondary" }}>
                          {att.dailyWage !== null && att.dailyWage !== undefined && att.dailyWage > 0
                            ? `₹${Number(att.dailyWage).toLocaleString()}`
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {/* Summary Footer */}
              <Box sx={{ p: 2, borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "flex-end" }}>
                <Typography sx={{ fontWeight: 800, fontSize: "1rem", color: "#10b981" }}>
                  Total Salary Paid: ₹{Number(selectedOperator.totalSalaryPaid ?? selectedOperator.earnedSalary).toLocaleString()}
                </Typography>
              </Box>
            </>
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

export default Operators;
