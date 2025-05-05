// save.js
import { games, currentUser } from './state.js';

export function saveData() {
  localStorage.setItem("games", JSON.stringify(games));
  if (currentUser) {
    firebase.database().ref(`users/${currentUser.uid}`).set({ games });
  }
}
