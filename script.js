const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isMobile = window.matchMedia("(max-width: 700px)");
const particleCanvas = document.querySelector("#particles");
const particleContext = particleCanvas?.getContext("2d", { alpha: true });
const worldArt = document.querySelector(".world__art");

const SCENE_WIDTH = 1672;
const SCENE_HEIGHT = 941;
const ART_INSET = 18;
const ART_SCALE = 1.035;

// Pixel coordinates extracted from the user's full-resolution red-spot markup.
// Radius follows the relative size of each marked light source.
const LANTERNS = [
  { x: 1255, y: 206, radius: 7 },
  { x: 699, y: 332, radius: 8 },
  { x: 1273, y: 340, radius: 7 },
  { x: 902, y: 344, radius: 7 },
  { x: 683, y: 370, radius: 6 },
  { x: 708, y: 370, radius: 6 },
  { x: 584, y: 374, radius: 6 },
  { x: 1114, y: 385, radius: 7 },
  { x: 956, y: 394, radius: 6 },
  { x: 922, y: 396, radius: 7 },
  { x: 887, y: 398, radius: 6 },
  { x: 751, y: 402, radius: 6 },
  { x: 1089, y: 436, radius: 8 },
  { x: 640, y: 439, radius: 5 },
  { x: 1412, y: 450, radius: 11 },
  { x: 907, y: 462, radius: 5 },
  { x: 775, y: 477, radius: 4 },
  { x: 1157, y: 489, radius: 6 },
  { x: 1256, y: 489, radius: 15 },
  { x: 1416, y: 495, radius: 5 },
  { x: 796, y: 510, radius: 4 },
  { x: 940, y: 526, radius: 5 },
  { x: 701, y: 545, radius: 5 },
  { x: 1198, y: 581, radius: 6 },
  { x: 1299, y: 581, radius: 6 },
  { x: 618, y: 594, radius: 5 },
  { x: 1025, y: 619, radius: 5 },
  { x: 1232, y: 630, radius: 6 },
  { x: 791, y: 638, radius: 5 },
  { x: 889, y: 646, radius: 5 },
  { x: 949, y: 653, radius: 5 },
  { x: 1118, y: 701, radius: 5 },
].map((lantern, index) => ({
  ...lantern,
  phase: (index * 1.73) % (Math.PI * 2),
}));

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

const blogStartedAt = new Date(2013, 8, 7, 19, 11, 35).getTime();
const uptimeParts = {
  days: document.querySelector("#runtime-days"),
  hours: document.querySelector("#runtime-hours"),
  minutes: document.querySelector("#runtime-minutes"),
  seconds: document.querySelector("#runtime-seconds"),
};

function updateBlogUptime() {
  const totalSeconds = Math.max(0, Math.floor((Date.now() - blogStartedAt) / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (uptimeParts.days) uptimeParts.days.textContent = String(days);
  if (uptimeParts.hours) uptimeParts.hours.textContent = String(hours).padStart(2, "0");
  if (uptimeParts.minutes) uptimeParts.minutes.textContent = String(minutes).padStart(2, "0");
  if (uptimeParts.seconds) uptimeParts.seconds.textContent = String(seconds).padStart(2, "0");
}

updateBlogUptime();
window.setInterval(updateBlogUptime, 1000);

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
