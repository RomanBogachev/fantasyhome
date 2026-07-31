const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isMobile = window.matchMedia("(max-width: 700px)");
const particleCanvas = document.querySelector("#particles");
const particleContext = particleCanvas?.getContext("2d", { alpha: true });
const worldArt = document.querySelector(".world__art");

const SCENE_WIDTH = 1672;
const SCENE_HEIGHT = 941;
const ART_INSET = 18;
const ART_SCALE = 1.035;

// Pixel coordinates verified against the full-resolution background.
// These are physical lanterns and path lights only; windows are intentionally
// excluded so the flicker cannot appear as a random glow on the scenery.
const LANTERNS = [
  { x: 611, y: 586, radius: 8, phase: 0.2 },
  { x: 784, y: 621, radius: 6, phase: 3.1 },
  { x: 883, y: 648, radius: 5, phase: 0.9 },
  { x: 957, y: 649, radius: 4, phase: 2.5 },
  { x: 1039, y: 620, radius: 8, phase: 4.2 },
  { x: 1118, y: 702, radius: 7, phase: 1.3 },
  { x: 1202, y: 575, radius: 5, phase: 3.8 },
  { x: 1269, y: 349, radius: 7, phase: 5.1 },
  { x: 1309, y: 592, radius: 7, phase: 0.5 },
  { x: 1412, y: 457, radius: 8, phase: 2.8 },
  { x: 1417, y: 493, radius: 5, phase: 4.7 },
  { x: 779, y: 879, radius: 10, phase: 1.9 },
];

let particles = [];
let frameId = 0;
let lastFrame = 0;
let sceneOffsetX = 0;
let sceneOffsetY = 0;

function getSceneLayout() {
  const boxWidth = window.innerWidth + ART_INSET * 2;
  const boxHeight = window.innerHeight + ART_INSET * 2;
  const imageScale = Math.max(boxWidth / SCENE_WIDTH, boxHeight / SCENE_HEIGHT);
  const renderedWidth = SCENE_WIDTH * imageScale;
  const renderedHeight = SCENE_HEIGHT * imageScale;
  const positionX = isMobile.matches ? 0.57 : 0.5;
  return {
    imageScale,
    left: -ART_INSET + (boxWidth - renderedWidth) * positionX,
    top: -ART_INSET + (boxHeight - renderedHeight) * 0.5,
  };
}

function scenePoint(point) {
  const layout = getSceneLayout();
  const baseX = layout.left + point.x * layout.imageScale;
  const baseY = layout.top + point.y * layout.imageScale;
  const centerX = window.innerWidth * 0.5;
  const centerY = window.innerHeight * 0.5;
  return {
    x: centerX + (baseX - centerX) * ART_SCALE,
    y: centerY + (baseY - centerY) * ART_SCALE,
  };
}

function sceneRadius(point, radius) {
  const center = scenePoint(point);
  const edge = scenePoint({ x: point.x + radius, y: point.y });
  return Math.abs(edge.x - center.x);
}

function createParticle(width, height, type) {
  const firefly = type === "firefly";
  return {
    type,
    x: Math.random() * width,
    y: height * (0.18 + Math.random() * 0.76),
    radius: firefly ? Math.random() * 1.25 + 1.15 : Math.random() * 1.15 + 0.35,
    vx: (Math.random() - 0.5) * (firefly ? 0.22 : 0.07),
    vy: (Math.random() - 0.5) * (firefly ? 0.14 : 0.05) - 0.025,
    alpha: firefly ? Math.random() * 0.3 + 0.7 : Math.random() * 0.34 + 0.18,
    phase: Math.random() * Math.PI * 2,
    color: firefly ? "255, 210, 92" : Math.random() > 0.55 ? "217, 240, 220" : "175, 229, 218",
  };
}

function createButterfly(width, height) {
  return {
    x: width * (0.14 + Math.random() * 0.72),
    y: height * (0.25 + Math.random() * 0.53),
    scale: Math.random() * 0.55 + 1.15,
    speed: Math.random() * 0.12 + 0.12,
    phase: Math.random() * Math.PI * 2,
    direction: Math.random() > 0.5 ? 1 : -1,
    tint: Math.random() > 0.45 ? "244, 210, 123" : "174, 230, 215",
  };
}

function resizeCanvases() {
  if (!particleCanvas || !particleContext) return;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = window.innerWidth;
  const height = window.innerHeight;

  particleCanvas.width = Math.floor(width * dpr);
  particleCanvas.height = Math.floor(height * dpr);
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;
  particleContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  const moteCount = isMobile.matches ? 18 : Math.min(42, Math.floor(width / 30));
  const fireflyCount = isMobile.matches ? 9 : Math.min(24, Math.floor(width / 52));
  const butterflyCount = isMobile.matches ? 2 : 7;
  particles = [
    ...Array.from({ length: moteCount }, () => createParticle(width, height, "mote")),
    ...Array.from({ length: fireflyCount }, () => createParticle(width, height, "firefly")),
    ...Array.from({ length: butterflyCount }, () => createButterfly(width, height)),
  ];
}

