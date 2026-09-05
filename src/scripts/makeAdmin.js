import { auth } from "../config/firebase.js";

const email = "anjireddyookanti@gmail.com";

try {
  const user = await auth.getUserByEmail(email);

  await auth.setCustomUserClaims(user.uid, {
    admin: true,
  });

  console.log(`Admin role assigned to: ${email}`);
  console.log(`UID: ${user.uid}`);

  process.exit(0);
} catch (error) {
  console.error("Failed to assign admin role:");
  console.error(error);

  process.exit(1);
}