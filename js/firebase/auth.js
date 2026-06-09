import { app }

from "./firebase-config.js";

import {

  getAuth

}

from "https://www.gstatic.com/firebasejs/12.14.0/firebase-auth.js";

export const auth =

  getAuth(app);