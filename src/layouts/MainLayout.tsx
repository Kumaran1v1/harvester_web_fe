import React, { useState } from "react";
import { Box, Toolbar, useTheme, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import GlobalToast from "../components/GlobalToast";

const SIDEBAR_WIDTH = 260;

export const MainLayout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));

  const handleToggleSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "background.default" }}>
      {/* Top Header */}
      <Header onToggleSidebar={handleToggleSidebar} />

      {/* Navigation Drawer (Sidebar) */}
      <Sidebar mobileOpen={mobileOpen} onToggleSidebar={handleToggleSidebar} />

      {/* Main Page Content Wrapper */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        {/* Spacer for sticky header */}
        <Toolbar />

        {/* Dynamic Nested Page Content */}
        <Box sx={{ flexGrow: 1, py: 1 }}>
          <Outlet />
        </Box>
      </Box>

      {/* Global Toast Notification */}
      <GlobalToast />
    </Box>
  );
};

export default MainLayout;

