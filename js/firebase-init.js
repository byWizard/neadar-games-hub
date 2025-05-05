// firebase-init.js
import { firebaseConfig } from './config.js';

import firebase from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-app-compat.js';
import 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth-compat.js';
import 'https://www.gstatic.com/firebasejs/9.6.1/firebase-database-compat.js';

firebase.initializeApp(firebaseConfig);

export { firebase };
