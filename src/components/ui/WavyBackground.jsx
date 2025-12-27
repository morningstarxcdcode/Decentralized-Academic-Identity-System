import React, { useEffect, useRef } from "react";

export const WavyBackground = ({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = "fast",
  waveOpacity = 0.5,
  ...props
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const noise = (n) => {
      return Math.sin(n) * Math.cos(n);
    };

    const getSpeed = () => {
      switch (speed) {
        case "slow":
          return 0.001;
        case "fast":
          return 0.002;
        default:
          return 0.001;
      }
    };

    const init = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      let w = (ctx.canvas.width = window.innerWidth);
      let h = (ctx.canvas.height = window.innerHeight);
      ctx.filter = `blur(${blur}px)`;
      let nt = 0;
      
      const handleResize = () => {
        w = ctx.canvas.width = window.innerWidth;
        h = ctx.canvas.height = window.innerHeight;
        ctx.filter = `blur(${blur}px)`;
      };
      
      window.addEventListener('resize', handleResize);

      const render = () => {
        ctx.fillStyle = backgroundFill || "black";
        ctx.globalAlpha = waveOpacity || 0.5;
        ctx.fillRect(0, 0, w, h);
        
        const waveColors = colors ?? [
          "#38bdf8",
          "#818cf8",
          "#c084fc",
          "#e879f9",
          "#22d3ee",
        ];
        
        drawWave(5);
        
        function drawWave(n) {
          nt += getSpeed();
          for (let i = 0; i < n; i++) {
            ctx.beginPath();
            ctx.lineWidth = waveWidth || 50;
            ctx.strokeStyle = waveColors[i % waveColors.length];
            for (let x = 0; x < w; x += 5) {
              var y = noise(x / 800 + 0.3 * i + nt) * 100;
              ctx.lineTo(x, y + h * 0.5);
            }
            ctx.stroke();
            ctx.closePath();
          }
        }
        requestAnimationFrame(render);
      };
      render();
      
      return () => {
          window.removeEventListener('resize', handleResize);
      };
    };

    const cleanup = init();
    return () => {
      if (cleanup) cleanup();
    };
  }, [backgroundFill, blur, colors, speed, waveOpacity, waveWidth]);

  return (
    <div
      className={`min-h-screen relative overflow-x-hidden ${containerClassName}`}
      style={{position: 'relative', minHeight: '100vh'}}
    >
      <canvas
        className="fixed inset-0 z-0 pointer-events-none"
        ref={canvasRef}
        id="canvas"
        style={{position: 'fixed', top: 0, left: 0, zIndex: 0, width: '100%', height: '100%'}}
      ></canvas>
      <div className={`relative z-10 ${className}`} {...props}>
        {children}
      </div>
    </div>
  );
};
