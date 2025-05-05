// main.js
import './firebase-init.js';
import './theme.js';
import './auth.js';
import './search.js';
import './backup.js';

import { setTheme } from './theme.js';
import { initParticles, animate, resizeCanvas } from './particles-engine.js';

window.addEventListener("DOMContentLoaded", () => {
  setTheme(localStorage.getItem("theme") || "dark");
  resizeCanvas();
  initParticles(150);
  animate();
});
