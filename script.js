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

let games = [];
let currentUser = null;

// Инициализация Firebase
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

// Кэширование поиска
const CACHE_KEY = "gameSearchCache";
const searchCache = loadCacheFromStorage();

function loadCacheFromStorage() {
  const cached = localStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
}

function saveCacheToStorage() {
  localStorage.setItem(CACHE_KEY, JSON.stringify(searchCache));
}

function getFromCache(query) {
  const cached = searchCache[query];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

function setToCache(query, data, ttl = 3600000) {
  searchCache[query] = {
    data,
    expiresAt: Date.now() + ttl
  };
  saveCacheToStorage();
}

// RAWG API
const RAWG_API_KEY = "ВАШ_КЛЮЧ_ЗДЕСЬ";

async function searchGame(query) {
  const cached = getFromCache(query);
  if (cached) {
    console.log("Берём из кэша:", query);
    return cached;
  }

  try {
    const response = await fetch(`https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.results || [];

    setToCache(query, results);
    return results;
  } catch (err) {
    console.error("Ошибка поиска:", err);
    return [];
  }
}

// Обработчик поиска
let debounceTimer;

gameSearchInput.addEventListener("input", e => {
  const query = e.target.value.trim();
  if (query.length < 3) {
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
    li.textContent = `${game.name}`;
    li.dataset.image = game.background_image;
    li.dataset.description = game.short_description || "Описание отсутствует";
    li.dataset.name = game.name;

    li.addEventListener("click", () => {
      gameTitle.value = game.name;
      gameImage.value = game.background_image;
      gameDescription.value = game.short_description || "";

      searchResults.innerHTML = "";
    });

    searchResults.appendChild(li);
  });
}

// Тема
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.contains("dark-theme");
  if (isDark) {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeToggle.textContent = "☀️ Переключить тему";
  } else {
    document.body.classList.remove("light-theme");
    document.body.classList.add("dark-theme");
    themeToggle.textContent = "🌙 Переключить тему";
  }
  localStorage.setItem("theme", isDark ? "light" : "dark");
});

window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme") || "dark";
  if (savedTheme === "light") {
    document.body.classList.remove("dark-theme");
    document.body.classList.add("light-theme");
    themeToggle.textContent = "☀️ Переключить тему";
  }
});

// Авторизация
authBtn.addEventListener("click", () => {
  if (currentUser) {
    auth.signOut();
  } else {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(err => {
      alert("Ошибка входа: " + err.message);
    });
  }
});

// Слушатель состояния пользователя
auth.onAuthStateChanged(user => {
  if (user) {
    currentUser = user;
    authBtn.textContent = "Выйти";
    userStatus.textContent = `Вы вошли как ${user.displayName}`;
    loadUserData();
  } else {
    currentUser = null;
    authBtn.textContent = "Войти через Google";
    userStatus.textContent = "Вы не вошли";
    games = JSON.parse(localStorage.getItem("games")) || [];
    renderGames();
  }
});

// Загрузка данных
function loadUserData() {
  database.ref(`users/${currentUser.uid}`).on("value", snapshot => {
    const data = snapshot.val();
    games = data?.games || [];
    renderGames();
  });
}

// Сохранение данных
function saveUserData() {
  database.ref(`users/${currentUser.uid}`).set({ games });
}

function saveData() {
  if (currentUser) {
    saveUserData();
  } else {
    localStorage.setItem("games", JSON.stringify(games));
  }
}

// Добавление игры
addGameForm.addEventListener("submit", e => {
  e.preventDefault();
  const newGame = {
    title: gameTitle.value.trim(),
    image: gameImage.value.trim(),
    description: gameDescription.value.trim(),
    status: "want",
    rating: 0
  };
  games.push(newGame);
  saveData();
  renderGames();
  addGameForm.reset();
});

// Отображение игр
function renderGames() {
  cardsContainer.innerHTML = "";
  games.forEach((game, index) => {
    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${game.image}" alt="${game.title}">
      <h2>${game.title}</h2>
      <span class="status want">Хочу пройти</span>
      <div class="stars" data-rating="0"></div>
      <small>Добавлено</small>
      <textarea class="description">${game.description || ""}</textarea>
      <button class="delete-btn">🗑️ Удалить</button>
    `;

    // Рейтинг
    const starsEl = card.querySelector(".stars");
    for (let i = 1; i <= 5; i++) {
      const star = document.createElement("span");
      star.textContent = "★";
      star.dataset.rating = i;
      starsEl.appendChild(star);
    }

    updateStarDisplay(starsEl, game.rating || 0);

    starsEl.addEventListener("click", e => {
      if (e.target.tagName === "SPAN") {
        const rating = parseInt(e.target.dataset.rating);
        game.rating = rating;
        starsEl.dataset.rating = rating;
        updateStarDisplay(starsEl, rating);
        saveData();
      }
    });

    // Статус
    const statusEl = card.querySelector(".status");
    statusEl.addEventListener("click", () => {
      game.status = game.status === "done" ? "want" : "done";
      statusEl.className = "status " + game.status;
      statusEl.textContent = game.status === "done" ? "Пройдена" : "Хочу пройти";
      saveData();
      updateStats();
    });

    // Описание
    const descEl = card.querySelector(".description");
    descEl.value = game.description || "";
    descEl.addEventListener("input", () => {
      game.description = descEl.value;
      saveData();
    });

    // Удаление
    const deleteBtn = card.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      games.splice(index, 1);
      saveData();
      renderGames();
    });

    // Показываем статус
    if (game.status === "done") {
      statusEl.className = "status done";
      statusEl.textContent = "Пройдена";
    }

    // Добавляем карточку
    cardsContainer.appendChild(card);
  });

  updateStats();
}

function updateStarDisplay(container, rating) {
  container.querySelectorAll("span").forEach((star, idx) => {
    star.classList.toggle("active", idx < rating);
  });
}

function updateStats() {
  const done = games.filter(g => g.status === "done").length;
  doneCountEl.textContent = done;
}
