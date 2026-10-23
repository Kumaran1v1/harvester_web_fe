import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stack,
  Alert,
} from "@mui/material";
import {
  Bell,
  Plus,
  Clock,
  Send,
  Edit2,
  Trash2,
  RefreshCw,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useDispatch } from "react-redux";
import { showToast } from "../../redux/toast/toastSlice";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import dayjs from "dayjs";

export interface NotificationSchedule {
  id: string;
  code: string;
  title: string;
  message: string;
  targetTime: string; // "HH:mm" in 24hr format
  category: string;
  targetScreen: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

const CATEGORIES = [
  { value: "GREETING", label: "Greeting (Morning/Night)", color: "primary" },
  { value: "HEALTHY_HABIT", label: "Healthy Habit (Meals/Snacks)", color: "success" },
  { value: "ACTION_REQUIRED", label: "Action Required (Attendance)", color: "warning" },
  { value: "REMINDER", label: "Reminder", color: "info" },
  { value: "GENERAL", label: "General Announcement", color: "secondary" },
];

const SCREENS = [
  { value: "DashboardTab", label: "Dashboard Tab" },
  { value: "OperatorsTab", label: "Operators Tab" },
  { value: "BillsTab", label: "Bills Tab" },
  { value: "PendingBillsTab", label: "Pending Bills Tab" },
  { value: "BunkDetailsTab", label: "Bunk Details Tab" },
];

function format12Hour(time24: string): string {
  if (!time24 || !time24.includes(":")) return time24;
  const [hStr, mStr] = time24.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  if (isNaN(h) || isNaN(m)) return time24;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  const minFormatted = m < 10 ? `0${m}` : m;
  return `${h12}:${minFormatted} ${ampm}`;
}

export const NotificationMaster: React.FC = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<NotificationSchedule[]>([]);
  const [serverTime, setServerTime] = useState<string>("");
  const [serverDate, setServerDate] = useState<string>("");

  // Trigger loading state for individual items
  const [triggeringCode, setTriggeringCode] = useState<string | null>(null);

  // Dialog State: Add / Edit
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"ADD" | "EDIT">("ADD");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [form, setForm] = useState({
    code: "",
    title: "",
    message: "",
    targetTime: "10:00",
    category: "GENERAL",
    targetScreen: "DashboardTab",
    isActive: true,
  });

