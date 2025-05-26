// === DOM Elements ===
const cardsContainer = document.getElementById("cardsContainer");
const addGameForm = document.getElementById("addGameForm");
const gameTitle = document.getElementById("gameTitle");
const gameImage = document.getElementById("gameImage");
const gameDescription = document.getElementById("gameDescription");
const gameSearchInput = document.getElementById("gameSearch");
const searchResults = document.getElementById("searchResults");
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const doneCountEl = document.getElementById("doneCount");
const authBtn = document.getElementById("authBtn");
const userStatus = document.getElementById("userStatus");
const themeToggle = document.getElementById("themeToggle");
const authOnlyOverlay = document.getElementById("authOnlyOverlay");
const authRequiredLoginBtn = document.getElementById("authRequiredLoginBtn");
const nightOverlay = document.getElementById("night-overlay");

let games = [];
let currentUser = null;
let isLoadingAuth = true;
// === Firebase Setup ===
const firebaseConfig = {
  apiKey: "AIzaSyDhMfbhd7emAXNKDexXxaCxZ0k2DfkRcVg",
  authDomain: "my-games-app-hub.firebaseapp.com",
  databaseURL: "https://my-games-app-hub-default-rtdb.firebaseio.com",
  projectId: "my-games-app-hub",
  storageBucket: "my-games-app-hub.appspot.com",
  messagingSenderId: "251367004030",
  appId: "1:251367004030:web:2b1be1b1c76ee80c0d052f"
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// === Кэширование поиска ===
const CACHE_KEY = "gameSearchCache";
const searchCache = loadCacheFromStorage();

function loadCacheFromStorage() {
  return JSON.parse(localStorage.getItem(CACHE_KEY)) || {};
}

function saveCacheToStorage() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(searchCache));
}

function getFromCache(query) {
  const cached = searchCache[query];
  if (cached && Date.now() < cached.expiresAt) return cached.data;
  return null;
}

function setToCache(query, data, ttl = 3600000) {
  searchCache[query] = { data, expiresAt: Date.now() + ttl };
  saveCacheToStorage();
}

// === RAWG API поиск ===
const RAWG_API_KEY = "48b79844fcc44af7860a5fa89de88ca8";

async function searchGame(query) {
  const cached = getFromCache(query);
  if (cached) return cached;
  try {
    const response = await fetch(
      `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`
    );
    const data = await response.json();
    const results = data.results || [];
    setToCache(query, results);
    return results;
  } catch (err) {
    console.error("Ошибка поиска:", err);
    return [];
  }
}

// === Обработчик поиска по играм ===
let debounceTimer;
gameSearchInput.addEventListener("input", e => {
  const query = e.target.value.trim();
  if (query.length < 2) {
    searchResults.innerHTML = "";
    return;
  }
  clearTimeout(debounceTimer);
  searchResults.innerHTML = "<li>Ищем игры...</li>";
  debounceTimer = setTimeout(async () => {
    const results = await searchGame(query);
    renderSearchResults(results);
  }, 500);
});

function renderSearchResults(results) {
  searchResults.innerHTML = "";
  if (results.length === 0) {
    searchResults.innerHTML = "<li>Ничего не найдено</li>";
    return;
  }
  results.slice(0, 5).forEach(game => {
    const li = document.createElement("li");
    li.innerHTML = `
      <div style="display: flex; align-items: center;">
        <img src="${game.background_image}" alt="${game.name}" width="40" style="margin-right: 10px; border-radius: 4px;">
        <div>
          <strong>${game.name}</strong><br>
          <small>${game.short_description || 'Описание отсутствует'}</small>
        </div>
      </div>
    `;
    li.addEventListener("click", () => {
      gameTitle.value = game.name;
      gameImage.value = game.background_image;
      gameDescription.value = game.short_description || "";
      searchResults.innerHTML = "";
    });
    searchResults.appendChild(li);
  });
}

// === Тема ===
function setTheme(theme) {
  document.body.classList.remove("dark-theme", "light-theme");
  document.body.classList.add(`${theme}-theme`);
  themeToggle.textContent = theme === "dark" ? "🌙 Переключить тему" : "☀️ Переключить тему";
  localStorage.setItem("theme", theme);
  updateParticleColor(theme);
}
themeToggle.addEventListener("click", () => {
  const currentTheme = localStorage.getItem("theme") || "dark";
  setTheme(currentTheme === "dark" ? "light" : "dark");
});
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  setTheme(savedTheme);
});

