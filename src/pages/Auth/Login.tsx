import React, { useState } from "react";
import { Box, Card, CardContent, Typography, TextField, Button, InputAdornment, IconButton, Alert, Paper } from "@mui/material";
import { Lock, Mail, Eye, EyeOff, Tractor } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    try {
      setError("");
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

      login(data.token, data.user);   // sets localStorage + isAuthenticated = true in context
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message || "Connection to auth server failed.");
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        background: "radial-gradient(circle at top right, #0d9488 0%, #0b0f19 60%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: "100%", p: 2 }}>
        <CardContent>
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 4 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: 3,
                backgroundColor: "rgba(13, 148, 136, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
                color: "primary.main",
              }}
            >
              <Tractor size={32} />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
              Harvester Admin
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Login to access the Management System
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Email or Mobile Number"
              fullWidth
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={18} style={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={18} style={{ color: "#9ca3af" }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button type="submit" variant="contained" color="primary" size="large" fullWidth sx={{ py: 1.5, mt: 1 }}>
              Login
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
