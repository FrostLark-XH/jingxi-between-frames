export const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const fragmentShader = `
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;
  uniform float uIsMobile;
  uniform vec3 uBgBase;
  uniform vec3 uGlowColor1;
  uniform vec3 uGlowColor2;
  uniform float uGlowIntensity;
  uniform float uGrainOpacity;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
      f.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    vec2 shift = vec2(100.0);
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p = p * 2.0 + shift;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // subtle refraction
    float refraction = 0.0015;
    vec2 distortedUv = uv + vec2(
      fbm(uv * 3.0 + uTime * 0.02) - 0.5,
      fbm(uv * 3.0 + uTime * 0.02 + 1.0) - 0.5
    ) * refraction;

    // mouse response (very weak)
    float mouseInfluence = 0.002;
    vec2 mouseOffset = (uMouse - 0.5) * mouseInfluence;
    distortedUv += mouseOffset;

    // slow drifting low-frequency noise
    float drift1 = fbm(distortedUv * 2.5 + uTime * 0.012);
    float drift2 = fbm(distortedUv * 3.5 - uTime * 0.016 + 1.5);
    float drift = drift1 * 0.6 + drift2 * 0.4;

    // Primary warm glow — theme-driven color
    float glow1Center = distance(distortedUv, vec2(
      0.48 + sin(uTime * 0.025) * 0.08,
      0.35 + cos(uTime * 0.032) * 0.06
    ));
    float glow1 = exp(-glow1Center * 5.5) * uGlowIntensity;
    glow1 *= 0.5 + 0.5 * sin(uTime * 0.2);

    // Secondary glow — smaller, upper region
    float glow2Center = distance(distortedUv, vec2(
      0.6 + cos(uTime * 0.028) * 0.1,
      0.55 + sin(uTime * 0.036) * 0.07
    ));
    float glow2 = exp(-glow2Center * 7.0) * uGlowIntensity * 0.7;
    glow2 *= 0.4 + 0.6 * sin(uTime * 0.18 + 1.2);

    vec3 warmLight = uGlowColor1 * glow1 + uGlowColor2 * glow2;

    // film grain — theme-controlled opacity
    float grainRes = uIsMobile > 0.5 ? 1.5 : 1.0;
    float grain = hash(uv * 800.0 * grainRes + uTime * 0.08) * uGrainOpacity;
    grain *= 0.4 + 0.6 * fbm(uv * 10.0);

    // Base color from theme
    vec3 baseColor = uBgBase;
    baseColor += drift * 0.012;

    // composite
    vec3 color = baseColor;
    color += warmLight;
    color += grain;

    // subtle vignette
    float vignette = 1.0 - length(uv - 0.5) * 0.25;
    color *= vignette;

    gl_FragColor = vec4(color, 1.0);
  }
`;
