'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RotateCcw, Loader2 } from 'lucide-react';
import { detectSoftwareWebGL } from '@/lib/device-capability';

interface ThreeModelViewerProps {
  imageUrl?: string;
  model3dUrl?: string;
  productName: string;
  accentHex?: string;
  isDark?: boolean;
}

function createRadialShadowTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(
      size / 2,
      size / 2,
      size * 0.08,
      size / 2,
      size / 2,
      size * 0.48,
    );
    grad.addColorStop(0, 'rgba(15, 23, 42, 0.42)');
    grad.addColorStop(0.55, 'rgba(15, 23, 42, 0.14)');
    grad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

function createRoundedFrameShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

interface PlaqueThemeMaterials {
  chassisMat: THREE.MeshStandardMaterial;
  backMat: THREE.MeshStandardMaterial;
  pedestalMat: THREE.MeshStandardMaterial;
}

function buildCompositeProductPlaque(
  texture: THREE.Texture | null,
  accentHex: string,
  isDark: boolean,
): { group: THREE.Group; materials: PlaqueThemeMaterials } {
  const group = new THREE.Group();

  // 1. Primary silhouette: Beveled brushed titanium outer chassis
  const outerShape = createRoundedFrameShape(2.55, 1.98, 0.22);
  const chassisGeo = new THREE.ExtrudeGeometry(outerShape, {
    depth: 0.14,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 4,
  });
  chassisGeo.center();

  const chassisMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x2a3346 : 0xdbe2ec,
    metalness: 0.85,
    roughness: 0.24,
  });
  const chassisMesh = new THREE.Mesh(chassisGeo, chassisMat);
  chassisMesh.castShadow = true;
  chassisMesh.receiveShadow = true;
  group.add(chassisMesh);

  // 2. Secondary read: Accent anodized chamfer trim bezel
  const trimShape = createRoundedFrameShape(2.42, 1.85, 0.18);
  const trimGeo = new THREE.ExtrudeGeometry(trimShape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
  });
  trimGeo.center();
  const trimMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentHex),
    metalness: 0.72,
    roughness: 0.28,
  });
  const trimMesh = new THREE.Mesh(trimGeo, trimMat);
  trimMesh.position.z = 0.075;
  group.add(trimMesh);

  // 3. Hero surface: High-definition textured product photo display plate
  const imageGeo = new THREE.PlaneGeometry(2.26, 1.7);
  const imageMat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: texture,
    roughness: 0.32,
    metalness: 0.05,
  });
  const imageMesh = new THREE.Mesh(imageGeo, imageMat);
  imageMesh.position.z = 0.112;
  group.add(imageMesh);

  // 4. Rear satin metallic plate (visible when rotated past 90deg)
  const backGeo = new THREE.PlaneGeometry(2.2, 1.64);
  const backMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x161f32 : 0xe8edf4,
    metalness: 0.6,
    roughness: 0.45,
  });
  const backMesh = new THREE.Mesh(backGeo, backMat);
  backMesh.position.z = -0.108;
  backMesh.rotation.y = Math.PI;
  group.add(backMesh);

  // 5. Accent detail: Machined glass-inspired floating pedestal base beneath plaque
  const pedestalGeo = new THREE.CylinderGeometry(1.18, 1.28, 0.08, 40);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: isDark ? 0x1e293b : 0xf1f5f9,
    metalness: 0.35,
    roughness: 0.25,
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.y = -1.28;
  pedestal.receiveShadow = true;
  group.add(pedestal);

  // 6. Accent ring around pedestal
  const ringGeo = new THREE.TorusGeometry(1.22, 0.016, 12, 48);
  const ringMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color(accentHex),
    metalness: 0.85,
    roughness: 0.2,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = -1.235;
  group.add(ring);

  return { group, materials: { chassisMat, backMat, pedestalMat } };
}

