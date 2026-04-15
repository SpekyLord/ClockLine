import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-app.js';
import { getDatabase, ref, child, onValue, runTransaction, set } from 'https://www.gstatic.com/firebasejs/12.12.0/firebase-database.js';

window.__FIREBASE_RTDB__ = {
  getOrInitApp(config) {
    return getApps().length ? getApp() : initializeApp(config);
  },
  getDatabase,
  ref,
  child,
  onValue,
  runTransaction,
  set
};