  // Delete Confirm State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingSchedule, setDeletingSchedule] = useState<NotificationSchedule | null>(null);

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/device/schedules");
      if (!res.ok) throw new Error("Failed to load notification schedules");
      const data = await res.json();
      if (data.success) {
        setSchedules(data.schedules || []);
        setServerTime(data.serverTime || "");
        setServerDate(data.serverDate || "");
      }
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.message || "Failed to fetch schedules",
          severity: "error",
        })
      );
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  // Handle Switch Toggle
  const handleToggleActive = async (schedule: NotificationSchedule) => {
    const updatedStatus = !schedule.isActive;
    // Optimistic update
    setSchedules((prev) =>
      prev.map((s) => (s.id === schedule.id ? { ...s, isActive: updatedStatus } : s))
    );

    try {
      const res = await fetch(`/api/device/schedules/${schedule.code}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: updatedStatus }),
      });
      if (!res.ok) throw new Error("Could not update schedule status");
      dispatch(
        showToast({
          message: `${schedule.title} is now ${updatedStatus ? "Active" : "Disabled"}`,
          severity: "success",
        })
      );
    } catch (err: any) {
      // Revert optimistic update
      setSchedules((prev) =>
        prev.map((s) => (s.id === schedule.id ? { ...s, isActive: schedule.isActive } : s))
      );
      dispatch(showToast({ message: err.message, severity: "error" }));
    }
  };

  // Immediate Test Send
  const handleTestSend = async (schedule: NotificationSchedule) => {
    setTriggeringCode(schedule.code);
    try {
      const res = await fetch(`/api/device/schedules/trigger/${schedule.code}`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        dispatch(
          showToast({
            message: `🔔 Test push sent successfully for "${schedule.title}"! Check your mobile phone.`,
            severity: "success",
          })
        );
      } else {
        throw new Error(data.message || "Push dispatch failed");
      }
    } catch (err: any) {
      dispatch(
        showToast({
          message: err.message || "Failed to send test push",
          severity: "error",
        })
      );
    } finally {
      setTriggeringCode(null);
    }
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setDialogMode("ADD");
    setEditingId(null);
    setForm({
      code: "",
      title: "",
      message: "",
      targetTime: "10:00",
      category: "GENERAL",
      targetScreen: "DashboardTab",
      isActive: true,
    });
    setDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (schedule: NotificationSchedule) => {
    setDialogMode("EDIT");
    setEditingId(schedule.id);
    setForm({
      code: schedule.code,
      title: schedule.title,
      message: schedule.message,
      targetTime: schedule.targetTime,
      category: schedule.category || "GENERAL",
      targetScreen: schedule.targetScreen || "DashboardTab",
      isActive: schedule.isActive,
    });
    setDialogOpen(true);
  };

  // Save (Add or Edit)
  const handleSave = async () => {
    if (!form.title.trim()) {
      dispatch(showToast({ message: "Notification title is required", severity: "warning" }));
      return;
    }
    if (!form.message.trim()) {
      dispatch(showToast({ message: "Notification message is required", severity: "warning" }));
      return;
    }
    if (!form.targetTime || !form.targetTime.includes(":")) {
      dispatch(showToast({ message: "Valid 24-hr time (HH:mm) is required", severity: "warning" }));
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === "ADD") {
        if (!form.code.trim()) {
          dispatch(showToast({ message: "Schedule code identifier is required", severity: "warning" }));
          setSaving(false);
          return;
        }

        const res = await fetch("/api/device/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to create schedule");

        dispatch(showToast({ message: "Schedule created successfully!", severity: "success" }));
      } else {
        // Edit existing
        const res = await fetch(`/api/device/schedules/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to update schedule");

        dispatch(showToast({ message: "Schedule updated successfully!", severity: "success" }));
      }

      setDialogOpen(false);
      fetchSchedules();
    } catch (err: any) {
      dispatch(showToast({ message: err.message, severity: "error" }));
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDeleteConfirm = async () => {
    if (!deletingSchedule) return;
    try {
      const res = await fetch(`/api/device/schedules/${deletingSchedule.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete schedule");
      dispatch(showToast({ message: "Schedule deleted successfully", severity: "success" }));
      setDeleteConfirmOpen(false);
      setDeletingSchedule(null);
      fetchSchedules();
    } catch (err: any) {
      dispatch(showToast({ message: err.message, severity: "error" }));
    }
  };

  const getCategoryChip = (category: string) => {
    const found = CATEGORIES.find((c) => c.value === category);
    return (
      <Chip
        label={found ? found.label.split(" ")[0] : category}
        size="small"
        color={(found?.color as any) || "default"}
        variant="outlined"
        sx={{ fontWeight: 600, fontSize: "0.72rem" }}
      />
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1400, mx: "auto" }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              color: "text.primary",
            }}
          >
            <Bell size={26} style={{ color: "#0d9488" }} />
            Push Notification Master
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage scheduled daily notifications, customize alert timings, and test instant push deliveries to mobile devices.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          {serverTime && (
            <Chip
              icon={<Clock size={15} style={{ color: "#0d9488" }} />}
              label={`IST Server Time: ${format12Hour(serverTime)} (${serverTime})`}
              variant="outlined"
              sx={{
                fontWeight: 700,
                borderColor: "#0d9488",
                backgroundColor: "rgba(13, 148, 136, 0.08)",
                px: 1,
              }}
            />
          )}

          <Tooltip title="Refresh Schedules">
            <IconButton
              onClick={fetchSchedules}
              disabled={loading}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
              }}
            >
              <RefreshCw size={18} className={loading ? "spin" : ""} />
            </IconButton>
          </Tooltip>

          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={handleOpenAdd}
            sx={{
              backgroundColor: "#0d9488",
              fontWeight: 700,
              borderRadius: 2,
              px: 2.5,
              "&:hover": { backgroundColor: "#0f766e" },
            }}
          >
            Add Schedule
          </Button>
        </Stack>
      </Box>

      {/* Info Banner */}
      <Alert
        severity="info"
        icon={<Sparkles size={18} />}
        sx={{
          mb: 3,
          borderRadius: 2,
          backgroundColor: "rgba(13, 148, 136, 0.06)",
          borderColor: "rgba(13, 148, 136, 0.2)",
          borderWidth: 1,
          borderStyle: "solid",
        }}
      >
        All timings are synchronized with <strong>Indian Standard Time (Asia/Kolkata, UTC+5:30)</strong>. Use the <strong>"Test Push"</strong> button on any card to immediately verify real-time delivery on your connected mobile phone.
      </Alert>

      {/* Schedules Grid */}
      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
          <CircularProgress sx={{ color: "#0d9488" }} />
        </Box>
      ) : schedules.length === 0 ? (
        <Card sx={{ textAlign: "center", py: 6, borderRadius: 3 }}>
          <CardContent>
            <AlertCircle size={40} style={{ color: "#9ca3af", marginBottom: 12 }} />
            <Typography variant="h6" fontWeight={700}>
              No Notification Schedules Found
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Initialize master records or click "Add Schedule" to configure daily alerts.
            </Typography>
            <Button variant="contained" onClick={fetchSchedules} sx={{ backgroundColor: "#0d9488" }}>
              Refresh & Seed Defaults
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {schedules.map((schedule) => {
            const isTriggering = triggeringCode === schedule.code;
            return (
              <Grid item xs={12} md={6} lg={4} key={schedule.id}>
                <Card
                  sx={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: schedule.isActive ? "rgba(13, 148, 136, 0.3)" : "divider",
                    boxShadow: schedule.isActive
                      ? "0 4px 14px rgba(13, 148, 136, 0.08)"
                      : "none",
                    opacity: schedule.isActive ? 1 : 0.75,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      borderColor: "#0d9488",
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 20px rgba(13, 148, 136, 0.12)",
                    },
                  }}
                >
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    {/* Header Row: Category Badge, Time Chip & Active Switch */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1.5,
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        {getCategoryChip(schedule.category)}
                        <Chip
                          icon={<Clock size={13} style={{ color: "#0d9488" }} />}
                          label={format12Hour(schedule.targetTime)}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            fontSize: "0.78rem",
                            backgroundColor: "rgba(13, 148, 136, 0.1)",
                            color: "#0d9488",
                          }}
                        />
                      </Stack>

                      <Tooltip title={schedule.isActive ? "Active (Click to Disable)" : "Disabled (Click to Enable)"}>
                        <Switch
                          checked={schedule.isActive}
                          onChange={() => handleToggleActive(schedule)}
                          color="primary"
                          size="small"
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": {
                              color: "#0d9488",
                            },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                              backgroundColor: "#0d9488",
                            },
                          }}
                        />
                      </Tooltip>
                    </Box>

                    {/* Notification Title */}
                    <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.8, color: "text.primary" }}>
                      {schedule.title}
                    </Typography>

                    {/* Notification Message */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        flexGrow: 1,
                        mb: 2,
                        minHeight: 40,
                        lineHeight: 1.5,
                      }}
                    >
                      {schedule.message}
                    </Typography>

                    {/* Target Screen & Code Meta */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        pt: 1.5,
                        mb: 2,
                        borderTop: "1px dashed",
                        borderColor: "divider",
                      }}
                    >
                      <Stack direction="row" spacing={0.6} alignItems="center">
                        <Smartphone size={14} style={{ color: "#6b7280" }} />
                        <Typography variant="caption" color="text.secondary">
                          Routes to: <strong>{schedule.targetScreen}</strong>
                        </Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", color: "text.disabled" }}>
                        #{schedule.code}
                      </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack direction="row" spacing={1} sx={{ mt: "auto" }}>
                      <Button
                        variant="outlined"
                        size="small"
                        fullWidth
                        startIcon={isTriggering ? <CircularProgress size={14} /> : <Send size={14} />}
                        disabled={isTriggering}
                        onClick={() => handleTestSend(schedule)}
                        sx={{
                          borderColor: "#0d9488",
                          color: "#0d9488",
                          fontWeight: 700,
                          borderRadius: 2,
                          "&:hover": {
                            borderColor: "#0f766e",
                            backgroundColor: "rgba(13, 148, 136, 0.08)",
                          },
                        }}
                      >
                        {isTriggering ? "Sending..." : "Test Push"}
                      </Button>

                      <Tooltip title="Edit Timing / Content">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(schedule)}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            "&:hover": { backgroundColor: "action.hover" },
                          }}
                        >
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Schedule">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setDeletingSchedule(schedule);
                            setDeleteConfirmOpen(true);
                          }}
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 2,
                            "&:hover": { backgroundColor: "rgba(239, 68, 68, 0.08)" },
                          }}
                        >
                          <Trash2 size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800, pb: 1 }}>
          {dialogMode === "ADD" ? "Add Notification Schedule" : `Edit: ${form.code}`}
        </DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Grid container spacing={2.5}>
            {dialogMode === "ADD" && (
              <Grid item xs={12}>
                <TextField
                  label="Schedule Code (Identifier)"
                  placeholder="e.g. MORNING_CHECK, WATER_REMINDER"
                  fullWidth
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase().replace(/\s+/g, "_") })}
                  helperText="Unique uppercase identifier for this notification"
                />
              </Grid>
            )}

            <Grid item xs={12} sm={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <TimePicker
                  label="Target Time (Interactive Clock)"
                  value={
                    form.targetTime && form.targetTime.includes(":")
                      ? dayjs(`2026-01-01T${form.targetTime}:00`)
                      : dayjs()
                  }
                  onChange={(newVal) => {
                    if (newVal && newVal.isValid()) {
                      setForm({ ...form, targetTime: newVal.format("HH:mm") });
                    }
                  }}
                  format="hh:mm A"
                  ampm={true}
                  views={["hours", "minutes"]}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      helperText: `Clock Setting: ${format12Hour(form.targetTime)} (${form.targetTime})`,
                    },
                  }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid item xs={12}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", mb: 0.8, display: "block" }}>
                ⚡ Quick Presets (Click to Auto-Set Clock):
              </Typography>
              <Stack direction="row" spacing={0.8} sx={{ flexWrap: "wrap", gap: 0.8 }}>
                {[
                  { label: "06:00 AM (Morning)", time: "06:00" },
                  { label: "09:00 AM (Breakfast)", time: "09:00" },
                  { label: "11:00 AM (Tea)", time: "11:00" },
                  { label: "01:00 PM (Lunch)", time: "13:00" },
                  { label: "05:00 PM (Snack)", time: "17:00" },
                  { label: "06:00 PM (Attendance)", time: "18:00" },
                  { label: "08:30 PM (Dinner)", time: "20:30" },
                  { label: "09:00 PM (Night)", time: "21:00" },
                ].map((preset) => {
                  const isSelected = form.targetTime === preset.time;
                  return (
                    <Chip
                      key={preset.time}
                      label={preset.label}
                      size="small"
                      clickable
                      onClick={() => setForm({ ...form, targetTime: preset.time })}
                      color={isSelected ? "primary" : "default"}
                      variant={isSelected ? "filled" : "outlined"}
                      sx={{
                        fontWeight: isSelected ? 800 : 500,
                        fontSize: "0.74rem",
                        borderColor: isSelected ? "#0d9488" : "divider",
                        backgroundColor: isSelected ? "#0d9488" : "transparent",
                        color: isSelected ? "#fff" : "text.secondary",
                      }}
                    />
                  );
                })}
              </Stack>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={form.category}
                  label="Category"
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                >
                  {CATEGORIES.map((cat) => (
                    <MenuItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notification Title (Includes Emoji)"
                placeholder="e.g. 🌅 Good Morning!"
                fullWidth
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Notification Message Content"
                placeholder="e.g. Have a productive and safe workday ahead."
                fullWidth
                required
                multiline
                rows={3}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
              />
            </Grid>

            <Grid item xs={12} sm={8}>
              <FormControl fullWidth>
                <InputLabel>On Tap Mobile Screen</InputLabel>
                <Select
                  value={form.targetScreen}
                  label="On Tap Mobile Screen"
                  onChange={(e) => setForm({ ...form, targetScreen: e.target.value })}
                >
                  {SCREENS.map((sc) => (
                    <MenuItem key={sc.value} value={sc.value}>
                      {sc.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={4} sx={{ display: "flex", alignItems: "center" }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Switch
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  color="primary"
                />
                <Typography variant="body2" fontWeight={600}>
                  {form.isActive ? "Active" : "Disabled"}
                </Typography>
              </Stack>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} /> : <CheckCircle2 size={16} />}
            sx={{
              backgroundColor: "#0d9488",
              fontWeight: 700,
              px: 3,
              "&:hover": { backgroundColor: "#0f766e" },
            }}
          >
            {saving ? "Saving..." : "Save Schedule"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete the notification schedule:{" "}
            <strong>"{deletingSchedule?.title}"</strong> (#{deletingSchedule?.code})?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button variant="contained" color="error" onClick={handleDeleteConfirm} sx={{ fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationMaster;