function drawLanterns(time) {
  particleContext.save();
  particleContext.globalCompositeOperation = "screen";
  for (const lantern of LANTERNS) {
    const point = scenePoint(lantern);
    const radius = sceneRadius(lantern, lantern.radius);
    const slowBreath = Math.sin(time * 0.0018 + lantern.phase);
    const quickFlutter = Math.sin(time * 0.0085 + lantern.phase * 2.3);
    const tinyShimmer = Math.sin(time * 0.016 + lantern.phase * 4.1);
    const flicker = 0.82 + slowBreath * 0.08 + quickFlutter * 0.07 + tinyShimmer * 0.05;
    const radiusPulse = 1 + slowBreath * 0.06 + quickFlutter * 0.035;
    const glowRadius = radius * 4.35 * radiusPulse;

    const outerGlow = particleContext.createRadialGradient(point.x, point.y, 0, point.x, point.y, glowRadius);
    outerGlow.addColorStop(0, `rgba(255, 204, 92, ${0.3 * flicker})`);
    outerGlow.addColorStop(0.24, `rgba(255, 172, 49, ${0.2 * flicker})`);
    outerGlow.addColorStop(0.58, `rgba(225, 119, 25, ${0.08 * flicker})`);
    outerGlow.addColorStop(1, "rgba(205, 94, 18, 0)");
    particleContext.fillStyle = outerGlow;
    particleContext.beginPath();
    particleContext.arc(point.x, point.y, glowRadius, 0, Math.PI * 2);
    particleContext.fill();

    const flameY = point.y;
    const coreRadius = radius * 1.55 * (0.96 + quickFlutter * 0.04);
    const innerGlow = particleContext.createRadialGradient(point.x, flameY, 0, point.x, flameY, coreRadius);
    innerGlow.addColorStop(0, `rgba(255, 255, 226, ${0.94 * flicker})`);
    innerGlow.addColorStop(0.28, `rgba(255, 220, 116, ${0.72 * flicker})`);
    innerGlow.addColorStop(0.66, `rgba(255, 153, 42, ${0.28 * flicker})`);
    innerGlow.addColorStop(1, "rgba(236, 112, 22, 0)");
    particleContext.fillStyle = innerGlow;
    particleContext.beginPath();
    particleContext.arc(point.x, flameY, coreRadius, 0, Math.PI * 2);
    particleContext.fill();
  }
  particleContext.restore();
}

function drawButterfly(butterfly, time) {
  const wing = 0.36 + Math.abs(Math.sin(time * 0.009 + butterfly.phase)) * 0.64;
  butterfly.x += butterfly.speed * butterfly.direction;
  butterfly.y += Math.sin(time * 0.0015 + butterfly.phase) * 0.2;
  if (butterfly.x < -30) butterfly.x = window.innerWidth + 30;
  if (butterfly.x > window.innerWidth + 30) butterfly.x = -30;

  particleContext.save();
  particleContext.translate(butterfly.x, butterfly.y);
  particleContext.rotate(Math.sin(time * 0.001 + butterfly.phase) * 0.22);
  particleContext.scale(butterfly.scale * butterfly.direction, butterfly.scale);
  particleContext.shadowColor = `rgba(${butterfly.tint}, .86)`;
  particleContext.shadowBlur = 12;
  particleContext.fillStyle = `rgba(${butterfly.tint}, .8)`;
  particleContext.strokeStyle = `rgba(${butterfly.tint}, .7)`;
  particleContext.lineWidth = 0.65;
  particleContext.beginPath();
  particleContext.moveTo(-1, 0);
  particleContext.bezierCurveTo(-11 * wing, -9, -13 * wing, 6, -2, 4);
  particleContext.bezierCurveTo(-8 * wing, 9, -6 * wing, 14, 0, 5);
  particleContext.bezierCurveTo(6 * wing, 14, 8 * wing, 9, 2, 4);
  particleContext.bezierCurveTo(13 * wing, 6, 11 * wing, -9, 1, 0);
  particleContext.closePath();
  particleContext.fill();
  particleContext.stroke();
  particleContext.fillStyle = "rgba(91, 69, 36, .86)";
  particleContext.fillRect(-0.7, -1, 1.4, 7);
  particleContext.restore();
}

