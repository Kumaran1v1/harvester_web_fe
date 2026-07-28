import React, { useState, useEffect } from "react";
import {
  Box, Grid, Card, CardContent, Typography, Paper, CircularProgress,
  Avatar, Alert, Divider, Chip
} from "@mui/material";
import {
  LayoutDashboard, FileText, CreditCard, Users, Fuel,
  TrendingUp, IndianRupee, ShieldCheck, ArrowRight, UserCheck,
  Zap, Receipt, Wallet, Activity
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routeConstants";

interface DashboardStats {
  user?: {
    name: string;
    mobile: string;
    email: string;
    machineName?: string;
    address?: string;
  } | null;
  totalBills: number;
  classBillsCount: number;
  kartarBillsCount: number;
  totalAdvance: number;
  totalBalance: number;
  totalPendingBillsCount: number;
  totalPendingBalance: number;
  totalOperators: number;
  totalOperatorSalaryPaid: number;
  totalFuelPurchases: number;
  totalFuelAmount: number;
  totalFuelPaid: number;
  totalFuelPending: number;
  totalBilledRevenue: number;
  totalExpenses: number;
  netProfit: number;
  recentActivity?: {
    classBills: any[];
    kartarBills: any[];
    bunkDetails: any[];
  };
}

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load dashboard metrics");
      const data = await res.json();
      setStats(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = stats?.user?.name || storedUser.name || "Owner";
  const machineName = stats?.user?.machineName || storedUser.machineName || "Harvester Machine";

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={44} color="primary" />
      </Box>
    );
  }

  const cardsData = [
    {
      title: "Personal Details",
      value: userName,
      sub: `Machine: ${machineName}`,
      icon: <UserCheck size={20} />,
      color: "#0d9488",
      gradient: "linear-gradient(135deg, #0d9488, #2dd4bf)",
      path: ROUTES.PERSONAL_DETAILS
    },
    {
      title: "Bills Logs",
      value: `${stats?.totalBills || 0} Bills`,
      sub: `Revenue: ₹${(stats?.totalBilledRevenue || 0).toLocaleString()}`,
      icon: <FileText size={20} />,
      color: "#3b82f6",
      gradient: "linear-gradient(135deg, #3b82f6, #818cf8)",
      path: ROUTES.BILLS
    },
    {
      title: "Pending Bills",
      value: `₹${(stats?.totalPendingBalance || 0).toLocaleString()}`,
      sub: `${(stats?.totalPendingBillsCount || 0) + (stats?.totalBalance ? 1 : 0)} Accounts Pending`,
      icon: <CreditCard size={20} />,
      color: "#ef4444",
      gradient: "linear-gradient(135deg, #ef4444, #f87171)",
      path: ROUTES.PENDING_BILLS
    },
    {
      title: "Operator Records",
      value: `${stats?.totalOperators || 0} Operators`,
      sub: `Salary Paid: ₹${(stats?.totalOperatorSalaryPaid || 0).toLocaleString()}`,
      icon: <Users size={20} />,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, #f59e0b, #fbbf24)",
      path: ROUTES.OPERATORS
    },
    {
      title: "Bunk Details",
      value: `₹${(stats?.totalFuelAmount || 0).toLocaleString()}`,
      sub: `Pending Bunk: ₹${(stats?.totalFuelPending || 0).toLocaleString()}`,
      icon: <Fuel size={20} />,
      color: "#a855f7",
      gradient: "linear-gradient(135deg, #a855f7, #c084fc)",
      path: ROUTES.BUNK_DETAILS
    }
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      {/* Page Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 900, mb: 0.5, display: "flex", alignItems: "center", gap: 1.5, background: "linear-gradient(90deg, #2dd4bf, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
          <LayoutDashboard style={{ color: "#0d9488" }} />
          Owner Dashboard
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
          Welcome back, {userName}! Aggregate overview of harvester operations, revenue, expenses, and pending balances.
        </Typography>
      </Box>

      {/* Navigation Modules Cards Grid */}
      <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: 3 }}>
        {cardsData.map((card, index) => (
          <Grid item xs={12} sm={6} md={4} key={index}>
            <Card
              onClick={() => navigate(card.path)}
              sx={{
                position: "relative",
                overflow: "hidden",
                cursor: "pointer",
                height: "100%",
                borderRadius: 3,
                border: "1px solid rgba(255,255,255,0.08)",
                bgcolor: "background.paper",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  transform: "translateY(-4px)",
                  boxShadow: "0 12px 24px rgba(0,0,0,0.25)",
                  "& .arrow-icon": {
                    transform: "translateX(4px)",
                    opacity: 1
                  }
                }
              }}
            >
              <Box sx={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: card.gradient }} />
              <CardContent sx={{ p: { xs: 2.2, sm: 3 } }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "0.75rem", letterSpacing: 0.8 }}>
                    {card.title}
                  </Typography>
                  <Avatar sx={{ width: 36, height: 36, background: card.gradient, color: "#fff" }}>
                    {card.icon}
                  </Avatar>
                </Box>
                
                <Typography variant="h6" sx={{ fontWeight: 900, mb: 0.5, color: "text.primary", fontSize: { xs: "1.15rem", sm: "1.3rem" } }}>
                  {card.value}
                </Typography>
                
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    {card.sub}
                  </Typography>
                  <Box className="arrow-icon" sx={{ opacity: 0.5, transition: "transform 0.2s, opacity 0.2s", display: "flex", alignItems: "center", color: card.color }}>
                    <ArrowRight size={16} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Business Metrics & Profit Summary Banner */}
      <Paper sx={{ p: { xs: 2.2, sm: 3.5 }, borderRadius: 3.5, border: "1px solid rgba(255,255,255,0.08)", bgcolor: "background.paper", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Typography variant="subtitle1" fontWeight={800} display="flex" alignItems="center" gap={1} sx={{ fontSize: { xs: "0.95rem", sm: "1.1rem" } }}>
            <TrendingUp size={20} style={{ color: "#2dd4bf" }} /> Business Financial Metrics Summary
          </Typography>
          <Chip
            label={(stats?.netProfit || 0) >= 0 ? "PROFITABLE" : "EXPENSE HIGH"}
            color={(stats?.netProfit || 0) >= 0 ? "success" : "error"}
            size="small"
            sx={{ fontWeight: 800 }}
          />
        </Box>
        <Divider sx={{ mb: 2.5 }} />

        <Grid container spacing={2} sx={{ textAlign: "center" }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(45, 212, 191, 0.05)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
                Total Billed Revenue
              </Typography>
              <Typography variant="h6" fontWeight={900} color="#2dd4bf" sx={{ mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                ₹{(stats?.totalBilledRevenue || 0).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(248, 113, 113, 0.05)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
                Customer Receivables Due
              </Typography>
              <Typography variant="h6" fontWeight={900} color="#f87171" sx={{ mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                ₹{(stats?.totalPendingBalance || 0).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(245, 158, 11, 0.05)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
                Operating Expenses (Fuel + Salary)
              </Typography>
              <Typography variant="h6" fontWeight={900} color="#f59e0b" sx={{ mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                ₹{(stats?.totalExpenses || 0).toLocaleString()}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: "rgba(16, 185, 129, 0.05)" }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: "11px" }}>
                Net Estimated Margin
              </Typography>
              <Typography variant="h6" fontWeight={900} color={(stats?.netProfit || 0) >= 0 ? "#10b981" : "#ef4444"} sx={{ mt: 0.5, fontSize: { xs: "1.2rem", sm: "1.35rem" } }}>
                ₹{(stats?.netProfit || 0).toLocaleString()}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;
