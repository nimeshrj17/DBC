import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from './firebase';

export async function seedDatabase() {
  console.log("Starting seed process...");
  
  // Seed Tables
  const tablesRef = collection(db, 'tables');
  const tablesSnapshot = await getDocs(tablesRef);
  
  if (tablesSnapshot.empty) {
    console.log("Seeding tables...");
    const batch = writeBatch(db);
    
    const defaultTables = [
      { id: '1', number: 1, seats: 2, status: 'empty', currentOrderId: null },
      { id: '2', number: 2, seats: 4, status: 'empty', currentOrderId: null },
      { id: '3', number: 3, seats: 4, status: 'empty', currentOrderId: null },
      { id: '4', number: 4, seats: 4, status: 'empty', currentOrderId: null },
      { id: '5', number: 5, seats: 6, status: 'empty', currentOrderId: null },
      { id: '6', number: 6, seats: 2, status: 'empty', currentOrderId: null },
      { id: '7', number: 7, seats: 2, status: 'empty', currentOrderId: null },
      { id: '8', number: 8, seats: 4, status: 'empty', currentOrderId: null },
      { id: '9', number: 9, seats: 4, status: 'empty', currentOrderId: null },
      { id: '10', number: 10, seats: 2, status: 'empty', currentOrderId: null },
      { id: '11', number: 11, seats: 2, status: 'empty', currentOrderId: null },
      { id: '12', number: 12, seats: 2, status: 'empty', currentOrderId: null },
    ];
    
    for (const table of defaultTables) {
      const docRef = doc(db, 'tables', table.id);
      batch.set(docRef, table);
    }
    
    await batch.commit();
    console.log("Tables seeded successfully.");
  } else {
    console.log("Tables collection is not empty, skipping.");
  }

  // Seed Menu Items
  const menuRef = collection(db, 'menuItems');
  const menuSnapshot = await getDocs(menuRef);
  
  if (menuSnapshot.empty) {
    console.log("Seeding menu items...");
    const batch = writeBatch(db);
    
    const defaultMenu = [
      { id: 'm1', name: 'Cappuccino', description: 'Classic cappuccino with rich espresso', price: 150, category: 'Beverages', available: true },
      { id: 'm2', name: 'Iced Americano', description: 'Smooth and bold iced americano', price: 140, category: 'Beverages', available: true },
      { id: 'm3', name: 'Masala Chai', description: 'Spiced Indian tea', price: 80, category: 'Beverages', available: true },
      { id: 'm4', name: 'Veg Burger', description: 'Classic veg burger with cheese', price: 180, category: 'Snacks', available: true },
      { id: 'm5', name: 'French Fries', description: 'Crispy salted fries', price: 120, category: 'Snacks', available: true },
      { id: 'm6', name: 'Garlic Bread', description: 'Toasted garlic bread with cheese', price: 150, category: 'Snacks', available: true },
      { id: 'm7', name: 'Marlboro', description: 'Standard pack', price: 350, category: 'Cigarettes', available: true },
      { id: 'm8', name: 'Classic Milds', description: 'Standard pack', price: 350, category: 'Cigarettes', available: true },
      { id: 'm9', name: 'Cold Coffee', description: 'Thick cold coffee with ice cream', price: 180, category: 'Drinks', available: true },
      { id: 'm10', name: 'Mint Mojito', description: 'Refreshing mint and lime', price: 160, category: 'Drinks', available: true },
    ];
    
    for (const item of defaultMenu) {
      const docRef = doc(db, 'menuItems', item.id);
      batch.set(docRef, item);
    }
    
    await batch.commit();
    console.log("Menu items seeded successfully.");
  } else {
    console.log("Menu items collection is not empty, skipping.");
  }
  
  alert("Database seed check complete! Refreshing page may be needed.");
}

