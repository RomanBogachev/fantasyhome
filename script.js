const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const isMobile = window.matchMedia("(max-width: 720px)");
const saveData = Boolean(navigator.connection?.saveData);
const particleCanvas = document.querySelector("#particles");
const particleContext = particleCanvas?.getContext("2d", { alpha: true });
const worldArt = document.querySelector(".world__art");

const SCENE_WIDTH = 1672;
const SCENE_HEIGHT = 941;
const ART_INSET = 18;
const ART_SCALE = 1.035;

// Coordinates are mapped to confirmed light sources in the supplied background.
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
].map((lantern, index) => ({ ...lantern, phase: (index * 1.73) % (Math.PI * 2) }));

let particles = [];
let frameId = 0;
let lastFrame = 0;
let sceneInitialized = false;

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

function resizeCanvas() {
  if (!particleCanvas || !particleContext) return;

  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  const width = window.innerWidth;
  const height = window.innerHeight;
  particleCanvas.width = Math.floor(width * dpr);
  particleCanvas.height = Math.floor(height * dpr);
  particleCanvas.style.width = `${width}px`;
  particleCanvas.style.height = `${height}px`;
  particleContext.setTransform(dpr, 0, 0, dpr, 0, 0);

  const moteCount = isMobile.matches ? 16 : Math.min(40, Math.floor(width / 32));
  const fireflyCount = isMobile.matches ? 8 : Math.min(22, Math.floor(width / 56));
  const butterflyCount = isMobile.matches ? 2 : 6;
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

    const coreRadius = radius * 1.55 * (0.96 + quickFlutter * 0.04);
    const innerGlow = particleContext.createRadialGradient(point.x, point.y, 0, point.x, point.y, coreRadius);
    innerGlow.addColorStop(0, `rgba(255, 255, 226, ${0.94 * flicker})`);
    innerGlow.addColorStop(0.28, `rgba(255, 220, 116, ${0.72 * flicker})`);
    innerGlow.addColorStop(0.66, `rgba(255, 153, 42, ${0.28 * flicker})`);
    innerGlow.addColorStop(1, "rgba(236, 112, 22, 0)");
    particleContext.fillStyle = innerGlow;
    particleContext.beginPath();
    particleContext.arc(point.x, point.y, coreRadius, 0, Math.PI * 2);
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

  const pulse = 0.62 + Math.sin(time * (firefly ? 0.0032 : 0.001) + particle.phase) * 0.38;
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
  if (!sceneInitialized || !particleContext || reduceMotion.matches || document.hidden) return;
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
  if (sceneInitialized && !reduceMotion.matches && !saveData && !document.hidden) frameId = requestAnimationFrame(drawScene);
}

function initializeScene() {
  if (sceneInitialized || !particleCanvas || !particleContext || saveData) return;
  sceneInitialized = true;
  resizeCanvas();
  startScene();
}

if ("requestIdleCallback" in window) window.requestIdleCallback(initializeScene, { timeout: 1200 });
else window.setTimeout(initializeScene, 350);

