import { useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, Vector2 } from 'three';
import type { ShaderMaterial } from 'three';
import { dprFor, particlesFor, useAdaptiveTier, type Tier } from '../lib/quality';

const vertex = /* glsl */ `
  uniform float uTime;
  uniform vec2  uPointer;
  uniform float uSize;
  attribute float aSeed;
  varying float vGlow;

  void main() {
    vec3 p = position;

    // Slow independent drift so the field never looks like a static texture.
    p.x += sin(uTime * 0.18 + aSeed * 6.2831) * 0.35;
    p.y += cos(uTime * 0.14 + aSeed * 3.1415) * 0.30;

    // Push away from the pointer, falling off with distance.
    vec2 away = p.xy - uPointer;
    float d2 = dot(away, away);
    p.xy += normalize(away + 1e-4) * (1.6 / (d2 + 0.9));

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (1.0 + aSeed) / -mv.z;
    vGlow = clamp(1.0 - d2 * 0.03, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision mediump float;
  varying float vGlow;

  void main() {
    // Round, soft-edged point without a texture fetch.
    float d = length(gl_PointCoord - 0.5);
    float alpha = 1.0 - smoothstep(0.05, 0.5, d);
    vec3 cool = vec3(0.36, 0.60, 1.00);
    vec3 warm = vec3(0.80, 0.92, 1.00);
    gl_FragColor = vec4(mix(cool, warm, vGlow), alpha * (0.35 + 0.5 * vGlow));
  }
`;

function Field({ tier }: { tier: Tier }) {
  const material = useRef<ShaderMaterial>(null);
  const pointer = useRef(new Vector2(0, 0));
  const { viewport } = useThree();
  const count = particlesFor(tier);

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const seeds = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 2;
      seeds[i] = Math.random();
    }
    const geo = new BufferGeometry();
    geo.setAttribute('position', new Float32BufferAttribute(positions, 3));
    geo.setAttribute('aSeed', new Float32BufferAttribute(seeds, 1));
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uPointer: { value: new Vector2(0, 0) },
      uSize: { value: tier === 'low' ? 26 : 34 },
    }),
    [tier],
  );

  useFrame(({ pointer: p, clock }) => {
    // Pointer arrives normalised to [-1, 1]; map it onto the visible plane and ease it.
    pointer.current.set((p.x * viewport.width) / 2, (p.y * viewport.height) / 2);
    uniforms.uPointer.value.lerp(pointer.current, 0.08);
    uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <points geometry={geometry}>
      <shaderMaterial
        ref={material}
        vertexShader={vertex}
        fragmentShader={fragment}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

export default function HomeField() {
  const tier = useAdaptiveTier();

  return (
    <Canvas
      className="home-field"
      dpr={dprFor(tier)}
      camera={{ position: [0, 0, 9], fov: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <Field tier={tier} />
    </Canvas>
  );
}
