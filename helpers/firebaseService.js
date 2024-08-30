import serviceAccount from "./hawtie.json" assert { type: "json" };
import admin from "firebase-admin";

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export const auth = admin.auth();
