// Поиск и фильтрация
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

// Сохранение прогресса
document.querySelectorAll(".card").forEach((card, index) => {
  const statusEl = card.querySelector(".status");
  const key = `game-${index}-status`;

  // При загрузке проверяем localStorage
  const savedStatus = localStorage.getItem(key);
  if (savedStatus) {
    statusEl.className = "status " + savedStatus;
    statusEl.textContent = savedStatus === "done" ? "Пройдена" : "Хочу пройти";
  }

  // Клик по статусу меняет его и сохраняет
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

    // Обновляем фильтрацию после изменения
    filterCards();
  });
});