export async function seedChalkboardMenu() {
  console.log("Seeding chalkboard menu items...");
  const batch = writeBatch(db);
  
  const chalkboardMenu = [
    { name: 'Adrak Chai', price: 25, category: 'Chai', available: true },
    { name: 'Masala Chai', price: 30, category: 'Chai', available: true },
    { name: 'Elaichi Chai', price: 30, category: 'Chai', available: true },
    
    { name: 'Maska Bun', price: 30, category: 'Chai Ke Sang', available: true },
    { name: 'Chocolate Bun', price: 40, category: 'Chai Ke Sang', available: true },
    
    { name: 'Cheese Garlic Bread', price: 110, category: 'Garlic Bread', available: true },
    { name: 'OTC Garlic Bread', price: 120, category: 'Garlic Bread', available: true },
    
    { name: 'Black Tea', price: 25, category: 'Herbal Tea', available: true },
    { name: 'Green Tea', price: 30, category: 'Herbal Tea', available: true },
    
    { name: 'Hot Coffee', price: 40, category: 'Hot Coffee', available: true },
    { name: 'Black Coffee', price: 30, category: 'Hot Coffee', available: true },
    { name: 'Hot Chocolate Coffee', price: 50, category: 'Hot Coffee', available: true },
    
    { name: 'Regular Cold Coffee (M)', price: 70, category: 'Cold Coffee', available: true },
    { name: 'Regular Cold Coffee (L)', price: 90, category: 'Cold Coffee', available: true },
    { name: 'Choco Chips Cold Coffee (M)', price: 95, category: 'Cold Coffee', available: true },
    { name: 'Choco Chips Cold Coffee (L)', price: 105, category: 'Cold Coffee', available: true },
    { name: 'Cold Coffee with icecream (M)', price: 80, category: 'Cold Coffee', available: true },
    { name: 'Cold Coffee with icecream (L)', price: 110, category: 'Cold Coffee', available: true },
    
    { name: 'Margherita Pizza', price: 110, category: 'Pizza Mania', available: true },
    { name: 'OTC Pizza', price: 140, category: 'Pizza Mania', available: true },
    { name: 'Paneer Pizza', price: 170, category: 'Pizza Mania', available: true },
    { name: 'Tandoori cheese corn Pizza', price: 150, category: 'Pizza Mania', available: true },
    
    { name: 'Veg Grill Sandwich', price: 90, category: 'Sandwich', available: true },
    { name: 'Veg cheese Grill Sandwich', price: 100, category: 'Sandwich', available: true },
    { name: 'Paneer Tikka Sandwich', price: 120, category: 'Sandwich', available: true },
    { name: 'Cheese corn Sandwich', price: 95, category: 'Sandwich', available: true },
    { name: 'Bombay Sandwich', price: 80, category: 'Sandwich', available: true },
    
    { name: 'Peri Peri fries', price: 80, category: 'Snacks', available: true },
    { name: 'French fries', price: 70, category: 'Snacks', available: true },
    { name: 'Cheese Loaded fries', price: 100, category: 'Snacks', available: true },
    
    { name: 'Steam Momos', price: 90, category: 'Momos', available: true },
    { name: 'Fried Momos', price: 100, category: 'Momos', available: true },
    
    { name: 'Veg Burger', price: 80, category: 'Burger', available: true },
    { name: 'Chatpata Burger', price: 90, category: 'Burger', available: true },
    { name: 'Veg cheese Burger', price: 90, category: 'Burger', available: true },
    { name: 'Paneer Burger', price: 100, category: 'Burger', available: true },
    
    { name: 'Plain Maggi', price: 60, category: 'Maggi', available: true },
    { name: 'Veg Masala Maggi', price: 80, category: 'Maggi', available: true },
    { name: 'Corn Veg Maggi', price: 90, category: 'Maggi', available: true },
    { name: 'Butter Maggi', price: 90, category: 'Maggi', available: true },
    { name: 'Cheese Maggi', price: 90, category: 'Maggi', available: true },
    { name: 'Cheese corn Maggi', price: 100, category: 'Maggi', available: true },
    
    { name: 'Lemon Soda', price: 60, category: 'Mocktails', available: true },
    { name: 'Mint Mojito', price: 80, category: 'Mocktails', available: true },
    { name: 'Orange Mojito', price: 90, category: 'Mocktails', available: true },
    { name: 'Green apple Mojito', price: 90, category: 'Mocktails', available: true },
    { name: 'Water Melon Mojito', price: 100, category: 'Mocktails', available: true },
    { name: 'Lemon Ice Tea', price: 80, category: 'Mocktails', available: true },
    
    { name: 'Vanilla Shake', price: 80, category: 'Shake', available: true },
    { name: 'Strawberry Shake', price: 90, category: 'Shake', available: true },
    { name: 'Mango Shake', price: 90, category: 'Shake', available: true },
    { name: 'Pineapple Shake', price: 90, category: 'Shake', available: true },
    { name: 'Black Currant Shake', price: 90, category: 'Shake', available: true },
    { name: 'Oreo Shake', price: 110, category: 'Shake', available: true },
    { name: 'Kit Kat Shake', price: 120, category: 'Shake', available: true },
  ];
  
  for (const item of chalkboardMenu) {
    const docRef = doc(collection(db, 'menuItems'));
    batch.set(docRef, item);
  }
  
  await batch.commit();
  alert("Chalkboard menu seeded successfully! Please refresh the page.");
}