// === Авторизация ===
authBtn.addEventListener("click", () => {
  if (currentUser) {
    auth.signOut().then(() => {
      localStorage.removeItem("games");
    });
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => alert("Ошибка входа: " + err.message));
  }
});
authRequiredLoginBtn.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(err => alert("Ошибка входа: " + err.message));
});

// === Слушатель состояния пользователя ===
auth.onAuthStateChanged((user) => {
  isLoadingAuth = false;
  if (user) {
    currentUser = user;
    authBtn.textContent = "Выйти";
    userStatus.textContent = `Вы вошли как ${user.displayName}`;

    // Загружаем данные только из Firebase
    database.ref(`users/${currentUser.uid}`).once("value").then(snapshot => {
      const data = snapshot.val();
      games = data?.games || []; // ❗ Не используем localStorage, если пользователь залогинен

      applyFilters();
      toggleAuthUI(false);
    }).catch(console.error);

  } else {
    currentUser = null;
    authBtn.textContent = "Войти через Google";
    userStatus.textContent = "Вы не вошли";
    games = []; // ❗ При выходе всегда чистим список
    applyFilters();
    toggleAuthUI(true);
  }
});

function toggleAuthUI(isVisible) {
  if (isLoadingAuth) return; // Пока проверяем — не показываем оверлей
  authOnlyOverlay.style.display = isVisible ? "flex" : "none";
}

// === Сохранение данных ===
function saveData() {
  if (currentUser) {
    database.ref(`users/${currentUser.uid}`).set({ games });
  } else {
    localStorage.setItem("games", JSON.stringify(games));
  }
}

// === Добавление игры ===
addGameForm.addEventListener("submit", e => {
  e.preventDefault();
  games.push({
    id: Date.now(),
    title: gameTitle.value.trim(),
    image: gameImage.value.trim(),
    description: gameDescription.value.trim(),
    status: "want",
    rating: 0
  });
  saveData();
  applyFilters();
  addGameForm.reset();
});

// === Фильтрация ===
document.addEventListener("DOMContentLoaded", () => {
  searchInput.addEventListener("input", applyFilters);
  filterSelect.addEventListener("change", applyFilters);
});

function applyFilters() {
  const term = searchInput.value.toLowerCase();
  const filter = filterSelect.value;
  const filtered = games.filter(g =>
  g.title.toLowerCase().includes(term) &&
  (filter === "all" || g.status === filter)
);
  renderFilteredGames(filtered);
}

function renderFilteredGames(filteredGames) {
  const existingCards = [...cardsContainer.querySelectorAll(".card")];

  filteredGames.forEach((game, index) => {
    let card = existingCards.find(c => c.dataset.id == game.id);

    if (!card) {
      card = document.createElement("div");
      card.className = "card";
      card.setAttribute("data-id", game.id);
      card.innerHTML = `
  <img src="${game.image}" alt="${game.title}">
  <h2>${game.title}</h2>
  <span class="status ${game.status}">${
    game.status === "done"
      ? "Пройдена"
      : game.status === "want"
        ? "Хочу пройти"
        : "Отложена"
  }</span>
        <div class="stars" data-rating="${game.rating || 0}"></div>
        <small>Добавлено</small>
        <textarea class="description">${game.description || ""}</textarea>
        <button class="delete-btn">🗑️ Удалить</button>
      `;

      const starsEl = card.querySelector(".stars");
      for (let i = 1; i <= 5; i++) {
        const star = document.createElement("span");
        star.textContent = "★";
        star.dataset.rating = i;
        starsEl.appendChild(star);
      }

      updateStarDisplay(starsEl, game.rating || 0);

      // Звёзды
      starsEl.addEventListener("click", e => {
        if (e.target.tagName === "SPAN") {
          game.rating = parseInt(e.target.dataset.rating);
          updateStarDisplay(starsEl, game.rating);
          saveData();
        }
      });

      // Статус
const statusEl = card.querySelector(".status");
statusEl.addEventListener("click", () => {
  if (game.status === "done") {
    game.status = "want";
  } else if (game.status === "want") {
    game.status = "postponed"; // Переход к новому статусу
  } else {
    game.status = "done"; // Цикл из "postponed" -> "done"
  }
  saveData();
  updateCard(card, game); 
  updateStats(); 
});

      // Описание
      const descEl = card.querySelector(".description");
      descEl.addEventListener("input", () => {
        game.description = descEl.value;
        saveData();
      });

      // Удаление
const deleteBtn = card.querySelector(".delete-btn");
deleteBtn.addEventListener("click", () => {
  games.splice(index, 1);
  saveData();
  applyFilters();
  updateStats(); // ✅ Добавили обновление счётчика
});

      cardsContainer.appendChild(card);
    } else {
      updateCard(card, game);
    }
  });

  // Удаляем карточки, которых нет в новых данных
  existingCards.forEach(card => {
    if (!filteredGames.some(g => g.id == card.dataset.id)) {
      card.remove();
    }
  });

  updateStats();
}

