// ========== АВТОРИЗАЦИЯ ЧЕРЕЗ GOOGLE ==========
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

// ========== СЛУШАТЕЛЬ СОСТОЯНИЯ ПОЛЬЗОВАТЕЛЯ ==========
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    authBtn.textContent = "Выйти";
    userStatus.textContent = `Вы вошли как ${user.displayName}`;

    // Грузим данные из Firebase
    let firebaseData = [];
    try {
      const snapshot = await database.ref(`users/${currentUser.uid}`).once("value");
      const data = snapshot.val();
      firebaseData = data?.games || [];
    } catch (error) {
      console.error("Ошибка при загрузке данных из Firebase:", error);
    }

    // Если Firebase пустой — грузим из localStorage
    const localData = JSON.parse(localStorage.getItem("games")) || [];

    games = firebaseData.length > 0 ? firebaseData : localData;

    renderGames();

  } else {
    // Неавторизован — показываем локальные данные
    currentUser = null;
    authBtn.textContent = "Войти через Google";
    userStatus.textContent = "Вы не вошли";
    games = JSON.parse(localStorage.getItem("games")) || [];
    renderGames();
  }
});
