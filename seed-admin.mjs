import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCUqN1QNTL32VD0feC93LtlUEooNNuJUg0",
  authDomain: "dbcafe-3f5ee.firebaseapp.com",
  projectId: "dbcafe-3f5ee",
  storageBucket: "dbcafe-3f5ee.firebasestorage.app",
  messagingSenderId: "357679112647",
  appId: "1:357679112647:web:644f1c32e484879245b9e2"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function seed() {
  const staffRef = collection(db, 'staff');
  const q = query(staffRef, where('pin', '==', '895518'));
  const snap = await getDocs(q);
  
  if (snap.empty) {
    await addDoc(staffRef, {
      name: 'Owner',
      pin: '895518',
      role: 'admin',
      isActive: true,
      canViewRevenue: true,
      createdAt: new Date()
    });
    console.log("Admin user created.");
  } else {
    console.log("Admin user already exists.");
  }
  process.exit(0);
}

seed();
