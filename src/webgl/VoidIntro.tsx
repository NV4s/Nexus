import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer } from '@react-three/postprocessing';
import { Vector2, type ShaderMaterial } from 'three';
import { dprFor, prefersReducedMotion, useAdaptiveTier } from '../lib/quality';

const DURATION = 7.0;

const vertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * Infinite Void: a boundary expands from a single point, and everything inside it is
 * mapped through a sphere inversion (q = p / |p|^2) so the interior reads as unbounded
 * space. Analytic throughout — no raymarch loop — so the cost is flat per pixel.
 */
const fragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;      // seconds since the intro started
  uniform vec2  uResolution;
  uniform float uLayers;    // detail depth, dialled down on weak hardware

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Sparse points on a jittered grid — cheap stars with stable positions.
  float stars(vec2 p, float density) {
    vec2 cell = floor(p * density);
    vec2 local = fract(p * density) - 0.5;
    float seed = hash(cell);
    if (seed < 0.935) return 0.0;
    vec2 offset = vec2(hash(cell + 1.7), hash(cell + 4.3)) - 0.5;
    float d = length(local - offset * 0.7);
    return (1.0 - smoothstep(0.0, 0.085, d)) * (0.3 + 0.7 * hash(cell + 9.1));
  }

  float easeOut(float x) { return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0); }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
    float r = max(length(p), 1e-4);
    float angle = atan(p.y, p.x);
    float t = uTime;

    // Phase timings, in seconds.
    float open     = easeOut((t - 0.40) / 2.60);  // boundary swallows the screen
    float depth    = easeOut((t - 2.20) / 3.20);  // fall inward
    float collapse = easeOut((t - 5.10) / 1.30);  // everything floods white

    float radius = open * 2.4;
    // smoothstep needs edge0 < edge1 — reversed edges are undefined, not inverted.
    float inside = 1.0 - smoothstep(radius - 0.05, radius, r);

    // Outside the domain: all but black.
    vec3 color = vec3(0.004, 0.005, 0.010);

    // Sphere inversion, so the interior reads as unbounded rather than a disc.
    vec2 q = p / (r * r);
    q += vec2(0.0, depth * 2.0);

    float field = 0.0;
    for (float i = 0.0; i < 5.0; i += 1.0) {
      if (i >= uLayers) break;
      float scale = 1.4 + i * 2.0;
      float drift = depth * (0.5 + i * 0.45);
      field += stars(q * scale + vec2(drift, -drift * 1.7), 1.8) * (0.9 - i * 0.16);
    }

    // Light streaming outward from the core — the rush of information.
    float rays = 0.0;
    for (float i = 0.0; i < 3.0; i += 1.0) {
      if (i >= uLayers) break;
      float frequency = 9.0 + i * 14.0;
      rays += (sin(angle * frequency + depth * 5.0 + i * 2.3) * 0.5 + 0.5) * (0.22 - i * 0.05);
    }

    // The dark sphere suspended at the centre of the white.
    float orbRadius = 0.30 + 0.05 * sin(t * 1.3);
    float orb = 1.0 - smoothstep(orbRadius - 0.015, orbRadius, r);
    float orbRim = 1.0 - smoothstep(0.0, 0.028, abs(r - orbRadius));

    // Soft banding through the inversion space, so the white carries structure
    // instead of clipping to a flat sheet.
    float veil = sin(q.x * 3.0 + depth * 3.0) * sin(q.y * 2.4 - depth * 2.0) * 0.5 + 0.5;

    // Interior is bright, not black: the void is blinding, and the shapes in it are dark.
    vec3 lit = mix(vec3(0.55, 0.66, 0.90), vec3(0.80, 0.86, 0.97), smoothstep(0.0, 1.9, r));
    float outward = smoothstep(orbRadius, 1.2, r);
    lit -= vec3(0.26, 0.30, 0.38) * rays * outward;
    lit -= vec3(0.10, 0.12, 0.18) * veil * outward;
    lit = mix(lit, vec3(0.010, 0.018, 0.055) + vec3(0.55, 0.72, 1.0) * field, orb);
    lit += vec3(0.70, 0.80, 1.0) * orbRim;

    color = mix(color, lit, inside);

    // The expanding boundary itself.
    float rim = 1.0 - smoothstep(0.0, 0.035, abs(r - radius));
    color += vec3(0.70, 0.85, 1.0) * rim * (1.0 - collapse);

    // The seed of light before the domain opens.
    color += vec3(0.7, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.18, r)) * pow(1.0 - open, 2.0);

    // Flood to white, then hand over to the site.
    color = mix(color, vec3(1.0), collapse);
    float fade = 1.0 - smoothstep(0.78, 1.0, (t - 5.1) / 1.9);

    gl_FragColor = vec4(color, max(fade, 0.0));
  }
