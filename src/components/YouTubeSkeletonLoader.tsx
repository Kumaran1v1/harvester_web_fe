import React from "react";
import { Box, Card, CardContent, Grid, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, useTheme } from "@mui/material";

/**
 * Single YouTube-style Shimmer Card Skeleton
 * Matching YouTube video/card layout: Thumbnail/Icon placeholder, title, and metadata lines.
 */
export const YouTubeCardSkeleton: React.FC<{ height?: number }> = ({ height = 140 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Card
      sx={{
        borderRadius: 3,
        bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
        border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
        p: 2,
        height: height,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        boxShadow: "none",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        {/* Circle avatar / icon placeholder */}
        <Skeleton
          variant="circular"
          width={48}
          height={48}
          animation="wave"
          sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
        />
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton
            variant="text"
            width="60%"
            height={24}
            animation="wave"
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}
          />
          <Skeleton
            variant="text"
            width="40%"
            height={18}
            animation="wave"
            sx={{ bgcolor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }}
          />
        </Box>
      </Box>

      <Box sx={{ mt: 2 }}>
        <Skeleton
          variant="rectangular"
          width="85%"
          height={28}
          animation="wave"
          sx={{ borderRadius: 1.5, bgcolor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }}
        />
      </Box>
    </Card>
  );
};

/**
 * YouTube Dashboard Skeleton Loader
 * Top header banner + stat card grid + recent activity cards
 */
export const YouTubeDashboardSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top Banner Skeleton */}
      <Skeleton
        variant="rectangular"
        width="100%"
        height={90}
        animation="wave"
        sx={{
          borderRadius: 3,
          bgcolor: isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)",
        }}
      />

      {/* Grid of Stat Cards Skeletons */}
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <YouTubeCardSkeleton height={150} />
          </Grid>
        ))}
      </Grid>

      {/* Large Chart / Content Section Skeleton */}
      <Card
        sx={{
          borderRadius: 3,
          p: 3,
          bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
          boxShadow: "none",
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
          <Skeleton variant="text" width="30%" height={28} animation="wave" />
          <Skeleton variant="rectangular" width={100} height={32} animation="wave" sx={{ borderRadius: 2 }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={220} animation="wave" sx={{ borderRadius: 2 }} />
      </Card>
    </Box>
  );
};

/**
 * YouTube Table Skeleton Loader
 * Filter bar + Table headers & shimmer rows
 */
export const YouTubeTableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 6,
  columns = 6,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2.5 }}>
      {/* Search & Filter Header Skeleton */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Skeleton variant="rectangular" width={220} height={40} animation="wave" sx={{ borderRadius: 2 }} />
        <Box sx={{ display: "flex", gap: 1.5 }}>
          <Skeleton variant="rectangular" width={120} height={40} animation="wave" sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" width={120} height={40} animation="wave" sx={{ borderRadius: 2 }} />
        </Box>
      </Box>

      {/* Table Container Skeleton */}
      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: 3,
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
          bgcolor: isDark ? "rgba(255, 255, 255, 0.02)" : "#ffffff",
          overflow: "hidden",
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              {Array.from({ length: columns }).map((_, idx) => (
                <TableCell key={idx}>
                  <Skeleton variant="text" width="70%" height={24} animation="wave" />
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <TableRow key={rIdx}>
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <TableCell key={cIdx}>
                    {cIdx === 0 ? (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Skeleton variant="circular" width={34} height={34} animation="wave" />
                        <Skeleton variant="text" width="60%" height={20} animation="wave" />
                      </Box>
                    ) : cIdx === columns - 1 ? (
                      <Skeleton variant="rectangular" width={70} height={26} animation="wave" sx={{ borderRadius: 1.5 }} />
                    ) : (
                      <Skeleton variant="text" width={`${Math.floor(Math.random() * 40) + 40}%`} height={20} animation="wave" />
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

/**
 * YouTube Profile / Details Skeleton Loader
 * Avatar profile card + form fields grid skeleton
 */
export const YouTubeProfileSkeleton: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Profile Header Banner & Avatar Skeleton */}
      <Card
        sx={{
          borderRadius: 3,
          p: 3,
          bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
          border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
          boxShadow: "none",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 3, flexWrap: "wrap" }}>
          <Skeleton variant="circular" width={90} height={90} animation="wave" />
          <Box sx={{ flexGrow: 1 }}>
            <Skeleton variant="text" width="40%" height={32} animation="wave" />
            <Skeleton variant="text" width="25%" height={22} animation="wave" />
            <Skeleton variant="rectangular" width={110} height={26} animation="wave" sx={{ borderRadius: 2, mt: 1 }} />
          </Box>
        </Box>
      </Card>

      {/* Grid of details fields */}
      <Grid container spacing={2.5}>
        {[1, 2, 3, 4, 5, 6].map((key) => (
          <Grid item xs={12} sm={6} md={4} key={key}>
            <Skeleton variant="rectangular" width="100%" height={70} animation="wave" sx={{ borderRadius: 2 }} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

/**
 * YouTube Styled Red Accent Circular Spinner
 * Useful for inline / button loading states
 */
export const YouTubeSpinner: React.FC<{ size?: number; label?: string }> = ({ size = 44, label }) => {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5, py: 3 }}>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          border: "3px solid rgba(255, 0, 0, 0.15)",
          borderTopColor: "#ff0000",
          borderRightColor: "#ff4e45",
          animation: "spin 0.8s linear infinite",
          "@keyframes spin": {
            "0%": { transform: "rotate(0deg)" },
            "100%": { transform: "rotate(360deg)" },
          },
          filter: "drop-shadow(0 0 6px rgba(255,0,0,0.5))",
        }}
      />
      {label && (
        <Box sx={{ fontSize: "13px", fontWeight: 600, color: "text.secondary" }}>
          {label}
        </Box>
      )}
    </Box>
  );
};


/**
 * YouTube Card Grid Skeleton Loader
 * Responsive 6-card grid for card view loading
 */
export const YouTubeCardGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  return (
    <Grid container spacing={2.5}>
      {Array.from({ length: count }).map((_, idx) => (
        <Grid item xs={12} sm={6} lg={4} key={idx}>
          <Card
            sx={{
              borderRadius: 3,
              bgcolor: isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)",
              border: `1px solid ${isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.06)"}`,
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              gap: 2,
              boxShadow: "none",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
                <Skeleton variant="circular" width={40} height={40} animation="wave" />
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="65%" height={22} animation="wave" />
                  <Skeleton variant="text" width="40%" height={16} animation="wave" />
                </Box>
              </Box>
              <Skeleton variant="rectangular" width={80} height={24} animation="wave" sx={{ borderRadius: 2 }} />
            </Box>

            <Box sx={{ display: "flex", gap: 2 }}>
              <Skeleton variant="rectangular" width="50%" height={20} animation="wave" sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width="50%" height={20} animation="wave" sx={{ borderRadius: 1 }} />
            </Box>

            <Skeleton variant="rectangular" width="100%" height={70} animation="wave" sx={{ borderRadius: 2 }} />

            <Box sx={{ display: "flex", justifyContent: "space-between", pt: 1 }}>
              <Skeleton variant="rectangular" width={100} height={32} animation="wave" sx={{ borderRadius: 2 }} />
              <Skeleton variant="rectangular" width={80} height={32} animation="wave" sx={{ borderRadius: 2 }} />
            </Box>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default YouTubeDashboardSkeleton;

