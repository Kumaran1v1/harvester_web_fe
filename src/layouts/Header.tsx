import React, { useState } from "react";
import { AppBar, Toolbar, IconButton, Typography, Box, Menu, MenuItem, Avatar, Tooltip } from "@mui/material";
import { LogOut, Menu as MenuIcon, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";

import { useThemeMode } from "../context/ThemeContext";

interface HeaderProps {
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  const navigate = useNavigate();
  const { mode, toggleTheme } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const userName = user.name || "Guest User";
  const userRole = (typeof user.role === "object" ? user.role?.roleCode : user.role) || "GUEST";
  const companyName = user.companyName || "Harvester MS";

  const getInitials = (nameStr: string) => {
    if (!nameStr) return "U";
    const parts = nameStr.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleMenuClose();
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate(ROUTES.LOGIN);
  };

  const isDark = mode === "dark";

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: isDark ? "rgba(11, 15, 25, 0.85)" : "rgba(255, 255, 255, 0.92)",
        backdropFilter: "blur(14px)",
        borderBottom: isDark
          ? "1px solid rgba(255, 255, 255, 0.06)"
          : "1px solid rgba(0, 0, 0, 0.08)",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", px: 2, minHeight: "56px !important" }}>
        {/* Left: Logo + Mobile menu */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={onToggleSidebar}
            sx={{ mr: 0.5, display: { md: "none" }, color: isDark ? "inherit" : "#374151" }}
          >
            <MenuIcon size={20} />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 800,
              fontSize: "1.2rem",
              background: "linear-gradient(90deg, #0d9488, #818cf8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "-0.01em",
            }}
          >
            {companyName.toUpperCase()}
          </Typography>
        </Box>

        {/* Right: Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          {/* Theme Toggle */}
          <Tooltip title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"} arrow>
            <IconButton
              onClick={toggleTheme}
              size="small"
              sx={{
                color: isDark ? "#9ca3af" : "#6b7280",
                transition: "all 0.2s",
                "&:hover": {
                  color: "#0d9488",
                  backgroundColor: isDark
                    ? "rgba(13, 148, 136, 0.12)"
                    : "rgba(13, 148, 136, 0.08)",
                },
              }}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
          </Tooltip>

          {/* User Avatar */}
          <Tooltip title="Account" arrow>
            <IconButton
              edge="end"
              onClick={handleProfileMenuOpen}
              size="small"
              sx={{ ml: 0.5 }}
            >
              <Avatar
                sx={{
                  bgcolor: "primary.main",
                  width: 30,
                  height: 30,
                  fontSize: "0.75rem",
                  fontWeight: 700,
                }}
              >
                {getInitials(userName)}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Profile Menu */}
          <Menu
            anchorEl={anchorEl}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            id="primary-search-account-menu"
            keepMounted
            transformOrigin={{ vertical: "top", horizontal: "right" }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                bgcolor: isDark ? "#111827" : "#ffffff",
                border: isDark
                  ? "1px solid rgba(255, 255, 255, 0.08)"
                  : "1px solid rgba(0, 0, 0, 0.1)",
                boxShadow: isDark
                  ? "0 10px 25px rgba(0,0,0,0.5)"
                  : "0 10px 25px rgba(0,0,0,0.12)",
                mt: 1,
                minWidth: 180,
              },
            }}
          >
            {/* User Info Header Section */}
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderBottom: "1px solid",
                borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
                mb: 0.5,
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 700,
                  color: isDark ? "#f3f4f6" : "#111827",
                  fontSize: "0.875rem",
                  lineHeight: 1.2,
                }}
              >
                {userName}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: isDark ? "#9ca3af" : "#6b7280",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  letterSpacing: "0.03em",
                  mt: 0.5,
                }}
              >
                {userRole}
              </Typography>
            </Box>
            <MenuItem
              onClick={handleLogout}
              sx={{ gap: 1.5, py: 1, color: "error.main", fontSize: "0.875rem" }}
            >
              <LogOut size={15} />
              <Typography variant="body2">Sign Out</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
