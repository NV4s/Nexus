import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer } from '@react-three/postprocessing';
import { Vector2, type ShaderMaterial } from 'three';
import { dprFor, prefersReducedMotion, useAdaptiveTier } from '../lib/quality';
import { playIntroAudio, preloadIntroAudio } from '../lib/introAudio';

const DURATION = 8.0;

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

  const float TAU = 6.28318530718;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float easeOut(float x) { return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0); }

  // A soft irregular blob, used for the drifting wisps of light.
  float wisp(vec2 p, vec2 centre, float radius, float seed) {
    vec2 d = p - centre;
    float ang = atan(d.y, d.x);
    float wobble = 1.0 + 0.28 * sin(ang * 3.0 + seed) + 0.16 * sin(ang * 5.0 - seed * 2.0);
    float edge = radius * max(wobble, 0.3);
    return 1.0 - smoothstep(edge * 0.05, edge, length(d));
  }

  // One band of warp streaks. Each angular slot gets its own speed, length and
  // colour, so the rush reads as thousands of separate trails rather than a fan.
  vec3 warpBand(float ang, float r, float count, float seed, float speed, float t) {
    float slot = floor(ang / TAU * count + 0.5) + seed * 37.0;
    float rnd = hash(vec2(slot, 3.7));
    float rnd2 = hash(vec2(slot, 9.1));

    float across = abs(fract(ang / TAU * count + 0.5) - 0.5) * 2.0;
    float line = 1.0 - smoothstep(0.0, 0.30 + rnd2 * 0.30, across);

    float head = fract(rnd2 + t * speed * (0.35 + rnd * 1.25)) * 2.9;
    float tail = head - (0.30 + rnd * 0.75);
    float segment = smoothstep(tail, tail + 0.06, r) * (1.0 - smoothstep(head - 0.04, head, r));
    float along = smoothstep(tail, head, r);

    vec3 violet = vec3(0.42, 0.16, 0.95);
    vec3 magenta = vec3(0.88, 0.14, 0.70);
    vec3 hot = vec3(1.0, 0.86, 1.0);
    vec3 tint = mix(violet, magenta, rnd);
    tint = mix(tint, hot, pow(along, 3.0) * (0.3 + rnd2 * 0.6));

    return tint * line * segment * along;
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
    float r = max(length(p), 1e-4);
    float ang = atan(p.y, p.x);
    float t = uTime;

    // The rush builds, holds, then gives way to the void it was carrying you into.
    float rush = smoothstep(0.25, 1.20, t) * (1.0 - smoothstep(4.40, 5.90, t));
    float settle = smoothstep(4.60, 6.40, t);
    float accel = 0.55 + easeOut((t - 0.3) / 4.0) * 1.35;

    vec3 color = vec3(0.004, 0.003, 0.012);

    // --- the rush -------------------------------------------------------
    vec3 streaks = warpBand(ang, r, 64.0, 1.0, 0.55 * accel, t);
    if (uLayers >= 3.0) streaks += warpBand(ang, r, 118.0, 2.0, 0.78 * accel, t) * 0.75;
    if (uLayers >= 4.0) streaks += warpBand(ang, r, 182.0, 3.0, 0.98 * accel, t) * 0.55;
    color += streaks * rush * 1.35;

    // The vanishing point everything is pouring out of.
    color += vec3(1.0, 0.82, 1.0) * (1.0 - smoothstep(0.0, 0.30, r)) * rush * 0.55;

    // Wisps of light tumbling past.
    float drift = t * 0.35;
    float wisps = 0.0;
    wisps += wisp(p, vec2(-1.05 + sin(drift) * 0.15, 0.52), 0.34, 3.4);
    wisps += wisp(p, vec2(1.12, 0.44 + cos(drift * 1.2) * 0.12), 0.28, 5.9);
    if (uLayers >= 3.0) {
      wisps += wisp(p, vec2(0.72, -0.62 + sin(drift * 0.8) * 0.10), 0.24, 8.2);
      wisps += wisp(p, vec2(-0.88, -0.48), 0.22, 1.1);
    }
    color += vec3(0.95, 0.88, 1.0) * clamp(wisps, 0.0, 1.0) * rush * 0.16;

    // --- the void it resolves into --------------------------------------
    float core = 0.27;
    float ring = 1.0 - smoothstep(0.0, 0.045, abs(r - core * 1.20));
    float halo = 1.0 - smoothstep(0.0, 0.28, abs(r - core * 1.30));

    vec3 field = vec3(0.005, 0.007, 0.014);
    field += vec3(0.90, 0.94, 1.0) * ring * 1.15;
    field += vec3(0.26, 0.34, 0.56) * halo * 0.30;
    // Wispy cloud lying across the field, the way it does once the rush stops.
    float cloud = wisp(p, vec2(-1.25, -0.14), 0.70, 2.2) + wisp(p, vec2(1.22, 0.20), 0.62, 6.6);
    field += vec3(0.24, 0.30, 0.44) * clamp(cloud, 0.0, 1.0) * 0.055;
    // Nothing escapes the core.
    field *= smoothstep(core * 0.94, core, r);

    color = mix(color, field, settle);

    gl_FragColor = vec4(color, 1.0 - smoothstep(7.1, 8.0, t));
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
  const [started, setStarted] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Stable identity: the old intro re-ran its animation effect on every parent render.
  const finish = useCallback(() => setLeaving(true), []);

  useEffect(preloadIntroAudio, []);

  useEffect(() => {
    if (!leaving) return;
    // The track keeps playing past this point on purpose — see lib/introAudio.
    const timer = setTimeout(onComplete, 400);
    return () => clearTimeout(timer);
  }, [leaving, onComplete]);

  const begin = () => {
    setStarted(true);
    playIntroAudio();
    if (prefersReducedMotion()) finish();
  };

  const layers = tier === 'low' ? 2 : tier === 'medium' ? 3 : 5;

  return (
    <div className={`intro ${leaving ? 'is-leaving' : ''}`}>
      {started && (
        <Canvas
          flat
          dpr={dprFor(tier)}
          gl={{ antialias: false, powerPreference: 'high-performance' }}
        >
          <VoidSurface layers={layers} onDone={finish} />
          {tier !== 'low' && (
            <EffectComposer>
              <Bloom intensity={0.65} luminanceThreshold={0.55} mipmapBlur />
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
