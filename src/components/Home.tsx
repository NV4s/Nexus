import React, { useEffect, useRef, useState } from 'react';
import { getRandomGreeting } from '../data/greetings';
import { Instagram } from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export default function Home({ setActiveTab }: HomeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    setGreeting(getRandomGreeting());
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const mouse = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0 };
    let lastMouse = { x: canvas.width / 2, y: canvas.height / 2 };
    let isClicking = false;

    // Event listeners moved below Particle class to access particles array

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      baseSize: number;
      life: number;

      constructor(x?: number, y?: number, isTemporary: boolean = false) {
        this.x = x !== undefined ? x : Math.random() * canvas!.width;
        this.y = y !== undefined ? y : Math.random() * canvas!.height;
        
        if (isTemporary) {
          this.vx = (Math.random() - 0.5) * 12;
          this.vy = (Math.random() - 0.5) * 12;
          this.life = 1.0;
        } else {
          this.vx = (Math.random() - 0.5) * 2;
          this.vy = (Math.random() - 0.5) * 2;
          this.life = Infinity;
        }
        
        this.baseSize = Math.random() * 2 + 1;
        this.size = this.baseSize;
      }

      update() {
        if (this.life !== Infinity) {
          this.life -= 0.015;
        }
        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (isClicking && dist < 400) {
          // Attract to mouse when clicking and dragging
          const angle = Math.atan2(dy, dx);
          const force = (400 - dist) / 400;
          
          // Pull towards center
          this.vx += Math.cos(angle) * force * 4.0;
          this.vy += Math.sin(angle) * force * 4.0;
          
          // Increase size slightly when attracted
          this.size = Math.min(this.size + 0.5, this.baseSize * 2.5);
        } else {
          // Shrink back to normal size
          if (this.size > this.baseSize) this.size -= 0.1;
          
          if (dist < 150) {
            // Repel slightly on hover
            this.vx -= (dx / dist) * 0.05;
            this.vy -= (dy / dist) * 0.05;
          }
        }

        // Apply friction
        this.vx *= 0.95;
        this.vy *= 0.95;

        // Minimum speed to keep them moving
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed < 0.5) {
          this.vx += (Math.random() - 0.5) * 0.1;
          this.vy += (Math.random() - 0.5) * 0.1;
        }

        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
        if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
        
        // Keep within bounds
        if (this.x < 0) this.x = 0;
        if (this.x > canvas!.width) this.x = canvas!.width;
        if (this.y < 0) this.y = 0;
        if (this.y > canvas!.height) this.y = canvas!.height;
      }

      draw(ctx: CanvasRenderingContext2D, hue: number) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        const alpha = this.life !== Infinity ? Math.max(0, this.life * 0.8) : 0.8;
        ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
        ctx.fill();
      }
    }

    const particles: Particle[] = [];
    const particleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 8000), 200);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const handleMouseMove = (e: MouseEvent) => {
      lastMouse.x = mouse.x;
      lastMouse.y = mouse.y;
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.vx = mouse.x - lastMouse.x;
      mouse.vy = mouse.y - lastMouse.y;
      
      if (isClicking) {
        particles.push(new Particle(e.clientX, e.clientY, true));
        if (particles.length > 400) particles.shift();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      isClicking = true;
      for (let i = 0; i < 15; i++) {
        particles.push(new Particle(e.clientX, e.clientY, true));
        if (particles.length > 400) particles.shift();
      }
    };

    const handleMouseUp = () => {
      isClicking = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    let baseHue = 0;

    const animate = () => {
      baseHue = (baseHue + 0.5) % 360;

      // Clear canvas (supports both light and dark mode)
      const isLightMode = document.body.classList.contains('light-mode');
      ctx.fillStyle = isLightMode ? 'rgba(240, 242, 245, 0.3)' : 'rgba(11, 12, 16, 0.3)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.update();
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          p.draw(ctx, baseHue);
        }
      }

      // Draw RGB strings between particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            const stringHue = (baseHue + dist) % 360;
            const lifeAlpha = Math.min(particles[i].life, particles[j].life, 1.0);
            ctx.strokeStyle = `hsla(${stringHue}, 100%, 60%, ${Math.max(0, (1 - dist / 150) * lifeAlpha)})`;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
        }

        // Draw strings to mouse
        const dxMouse = mouse.x - particles[i].x;
        const dyMouse = mouse.y - particles[i].y;
        const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);

        const mouseRadius = isClicking ? 350 : 200;
        if (distMouse < mouseRadius) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          const opacity = 1 - distMouse / mouseRadius;
          const lifeAlpha = Math.min(particles[i].life, 1.0);
          ctx.strokeStyle = `hsla(${baseHue + (isClicking ? 40 : 0)}, 100%, 60%, ${Math.max(0, (isClicking ? opacity * 0.8 : opacity) * lifeAlpha)})`;
          ctx.lineWidth = isClicking ? 3 : 2;
          ctx.stroke();
        }
      }

      mouse.vx *= 0.9;
      mouse.vy *= 0.9;

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="select-none" style={{ width: '100%', height: '100%' }}>
      <canvas id="nexus-canvas" ref={canvasRef}></canvas>
      <div style={{ textAlign: 'center', marginTop: '5rem', position: 'relative', zIndex: 10 }}>
        <h1 className="rgb-text" style={{ fontSize: '4rem', marginBottom: '1rem' }}>
          NEXUS TERMINAL
        </h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', minHeight: '1.5em' }}>
          {greeting}
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('Arcade')}
            className="action-btn"
            style={{ border: '2px solid var(--rgb-base)', background: 'transparent' }}
          >
            Launch Arcade
          </button>
          <button
            onClick={() => setActiveTab('Study')}
            className="action-btn"
            style={{ border: '2px solid var(--rgb-base)', background: 'transparent' }}
          >
            Launch Study
          </button>
          <button
            onClick={() => setActiveTab('Movies')}
            className="action-btn"
            style={{ border: '2px solid var(--rgb-base)', background: 'transparent' }}
          >
            Launch Movies
          </button>
        </div>
        
        <div style={{ position: 'fixed', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '1.5rem', zIndex: 10 }}>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              color: 'var(--text-color)', 
              opacity: 0.7, 
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.5rem',
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.05)'
            }}
            onMouseOver={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = 'var(--rgb-base)'; e.currentTarget.style.transform = 'scale(1.1)'; }}
            onMouseOut={(e) => { e.currentTarget.style.opacity = '0.7'; e.currentTarget.style.color = 'var(--text-color)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <Instagram size={24} />
          </a>
        </div>
      </div>
    </div>
  );
}
