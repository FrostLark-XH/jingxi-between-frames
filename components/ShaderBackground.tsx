"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { vertexShader, fragmentShader } from "@/lib/shader";

export default function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let cleanup: (() => void) | null = null;

    import("three").then((THREE) => {
      if (!canvasRef.current) return;

      const isMobile = window.innerWidth < 768;
      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: false,
        powerPreference: "high-performance",
      });
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
        renderer.setPixelRatio(
          mobile ? 1 : Math.min(window.devicePixelRatio, 1.5)
        );
        uniforms.uIsMobile.value = mobile ? 1 : 0;
      };

      window.addEventListener("resize", handleResize);

      let animationId: number;
      const clock = new THREE.Clock();

      const animate = () => {
        const delta = clock.getDelta();
        const currentMouse = uniforms.uMouse.value;
        currentMouse.x += (mouseTarget.x - currentMouse.x) * 2 * delta;
        currentMouse.y += (mouseTarget.y - currentMouse.y) * 2 * delta;
        uniforms.uTime.value += delta;
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
      };

      animate();

      cleanup = () => {
        cancelAnimationFrame(animationId);
        window.removeEventListener("mousemove", handleMouse);
        window.removeEventListener("touchmove", handleTouch);
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    });

    return () => {
      cleanup?.();
    };
  }, [theme.id]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
