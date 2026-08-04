import React, { useState, useEffect } from "react";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";
import {
  Box, Card, Typography, Button, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, CircularProgress,
  IconButton, Tooltip, Grid, Checkbox, Chip, TablePagination, Tabs, Tab
} from "@mui/material";
import { FileText, Plus, Edit, Search, History, Trash2 } from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";

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

export const Bills: React.FC = () => {
  const dispatch = useDispatch();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Tab control: "CLASS" or "KARTAR"
  const [activeTab, setActiveTab] = useState<"CLASS" | "KARTAR">("KARTAR");

  // Search & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
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

  const fetchBills = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}?page=${page}&limit=${rowsPerPage}&search=${encodeURIComponent(searchQuery)}`);
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

  // Re-fetch when page, rows per page, search, or active tab changes
  useEffect(() => {
    fetchBills();
  }, [page, rowsPerPage, searchQuery, activeTab]);

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
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 3, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
            <FileText style={{ color: "#0d9488" }} />
            Bills Registry
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            Log bills, track total amount, advance & balance payments, and manage pending statuses.
          </Typography>
        </Box>
        <Button variant="contained" color="primary" startIcon={<Plus size={18} />} onClick={handleOpenCreate} sx={{ py: 1, px: 3, fontWeight: 700 }}>
          Create Bill
        </Button>
      </Box>

      {/* Tabs Navigation to Separate Class & Kartar Machines */}
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{
          mb: 3,
          borderBottom: 1,
          borderColor: "divider",
          "& .MuiTab-root": { fontWeight: 700, fontSize: { xs: "13px", sm: "14px" } }
        }}
      >
        <Tab value="KARTAR" label="Kartar Bills" />
        <Tab value="CLASS" label="Class Bills" />
      </Tabs>

      {/* Action Bar: Search Input */}
      <Box sx={{ mb: 3 }}>
        <TextField
          placeholder="Search by customer name, place, or contact..."
          variant="outlined"
          size="small"
          fullWidth
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(0);
          }}
          InputProps={{
            startAdornment: <Search size={18} style={{ marginRight: 8, color: "#94a3b8" }} />
          }}
          sx={{ maxWidth: { xs: "100%", sm: 380 } }}
        />
      </Box>

      {/* Bills Table */}
      {loading && bills.length === 0 ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
          <CircularProgress size={44} />
        </Box>
      ) : (
        <Card sx={{ borderRadius: 3, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden" }}>
          <TableContainer component={Paper} sx={{ bgcolor: "background.paper", overflowX: "auto" }}>
            <Table sx={{ minWidth: 1200 }}>
              <TableHead>
                <TableRow>
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
                    <TableCell colSpan={11} align="center" sx={{ py: 6 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? "No matching records found." : "No bills found for this tab. Create a new bill to begin."}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  bills.map((bill) => {
                    const isCompleted = bill.status === 1;
                    return (
                      <TableRow key={bill.id} hover>
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
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
          />
        </Card>
      )}

      {/* Create Dialog Modal */}
      <Dialog open={isCreateOpen} onClose={handleCloseCreate} fullWidth maxWidth="sm">
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
      <Dialog open={isEditOpen} onClose={handleCloseEdit} fullWidth maxWidth="sm">
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
      <Dialog open={isConfirmOpen} onClose={handleCloseConfirm} maxWidth="xs" fullWidth>
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
      <Dialog open={isPaymentOpen} onClose={handleClosePayment} fullWidth maxWidth="xs">
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
            <Box display="flex" justifyContent="center" alignItems="center" py={8}>
              <CircularProgress size={36} />
            </Box>
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
