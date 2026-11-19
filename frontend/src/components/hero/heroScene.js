import * as THREE from "three";

const C = { paper: 0xf4f1ea, ink: 0x23262e, inkDeep: 0x15171c, blue: 0x2247ff, line: 0xcdc6b6, screen: 0x1b2340 };

function roundedShape(w, h, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function slab(w, h, d, r, mat) {
  const bevel = Math.min(0.035, d / 2.5);
  const g = new THREE.ExtrudeGeometry(roundedShape(w, h, Math.min(r, w / 2, h / 2)), {
    depth: d, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 10,
  });
  g.translate(0, 0, -d / 2);
  const m = new THREE.Mesh(g, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

// Brand artwork from /public/brand, rasterised once into a texture.
function svgPlane(url, w, h, M, key) {
  const mat = new THREE.MeshStandardMaterial({ transparent: true, opacity: 0, roughness: 0.6 });
  M[key] = mat;
  const img = new Image();
  img.onload = () => {
    const c = document.createElement("canvas");
    c.width = 1024;
    c.height = Math.round((1024 * h) / w);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    mat.map = tex;
    mat.opacity = 1;
    mat.needsUpdate = true;
  };
  img.src = url;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
}

function at(mesh, x, y, z) {
  mesh.position.set(x, y, z);
  return mesh;
}

function buildObjects(M) {
  // Website: browser window with content blocks that "build" in Web mode
  const web = new THREE.Group();
  web.add(slab(3.4, 2.25, 0.12, 0.16, M.paper));
  web.add(at(slab(3.4, 0.3, 0.04, 0.12, M.ink), 0, 0.98, 0.08));
  [-1.5, -1.36, -1.22].forEach((x, i) => web.add(at(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16).rotateX(Math.PI / 2), i === 2 ? M.blue : M.line), x, 0.98, 0.12)));
  const blocks = [
    at(svgPlane("/brand/adzenmedia-horizontal-charcoal.svg", 1.45, 1.45 * (111 / 658), M, "logoWeb"), -0.86, 0.52, 0.11),
    at(slab(1.2, 0.1, 0.04, 0.04, M.line), -1.0, 0.25, 0.1),
    at(slab(1.2, 0.1, 0.04, 0.04, M.line), -1.0, 0.08, 0.1),
    at(slab(0.8, 0.26, 0.06, 0.13, M.blue), -1.2, -0.25, 0.12),
    at(slab(1.3, 1.25, 0.06, 0.08, M.line), 0.8, 0.05, 0.1),
    at(slab(0.95, 0.4, 0.05, 0.06, M.paperShade), -1.05, -0.75, 0.1),
    at(slab(1.3, 0.4, 0.05, 0.06, M.paperShade), 0.8, -0.75, 0.1),
  ];
  blocks.forEach((b) => web.add(b));
  web.userData.blocks = blocks;

  // Social video / ad: phone with play button, progress bar and CTA pill
  const ad = new THREE.Group();
  ad.add(slab(1.3, 2.4, 0.14, 0.22, M.inkDeep));
  ad.add(at(slab(1.12, 2.0, 0.03, 0.12, M.screen), 0, 0.04, 0.09));
  ad.add(at(svgPlane("/brand/adzenmedia-favicon.svg", 0.24, 0.24, M, "logoAdMark"), -0.36, 0.82, 0.15));
  ad.add(at(svgPlane("/brand/adzenmedia-horizontal-white.svg", 0.58, 0.58 * (111 / 658), M, "logoAdWord"), 0.1, 0.82, 0.15));
  const tri = new THREE.Shape();
  tri.moveTo(-0.14, -0.18); tri.lineTo(0.2, 0); tri.lineTo(-0.14, 0.18); tri.lineTo(-0.14, -0.18);
  const play = new THREE.Mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.05, bevelEnabled: false }), M.paper);
  ad.add(at(play, 0, 0.35, 0.1));
  ad.add(at(slab(0.9, 0.04, 0.02, 0.02, M.ink), 0, -0.45, 0.11));
  const fill = slab(0.9, 0.045, 0.025, 0.02, M.blue);
  fill.geometry.translate(0.45, 0, 0);
  ad.add(at(fill, -0.45, -0.45, 0.12));
  const pill = at(slab(0.8, 0.22, 0.06, 0.11, M.blueGlow), 0, -0.78, 0.12);
  ad.add(pill);
  ad.userData = { fill, pill };

  // AI conversation: three bubbles and typing dots
  const chat = new THREE.Group();
  const bubbles = [
    at(slab(1.9, 0.48, 0.12, 0.24, M.paper), -0.25, 0.65, 0),
    at(slab(1.6, 0.48, 0.12, 0.24, M.blue), 0.35, 0.0, 0.05),
    at(slab(1.2, 0.48, 0.12, 0.24, M.paper), -0.45, -0.65, 0.1),
  ];
  bubbles.forEach((b) => chat.add(b));
  const dots = [-0.2, 0, 0.2].map((x) => at(new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.ink), -0.45 + x, -0.65, 0.2));
  dots.forEach((d) => chat.add(d));
  chat.userData = { bubbles, dots };

  // Calendar: grid with one slot that gets booked in AI mode
  const cal = new THREE.Group();
  cal.add(slab(2.1, 2.0, 0.12, 0.14, M.paper));
  cal.add(at(slab(2.1, 0.38, 0.05, 0.12, M.ink), 0, 0.81, 0.08));
  let slot = null;
  for (let r = 0; r < 4; r += 1) {
    for (let c = 0; c < 5; c += 1) {
      const isSlot = r === 2 && c === 3;
      const mat = isSlot ? M.slot : M.line;
      const t = at(slab(0.3, 0.26, 0.04, 0.05, mat), -0.76 + c * 0.38, 0.38 - r * 0.36, 0.09);
      cal.add(t);
      if (isSlot) slot = t;
    }
  }
  const check = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.03, 10, 32), M.blue);
  cal.add(at(check, slot.position.x, slot.position.y, 0.16));
  cal.userData = { slot, check };

  return { web, ad, chat, cal };
}