function updateCard(card, game) {
  const statusEl = card.querySelector(".status");
  statusEl.className = `status ${game.status}`;
  statusEl.textContent =
    game.status === "done"
      ? "Пройдена"
      : game.status === "want"
      ? "Хочу пройти"
      : "Отложена"; // Текст для нового статуса

  const starsEl = card.querySelector(".stars");
  updateStarDisplay(starsEl, game.rating || 0);

  const descEl = card.querySelector(".description");
  descEl.value = game.description || "";
}

function updateStarDisplay(container, rating) {
  container.querySelectorAll("span").forEach((star, idx) => {
    star.classList.toggle("active", idx < rating);
  });
}

function updateStats() {
  doneCountEl.textContent = games.filter(g => g.status === "done").length;
}

// ==== ЭКСПОРТ / ИМПОРТ ====
document.getElementById("exportBtn").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(games, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "my-games.json";
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("importInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = event => {
    try {
      games = JSON.parse(event.target.result);
      saveData();
      applyFilters();
      alert("✅ Игры импортированы!");
    } catch (e) {
      alert("❌ Ошибка импорта.");
    }
  };
  reader.readAsText(file);
});

// === Частицы через Canvas с реакцией на мышь и цветом под тему ===
const canvas = document.getElementById("particles");
const ctx = canvas.getContext("2d");

let particles = [];
let width, height;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;

function resizeCanvas() {
  width = (canvas.width = window.innerWidth);
  height = (canvas.height = window.innerHeight);
}
resizeCanvas();
window.addEventListener("resize", resizeCanvas);

