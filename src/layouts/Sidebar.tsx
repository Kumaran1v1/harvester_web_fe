import React from "react";
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, Box } from "@mui/material";
import { useLocation, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";
import {
  LayoutDashboard, User, FileText, CreditCard,
  Tractor, Users
} from "lucide-react";

interface SidebarProps {
  mobileOpen: boolean;
  onToggleSidebar: () => void;
}

const SIDEBAR_WIDTH = 260;

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onToggleSidebar }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (mobileOpen) onToggleSidebar();
  };

  const isSelected = (path: string) =>
    location.pathname === path || (path !== "/" && location.pathname.startsWith(path));

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;
  const companyName = user?.companyName || "Owner Portal";

  const menuItems = [
    { label: "Dashboard", path: ROUTES.DASHBOARD, icon: LayoutDashboard },
    { label: "Personal Details", path: ROUTES.PERSONAL_DETAILS, icon: User },
    { label: "Bills", path: ROUTES.BILLS, icon: FileText },
    { label: "Pending Bills", path: ROUTES.PENDING_BILLS, icon: CreditCard },
    { label: "Operator Records", path: ROUTES.OPERATORS, icon: Users },
    { label: "Bunk Details", path: ROUTES.BUNK_DETAILS, icon: Tractor },
  ];

  const drawerContent = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Brand Header */}
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", gap: 0.5, borderBottom: "1px solid", borderColor: "divider" }}>
        <Typography variant="h6" sx={{ fontWeight: 800, color: "text.primary", display: "flex", alignItems: "center", gap: 1 }}>
          <Tractor size={22} style={{ color: "#0d9488" }} />
          {companyName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Owner Control Center
        </Typography>
      </Box>

      {/* Navigation List */}
      <List sx={{ px: 1.5, mt: 1.5 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            px: 1.5,
            mb: 0.8,
            display: "block",
            fontSize: "0.7rem",
          }}
        >
          Main Menu
        </Typography>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isSelected(item.path);
          return (
            <ListItemButton
              key={item.path}
              onClick={() => handleNavigation(item.path)}
              sx={{
                borderRadius: 2,
                mb: 0.4,
                py: 1,
                px: 1.5,
                backgroundColor: active ? "rgba(13, 148, 136, 0.08)" : "transparent",
                borderLeft: active ? "3px solid #0d9488" : "3px solid transparent",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 32, color: active ? "primary.light" : "text.secondary" }}>
                <Icon size={18} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: "0.85rem",
                  fontWeight: active ? 600 : 500,
                  color: active ? "primary.light" : "text.primary",
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onToggleSidebar}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: SIDEBAR_WIDTH,
            backgroundColor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", md: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: SIDEBAR_WIDTH,
            backgroundColor: "background.paper",
            borderRight: "1px solid",
            borderColor: "divider",
            top: 64, // below header
            height: "calc(100vh - 64px)",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
};

export default Sidebar;
