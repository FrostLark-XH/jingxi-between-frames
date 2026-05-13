"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { vertexShader, fragmentShader } from "@/lib/shader";
import type { Vector2, Vector3 } from "three";

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const materialRef = useRef<{ uniforms: Record<string, { value: unknown }> } | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const animationIdRef = useRef<number>(0);
  const { theme } = useTheme();
  const [webglFailed, setWebglFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detect prefers-reduced-motion (SSR-safe: only runs client-side)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Init Three.js scene — skipped entirely when reduced motion is preferred
  useEffect(() => {
    if (reducedMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;

    import("three")
      .then((THREE) => {
        if (!canvasRef.current || cancelled) return;

        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({
            canvas: canvasRef.current,
            antialias: false,
            powerPreference: "high-performance",
          });
        } catch {
          setWebglFailed(true);
          return;
        }

        const isMobile = window.innerWidth < 768;
        renderer.setPixelRatio(
          isMobile ? 1 : Math.min(window.devicePixelRatio, 1.5)
        );
        renderer.setSize(window.innerWidth, window.innerHeight, false);

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);
        const shader = theme.shader;
        const uniforms = {
          uTime: { value: 0 },
          uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          uIsMobile: { value: isMobile ? 1 : 0 },
          uBgBase: { value: new THREE.Vector3(...shader.bgBase) },
          uGlowColor1: { value: new THREE.Vector3(...shader.glowColor1) },
          uGlowColor2: { value: new THREE.Vector3(...shader.glowColor2) },
          uGlowIntensity: { value: shader.glowIntensity },
          uGrainOpacity: { value: shader.grainOpacity },
        };
        const material = new THREE.ShaderMaterial({
          vertexShader,
          fragmentShader,
          uniforms,
          depthTest: false,
          depthWrite: false,
        });
        materialRef.current = material;
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const mouseTarget = { x: 0.5, y: 0.5 };

        const handleMouse = (e: MouseEvent) => {
          mouseTarget.x = e.clientX / window.innerWidth;
          mouseTarget.y = 1.0 - e.clientY / window.innerHeight;
        };

        const handleTouch = (e: TouchEvent) => {
          if (e.touches.length > 0) {
            mouseTarget.x = e.touches[0].clientX / window.innerWidth;
            mouseTarget.y = 1.0 - e.touches[0].clientY / window.innerHeight;
          }
        };

        window.addEventListener("mousemove", handleMouse, { passive: true });
        window.addEventListener("touchmove", handleTouch, { passive: true });

        const handleResize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight, false);
          const mobile = window.innerWidth < 768;
          // On mobile with keyboard likely open, reduce pixel ratio to ease GPU pressure
          const vh = window.visualViewport?.height ?? window.innerHeight;
          const keyboardLikelyOpen = mobile && vh < window.innerHeight * 0.75;
          renderer.setPixelRatio(
            mobile
              ? keyboardLikelyOpen
                ? 0.5
                : 1
              : Math.min(window.devicePixelRatio, 1.5)
          );
          uniforms.uIsMobile.value = mobile ? 1 : 0;
        };

        window.addEventListener("resize", handleResize);
        // visualViewport resize fires on mobile keyboard open/close
        window.visualViewport?.addEventListener("resize", handleResize);

        const clock = new THREE.Clock();

        const animate = () => {
          const delta = clock.getDelta();
          const currentMouse = uniforms.uMouse.value as Vector2;
          currentMouse.x += (mouseTarget.x - currentMouse.x) * 2 * delta;
          currentMouse.y += (mouseTarget.y - currentMouse.y) * 2 * delta;
          uniforms.uTime.value += delta;
          renderer.render(scene, camera);
          animationIdRef.current = requestAnimationFrame(animate);
        };

        // Pause animation when tab hidden; resume on visibility
        const handleVisibility = () => {
          if (document.hidden) {
            cancelAnimationFrame(animationIdRef.current);
          } else {
            clock.getDelta(); // discard accumulated delta
            animationIdRef.current = requestAnimationFrame(animate);
          }
        };
        document.addEventListener("visibilitychange", handleVisibility);

        animationIdRef.current = requestAnimationFrame(animate);

        cleanupRef.current = () => {
          cancelAnimationFrame(animationIdRef.current);
          document.removeEventListener("visibilitychange", handleVisibility);
          window.removeEventListener("mousemove", handleMouse);
          window.removeEventListener("touchmove", handleTouch);
          window.removeEventListener("resize", handleResize);
          window.visualViewport?.removeEventListener("resize", handleResize);
          renderer.dispose();
          geometry.dispose();
          material.dispose();
          materialRef.current = null;
        };
      })
      .catch(() => {
        // Dynamic import failed (network error, etc.)
        setWebglFailed(true);
      });

    return () => {
      cancelled = true;
      cleanupRef.current?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  // Theme update — patches uniforms only, no scene destruction
  useEffect(() => {
    const material = materialRef.current;
    if (!material) return;

    const shader = theme.shader;
    const u = material.uniforms;
    (u.uBgBase.value as Vector3).set(...shader.bgBase);
    (u.uGlowColor1.value as Vector3).set(...shader.glowColor1);
    (u.uGlowColor2.value as Vector3).set(...shader.glowColor2);
    u.uGlowIntensity.value = shader.glowIntensity;
    u.uGrainOpacity.value = shader.grainOpacity;
  }, [theme.id]);

  // CSS gradient fallback — matches theme accent shape (warm glow top-center)
  if (webglFailed || reducedMotion) {
    const gradient = `radial-gradient(ellipse 60% 50% at 50% 35%, ${theme.accentGlow}, ${theme.bgBase})`;
    return (
      <div
        className="pointer-events-none fixed inset-0 z-0"
        style={{ background: gradient }}
      />
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
