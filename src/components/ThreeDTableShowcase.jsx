"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { IconSparkles, IconArrowRight, IconUtensils, IconQrCode, IconClock } from "./Icons";

const DISHES_DATA = [
  { name: "Royal Hyderabadi Biryani", color: 0xd97706, plateColor: 0xffffff, tag: "🔥 Chef's Special", icon: "🍛" },
  { name: "Artisanal Woodfired Pizza", color: 0xd97706, plateColor: 0xf8fafc, tag: "🍕 Bestseller", icon: "🍕" },
  { name: "Creamy Butter Chicken", color: 0xe11d48, plateColor: 0xffffff, tag: "⭐ 4.9 Rating", icon: "🥘" },
  { name: "Fresh Mediterranean Salad", color: 0x16a34a, plateColor: 0xf1f5f9, tag: "🥗 Fresh & Healthy", icon: "🥗" },
  { name: "Sizzling Paneer Tikka", color: 0xea580c, plateColor: 0xffffff, tag: "🧀 100% Pure Veg", icon: "🧆" },
  { name: "Tropical Sunset Mocktail", color: 0x0284c7, plateColor: 0xe0f2fe, tag: "🍹 Refreshing", icon: "🍹" },
];

export default function ThreeDTableShowcase({ onProceed, restaurantName }) {
  const mountRef = useRef(null);
  const [activeDishIndex, setActiveDishIndex] = useState(0);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || 450;

    // Scene
    const scene = new THREE.Scene();
    scene.background = null;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 3.8, 6.5);
    camera.lookAt(0, 0.4, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfffaed, 1.8);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 25;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const pointLight = new THREE.PointLight(0x6366f1, 2, 12);
    pointLight.position.set(0, 4, 0);
    scene.add(pointLight);

    // Table Top (Rich Wooden Finish)
    const tableRadius = 3.2;
    const tableGeo = new THREE.CylinderGeometry(tableRadius, tableRadius * 0.96, 0.25, 64);
    const tableMat = new THREE.MeshStandardMaterial({
      color: 0x271911,
      roughness: 0.35,
      metalness: 0.1,
    });
    const tableMesh = new THREE.Mesh(tableGeo, tableMat);
    tableMesh.position.y = -0.125;
    tableMesh.receiveShadow = true;
    scene.add(tableMesh);

    // Table Inner Inlay / Rim
    const rimGeo = new THREE.TorusGeometry(tableRadius - 0.08, 0.04, 16, 64);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.2 });
    const rimMesh = new THREE.Mesh(rimGeo, rimMat);
    rimMesh.rotation.x = Math.PI / 2;
    rimMesh.position.y = 0.01;
    scene.add(rimMesh);

    // Center Pedestal / Leg
    const legGeo = new THREE.CylinderGeometry(0.5, 0.8, 2.5, 32);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x18100a, roughness: 0.5 });
    const legMesh = new THREE.Mesh(legGeo, legMat);
    legMesh.position.y = -1.375;
    scene.add(legMesh);

    // Dishes Group & Popping Animation Setup
    const dishMeshes = [];
    const dishCount = DISHES_DATA.length;
    const radius = 2.0;

    DISHES_DATA.forEach((dish, idx) => {
      const angle = (idx / dishCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;

      const dishGroup = new THREE.Group();
      dishGroup.position.set(x, 0, z);

      // Plate
      const plateGeo = new THREE.CylinderGeometry(0.65, 0.5, 0.1, 32);
      const plateMat = new THREE.MeshStandardMaterial({
        color: dish.plateColor,
        roughness: 0.2,
        metalness: 0.1,
      });
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.y = 0.05;
      plate.castShadow = true;
      plate.receiveShadow = true;
      dishGroup.add(plate);

      // Plate Gold Rim
      const plateRimGeo = new THREE.TorusGeometry(0.63, 0.02, 12, 32);
      const plateRimMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.9, roughness: 0.1 });
      const plateRim = new THREE.Mesh(plateRimGeo, plateRimMat);
      plateRim.rotation.x = Math.PI / 2;
      plateRim.position.y = 0.105;
      dishGroup.add(plateRim);

      // Food Mound (Representing Delicious Dishes)
      let foodGeo;
      if (idx % 3 === 0) {
        foodGeo = new THREE.SphereGeometry(0.48, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
      } else if (idx % 3 === 1) {
        foodGeo = new THREE.CylinderGeometry(0.52, 0.55, 0.22, 24);
      } else {
        foodGeo = new THREE.DodecahedronGeometry(0.4, 1);
      }

      const foodMat = new THREE.MeshStandardMaterial({
        color: dish.color,
        roughness: 0.6,
        metalness: 0.05,
      });
      const food = new THREE.Mesh(foodGeo, foodMat);
      food.position.y = 0.18;
      food.castShadow = true;
      dishGroup.add(food);

      // Garnish / Top detail
      const garnishGeo = new THREE.SphereGeometry(0.12, 12, 12);
      const garnishMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.4 });
      const garnish = new THREE.Mesh(garnishGeo, garnishMat);
      garnish.position.y = 0.42;
      garnish.castShadow = true;
      dishGroup.add(garnish);

      // Start zero scaled for pop animation
      dishGroup.scale.set(0, 0, 0);

      scene.add(dishGroup);
      dishMeshes.push({
        group: dishGroup,
        targetScale: 1,
        delay: idx * 0.18,
        popped: false,
        angle,
      });
    });

    // Animation variables
    let animationFrameId;
    let angleCam = 0;
    const startTime = performance.now();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = (performance.now() - startTime) / 1000;

      // Rotate camera around the center table smoothly
      angleCam += 0.005;
      const camDist = 6.2;
      camera.position.x = Math.sin(angleCam) * camDist;
      camera.position.z = Math.cos(angleCam) * camDist;
      camera.position.y = 3.6 + Math.sin(angleCam * 1.5) * 0.3;
      camera.lookAt(0, 0.4, 0);

      // Dish popping elastic spring animation
      dishMeshes.forEach((item) => {
        if (elapsed > item.delay) {
          const t = Math.min(1, (elapsed - item.delay) * 2.5);
          // Bounce effect math formula
          const spring = 1 + Math.sin(t * Math.PI * 1.8) * 0.25 * (1 - t);
          const currentScale = t >= 1 ? 1 : Math.max(0, t * spring);
          item.group.scale.set(currentScale, currentScale, currentScale);

          // Subtle gentle bobbing for dishes
          item.group.position.y = Math.sin(elapsed * 2 + item.angle) * 0.04;
        }
      });

      // Track dish closest to camera front for UI highlight
      let minDiff = Math.PI * 2;
      let closestIdx = 0;
      dishMeshes.forEach((item, i) => {
        const normCamAngle = ((angleCam % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const normDishAngle = (item.angle + Math.PI * 2) % (Math.PI * 2);
        let diff = Math.abs(normCamAngle - normDishAngle);
        if (diff > Math.PI) diff = Math.PI * 2 - diff;
        if (diff < minDiff) {
          minDiff = diff;
          closestIdx = i;
        }
      });
      setActiveDishIndex(closestIdx);

      renderer.render(scene, camera);
    };

    animate();

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight || 450;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  const currentDish = DISHES_DATA[activeDishIndex] || DISHES_DATA[0];

  return (
    <div className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 text-white shadow-2xl border border-indigo-500/20">
      {/* Background Ambient Glow */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-indigo-600/30 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-amber-500/20 blur-3xl pointer-events-none" />

      {/* Top Header Badge */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-3.5 py-1.5 text-xs font-bold text-indigo-300 border border-indigo-500/30 backdrop-blur-md shadow-lg">
          <IconSparkles className="h-4 w-4 text-amber-400 animate-pulse" /> 360° Interactive Table View
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-[11px] font-black text-amber-300 border border-amber-500/30 backdrop-blur-md">
          {currentDish.icon} {currentDish.tag}
        </span>
      </div>

      {/* 3D WebGL Canvas Mounting Container */}
      <div ref={mountRef} className="h-[360px] sm:h-[420px] w-full cursor-grab active:cursor-grabbing" />

      {/* Floating Active Dish Info Overlay at Bottom of Canvas */}
      <div className="absolute bottom-20 left-4 right-4 z-20 flex justify-center">
        <div className="inline-flex items-center gap-3 rounded-2xl bg-slate-900/90 px-4 py-2.5 shadow-2xl border border-indigo-500/30 backdrop-blur-lg animate-fade-in">
          <span className="text-xl">{currentDish.icon}</span>
          <div>
            <p className="text-xs font-extrabold text-white tracking-wide">{currentDish.name}</p>
            <p className="text-[10px] font-semibold text-indigo-300">Popping fresh on table · Rotates 360°</p>
          </div>
        </div>
      </div>

      {/* Action Footer Bar */}
      <div className="relative z-20 bg-slate-900/90 px-5 py-4 border-t border-indigo-500/20 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
            <IconUtensils className="h-4 w-4 text-indigo-400" />
            {restaurantName || "ALPHAY Dining"}
          </h2>
          <p className="text-[11px] font-medium text-slate-400">
            Ready to order? Enter table number to unlock full menu & instant checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={onProceed}
          className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 active:scale-95 px-6 py-3.5 text-xs font-extrabold text-white shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
        >
          <span>Enter Table Number</span>
          <IconArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
