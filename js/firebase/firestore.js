import { app }
from "./firebase-config.js";

import {
  getFirestore
}
from "https://www.gstatic.com/firebasejs/12.14.0/firebase-firestore.js";

export const db =
  getFirestore(app);