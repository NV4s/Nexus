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
  uniform float uLayers;    // starfield depth, dialled down on weak hardware

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
    float t = uTime;

    // Phase timings, in seconds.
    float open     = easeOut((t - 0.35) / 1.9);  // boundary expands
    float depth    = easeOut((t - 1.6) / 3.4);   // travel into the void
    float collapse = easeOut((t - 5.2) / 1.1);   // whiteout

    float radius = open * 2.4;
    // smoothstep needs edge0 < edge1 — reversed edges are undefined, not inverted.
    float inside = 1.0 - smoothstep(radius - 0.05, radius, r);

    // Sphere inversion. Points near the boundary stretch toward infinity.
    vec2 q = p / (r * r);
    q += vec2(0.0, depth * 2.4);

    // Outside the domain: all but black.
    vec3 color = vec3(0.004, 0.005, 0.010);

    // Interior starfield, several parallax layers.
    float field = 0.0;
    for (float i = 0.0; i < 5.0; i += 1.0) {
      if (i >= uLayers) break;
      float scale = 1.4 + i * 2.0;
      float drift = depth * (0.5 + i * 0.45);
      field += stars(q * scale + vec2(drift, -drift * 1.7), 1.8) * (0.9 - i * 0.16);
    }

    // Deep indigo interior so the domain reads as a distinct volume.
    vec3 voidColor = vec3(0.004, 0.006, 0.016);
    voidColor += vec3(0.012, 0.030, 0.090) * (1.0 - smoothstep(0.0, 1.3, r));
    voidColor += vec3(0.60, 0.78, 1.0) * field;

    color = mix(color, voidColor, inside);

    // Boundary rim, plus a wider halo bleeding outward.
    float rim = 1.0 - smoothstep(0.0, 0.04, abs(r - radius));
    float halo = 1.0 - smoothstep(0.0, 0.45, abs(r - radius));
    color += vec3(0.62, 0.82, 1.0) * rim * (1.0 - collapse);
    color += vec3(0.10, 0.22, 0.50) * halo * 0.35 * open * (1.0 - collapse);

    // The seed of light before the domain opens.
    color += vec3(0.7, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.18, r)) * pow(1.0 - open, 2.0);

    // Collapse to white, then hand over to the site.
    color = mix(color, vec3(1.0), collapse);
    float fade = 1.0 - smoothstep(0.75, 1.0, (t - 5.2) / 1.8);

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
              <Bloom intensity={0.75} luminanceThreshold={0.6} mipmapBlur />
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