// Objects lifted toward the viewer in each mode; the rest step back slightly.
const FOCUS = { web: ["web"], marketing: ["ad"], ai: ["chat", "cal"] };
const LIFT = 0.55;
const SINK = -0.3;
const TWEEN = 0.8;
const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

// Per-mode targets: [x, y, z, rotY, rotX, scale]
const LAYOUTS = {
  web: { web: [-0.1, 0.15, 1.2, -0.18, 0.04, 1.12], ad: [2.75, -0.7, -0.6, -0.35, 0.05, 0.85], chat: [-2.9, 1.05, -1.1, 0.3, 0.1, 0.75], cal: [2.5, 1.55, -2.0, -0.3, 0.12, 0.7] },
  marketing: { web: [-2.5, 0.5, -1.6, 0.35, 0.06, 0.8], ad: [0.1, 0.0, 1.5, -0.12, 0.03, 1.2], chat: [2.6, 1.0, -0.8, -0.3, 0.1, 0.72], cal: [-2.4, -1.3, -1.2, 0.4, -0.05, 0.6] },
  ai: { web: [-3.0, -1.0, -2.2, 0.35, 0.05, 0.7], ad: [3.0, 1.3, -2.2, -0.35, 0.1, 0.65], chat: [-1.1, 0.45, 1.3, 0.16, 0.04, 1.05], cal: [1.7, -0.3, 0.8, -0.28, 0.06, 0.95] },
};

