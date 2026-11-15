// Project E.D.E.N. — Mockup 3D: un Seed Pod se enchufa en la bandeja de NASA Veggie.
// Modelo hecho con código (Three.js), sin archivos externos: compatible con la CSP del sitio.
// Se puede girar con el mouse o el dedo. Respeta "reducir movimiento" del sistema.
//
// Uso (cargado aparte para no agrandar la carga inicial):
//   import PodVeggie3D from './three';   // ver ./index.js
//   <PodVeggie3D podId="ASH-Gen2-001" plantName="Ashwagandha" accent="#E14D2A" height={320} />
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const SLOT_COLS = 3;
const SLOT_ROWS = 2;
const EMPTY_SLOT = 4; // índice del hueco donde entra el pod (0..5)

function buildScene(accent) {
  const scene = new THREE.Scene();
  const disposables = [];
  const mat = (opts) => { const m = new THREE.MeshStandardMaterial(opts); disposables.push(m); return m; };
  const geo = (g) => { disposables.push(g); return g; };
  const mesh = (g, m, [x, y, z] = [0, 0, 0]) => { const o = new THREE.Mesh(geo(g), m); o.position.set(x, y, z); scene.add(o); return o; };

  // Luces: ambiente + "sol" + LEDs de Veggie (rojo + azul = luz magenta)
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8899aa, 1.1));
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(3, 5, 4);
  scene.add(sun);
  const ledLight = new THREE.PointLight(0xff4fd8, 6, 6, 1.6);
  ledLight.position.set(0, 1.55, 0);
  scene.add(ledLight);

  const metal = mat({ color: 0xd9dee5, metalness: 0.55, roughness: 0.35 });
  const darkMetal = mat({ color: 0x46505e, metalness: 0.6, roughness: 0.4 });

  // Base y panel trasero de la unidad Veggie
  mesh(new THREE.BoxGeometry(2.6, 0.16, 1.8), metal, [0, -0.08, 0]);
  mesh(new THREE.BoxGeometry(2.6, 1.9, 0.08), darkMetal, [0, 0.95, -0.9]);

  // Banco de LEDs arriba (emisivo) y sus soportes
  mesh(new THREE.BoxGeometry(2.4, 0.08, 1.6), mat({ color: 0x2b0b2a, emissive: 0xff3fd0, emissiveIntensity: 1.4 }), [0, 1.86, 0]);
  for (const x of [-1.25, 1.25]) for (const z of [-0.85, 0.85]) mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8), darkMetal, [x, 0.95, z]);

  // Fuelle transparente (bellows) que encierra el cultivo
  const bellows = mat({ color: 0xcfe8ff, transparent: true, opacity: 0.12, roughness: 0.1, depthWrite: false });
  mesh(new THREE.BoxGeometry(2.5, 1.8, 1.7), bellows, [0, 0.95, 0]);

  // Tapete de raíces (root mat)
  mesh(new THREE.BoxGeometry(2.3, 0.05, 1.5), mat({ color: 0x8a6b4a, roughness: 0.95 }), [0, 0.025, 0]);

  // 6 "plant pillows" en una grilla 3×2; uno queda vacío para el Seed Pod
  const pillowMat = mat({ color: 0xf2efe6, roughness: 0.9 });
  const leafMat = mat({ color: 0x3fa34d, roughness: 0.6 });
  const slots = [];
  for (let r = 0; r < SLOT_ROWS; r++) {
    for (let c = 0; c < SLOT_COLS; c++) {
      const i = r * SLOT_COLS + c;
      const x = (c - 1) * 0.7;
      const z = (r - 0.5) * 0.7;
      slots.push(new THREE.Vector3(x, 0.05, z));
      if (i === EMPTY_SLOT) {
        mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.02, 24), mat({ color: 0x1f2937 }), [x, 0.06, z]); // hueco
        continue;
      }
      mesh(new THREE.BoxGeometry(0.42, 0.14, 0.42), pillowMat, [x, 0.12, z]);
      // Brote: tallo + hojas
      mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 6), leafMat, [x, 0.33, z]);
      for (let k = 0; k < 4; k++) {
        const leaf = mesh(new THREE.SphereGeometry(0.09, 10, 8), leafMat, [x, 0.46, z]);
        leaf.scale.set(1, 0.25, 0.55);
        leaf.rotation.y = (k * Math.PI) / 2;
        leaf.position.x += Math.cos((k * Math.PI) / 2) * 0.08;
        leaf.position.z += Math.sin((k * Math.PI) / 2) * 0.08;
      }
    }
  }

  // Seed Pod: cápsula con anillo de color (identifica la planta) y tapa
  const pod = new THREE.Group();
  const shell = new THREE.Mesh(geo(new THREE.CapsuleGeometry(0.16, 0.32, 8, 20)), mat({ color: 0xf8fafc, metalness: 0.2, roughness: 0.3 }));
  const band = new THREE.Mesh(geo(new THREE.TorusGeometry(0.165, 0.025, 10, 32)), mat({ color: accent, emissive: accent, emissiveIntensity: 0.35 }));
  band.rotation.x = Math.PI / 2;
  band.position.y = 0.08;
  const cap = new THREE.Mesh(geo(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 20)), darkMetal);
  cap.position.y = 0.34;
  pod.add(shell, band, cap);
  scene.add(pod);

  return { scene, pod, target: slots[EMPTY_SLOT], disposables };
}

