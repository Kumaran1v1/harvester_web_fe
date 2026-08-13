import React from "react";
import { Box, Typography, keyframes } from "@mui/material";
import { Tractor, Sparkles } from "lucide-react";

// Keyframe Animations for Harvester Modal Loader
const harvesterDriveSmooth = keyframes`
  0% {
    transform: translateX(-120%);
  }
  50% {
    transform: translateX(0%);
  }
  100% {
    transform: translateX(120%);
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

interface HarvesterModalLoaderProps {
  loading?: boolean;
  message?: string;
}

export const HarvesterModalLoader: React.FC<HarvesterModalLoaderProps> = ({
  loading = true,
  message = "Processing request...",
}) => {
  if (!loading) return null;

  return (
    <Box
      sx={{
        position: "absolute",
        inset: 0,
        bgcolor: "rgba(5, 8, 17, 0.92)",
        backdropFilter: "blur(14px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1400,
        p: 3,
        borderRadius: "inherit",
      }}
    >
      {/* Animated Cyber Harvester Stage */}
      <Box
        sx={{
          position: "relative",
          width: "100%",
          maxWidth: 340,
          height: "110px",
          bgcolor: "rgba(3, 7, 18, 0.85)",
          borderRadius: "20px",
          border: "1.5px solid rgba(45, 212, 191, 0.4)",
          boxShadow: "0 0 30px rgba(13, 148, 136, 0.35)",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mb: 2,
        }}
      >
        {/* Expanding Energy Pulse Rings */}
        <Box
          sx={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "2px solid #2dd4bf",
            animation: `${ringExpand} 1.2s infinite ease-out`,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 70,
            height: 70,
            borderRadius: "50%",
            border: "2px solid #10b981",
            animation: `${ringExpand} 1.2s infinite ease-out 0.4s`,
          }}
        />

        {/* Driving Harvester Unit */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            animation: `${harvesterDriveSmooth} 1.5s ease-in-out infinite`,
          }}
        >
          {/* Particle Trail */}
          <Box
            sx={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              bgcolor: "#f59e0b",
              boxShadow: "0 0 8px #f59e0b",
              animation: `${trailParticle} 0.6s infinite ease-out`,
            }}
          />

          {/* Harvester Icon Badge */}
          <Box
            sx={{
              position: "relative",
              width: 52,
              height: 52,
              borderRadius: "50%",
              bgcolor: "rgba(13, 148, 136, 0.35)",
              border: "2px solid #2dd4bf",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#2dd4bf",
              boxShadow: "0 0 25px #2dd4bf",
            }}
          >
            <Tractor size={30} style={{ animation: `${spinReel} 0.9s linear infinite` }} />
            <Sparkles
              size={14}
              style={{
                position: "absolute",
                top: -4,
                right: -4,
                color: "#f59e0b",
                animation: `${spinReel} 1.2s linear infinite`,
              }}
            />
          </Box>
        </Box>

        {/* Laser Field Track */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "linear-gradient(90deg, #0d9488 0%, #2dd4bf 50%, #10b981 100%)",
            boxShadow: "0 0 15px #2dd4bf",
          }}
        />
      </Box>

      {/* Message Label */}
      {message && (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "#2dd4bf",
            fontSize: "13.5px",
            letterSpacing: "0.3px",
            textAlign: "center",
          }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default HarvesterModalLoader;
