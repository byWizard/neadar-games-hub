const cardsContainer = document.getElementById("cardsContainer");
const addGameForm = document.getElementById("addGameForm");
const gameTitle = document.getElementById("gameTitle");
const gameImage = document.getElementById("gameImage");
const gameDescription = document.getElementById("gameDescription");
const doneCountEl = document.getElementById("doneCount");
const authBtn = document.getElementById("authBtn");
const userStatus = document.getElementById("userStatus");

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

// Обработчик входа/выхода
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

// Загрузка данных из Firebase
function loadUserData() {
  database.ref(`users/${currentUser.uid}`).on("value", snapshot => {
    const data = snapshot.val();
    games = data?.games || [];
    renderGames();
  });
}

// Сохранение данных в Firebase
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
      <span class="status ${game.status === "done" ? "done" : "want"}">${game.status === "done" ? "Пройдена" : "Хочу пройти"}</span>
      <div class="stars" data-rating="${game.rating || 0}"></div>
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
      if (i <= game.rating) star.classList.add("active");
      starsEl.appendChild(star);
    }

    starsEl.addEventListener("click", e => {
      if (e.target.tagName === "SPAN") {
        const rating = parseInt(e.target.dataset.rating);
        game.rating = rating;
        starsEl.dataset.rating = rating;
        starsEl.querySelectorAll("span").forEach((star, idx) => {
          star.classList.toggle("active", idx < rating);
        });
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

    cardsContainer.appendChild(card);
  });

  updateStats();
}

// Сохранение данных
function updateStats() {
  const done = games.filter(g => g.status === "done").length;
  doneCountEl.textContent = done;
}
