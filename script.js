// Поиск и фильтр
const searchInput = document.getElementById("searchInput");
const filterSelect = document.getElementById("filterSelect");
const cards = document.querySelectorAll(".card");

function filterCards() {
  const searchTerm = searchInput.value.toLowerCase();
  const filterValue = filterSelect.value;

  cards.forEach(card => {
    const title = card.querySelector("h2").textContent.toLowerCase();
    const status = card.querySelector(".status").classList.contains("done") ? "done" : "want";

    const matchesSearch = title.includes(searchTerm);
    const matchesFilter = filterValue === "all" || status === filterValue;

    if (matchesSearch && matchesFilter) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
}

searchInput.addEventListener("input", filterCards);
filterSelect.addEventListener("change", filterCards);

// Звезды
document.querySelectorAll(".stars").forEach(starsEl => {
  const gameId = starsEl.closest(".card").dataset.id;
  const currentRating = parseInt(starsEl.dataset.rating) || 0;

  for (let i = 1; i <= 5; i++) {
    const star = document.createElement("span");
    star.textContent = "★";
    star.dataset.rating = i;
    if (i <= currentRating) star.classList.add("active");
    starsEl.appendChild(star);
  }

  // Загрузка из localStorage
  const savedRating = localStorage.getItem(`rating-${gameId}`);
  if (savedRating) {
    starsEl.dataset.rating = savedRating;
    starsEl.querySelectorAll("span").forEach((star, index) => {
      star.classList.toggle("active", index < savedRating);
    });
  }

  starsEl.addEventListener("click", e => {
    if (e.target.tagName === "SPAN") {
      const rating = parseInt(e.target.dataset.rating);
      starsEl.dataset.rating = rating;

      starsEl.querySelectorAll("span").forEach((star, index) => {
        star.classList.toggle("active", index < rating);
      });

      localStorage.setItem(`rating-${gameId}`, rating);
    }
  });
});

// Статус
document.querySelectorAll(".card").forEach(card => {
  const statusEl = card.querySelector(".status");
  const gameId = card.dataset.id;
  const key = `game-${gameId}-status`;

  const savedStatus = localStorage.getItem(key);
  if (savedStatus) {
    statusEl.className = "status " + savedStatus;
    statusEl.textContent = savedStatus === "done" ? "Пройдена" : "Хочу пройти";
  }

  statusEl.addEventListener("click", () => {
    if (statusEl.classList.contains("done")) {
      statusEl.className = "status want";
      statusEl.textContent = "Хочу пройти";
      localStorage.setItem(key, "want");
    } else {
      statusEl.className = "status done";
      statusEl.textContent = "Пройдена";
      localStorage.setItem(key, "done");
    }

    filterCards();
  });
});

// Описание
document.querySelectorAll(".description").forEach(textarea => {
  const card = textarea.closest(".card");
  const gameId = card.dataset.id;
  const key = `desc-${gameId}`;

  const savedDesc = localStorage.getItem(key);
  if (savedDesc) {
    textarea.value = savedDesc;
  }

  textarea.addEventListener("input", () => {
    localStorage.setItem(key, textarea.value);
  });
});