function setupPointerParallax() {
  if (!worldArt || !particleCanvas || isMobile.matches || reduceMotion.matches) return;

  const hasGsap = Boolean(window.gsap);
  const artX = hasGsap ? window.gsap.quickTo(worldArt, "x", { duration: 0.8, ease: "power3.out" }) : null;
  const artY = hasGsap ? window.gsap.quickTo(worldArt, "y", { duration: 0.8, ease: "power3.out" }) : null;
  const canvasX = hasGsap ? window.gsap.quickTo(particleCanvas, "x", { duration: 0.8, ease: "power3.out" }) : null;
  const canvasY = hasGsap ? window.gsap.quickTo(particleCanvas, "y", { duration: 0.8, ease: "power3.out" }) : null;
  let fallbackFrame = 0;

  document.addEventListener("pointermove", (event) => {
    if (document.hidden || reduceMotion.matches || isMobile.matches) return;
    const x = ((event.clientX / window.innerWidth) - 0.5) * -9;
    const y = ((event.clientY / window.innerHeight) - 0.5) * -5;

    if (artX && artY && canvasX && canvasY) {
      artX(x);
      artY(y);
      canvasX(x);
      canvasY(y);
      return;
    }

    if (fallbackFrame) return;
    fallbackFrame = requestAnimationFrame(() => {
      worldArt.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${ART_SCALE})`;
      particleCanvas.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      fallbackFrame = 0;
    });
  }, { passive: true });
}

function setupGsapMotion() {
  if (!window.gsap || reduceMotion.matches) return;
  const { gsap } = window;

  gsap.timeline({ defaults: { ease: "power3.out" } })
    .addLabel("world", 0)
    .from(".world__art", { scale: 1.075, duration: 1.55, ease: "power2.out" }, "world")
    .from("[data-intro='nav']", { y: -14, autoAlpha: 0, duration: 0.55 }, "world+=0.08")
    .from("[data-intro='profile']", { x: -14, autoAlpha: 0, duration: 0.68 }, "world+=0.16")
    .from(".project-tab", { autoAlpha: 0, duration: 0.3, stagger: 0.045 }, "world+=0.38")
    .from("[data-intro='content']", { x: 14, autoAlpha: 0, duration: 0.68 }, "world+=0.24");
}

const projectTabs = Array.from(document.querySelectorAll(".project-tab"));
const projectPanels = Array.from(document.querySelectorAll(".project-detail"));

function activateProject(nextTab, { focus = false, instant = false } = {}) {
  if (!nextTab) return;
  const nextPanelId = nextTab.getAttribute("aria-controls");
  const projectStage = document.querySelector(".project-stage");
  const projectNav = document.querySelector(".project-nav");

  if (instant) {
    projectStage?.classList.add("is-instant");
    projectNav?.classList.add("is-instant");
  }

  for (const tab of projectTabs) {
    const selected = tab === nextTab;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  }

  for (const panel of projectPanels) {
    const selected = panel.id === nextPanelId;
    panel.setAttribute("aria-hidden", String(!selected));
    panel.toggleAttribute("inert", !selected);
  }

  if (focus) nextTab.focus();
  if (instant) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      projectStage?.classList.remove("is-instant");
      projectNav?.classList.remove("is-instant");
    }));
  }
}

projectTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateProject(tab));
  tab.addEventListener("keydown", (event) => {
    const lastIndex = projectTabs.length - 1;
    let nextIndex = index;

    if (event.key === "ArrowDown" || event.key === "ArrowRight") nextIndex = index === lastIndex ? 0 : index + 1;
    else if (event.key === "ArrowUp" || event.key === "ArrowLeft") nextIndex = index === 0 ? lastIndex : index - 1;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lastIndex;
    else return;

    event.preventDefault();
    activateProject(projectTabs[nextIndex], { focus: true, instant: true });
  });
});

const audio = document.querySelector("#ambient-audio");
const soundToggle = document.querySelector(".sound-toggle");
let audioUnlockAttached = false;

function setSoundUI(playing) {
  if (!soundToggle) return;
  soundToggle.setAttribute("aria-pressed", String(playing));
  soundToggle.setAttribute("aria-label", playing ? "Pause Elven Lullaby" : "Play Elven Lullaby");
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

function handleVisibility() {
  const paused = document.hidden;
  document.body.classList.toggle("is-paused", paused);

  if (paused) {
    cancelAnimationFrame(frameId);
    window.gsap?.globalTimeline.pause();
  } else {
    window.gsap?.globalTimeline.resume();
    startScene();
  }
}

document.addEventListener("visibilitychange", handleVisibility);
window.addEventListener("resize", () => {
  if (sceneInitialized) resizeCanvas();
  startScene();
});
reduceMotion.addEventListener("change", () => {
  startScene();
});
window.addEventListener("beforeunload", () => {
  cancelAnimationFrame(frameId);
});

setupPointerParallax();
setupGsapMotion();