export function createHeroScene(canvas, initialMode = "web") {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(C.inkDeep, 12, 24);
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);

  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x1a1d26, 1.6));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(4, 6, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 25 });
  key.shadow.radius = 6;
  key.shadow.bias = -0.0004;
  scene.add(key);
  const rim = new THREE.PointLight(C.blue, 40, 16, 2);
  rim.position.set(-4.5, 2.5, -2.5);
  scene.add(rim);
  const fillLight = new THREE.PointLight(0xffd9a8, 8, 14, 2);
  fillLight.position.set(3.5, -2.5, 4);
  scene.add(fillLight);

  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.1 }));
  backdrop.position.z = -3.2;
  backdrop.receiveShadow = true;
  scene.add(backdrop);

  const M = {
    paper: new THREE.MeshPhysicalMaterial({ color: C.paper, roughness: 0.5, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
    paperShade: new THREE.MeshStandardMaterial({ color: 0xe3ddd0, roughness: 0.7 }),
    ink: new THREE.MeshStandardMaterial({ color: C.ink, roughness: 0.55 }),
    inkDeep: new THREE.MeshPhysicalMaterial({ color: C.inkDeep, roughness: 0.3, metalness: 0.2, clearcoat: 0.6 }),
    line: new THREE.MeshStandardMaterial({ color: C.line, roughness: 0.8 }),
    screen: new THREE.MeshStandardMaterial({ color: C.screen, roughness: 0.25, emissive: 0x0a1040, emissiveIntensity: 0.6 }),
    blue: new THREE.MeshStandardMaterial({ color: C.blue, roughness: 0.3, emissive: C.blue, emissiveIntensity: 0.22 }),
    blueGlow: new THREE.MeshStandardMaterial({ color: C.blue, roughness: 0.3, emissive: C.blue, emissiveIntensity: 0.3 }),
    slot: new THREE.MeshStandardMaterial({ color: C.line, roughness: 0.6, emissive: C.blue, emissiveIntensity: 0 }),
  };

  const root = new THREE.Group();
  scene.add(root);
  const objs = buildObjects(M);
  const names = ["web", "ad", "chat", "cal"];
  names.forEach((n, i) => {
    const o = objs[n];
    const a = (i / names.length) * Math.PI * 2 + 0.6;
    o.position.set(Math.cos(a) * 9, Math.sin(a) * 6, -6);
    o.rotation.set(0.8, a, 0.4);
    o.scale.setScalar(0.2);
    o.userData.delay = 0.15 + i * 0.18;
    o.userData.phase = i * 1.7;
    root.add(o);
  });

  let mode = initialMode;
  let modeAt = 0;
  let width = 1, height = 1, narrow = false;
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  let tweening = false;
  const state = {};
  names.forEach((n) => {
    const o = objs[n];
    state[n] = { x: o.position.x, y: o.position.y, z: o.position.z, ry: o.rotation.y, rx: o.rotation.x, s: o.scale.x, from: null };
  });

  function target(n) {
    const [x, y, z, ry, rx, sc] = LAYOUTS[mode][n];
    const dz = FOCUS[mode].includes(n) ? LIFT : SINK;
    return { x: x * (narrow ? 0.72 : 1), y, z: z + dz, ry, rx, s: sc * (FOCUS[mode].includes(n) ? 1.04 : 1) };
  }
  const clock = new THREE.Clock();
  let running = true;
  let raf = 0;

  function resize() {
    const r = canvas.parentElement.getBoundingClientRect();
    width = Math.max(1, r.width);
    height = Math.max(1, r.height);
    narrow = width / height < 1.05;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.position.set(0, 0.2, narrow ? 12.5 : 9.2);
    camera.updateProjectionMatrix();
  }

  function step() {
    const dt = Math.min(clock.getDelta(), 0.1);
    const t = clock.elapsedTime;
    const since = t - modeAt;
    const k = 1 - Math.exp(-dt * 3.6);
    const keys = ["x", "y", "z", "ry", "rx", "s"];
    const p = tweening ? easeInOut(Math.min(since / TWEEN, 1)) : 0;
    if (tweening && since >= TWEEN) tweening = false;
    smooth.x += (pointer.x - smooth.x) * (1 - Math.exp(-dt * 5));
    smooth.y += (pointer.y - smooth.y) * (1 - Math.exp(-dt * 5));
    names.forEach((n) => {
      const o = objs[n];
      const st = state[n];
      const tg = target(n);
      if (st.from && (tweening || p > 0)) {
        keys.forEach((key) => { st[key] = st.from[key] + (tg[key] - st.from[key]) * p; });
        if (!tweening) st.from = null;
      } else if (t >= o.userData.delay) {
        keys.forEach((key) => { st[key] += (tg[key] - st[key]) * k; });
      } else {
        return;
      }
      const depth = (st.z + 3) / 4.5;
      const bob = Math.sin(t * 0.9 + o.userData.phase) * 0.05;
      o.position.set(st.x + smooth.x * 0.14 * depth, st.y + bob - smooth.y * 0.1 * depth, st.z);
      o.rotation.set(st.rx + smooth.y * 0.05, st.ry + smooth.x * 0.08, 0);
      o.scale.setScalar(st.s);
    });

    // Web: content blocks build in sequence
    objs.web.userData.blocks.forEach((b, i) => {
      const target = mode === "web" ? (since > 0.25 + i * 0.12 ? 1 : 0.05) : 1;
      b.scale.y += (target - b.scale.y) * k * 1.6;
    });
    // Marketing: video plays, CTA pulses
    const fillTarget = mode === "marketing" ? (since * 0.28) % 1 : 0.35;
    objs.ad.userData.fill.scale.x = Math.max(0.02, mode === "marketing" ? fillTarget : objs.ad.userData.fill.scale.x + (0.35 - objs.ad.userData.fill.scale.x) * k);
    M.blueGlow.emissiveIntensity = mode === "marketing" ? 0.3 + Math.sin(t * 4) * 0.25 + 0.25 : 0.3;
    // AI: bubbles appear, typing dots bounce, then the calendar slot is booked
    objs.chat.userData.bubbles.forEach((b, i) => {
      const target = mode === "ai" ? (since > 0.2 + i * 0.45 ? 1 : 0.01) : 1;
      b.scale.x += (target - b.scale.x) * k * 1.8;
      b.scale.y = b.scale.x;
    });
    objs.chat.userData.dots.forEach((d, i) => {
      const show = mode === "ai" && since > 1.5 && since < 2.4;
      d.visible = show;
      d.position.y = -0.65 + (show ? Math.abs(Math.sin(t * 7 + i)) * 0.08 : 0);
    });
    const booked = mode === "ai" ? since > 2.2 : true;
    M.slot.emissiveIntensity += ((booked ? 0.9 : 0) - M.slot.emissiveIntensity) * k * 2;
    M.slot.color.lerp(new THREE.Color(booked ? C.blue : C.line), k * 2);
    const chk = objs.cal.userData.check;
    const cs = chk.scale.x + ((booked ? 1 : 0.01) - chk.scale.x) * k * 2;
    chk.scale.setScalar(cs);
    chk.rotation.z = t * 0.8;

    renderer.render(scene, camera);
  }

  function loop() {
    if (!running) return;
    step();
    raf = requestAnimationFrame(loop);
  }

  const area = canvas.parentElement;
  function onLeave() { pointer.x = 0; pointer.y = 0; }
  function onPointer(e) {
    if (e.pointerType !== "mouse") return;
    const r = area.getBoundingClientRect();
    pointer.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.y = ((e.clientY - r.top) / r.height) * 2 - 1;
  }

  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement);
  if (finePointer) {
    area.addEventListener("pointermove", onPointer, { passive: true });
    area.addEventListener("pointerleave", onLeave);
  }
  loop();

  return {
    setMode(m) {
      if (m === mode || !LAYOUTS[m]) return;
      names.forEach((n) => { const st = state[n]; st.from = { x: st.x, y: st.y, z: st.z, ry: st.ry, rx: st.rx, s: st.s }; });
      mode = m;
      modeAt = clock.elapsedTime;
      tweening = true;
    },
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; clock.getDelta(); loop(); } },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      area.removeEventListener("pointermove", onPointer);
      area.removeEventListener("pointerleave", onLeave);
      scene.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
      Object.values(M).forEach((m) => { m.map?.dispose(); m.dispose(); });
      renderer.dispose();
    },
  };
}
