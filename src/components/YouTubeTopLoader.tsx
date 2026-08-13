import React, { useEffect, useState } from "react";
import { Box, keyframes } from "@mui/material";
import { useLocation } from "react-router-dom";

const shimmerWave = keyframes`
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
`;

const pulseGlow = keyframes`
  0%, 100% {
    box-shadow: 0 0 10px #ff0000, 0 0 5px #ff0000;
  }
  50% {
    box-shadow: 0 0 18px #ff4e45, 0 0 10px #ff4e45;
  }
`;

interface YouTubeTopLoaderProps {
  isLoading?: boolean;
  color?: string;
  height?: number;
}

export const YouTubeTopLoader: React.FC<YouTubeTopLoaderProps> = ({
  isLoading,
  color = "#ff0000",
  height = 3,
}) => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [active, setActive] = useState(false);

  // Trigger loading progress on route location change or explicit isLoading prop
  useEffect(() => {
    setActive(true);
    setProgress(20);

    const timer1 = setTimeout(() => setProgress(70), 120);
    const timer2 = setTimeout(() => setProgress(100), 300);
    const timer3 = setTimeout(() => {
      setActive(false);
      setProgress(0);
    }, 550);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [location.pathname, location.search, isLoading]);

  if (!active && progress === 0 && !isLoading) {
    return null;
  }

  const currentProgress = isLoading ? 85 : progress;

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: `${height}px`,
        zIndex: 99999,
        pointerEvents: "none",
        backgroundColor: "transparent",
      }}
    >
      {/* Animated Top Progress Bar */}
      <Box
        sx={{
          height: "100%",
          width: `${currentProgress}%`,
          transition: "width 250ms ease-out, opacity 200ms ease",
          background: `linear-gradient(90deg, ${color} 0%, #ff4e45 50%, #ff857e 100%)`,
          backgroundSize: "200% 100%",
          animation: `${shimmerWave} 1.5s infinite linear, ${pulseGlow} 1.2s infinite ease-in-out`,
          position: "relative",
          borderTopRightRadius: 2,
          borderBottomRightRadius: 2,
        }}
      >
        {/* Leading glowing edge (YouTube style red head glow) */}
        <Box
          sx={{
            position: "absolute",
            right: 0,
            top: "-2px",
            width: "100px",
            height: `${height + 4}px`,
            background: "transparent",
            boxShadow: `0 0 12px ${color}, 0 0 8px #ff4e45`,
            transform: "rotate(3deg) translate(0px, -4px)",
            opacity: 0.9,
          }}
        />
      </Box>
    </Box>
  );
};

export default YouTubeTopLoader;
