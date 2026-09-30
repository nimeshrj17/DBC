import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const credential = cert({
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
});

initializeApp({ credential });

const db = getFirestore();
const snapshot = await db.collection('tables').get();
if (snapshot.empty) {
  console.log('No tables found in the database.');
} else {
  console.log('Tables found:');
  snapshot.forEach(doc => {
    console.log(`- ID: ${doc.id}, Number: ${doc.data().number}, Status: ${doc.data().status}`);
  });
}