export default function PodVeggie3D({ podId = 'Seed Pod', plantName = '', accent = '#E14D2A', height = 320 }) {
  const mountRef = useRef(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setFailed(true); // sin WebGL: se muestra el texto alternativo
      return undefined;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    renderer.domElement.style.display = 'block';

    const { scene, pod, target, disposables } = buildScene(accent);
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
    camera.position.set(2.9, 2.3, 3.4);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.7, 0);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.minDistance = 3;
    controls.maxDistance = 7;
    controls.maxPolarAngle = Math.PI * 0.49;

    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    controls.autoRotate = !reduceMotion;
    controls.autoRotateSpeed = 0.8;

    const resize = () => {
      const w = mount.clientWidth || 300;
      renderer.setSize(w, height, false);
      renderer.domElement.style.width = '100%';
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Animación: el pod baja y se enchufa en el hueco; pausa; vuelve a empezar.
    const top = 1.45;
    const seated = target.y + 0.2;
    pod.position.set(target.x, reduceMotion ? seated : top, target.z);
    const clock = new THREE.Clock();
    let frame;
    const loop = () => {
      const t = clock.getElapsedTime();
      if (!reduceMotion) {
        const cycle = t % 5; // 0–2 s baja · 2–4 s enchufado · 4–5 s sube
        const ease = (u) => u * u * (3 - 2 * u);
        pod.position.y = cycle < 2 ? top + (seated - top) * ease(cycle / 2)
          : cycle < 4 ? seated
            : seated + (top - seated) * ease(cycle - 4);
        pod.rotation.y = t * 0.6;
      }
      controls.update();
      renderer.render(scene, camera);
      frame = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      controls.dispose();
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [accent, height]);

  const label = `3D model: Seed Pod ${podId}${plantName ? ` (${plantName})` : ''} plugging into the NASA Veggie plant pillow tray`;
  return (
    <figure className="relative m-0 w-full overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100">
      {failed ? (
        <div style={{ height }} className="flex items-center justify-center p-4 text-center font-mono text-xs text-slate-500">
          {label} (3D view needs WebGL)
        </div>
      ) : (
        <div ref={mountRef} role="img" aria-label={label} style={{ height }} className="w-full cursor-grab active:cursor-grabbing" />
      )}
      <figcaption className="pointer-events-none absolute left-3 top-3 rounded-md bg-white/85 px-2 py-1 font-mono text-[10px] font-semibold tracking-wider text-slate-700 uppercase shadow-xs">
        {podId}{plantName ? ` · ${plantName}` : ''} → Veggie
      </figcaption>
      <span className="pointer-events-none absolute bottom-2 right-3 font-mono text-[10px] text-slate-500">
        Drag to rotate · mockup
      </span>
    </figure>
  );
}
