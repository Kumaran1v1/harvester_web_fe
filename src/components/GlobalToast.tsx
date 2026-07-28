import React from "react";
import { Snackbar, Alert } from "@mui/material";
import { useAppSelector, useAppDispatch } from "../hooks/storeHooks";
import { hideToast } from "../redux/toast/toastSlice";
import { RootState } from "../app/store";

const GlobalToast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { open, message, severity } = useAppSelector((state: RootState) => state.toast);

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") return;
    dispatch(hideToast());
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: "top", horizontal: "right" }}
      sx={{ mt: 7 }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{
          width: "100%",
          borderRadius: 2,
          fontWeight: 500,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          "& .MuiAlert-icon": { fontSize: 22 },
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default GlobalToast;
