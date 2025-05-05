// backup.js
import { games, saveData } from './save.js';
import { renderGames } from './cards.js';

document.getElementById("exportBtn").addEventListener("click", () => {
  const dataStr = JSON.stringify(games, null, 2);
  const blob = new Blob([dataStr], { type: "application/json" });
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
  reader.onload = (event) => {
    try {
      const importedGames = JSON.parse(event.target.result);
      if (Array.isArray(importedGames)) {
        games = importedGames;
        saveData();
        renderGames();
        alert("✅ Игры импортированы!");
      } else {
        throw new Error("Формат данных неверен");
      }
    } catch (err) {
      alert("❌ Ошибка при чтении файла.");
      console.error(err);
    }
  };

  reader.readAsText(file);
});
