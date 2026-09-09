import webpush from "web-push";

const keys = webpush.generateVAPIDKeys();

console.log("\nVAPID Schlüssel erzeugt. In .env.local und in die Vercel Umgebung eintragen:\n");
console.log(`NEXT_PUBLIC_VAPID_PUBLIC_KEY="${keys.publicKey}"`);
console.log(`VAPID_PRIVATE_KEY="${keys.privateKey}"`);
console.log(`VAPID_SUBJECT="mailto:du@example.com"\n`);
