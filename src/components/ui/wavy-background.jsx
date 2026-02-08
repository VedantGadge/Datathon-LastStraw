"use client";
import { cn } from "@/lib/utils";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { createNoise3D } from "simplex-noise";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  colorsLight,
  waveWidth,
  backgroundFill,
  backgroundFillLight,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const noise = createNoise3D();
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const [isDark, setIsDark] = useState(true);

  // Detect theme
  useEffect(() => {
    const checkTheme = () => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    };

    checkTheme();

    // Observe class changes on html element
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  const getSpeed = useCallback(() => {
    switch (speed) {
      case "slow":
        return 0.001;
      case "fast":
        return 0.002;
      default:
        return 0.001;
    }
  }, [speed]);

  const darkColors = colors ?? [
    "#f97316",
    "#fb923c",
    "#fdba74",
    "#fed7aa",
    "#ea580c",
  ];

  const lightColors = colorsLight ?? [
    "#fed7aa",
    "#fdba74",
    "#fb923c",
    "#f97316",
    "#ea580c",
  ];

  const darkBg = backgroundFill || "#09090b";
  const lightBg = backgroundFillLight || "#fafafa";

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let w = ctx.canvas.width = window.innerWidth;
    let h = ctx.canvas.height = window.innerHeight;
    ctx.filter = `blur(${blur}px)`;
    let nt = 0;

    const handleResize = () => {
      w = ctx.canvas.width = window.innerWidth;
      h = ctx.canvas.height = window.innerHeight;
      ctx.filter = `blur(${blur}px)`;
    };

    window.addEventListener("resize", handleResize);

    const waveColors = isDark ? darkColors : lightColors;
    const bgFill = isDark ? darkBg : lightBg;

    const drawWave = (n) => {
      nt += getSpeed();
      for (let i = 0; i < n; i++) {
        ctx.beginPath();
        ctx.lineWidth = waveWidth || 50;
        ctx.strokeStyle = waveColors[i % waveColors.length];
        for (let x = 0; x < w; x += 5) {
          const y = noise(x / 800, 0.3 * i, nt) * 100;
          ctx.lineTo(x, y + h * 0.5);
        }
        ctx.stroke();
        ctx.closePath();
      }
    };

    const render = () => {
      ctx.fillStyle = bgFill;
      ctx.globalAlpha = waveOpacity || 0.5;
      ctx.fillRect(0, 0, w, h);
      drawWave(5);
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isDark, blur, waveWidth, waveOpacity, getSpeed, noise, darkColors, lightColors, darkBg, lightBg]);

  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(typeof window !== "undefined" &&
      navigator.userAgent.includes("Safari") &&
      !navigator.userAgent.includes("Chrome"));
  }, []);

  return (
    <div
      className={cn("h-screen flex flex-col items-center justify-center", containerClassName)}>
      <canvas
        className="absolute inset-0 z-0"
        ref={canvasRef}
        id="canvas"
        style={{
          ...(isSafari ? { filter: `blur(${blur}px)` } : {}),
        }}></canvas>
      <div className={cn("relative z-10", className)} {...props}>
        {children}
      </div>
    </div>
  );
};