`;

function VoidSurface({ layers, onDone }: { layers: number; onDone: () => void }) {
  const { size } = useThree();
  // Wall clock, not accumulated frame deltas: a slow GPU should drop frames,
  // not play the whole sequence in slow motion.
  const startedAt = useRef(0);
  const finished = useRef(false);
  const material = useRef<ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uResolution: { value: new Vector2(1, 1) },
      uLayers: { value: layers },
    }),
    // Built once as the initial value; per-frame writes go through the ref below,
    // so a remount cannot leave us mutating an object the material no longer holds.
    [],
  );

  useFrame(() => {
    startedAt.current ||= performance.now();
    const elapsed = (performance.now() - startedAt.current) / 1000;

    const live = material.current?.uniforms;
    if (live) {
      live.uTime.value = elapsed;
      live.uLayers.value = layers;
      live.uResolution.value.set(size.width, size.height);
    }

    if (!finished.current && elapsed >= DURATION) {
      finished.current = true;
      onDone();
    }
  });

  return (
    // A 2x2 plane written straight to clip space by the vertex shader — covers the
    // viewport at any aspect without a camera.
    <mesh frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
      />
    </mesh>
  );
}

export default function VoidIntro({ onComplete }: { onComplete: () => void }) {
  const tier = useAdaptiveTier();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Stable identity: the old intro re-ran its animation effect on every parent render.
  const finish = useCallback(() => setLeaving(true), []);

  useEffect(() => {
    if (!leaving) return;

    // Fade the music out with the overlay instead of cutting it dead.
    const audio = audioRef.current;
    const fade = audio
      ? setInterval(() => {
          audio.volume = Math.max(0, audio.volume - 0.08);
          if (audio.volume === 0) audio.pause();
        }, 30)
      : undefined;

    const timer = setTimeout(onComplete, 400);
    return () => {
      clearTimeout(timer);
      if (fade) clearInterval(fade);
    };
  }, [leaving, onComplete]);

  const begin = () => {
    setStarted(true);
    if (prefersReducedMotion()) return finish();
    audioRef.current?.play().catch(() => {
      /* autoplay refused — the visual still runs */
    });
  };

  const layers = tier === 'low' ? 2 : tier === 'medium' ? 3 : 5;

  return (
    <div className={`intro ${leaving ? 'is-leaving' : ''}`}>
      <audio ref={audioRef} src="/audio/void-intro.mp3" preload="auto" />

      {started && (
        <Canvas
          flat
          dpr={dprFor(tier)}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <VoidSurface layers={layers} onDone={finish} />
          {tier !== 'low' && (
            <EffectComposer>
              <Bloom intensity={0.35} luminanceThreshold={0.95} mipmapBlur />
              <ChromaticAberration offset={new Vector2(0.0005, 0.0005)} />
            </EffectComposer>
          )}
        </Canvas>
      )}

      {!started ? (
        <button className="intro-enter" onClick={begin}>
          Enter
        </button>
      ) : (
        <button className="intro-skip" onClick={finish}>
          Skip
        </button>
      )}
    </div>
  );
}
