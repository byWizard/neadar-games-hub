// auth.js
import { firebase } from './firebase-init.js';
import { games, currentUser } from './state.js';
import { renderGames } from './cards.js';
import { saveData } from './save.js';

const authBtn = document.getElementById("authBtn");
const userStatus = document.getElementById("userStatus");

export function setupAuth() {
  // Кнопка авторизации
  authBtn.addEventListener("click", () => {
    if (currentUser) {
      firebase.auth().signOut();
    } else {
      const provider = new firebase.auth.GoogleAuthProvider();
      firebase.auth().signInWithPopup(provider).catch(err => {
        alert("Ошибка входа: " + err.message);
      });
    }
  });

  // Слушатель состояния пользователя
  firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
      currentUser = user;
      authBtn.textContent = "Выйти";
      userStatus.textContent = `Вы вошли как ${user.displayName}`;

      try {
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once("value");
        const data = snapshot.val();
        games = data?.games || [];
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
        games = JSON.parse(localStorage.getItem("games")) || [];
      }

      localStorage.setItem("games", JSON.stringify(games));
      renderGames();

    } else {
      currentUser = null;
      authBtn.textContent = "Войти через Google";
      userStatus.textContent = "Вы не вошли";
      games = JSON.parse(localStorage.getItem("games")) || [];
      renderGames();
    }
  });
}

setupAuth();