window.addEventListener("mousemove", e => {
  mouseX = e.clientX;
  mouseY = e.clientY;
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.vx = (Math.random() - 0.5) * 0.5;
    this.vy = (Math.random() - 0.5) * 0.5;
    this.radius = Math.random() * 2 + 1;
    this.alpha = Math.random() * 0.5 + 0.3;
    this.color = currentParticleColor;
  }

  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${this.color}, ${this.alpha})`;
    ctx.fill();
  }

  update() {
    const dx = this.x - mouseX;
    const dy = this.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200) {
      this.vx -= dx / 2000;
      this.vy -= dy / 2000;
    }
    this.x += this.vx;
    this.y += this.vy;
    if (this.x < 0 || this.x > width) this.reset();
    if (this.y < 0 || this.y > height) this.reset();
  }
}

function createParticles(num = 160) {
  particles = [];
  for (let i = 0; i < num; i++) {
    particles.push(new Particle());
  }
}

let currentParticleColor = "255, 255, 255";

function setParticleColor(color) {
  currentParticleColor = color;
  particles.forEach(p => {
    p.color = color;
  });
}

function animateParticles() {
  ctx.clearRect(0, 0, width, height);
  particles.forEach(p => {
    p.update();
    p.draw();
  });

// === Фонарик ===
// === Переменные для ночного режима ===
const nightOverlay = document.getElementById("night-overlay");

let baseRadius = 250; // базовый радиус фонарика
let maxRadius = 390;  // максимальный радиус в центре
let minRadius = 185;  // минимальный радиус

// === Слежение за курсором и динамический радиус ===
document.addEventListener("mousemove", (e) => {
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;

  const dx = e.clientX - centerX;
  const dy = e.clientY - centerY;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);

  // Рассчитываем радиус от расстояния до центра
  let dynamicRadius = baseRadius + (maxDistance - distance) / 15;

  // Ограничиваем радиус
  dynamicRadius = Math.min(maxRadius, Math.max(minRadius, dynamicRadius));

  // Обновляем стиль overlay
  nightOverlay.style.background = `
    radial-gradient(
      circle at ${e.clientX}px ${e.clientY}px,
      rgba(0, 0, 0, 0) 80px,
      rgba(0, 0, 0, 0.95) ${dynamicRadius}px
    )
  `;
});

// === Переключение анимации частиц через кнопку ===
const toggleParallaxBtn = document.getElementById("toggleParallaxBtn");
const canvas = document.getElementById("particles");
let isParticlesEnabled = localStorage.getItem("particlesEnabled") !== "false";

// Установка начального состояния + иконка
function updateParticleButtonIcon() {
  const icon = toggleParallaxBtn.querySelector(".icon-galaxy");
  icon.textContent = isParticlesEnabled ? "🚫" : "✨";
  toggleParallaxBtn.title = isParticlesEnabled ? "партиклы нахуй" : "вернуть партиклы";
}

// Применяем начальное состояние
if (!isParticlesEnabled) {
  canvas.style.display = "none";
}
updateParticleButtonIcon(); // Обновляем иконку при загрузке

toggleParallaxBtn.addEventListener("click", () => {
  isParticlesEnabled = !isParticlesEnabled;
  if (isParticlesEnabled) {
    canvas.style.display = "block";
  } else {
    canvas.style.display = "none";
  }
  localStorage.setItem("particlesEnabled", isParticlesEnabled);
  updateParticleButtonIcon(); // Обновляем иконку при клике
});

  // Линии между частицами
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const p1 = particles[i];
      const p2 = particles[j];
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 100) {
        ctx.strokeStyle = `rgba(${currentParticleColor}, ${0.7 * (1 - dist / 100)})`;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
      }
    }
  }

  // Линии к курсору
  ctx.strokeStyle = `rgba(${currentParticleColor}, 0.2)`;
  for (let p of particles) {
    const dx = p.x - mouseX;
    const dy = p.y - mouseY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 150) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouseX, mouseY);
      ctx.stroke();
    }
  }

  requestAnimationFrame(animateParticles);
}

// === Цвет частиц под тему ===
function updateParticleColor(theme) {
  if (theme === "dark") {
    setParticleColor("0, 150, 255");
  } else {
    setParticleColor("50, 50, 50");
  }
}

// === Инициализация ===
createParticles();
animateParticles();

// === Объект с пресетами фонов ===
const backgroundPresets = {
  cosmic: {
    layer1: "https://i.ibb.co/jkJc4Tbq/135763-nochnoe-nebo-atmosfera-astronomicheskij-obekt-galaktika-tumannost-3840x2160.jpg",
    layer2: "https://i.ibb.co/bjv5H8FP/143309-podzemnye-vody-oblako-atmosfera-nebo-tumannost-7680x4320.jpg"
  },
  anime: {
    layer1: "https://picsum.photos/id/1025/1920/1080 ",
    layer2: "https://i.ibb.co/xttMC2sR/178023-temnaya-ubijca-akame-akame-multik-ubijca-akame-rukav-7680x4320-1.jpg"
  },
  nature: { // например, природа
    layer1: "https://picsum.photos/id/1025/1920/1080 ",
    layer2: "https://i.ibb.co/pjHpFQW8/img1-akspic-ru-voda-gora-gidroresursy-rastenie-oblako-4096x2340.jpg"
  },
  cyberpunk: { // например, киберпанк
    layer1: "https://picsum.photos/id/1025/1920/1080 ",
    layer2: "https://i.ibb.co/3yNNYJgN/163092-kiberpank-kiberpank-2077-kiberpank-2020-etap-xbox-one-3840x2160.jpg"
  },
  night: {
  layer1: "https://picsum.photos/id/1025/1920/1080 ", 
  layer2: "https://i.ibb.co/WJnMV3P/img2-akspic-ru-monohromnyj-noch-karta-dizajn-mir-2560x1600-2.jpg"// тёмный фон города ночью
  },
  minimal: {
    layer1: null,
    layer2: null
  }
};

// === DOM Elements ===
const bgMenuToggle = document.getElementById("bgMenuToggle");
const bgPresetList = document.getElementById("bgPresetList");

// === Переключение меню ===
bgMenuToggle.addEventListener("click", () => {
  bgPresetList.classList.toggle("open");
});

// === Закрытие при клике вне меню ===
document.addEventListener("click", (e) => {
  if (!bgMenuToggle.contains(e.target) && !bgPresetList.contains(e.target)) {
    bgPresetList.classList.remove("open");
  }
});

// === Применение выбранного фона ===
function setBackground(preset) {
  const layers = backgroundPresets[preset];
  const layer1 = document.querySelector(".layer-1");
  const layer2 = document.querySelector(".layer-2");

  if (layer1 && layer2) {
    if (layers.layer1) {
      layer1.style.display = "block";
      layer1.style.backgroundImage = `url('${layers.layer1}')`;
    } else {
      layer1.style.display = "none";
    }
    if (layers.layer2) {
      layer2.style.display = "block";
      layer2.style.backgroundImage = `url('${layers.layer2}')`;
    } else {
      layer2.style.display = "none";
    }
  }

  localStorage.setItem("bgPreset", preset);

  // Режим "ночь с фонариком"
  if (preset === "night") {
    setParticleColor("255, 255, 255"); // Белые частицы
    document.querySelectorAll(".parallax-bg").forEach(el => el.style.display = "block");
    document.getElementById("particles").style.display = "none";
    nightOverlay.style.display = "block"; // Только над фоном

  // Режим аниме
  } else if (preset === "anime") {
    setParticleColor("255, 180, 255");
    document.querySelectorAll(".parallax-bg").forEach(el => el.style.display = "block");
    document.getElementById("particles").style.display = "block";
    nightOverlay.style.display = "none";

  // Режим минимал
  } else if (preset === "minimal") {
    setParticleColor("255, 255, 255");
    document.querySelectorAll(".parallax-bg").forEach(el => el.style.display = "none");
    document.getElementById("particles").style.display = "block";
    nightOverlay.style.display = "none";

  // Все остальные пресеты
  } else {
    const currentTheme = localStorage.getItem("theme") || "dark";
    updateParticleColor(currentTheme);
    document.querySelectorAll(".parallax-bg").forEach(el => el.style.display = "block");
    document.getElementById("particles").style.display = "block";
    nightOverlay.style.display = "none";
  }
}
// === Обработчики кликов по пунктам меню ===
bgPresetList.querySelectorAll("button[data-bg]").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const preset = e.target.dataset.bg;
    setBackground(preset);
    bgPresetList.classList.remove("open");
  });
});

// === Автозагрузка сохранённого фона ===
window.addEventListener("DOMContentLoaded", () => {
  const savedPreset = localStorage.getItem("bgPreset") || "cosmic";
  setBackground(savedPreset);
});

// === Счётчик FPS ===
const fpsCounter = document.getElementById("fps-counter");
let lastTime = performance.now();
let frameCount = 0;
let fps = 0;

function updateFPS() {
  const now = performance.now();
  const delta = now - lastTime;
  frameCount++;

  if (delta >= 1000) {
    fps = Math.round((frameCount * 1000) / delta);
    frameCount = 0;
    lastTime = now;
  }

  if (fpsCounter) {
    fpsCounter.textContent = `${fps} FPS`;
  }

  requestAnimationFrame(updateFPS);
}

if (fpsCounter) {
  updateFPS();
}
// === Тест скрытого сообщения ===
const hiddenMessage = document.querySelector('.hidden-message');

document.addEventListener('mousemove', (e) => {
  const rect = hiddenMessage.getBoundingClientRect();
  const dx = e.clientX - rect.left;
  const dy = e.clientY - rect.top;
  const distance = Math.sqrt(dx*dx + dy*dy);

  if (distance < 100) {
    hiddenMessage.style.opacity = '1';
  } else {
    hiddenMessage.style.opacity = '0';
  }
});