export default function ThreeModelViewer({
  imageUrl,
  model3dUrl,
  productName,
  accentHex = '#0F766E',
  isDark = false,
}: ThreeModelViewerProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const targetRotRef = useRef({ x: 0.08, y: -0.22 });
  const currentRotRef = useRef({ x: 0.08, y: -0.22 });
  const draggingRef = useRef(false);
  const lastPointerRef = useRef({ x: 0, y: 0 });
  const requestRenderRef = useRef<() => void>(() => {});
  const isDarkRef = useRef(isDark);
  const themeMatsRef = useRef<{
    plaque?: PlaqueThemeMaterials;
    shadowMat?: THREE.MeshBasicMaterial;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    isDarkRef.current = isDark;
    const { plaque, shadowMat } = themeMatsRef.current;
    if (plaque) {
      plaque.chassisMat.color.setHex(isDark ? 0x2a3346 : 0xdbe2ec);
      plaque.backMat.color.setHex(isDark ? 0x161f32 : 0xe8edf4);
      plaque.pedestalMat.color.setHex(isDark ? 0x1e293b : 0xf1f5f9);
    }
    if (shadowMat) {
      shadowMat.opacity = isDark ? 0.65 : 0.45;
    }
    requestRenderRef.current();
  }, [isDark]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const { supportsWebGL2, isSoftwareWebGL } = detectSoftwareWebGL();
    if (!supportsWebGL2) {
      queueMicrotask(() => setLoading(false));
      return;
    }

    const width = container.clientWidth || 480;
    const height = container.clientHeight || 360;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, width / height, 0.1, 50);
    camera.position.set(0, 0.22, 4.45);
    camera.lookAt(0, -0.08, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareWebGL,
      alpha: true,
      preserveDrawingBuffer: isSoftwareWebGL,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(
      isSoftwareWebGL ? 1 : Math.min(window.devicePixelRatio || 1, 2),
    );
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = !isSoftwareWebGL;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Mandatory studio environment reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    // Balanced 3-point warm/cool studio lighting
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x1e293b, 0.85);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff7ed, 1.55);
    keyLight.position.set(3.4, 4.5, 4.2);
    if (!isSoftwareWebGL) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(1024, 1024);
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0xe0f2fe, 0.75);
    rimLight.position.set(-3.5, 2.2, -3.2);
    scene.add(rimLight);

    // Soft radial contact shadow plane beneath subject
    const shadowTex = createRadialShadowTexture();
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: isDarkRef.current ? 0.65 : 0.45,
    });
    themeMatsRef.current.shadowMat = shadowMat;
    const shadowPlane = new THREE.Mesh(
      new THREE.CircleGeometry(1.75, 40),
      shadowMat,
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -1.34;
    scene.add(shadowPlane);

    const pivot = new THREE.Group();
    scene.add(pivot);

    // On-demand render scheduler with software-WebGL afterDraw pacing
    let disposed = false;
    let frameId = 0;
    let renderBusy = false;
    let renderDirty = false;
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    };

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = window.requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const now = performance.now();
        const dt = Math.min((now - lastTime) / 1000, 0.05);
        lastTime = now;

        const factor = isSoftwareWebGL ? 1 : 1 - Math.exp(-9 * dt);
        currentRotRef.current.x +=
          (targetRotRef.current.x - currentRotRef.current.x) * factor;
        currentRotRef.current.y +=
          (targetRotRef.current.y - currentRotRef.current.y) * factor;

        pivot.rotation.x = currentRotRef.current.x;
        pivot.rotation.y = currentRotRef.current.y;

        renderer.render(scene, camera);

        const stillMoving =
          !isSoftwareWebGL &&
          (Math.abs(targetRotRef.current.x - currentRotRef.current.x) > 0.002 ||
            Math.abs(targetRotRef.current.y - currentRotRef.current.y) > 0.002);

        const done = () => {
          renderBusy = false;
          if (renderDirty || stillMoving) {
            requestRender();
          }
        };

        if (isSoftwareWebGL) {
          afterDraw(done);
        } else {
          done();
        }
      });
    };

    requestRenderRef.current = requestRender;

    const disposableTextures: THREE.Texture[] = [envTex, shadowTex];

    const mountPlaqueFallback = () => {
      const attachPlaque = (tex: THREE.Texture | null) => {
        const built = buildCompositeProductPlaque(
          tex,
          accentHex,
          isDarkRef.current,
        );
        themeMatsRef.current.plaque = built.materials;
        pivot.add(built.group);
        requestRender();
      };

      if (imageUrl) {
        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');
        loader.load(
          imageUrl,
          (tex) => {
            if (disposed) {
              tex.dispose();
              return;
            }
            tex.colorSpace = THREE.SRGBColorSpace;
            tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
            disposableTextures.push(tex);
            attachPlaque(tex);
            setLoading(false);
          },
          undefined,
          () => {
            if (disposed) return;
            attachPlaque(null);
            setLoading(false);
          },
        );
      } else {
        attachPlaque(null);
        queueMicrotask(() => setLoading(false));
      }
    };

    if (model3dUrl) {
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        model3dUrl,
        (gltf) => {
          if (disposed) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const center = box.getCenter(new THREE.Vector3());
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          model.position.sub(center);
          model.scale.setScalar(2.4 / maxDim);
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              child.castShadow = !isSoftwareWebGL;
              child.receiveShadow = !isSoftwareWebGL;
            }
          });
          pivot.add(model);
          setLoading(false);
          requestRender();
        },
        undefined,
        () => {
          if (!disposed) {
            mountPlaqueFallback();
          }
        },
      );
    } else {
      mountPlaqueFallback();
    }

    const handleResize = () => {
      if (!container || disposed) return;
      const w = container.clientWidth || 480;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      renderer.render(scene, camera);
      requestRender();
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(frameId);
      resizeObserver.disconnect();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((m) => m.dispose());
          } else {
            mesh.material.dispose();
          }
        }
      });
      disposableTextures.forEach((t) => t.dispose());
      renderer.dispose();
      themeMatsRef.current = {};
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [imageUrl, model3dUrl, accentHex]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (draggingRef.current) {
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      targetRotRef.current.y += dx * 0.011;
      targetRotRef.current.x = THREE.MathUtils.clamp(
        targetRotRef.current.x + dy * 0.008,
        -0.55,
        0.55,
      );
      requestRenderRef.current();
    } else if (e.pointerType === 'mouse') {
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      targetRotRef.current.y = nx * 0.34;
      targetRotRef.current.x = ny * 0.16;
      requestRenderRef.current();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    draggingRef.current = false;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const resetView = () => {
    targetRotRef.current = { x: 0.08, y: -0.22 };
    requestRenderRef.current();
  };

  return (
    <div
      className="relative aspect-[4/3] w-full rounded-[28px] overflow-hidden bg-slate-100/90 dark:bg-slate-900/90 border border-white/60 dark:border-white/10 select-none touch-none cursor-grab active:cursor-grabbing"
      data-testid="three-3d-viewer"
      aria-label={`عرض ثلاثي الأبعاد لمنتج ${productName}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Dedicated isolated WebGL canvas mount — zero backdrop-filter siblings over canvas */}
      <div ref={mountRef} className="w-full h-full" />

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100/95 dark:bg-slate-900/95 text-slate-600 dark:text-slate-300 text-xs font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--lg-primary)]" />
          <span>جاري تجهيز المشهد ثلاثي الأبعاد...</span>
        </div>
      )}

      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="px-3 py-1.5 rounded-full bg-slate-900/85 text-white text-[11px] font-medium">
          اسحب للتدوير 360°
        </span>
        <button
          type="button"
          onClick={resetView}
          aria-label="إعادة ضبط زاوية العرض ثلاثي الأبعاد"
          className="pointer-events-auto h-8 px-3 rounded-full liquid-btn-glass text-slate-900 dark:text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة الضبط
        </button>
      </div>
    </div>
  );
}
