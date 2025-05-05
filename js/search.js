// search.js
import { RAWG_API_KEY } from './config.js';

async function searchGame(query) {
  const cached = getFromCache(query);
  if (cached) return cached;

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

function getFromCache(query) {
  const cache = loadSearchCache();
  const cached = cache[query];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.data;
  }
  return null;
}

function setToCache(query, data, ttl = 3600000) {
  const cache = loadSearchCache();
  cache[query] = {
    data,
    expiresAt: Date.now() + ttl
  };
  localStorage.setItem("gameSearchCache", JSON.stringify(cache));
}

function loadSearchCache() {
  const cached = localStorage.getItem("gameSearchCache");
  return cached ? JSON.parse(cached) : {};
}

// Обработчик поиска
const gameSearchInput = document.getElementById("gameSearch");
const searchResults = document.getElementById("searchResults");

let debounceTimer;

gameSearchInput.addEventListener("input", async e => {
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
      document.getElementById("gameTitle").value = game.name;
      document.getElementById("gameImage").value = game.background_image;
      document.getElementById("gameDescription").value = game.short_description || "";
      searchResults.innerHTML = "";
    });
    searchResults.appendChild(li);
  });
}
