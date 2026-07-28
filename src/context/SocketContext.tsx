import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAppDispatch } from '../hooks/storeHooks';
import { showToast } from '../redux/toast/toastSlice';
import { Box, Typography, Button, Paper } from '@mui/material';

interface SocketContextType {
  socket: Socket | null;
}

const SocketContext = createContext<SocketContextType>({ socket: null });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [simulatedMsg, setSimulatedMsg] = useState<{ mobile: string; message: string; type: 'SMS' | 'WHATSAPP' } | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Connect to backend socket server
    const newSocket = io('http://localhost:5000');
    setSocket(newSocket);

    // Join room based on user role and profile ID
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const roleCode = user.role?.roleCode || user.role;
      const profileId = user.profileId || user.id; // Fallback to ID if profileId not present
      if (roleCode && profileId) {
        newSocket.emit('join', `${roleCode}_${profileId}`);
      }
    }

    // Listen for global push notifications
    newSocket.on('notification', (data: { message: string, severity: 'success' | 'info' | 'warning' | 'error' }) => {
      dispatch(showToast({ message: data.message, severity: data.severity }));
    });

    // Listen for local mock message simulation
    newSocket.on('simulation_message', (data: { mobile: string, message: string, type: 'SMS' | 'WHATSAPP' }) => {
      setSimulatedMsg(data);
    });

    return () => {
      newSocket.close();
    };
  }, [dispatch]);

  useEffect(() => {
    if (simulatedMsg) {
      const timer = setTimeout(() => setSimulatedMsg(null), 12000);
      return () => clearTimeout(timer);
    }
  }, [simulatedMsg]);

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}

      {/* Virtual Mobile Notification Simulation HUD */}
      {simulatedMsg && (
        <Paper
          elevation={16}
          sx={{
            position: "fixed",
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: "90%",
            maxWidth: 380,
            bgcolor: "rgba(15, 23, 42, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            borderRadius: 3,
            p: 2,
            color: "white",
            animation: "slideUp 0.3s ease-out",
            "@keyframes slideUp": {
              from: { transform: "translateY(100px)", opacity: 0 },
              to: { transform: "translateY(0)", opacity: 1 },
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Box
                sx={{
                  width: 24,
                  height: 24,
                  bgcolor: simulatedMsg.type === "WHATSAPP" ? "#25d366" : "#007aff",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.68rem",
                  fontWeight: "bold",
                }}
              >
                {simulatedMsg.type === "WHATSAPP" ? "WA" : "SMS"}
              </Box>
              <Typography variant="caption" sx={{ fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5 }}>
                {simulatedMsg.type === "WHATSAPP" ? "WHATSAPP RECEIVER SIMULATOR" : "SMS RECEIVER SIMULATOR"}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => setSimulatedMsg(null)}
              sx={{ color: "rgba(255,255,255,0.5)", minWidth: 0, p: 0.5, fontSize: "0.75rem", "&:hover": { color: "white" } }}
            >
              Dismiss
            </Button>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontWeight: 600 }}>
            Simulated Phone Number: <strong>{simulatedMsg.mobile}</strong>
          </Typography>
          <Typography
            variant="body2"
            sx={{
              whiteSpace: "pre-line",
              fontFamily: "monospace",
              fontSize: "0.78rem",
              bgcolor: "rgba(255,255,255,0.06)",
              p: 1.5,
              borderRadius: 2,
              border: "1px solid rgba(255,255,255,0.08)",
              maxHeight: 180,
              overflowY: "auto",
            }}
          >
            {simulatedMsg.message}
          </Typography>
        </Paper>
      )}
    </SocketContext.Provider>
  );
};
