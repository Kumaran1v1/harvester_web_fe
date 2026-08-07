import React from "react";
import { Box, TextField, Button, ToggleButtonGroup, ToggleButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { Calendar, Globe, RotateCcw } from "lucide-react";

export interface MonthFilterState {
  month: number; // 1 to 12
  year: number;  // e.g. 2026
  isOverall: boolean;
}

interface MonthFilterBarProps {
  filterState: MonthFilterState;
  onChange: (newState: MonthFilterState) => void;
}

export const MonthFilterBar: React.FC<MonthFilterBarProps> = ({ filterState, onChange }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const handleModeChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMode: "MONTHLY" | "OVERALL" | null
  ) => {
    if (!newMode) return;
    onChange({
      ...filterState,
      isOverall: newMode === "OVERALL",
    });
  };

  const handleResetToCurrentMonth = () => {
    onChange({
      month: currentMonth,
      year: currentYear,
      isOverall: false,
    });
  };

  const isCurrentMonthActive = filterState.month === currentMonth && filterState.year === currentYear && !filterState.isOverall;

  // Format month value as YYYY-MM for native HTML5 month calendar picker
  const monthValueStr = `${filterState.year}-${String(filterState.month).padStart(2, "0")}`;

  return (
    <Box
      display="flex"
      flexDirection="column"
      gap={1.2}
      sx={{
        p: { xs: 1.2, sm: 1.5 },
        borderRadius: 2.5,
        bgcolor: "rgba(255, 255, 255, 0.03)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      {/* Mode Toggle Button Group */}
      <ToggleButtonGroup
        value={filterState.isOverall ? "OVERALL" : "MONTHLY"}
        exclusive
        onChange={handleModeChange}
        size="small"
        fullWidth
        sx={{
          bgcolor: "background.paper",
          borderRadius: 2,
          p: 0.3,
          "& .MuiToggleButton-root": {
            flex: 1,
            fontWeight: 700,
            py: 0.8,
            px: { xs: 1, sm: 2 },
            fontSize: { xs: "12px", sm: "13px" },
            textTransform: "none",
            gap: 0.8,
            borderRadius: 1.5,
            border: "none",
            color: "text.secondary",
            "&.Mui-selected": {
              bgcolor: "primary.main",
              color: "#fff",
              "&:hover": { bgcolor: "primary.dark" },
            },
          },
        }}
      >
        <ToggleButton value="MONTHLY">
          <Calendar size={14} />
          {isMobile ? "Monthly" : "Monthly Filter"}
        </ToggleButton>
        <ToggleButton value="OVERALL">
          <Globe size={14} />
          {isMobile ? "All-Time" : "Overall (All-Time)"}
        </ToggleButton>
      </ToggleButtonGroup>

      {/* Controls Container */}
      {!filterState.isOverall ? (
        <Box
          display="flex"
          alignItems="center"
          gap={1}
          sx={{ width: "100%" }}
        >
          {/* Dynamic HTML5 Month/Year Calendar Field */}
          <TextField
            type="month"
            label="Filter Month & Year"
            size="small"
            value={monthValueStr}
            onChange={(e) => {
              if (e.target.value) {
                const [y, m] = e.target.value.split("-").map(Number);
                onChange({
                  month: m,
                  year: y,
                  isOverall: false,
                });
              }
            }}
            InputLabelProps={{ shrink: true }}
            sx={{
              flex: 1,
              bgcolor: "background.paper",
              borderRadius: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                fontWeight: 700,
                fontSize: { xs: "12px", sm: "13px" },
              },
            }}
          />

          {/* Reset to Current Month Button */}
          {!isCurrentMonthActive && (
            <Button
              size="small"
              variant="outlined"
              color="primary"
              onClick={handleResetToCurrentMonth}
              sx={{
                borderRadius: 2,
                fontWeight: 700,
                textTransform: "none",
                py: 0.9,
                px: { xs: 1.2, sm: 1.8 },
                fontSize: { xs: "11px", sm: "12px" },
                whiteSpace: "nowrap",
                minWidth: "auto",
                height: 40,
              }}
            >
              <RotateCcw size={13} style={{ marginRight: 4 }} />
              {isMobile ? "Current" : "This Month"}
            </Button>
          )}
        </Box>
      ) : (
        <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 0.5 }}>
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700, textAlign: "center" }}>
            Showing all historical records across all months
          </Typography>
        </Box>
      )}
    </Box>
  );
};
