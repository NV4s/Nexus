import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer } from '@react-three/postprocessing';
import { Vector2, type ShaderMaterial } from 'three';
import { dprFor, prefersReducedMotion, useAdaptiveTier } from '../lib/quality';
import { playIntroAudio, preloadIntroAudio } from '../lib/introAudio';

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

  float easeOut(float x) { return 1.0 - pow(1.0 - clamp(x, 0.0, 1.0), 3.0); }

  // An ink blot: a disc whose radius wobbles with angle, so the edge reads as
  // spattered paint rather than a circle.
  float blot(vec2 p, vec2 centre, float radius, float seed) {
    vec2 d = p - centre;
    float ang = atan(d.y, d.x);
    float wobble = 1.0
      + 0.22 * sin(ang * 3.0 + seed)
      + 0.09 * sin(ang * 5.0 - seed * 2.0)
      + 0.05 * sin(ang * 9.0 + seed * 3.0);
    float edge = radius * max(wobble, 0.25);
    return 1.0 - smoothstep(edge * 0.82, edge, length(d));
  }

  void main() {
    vec2 p = (vUv - 0.5) * vec2(uResolution.x / uResolution.y, 1.0) * 2.0;
    float r = max(length(p), 1e-4);
    float ang = atan(p.y, p.x);
    float t = uTime;

    float open = easeOut((t - 0.40) / 2.40);   // the domain opens outward
    float spin = (t - 0.40) * 0.28;            // the shell turns, slowly
    float surge = exp(-pow((t - 5.25) * 2.6, 2.0));

    // Deep navy, a shade lighter toward the middle.
    vec3 color = mix(vec3(0.020, 0.036, 0.055), vec3(0.005, 0.009, 0.018), smoothstep(0.0, 1.7, r));

    // Logarithmic spiral: the arms wind inward instead of radiating straight out.
    float spiral = ang + log(r + 0.08) * 5.2 - spin * 2.2;

    float arms = 0.0;
    for (float i = 0.0; i < 4.0; i += 1.0) {
      if (i >= uLayers) break;
      arms += (sin(spiral * (2.0 + i) + i * 1.7) * 0.5 + 0.5) * (0.45 - i * 0.09);
    }

    // Fine concentric banding riding on the arms.
    float rings = sin(spiral * 7.0 - spin * 3.0) * 0.5 + 0.5;

    float core = 0.30;
    float shell = smoothstep(core * 0.98, core * 1.35, r) * (1.0 - smoothstep(0.55, 1.9, r));
    color += vec3(0.42, 0.68, 1.0) * (arms * 0.75 + rings * arms * 0.35) * shell * 0.42;

    // Hard lip of light right where the black begins.
    color += vec3(0.75, 0.90, 1.0)
      * (1.0 - smoothstep(core, core * 1.18, r))
      * smoothstep(core * 0.96, core, r) * 0.55;

    // Nothing escapes the core.
    color *= smoothstep(core * 0.92, core, r);

    // Dark spatter clinging to the core.
    float dark = 0.0;
    dark += blot(p, vec2(-0.30, 0.17), 0.17, 1.3);
    dark += blot(p, vec2(0.24, -0.22), 0.14, 4.1);
    dark += blot(p, vec2(-0.12, -0.33), 0.11, 7.7);
    dark += blot(p, vec2(0.33, 0.30), 0.12, 2.6);
    color *= 1.0 - clamp(dark, 0.0, 1.0) * 0.96;

    // White spatter thrown out across the field.
    float white = 0.0;
    white += blot(p, vec2(-1.32, 0.60), 0.20, 3.4);
    white += blot(p, vec2(1.18, 0.70), 0.17, 5.9);
    white += blot(p, vec2(1.44, -0.18), 0.15, 8.2);
    white += blot(p, vec2(0.98, -0.74), 0.14, 1.1);
    white += blot(p, vec2(-1.22, -0.58), 0.16, 6.5);
    color = mix(color, vec3(0.93, 0.96, 1.0), clamp(white, 0.0, 1.0) * 0.88);

    // Light flicking outward past the shell.
    float streak = pow(max(sin(ang * 6.0 + spin * 4.0), 0.0), 90.0)
      * (0.4 + 0.6 * sin(ang * 3.0 - spin))
      * smoothstep(0.55, 1.0, r) * (1.0 - smoothstep(1.4, 2.1, r));
    color += vec3(0.80, 0.90, 1.0) * streak * 0.22;

    // Reveal, sweeping out from the seed of light.
    float radius = open * 2.4;
    float inside = 1.0 - smoothstep(radius - 0.06, radius, r);
    color = mix(vec3(0.004, 0.005, 0.010), color, inside);
    color += vec3(0.70, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.035, abs(r - radius))) * step(open, 0.999);
    color += vec3(0.70, 0.85, 1.0) * (1.0 - smoothstep(0.0, 0.18, r)) * pow(1.0 - open, 2.0);

    // Late surge, then hand over to the site.
    color += vec3(0.55, 0.75, 1.0) * surge * 0.45;

    gl_FragColor = vec4(color, 1.0 - smoothstep(6.1, 7.0, t));
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
              <Bloom intensity={0.35} luminanceThreshold={0.75} mipmapBlur />
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
