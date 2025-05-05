// ========== ПОИСК ЧЕРЕЗ RAWG API ==========
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

async function searchGame(query) {
  const cached = getFromCache(query);
  if (cached) return cached;

  try {
    const response = await fetch(`https://api.rawg.io/api/games?key=48b79844fcc44af7860a5fa89de88ca8&search=${encodeURIComponent(query)}`);
    const data = await response.json();
    const results = data.results || [];
    setToCache(query, results);
    return results;
  } catch (err) {
    console.error("Ошибка поиска:", err);
    return [];
  }
}

// ========== ОБРАБОТЧИК ПОИСКА ==========
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
