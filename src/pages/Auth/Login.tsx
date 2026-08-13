import React, { useState } from "react";
import {
  Box, Card, CardContent, Typography, TextField, Button,
  InputAdornment, IconButton, Alert, keyframes
} from "@mui/material";
import { Lock, Mail, Eye, EyeOff, Tractor, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// Gen-Z Cyber Keyframes
const neonPulse = keyframes`
  0%, 100% {
    box-shadow: 0 0 25px rgba(13, 148, 136, 0.35), 0 0 50px rgba(16, 185, 129, 0.15);
    border-color: rgba(45, 212, 191, 0.4);
  }
  50% {
    box-shadow: 0 0 35px rgba(45, 212, 191, 0.6), 0 0 70px rgba(13, 148, 136, 0.3);
    border-color: rgba(45, 212, 191, 0.8);
  }
`;

const meshFloat1 = keyframes`
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(30px, -40px) scale(1.15); }
`;

const meshFloat2 = keyframes`
  0%, 100% { transform: translate(0px, 0px) scale(1); }
  50% { transform: translate(-35px, 35px) scale(1.2); }
`;

// Pure Animation Loader Keyframes
const harvesterDriveSmooth = keyframes`
  0% {
    transform: translateX(-130%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(130%);
  }
`;

const spinReel = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const ringExpand = keyframes`
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
`;

const trailParticle = keyframes`
  0% {
    transform: translate(0, 0) scale(1);
    opacity: 0.9;
  }
  100% {
    transform: translate(-30px, -15px) scale(0.2);
    opacity: 0;
  }
`;

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      setError("");
      setLoading(true);

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Invalid email/mobile or password.");
      }
      if (!data.token) {
        throw new Error("Login succeeded but no token was returned.");
      }

      // Fast pure animation loader before navigating
      setTimeout(() => {
        login(data.token, data.user);
        navigate("/dashboard", { replace: true });
      }, 950);

    } catch (err: any) {
      setError(err.message || "Connection to auth server failed.");
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "#050811",
        position: "relative",
        overflow: "hidden",
        p: 2.5,
      }}
    >
      {/* Glowing Ambient Orbs */}
      <Box
        sx={{
          position: "absolute",
          top: "15%",
          left: "18%",
          width: "380px",
          height: "380px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(13, 148, 136, 0.28) 0%, transparent 70%)",
          filter: "blur(50px)",
          animation: `${meshFloat1} 8s infinite ease-in-out`,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: "12%",
          right: "15%",
          width: "420px",
          height: "420px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(16, 185, 129, 0.22) 0%, transparent 70%)",
          filter: "blur(60px)",
          animation: `${meshFloat2} 10s infinite ease-in-out`,
          pointerEvents: "none",
        }}
      />

      {/* Grid Overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />

      {/* Main Glass Card */}
      <Card
        sx={{
          maxWidth: 430,
          width: "100%",
          borderRadius: "28px",
          bgcolor: "rgba(11, 17, 32, 0.75)",
          backdropFilter: "blur(32px)",
          border: "1px solid rgba(45, 212, 191, 0.4)",
          animation: `${neonPulse} 4s infinite ease-in-out`,
          position: "relative",
          zIndex: 2,
          overflow: "hidden",
        }}
      >
        <CardContent sx={{ p: { xs: 3.5, sm: 4.5 } }}>
          {/* Header */}
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4, textAlign: "center" }}>
            <Box
              sx={{
                width: 62,
                height: 62,
                borderRadius: "20px",
                background: "linear-gradient(135deg, rgba(13, 148, 136, 0.25) 0%, rgba(16, 185, 129, 0.15) 100%)",
                border: "1px solid rgba(45, 212, 191, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#2dd4bf",
                mb: 2,
                boxShadow: "0 0 20px rgba(13, 148, 136, 0.3)",
              }}
            >
              <Tractor size={32} />
            </Box>

            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                fontSize: "1.85rem",
                letterSpacing: "-0.5px",
                background: "linear-gradient(135deg, #ffffff 30%, #2dd4bf 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                mb: 0.5,
              }}
            >
              HARVESTER ADMIN
            </Typography>
            <Typography variant="body2" sx={{ color: "#94a3b8", fontSize: "13.5px", fontWeight: 500 }}>
              Gunal Harvester's Management System
            </Typography>
          </Box>

          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              sx={{
                mb: 3,
                borderRadius: "14px",
                bgcolor: "rgba(239, 68, 68, 0.14)",
                color: "#fca5a5",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontSize: "13px",
                fontWeight: 600,
                "& .MuiAlert-icon": { color: "#ef4444" },
              }}
            >
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.8 }}>
            <TextField
              label="Email or Mobile Number"
              variant="outlined"
              fullWidth
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
              placeholder="e.g. 9080076414 or email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={19} style={{ color: "#2dd4bf" }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  bgcolor: "rgba(15, 23, 42, 0.65)",
                  color: "#f8fafc",
                  fontSize: "14px",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(45, 212, 191, 0.5)" },
                  "&.Mui-focused fieldset": { borderColor: "#2dd4bf", boxShadow: "0 0 12px rgba(45, 212, 191, 0.25)" },
                },
                "& .MuiInputLabel-root": { color: "#94a3b8", fontSize: "13.5px" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#2dd4bf" },
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="Enter your password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={19} style={{ color: "#2dd4bf" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: "#94a3b8", "&:hover": { color: "#2dd4bf" } }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "16px",
                  bgcolor: "rgba(15, 23, 42, 0.65)",
                  color: "#f8fafc",
                  fontSize: "14px",
                  "& fieldset": { borderColor: "rgba(255, 255, 255, 0.12)" },
                  "&:hover fieldset": { borderColor: "rgba(45, 212, 191, 0.5)" },
                  "&.Mui-focused fieldset": { borderColor: "#2dd4bf", boxShadow: "0 0 12px rgba(45, 212, 191, 0.25)" },
                },
                "& .MuiInputLabel-root": { color: "#94a3b8", fontSize: "13.5px" },
                "& .MuiInputLabel-root.Mui-focused": { color: "#2dd4bf" },
              }}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              fullWidth
              sx={{
                py: 1.6,
                mt: 0.5,
                borderRadius: "16px",
                fontWeight: 800,
                fontSize: "15px",
                textTransform: "none",
                background: "linear-gradient(135deg, #0d9488 0%, #10b981 100%)",
                boxShadow: "0 10px 30px rgba(13, 148, 136, 0.45)",
                color: "#ffffff",
                transition: "all 0.25s ease",
                "&:hover": {
                  background: "linear-gradient(135deg, #14b8a6 0%, #34d399 100%)",
                  boxShadow: "0 12px 35px rgba(45, 212, 191, 0.6)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Login
            </Button>
          </Box>
        </CardContent>

        {/* PURE ANIMATION HARVESTER LOADER OVERLAY (ZERO TEXT CONTENT) */}
        {loading && (
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(5, 8, 17, 0.95)",
              backdropFilter: "blur(24px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              p: 3,
            }}
          >
            {/* Pure Animation Stage */}
            <Box
              sx={{
                position: "relative",
                width: "100%",
                height: "140px",
                bgcolor: "rgba(3, 7, 18, 0.85)",
                borderRadius: "24px",
                border: "1.5px solid rgba(45, 212, 191, 0.4)",
                boxShadow: "0 0 35px rgba(13, 148, 136, 0.4)",
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Expanding Energy Pulse Rings */}
              <Box
                sx={{
                  position: "absolute",
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  border: "2px solid #2dd4bf",
                  animation: `${ringExpand} 1.2s infinite ease-out`,
                }}
              />
              <Box
                sx={{
                  position: "absolute",
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  border: "2px solid #10b981",
                  animation: `${ringExpand} 1.2s infinite ease-out 0.4s`,
                }}
              />

              {/* Driving Cyber Harvester Unit with Spinning Cutter & Particles */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: `${harvesterDriveSmooth} 1.6s ease-in-out infinite`,
                }}
              >
                {/* Trail Particles */}
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "#f59e0b",
                    boxShadow: "0 0 10px #f59e0b",
                    animation: `${trailParticle} 0.6s infinite ease-out`,
                  }}
                />

                {/* Harvester Machine Circular Glowing Badge */}
                <Box
                  sx={{
                    position: "relative",
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    bgcolor: "rgba(13, 148, 136, 0.35)",
                    border: "2px solid #2dd4bf",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#2dd4bf",
                    boxShadow: "0 0 30px #2dd4bf, inset 0 0 15px rgba(45, 212, 191, 0.5)",
                  }}
                >
                  <Tractor size={36} style={{ animation: `${spinReel} 0.9s linear infinite` }} />
                  <Sparkles
                    size={16}
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      color: "#f59e0b",
                      animation: `${spinReel} 1.2s linear infinite`,
                    }}
                  />
                </Box>
              </Box>

              {/* Laser Ground Field Track */}
              <Box
                sx={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: "5px",
                  background: "linear-gradient(90deg, #0d9488 0%, #2dd4bf 50%, #10b981 100%)",
                  boxShadow: "0 0 20px #2dd4bf",
                }}
              />
            </Box>
          </Box>
        )}
      </Card>
    </Box>
  );
};

export default Login;