function drawParticle(particle, time) {
  const firefly = particle.type === "firefly";
  particle.x += particle.vx + Math.sin(time * (firefly ? 0.0012 : 0.00028) + particle.phase) * (firefly ? 0.12 : 0.025);
  particle.y += particle.vy + Math.cos(time * (firefly ? 0.001 : 0.00022) + particle.phase) * (firefly ? 0.1 : 0.015);
  if (particle.y < -12) particle.y = window.innerHeight + 12;
  if (particle.y > window.innerHeight + 12) particle.y = -12;
  if (particle.x < -12) particle.x = window.innerWidth + 12;
  if (particle.x > window.innerWidth + 12) particle.x = -12;

  const pulseRate = firefly ? 0.0032 : 0.001;
  const pulse = 0.62 + Math.sin(time * pulseRate + particle.phase) * 0.38;
  if (firefly) {
    const haloRadius = particle.radius * 7;
    const halo = particleContext.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, haloRadius);
    halo.addColorStop(0, `rgba(${particle.color}, ${0.7 * pulse})`);
    halo.addColorStop(0.2, `rgba(${particle.color}, ${0.35 * pulse})`);
    halo.addColorStop(1, `rgba(${particle.color}, 0)`);
    particleContext.fillStyle = halo;
    particleContext.beginPath();
    particleContext.arc(particle.x, particle.y, haloRadius, 0, Math.PI * 2);
    particleContext.fill();
  }

  particleContext.beginPath();
  particleContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
  particleContext.fillStyle = `rgba(${particle.color}, ${particle.alpha * pulse})`;
  particleContext.shadowColor = `rgba(${particle.color}, ${firefly ? 0.9 : 0.5})`;
  particleContext.shadowBlur = firefly ? 16 : particle.radius > 1 ? 7 : 3;
  particleContext.fill();
  particleContext.shadowBlur = 0;
}

function drawScene(time) {
  if (!particleContext || reduceMotion.matches || document.hidden) return;
  frameId = requestAnimationFrame(drawScene);
  if (time - lastFrame < 32) return;
  lastFrame = time;
  particleContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
  drawLanterns(time);

  for (const particle of particles) {
    if (particle.type) drawParticle(particle, time);
    else drawButterfly(particle, time);
  }
}

function startScene() {
  cancelAnimationFrame(frameId);
  particleContext?.clearRect(0, 0, window.innerWidth, window.innerHeight);
  if (!reduceMotion.matches && !navigator.connection?.saveData) frameId = requestAnimationFrame(drawScene);
}

let pointerFrame = 0;
document.addEventListener("pointermove", (event) => {
  if (reduceMotion.matches || isMobile.matches || pointerFrame || !worldArt || !particleCanvas) return;
  pointerFrame = requestAnimationFrame(() => {
    sceneOffsetX = ((event.clientX / window.innerWidth) - 0.5) * -9;
    sceneOffsetY = ((event.clientY / window.innerHeight) - 0.5) * -5;
    worldArt.style.transform = `translate3d(${sceneOffsetX.toFixed(2)}px, ${sceneOffsetY.toFixed(2)}px, 0) scale(${ART_SCALE})`;
    particleCanvas.style.transform = `translate3d(${sceneOffsetX.toFixed(2)}px, ${sceneOffsetY.toFixed(2)}px, 0)`;
    pointerFrame = 0;
  });
});

const realmLinks = [...document.querySelectorAll(".realm-link")];
const audio = document.querySelector("#ambient-audio");
const soundToggle = document.querySelector(".sound-toggle");
let audioUnlockAttached = false;

function setSoundUI(playing) {
  if (!soundToggle) return;
  soundToggle.setAttribute("aria-pressed", String(playing));
  soundToggle.setAttribute("aria-label", playing ? "Pause background music" : "Play background music");
}

function detachAudioUnlock() {
  if (!audioUnlockAttached) return;
  document.removeEventListener("pointerdown", unlockAudio, true);
  document.removeEventListener("click", unlockAudio, true);
  document.removeEventListener("keydown", unlockAudio, true);
  audioUnlockAttached = false;
}

async function startAudio() {
  if (!audio || !audio.paused) return true;
  try {
    await audio.play();
    return true;
  } catch {
    setSoundUI(false);
    return false;
  }
}

async function unlockAudio(event) {
  if ((event.type === "pointerdown" || event.type === "click") && soundToggle?.contains(event.target)) return;
  if (await startAudio()) detachAudioUnlock();
}

function attachAudioUnlock() {
  if (audioUnlockAttached) return;
  document.addEventListener("pointerdown", unlockAudio, true);
  document.addEventListener("click", unlockAudio, true);
  document.addEventListener("keydown", unlockAudio, true);
  audioUnlockAttached = true;
}

if (audio) {
  audio.volume = 0.5;
  audio.addEventListener("play", () => { setSoundUI(true); detachAudioUnlock(); });
  audio.addEventListener("pause", () => setSoundUI(false));
  startAudio().then((started) => { if (!started) attachAudioUnlock(); });
}

soundToggle?.addEventListener("click", async () => {
  if (!audio) return;
  if (audio.paused) await startAudio();
  else audio.pause();
});

document.addEventListener("keydown", (event) => {
  if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
  const current = realmLinks.indexOf(document.activeElement);
  const direction = event.key === "ArrowDown" ? 1 : -1;
  const next = current < 0 ? 0 : (current + direction + realmLinks.length) % realmLinks.length;
  realmLinks[next]?.focus();
  event.preventDefault();
});

document.querySelector(".primary-action")?.addEventListener("click", () => {
  window.setTimeout(() => realmLinks[0]?.focus({ preventScroll: true }), 450);
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden) cancelAnimationFrame(frameId);
  else startScene();
});
window.addEventListener("resize", () => { resizeCanvases(); startScene(); });
reduceMotion.addEventListener("change", startScene);

resizeCanvases();
startScene();
