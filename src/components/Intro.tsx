import React, { useEffect, useRef, useState } from 'react';

export default function Intro({ onComplete, onStart }: { onComplete: () => void, onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFading, setIsFading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!hasStarted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const startTime = Date.now();
    
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const stars: { x: number; y: number; z: number; size: number; color: string }[] = [];
    for (let i = 0; i < 1500; i++) {
      stars.push({
        x: (Math.random() - 0.5) * 4000,
        y: (Math.random() - 0.5) * 4000,
        z: Math.random() * 4000,
        size: Math.random() * 2 + 0.5,
        color: `hsl(${Math.random() * 60 + 200}, 100%, ${Math.random() * 50 + 50}%)`
      });
    }

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
      ctx.fillRect(0, 0, width, height);

      // Phase 1: Domain Expansion (0 - 3s)
      // A dark sphere expands from the center
      if (elapsed < 3000) {
        const progress = elapsed / 3000;
        const radius = progress * Math.max(width, height) * 1.5;
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(5, 5, 10, ${progress})`;
        ctx.fill();
        ctx.lineWidth = 5;
        ctx.strokeStyle = `rgba(100, 150, 255, ${1 - progress})`;
        ctx.stroke();
        ctx.restore();
        
        // Add some "domain" grid lines
        ctx.strokeStyle = `rgba(100, 150, 255, ${0.2 * Math.sin(progress * Math.PI)})`;
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 50) {
          ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
        }
        for (let i = 0; i < height; i += 50) {
          ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
        }
      }

      // Phase 2: Infinite Void / Warp Speed (3s - 5s)
      if (elapsed >= 3000 && elapsed < 5500) {
        const speedMultiplier = elapsed > 4500 ? (elapsed - 4500) / 10 : 10;
        
        stars.forEach(star => {
          star.z -= speedMultiplier;
          if (star.z <= 0) {
            star.z = 4000;
            star.x = (Math.random() - 0.5) * 4000;
            star.y = (Math.random() - 0.5) * 4000;
          }

          const perspective = 800 / star.z;
          const px = cx + star.x * perspective;
          const py = cy + star.y * perspective;
          const pSize = star.size * perspective;

          if (px >= 0 && px <= width && py >= 0 && py <= height) {
            ctx.beginPath();
            ctx.arc(px, py, pSize, 0, Math.PI * 2);
            ctx.fillStyle = star.color;
            ctx.fill();
          }
        });
      }

      // Phase 3: Supernova Climax (5s - 6.5s)
      if (elapsed >= 5000 && elapsed < 6500) {
        const progress = (elapsed - 5000) / 1500;
        const radius = progress * Math.max(width, height) * 2;
        
        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${progress * 2})`);
        gradient.addColorStop(0.5, `rgba(200, 220, 255, ${progress * 1.5})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Phase 4: Whiteout and Fade (6s - 7s)
      if (elapsed >= 6000) {
        ctx.fillStyle = `rgba(255, 255, 255, 1)`;
        ctx.fillRect(0, 0, width, height);
        
        if (!isFading) {
            setIsFading(true);
        }
      }

      if (elapsed < 7000) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [onComplete, isFading, hasStarted]);

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        pointerEvents: hasStarted ? 'none' : 'auto',
        opacity: isFading ? 0 : 1,
        transition: 'opacity 1s ease-out',
        backgroundColor: 'black',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {!hasStarted && (
        <button 
          onClick={() => {
            setHasStarted(true);
            onStart();
          }}
          style={{
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            color: 'white',
            background: 'transparent',
            border: '2px solid white',
            borderRadius: '8px',
            cursor: 'pointer',
            zIndex: 100000,
            fontFamily: 'monospace',
            textTransform: 'uppercase',
            letterSpacing: '0.1em'
          }}
        >
          Enter Nexus
        </button>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
    </div>
  );
}
