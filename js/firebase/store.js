import { app } from "./firebase-config.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.14.0/firebase-storage.js";

export const storage = getStorage(app);