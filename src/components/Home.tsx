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
    let particles: Particle[] = [];
    const numParticles = 100;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const mouse = { x: -1000, y: -1000, radius: 150 };

    let isDragging = false;

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseLeave = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      isDragging = false;
      mouse.radius = 150;
    };

    const handleMouseDown = () => {
      isDragging = true;
      mouse.radius = 300;
    };

    const handleMouseUp = () => {
      isDragging = false;
      mouse.radius = 150;
    };

    const handleClick = (e: MouseEvent) => {
      // Add a burst of particles on click
      for (let i = 0; i < 10; i++) {
        particles.push(new Particle(e.clientX, e.clientY, true));
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('click', handleClick);

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      alpha: number;
      isBurst: boolean;
      life: number;

      constructor(x?: number, y?: number, isBurst = false) {
        this.x = x ?? Math.random() * canvas!.width;
        this.y = y ?? Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.radius = Math.random() * 2 + 1;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.isBurst = isBurst;
        this.life = isBurst ? 100 : Infinity;
        
        if (isBurst) {
            this.vx = (Math.random() - 0.5) * 10;
            this.vy = (Math.random() - 0.5) * 10;
        }
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (!this.isBurst) {
            if (this.x < 0 || this.x > canvas!.width) this.vx *= -1;
            if (this.y < 0 || this.y > canvas!.height) this.vy *= -1;
        } else {
            this.life--;
        }

        // Mouse interaction
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < mouse.radius) {
          const forceDirectionX = dx / distance;
          const forceDirectionY = dy / distance;
          const maxDistance = mouse.radius;
          const force = (maxDistance - distance) / maxDistance;
          const directionX = forceDirectionX * force * 5;
          const directionY = forceDirectionY * force * 5;

          this.x -= directionX;
          this.y -= directionY;
        }
      }

      draw(currentHue: number) {
        ctx!.beginPath();
        ctx!.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx!.fillStyle = `hsla(${currentHue}, 100%, 50%, ${this.alpha})`;
        ctx!.fill();
      }
    }

    for (let i = 0; i < numParticles; i++) {
      particles.push(new Particle());
    }

    let hue = 0;

    const connect = (currentHue: number) => {
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          const dx = particles[a].x - particles[b].x;
          const dy = particles[a].y - particles[b].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            opacityValue = 1 - distance / 120;
            ctx!.strokeStyle = `hsla(${currentHue}, 100%, 50%, ${opacityValue * 0.5})`;
            ctx!.lineWidth = 1;
            ctx!.beginPath();
            ctx!.moveTo(particles[a].x, particles[a].y);
            ctx!.lineTo(particles[b].x, particles[b].y);
            ctx!.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      hue += 0.5;
      if (hue >= 360) hue = 0;

      particles = particles.filter(p => p.life > 0);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw(hue);
      }
      connect(hue);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('click', handleClick);
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
