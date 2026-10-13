const admin = require('firebase-admin');

const serviceAccount = {
  projectId: "dbcafe-3f5ee",
  clientEmail: "firebase-adminsdk-fbsvc@dbcafe-3f5ee.iam.gserviceaccount.com",
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const newMenuItems = [
  // Chinese - Noodles
  { name: "Hakka Noodles", category: "Chinese", price: 109, description: "Classic stir-fried Hakka noodles", available: true },
  { name: "Chilli Garlic Noodles", category: "Chinese", price: 139, description: "Spicy chilli garlic tossed noodles", available: true },
  { name: "Veg Noodles", category: "Chinese", price: 129, description: "Freshly tossed vegetable noodles", available: true },
  // Chinese - Snacks
  { name: "Honey Chilli Potato", category: "Chinese", price: 150, description: "Crispy potatoes in honey chilli sauce", available: true },
  { name: "Chilli Potato", category: "Chinese", price: 139, description: "Spicy crispy chilli potato", available: true },
  { name: "Chilli Paneer Dry", category: "Chinese", price: 180, description: "Dry tossed paneer in chilli sauce", available: true },
  { name: "Chilli Paneer Gravy", category: "Chinese", price: 200, description: "Paneer in rich chilli gravy", available: true },
  { name: "Gravy Manchurian", category: "Chinese", price: 180, description: "Veg balls in manchurian gravy", available: true },
  { name: "Dry Manchurian", category: "Chinese", price: 160, description: "Dry tossed veg manchurian balls", available: true },
  // Chinese - Momos
  { name: "Veg Steam Momos", category: "Chinese", price: 100, description: "Steamed veg dumplings", available: true },
  { name: "Veg Fried Momos", category: "Chinese", price: 120, description: "Crispy fried veg dumplings", available: true },
  // Chinese - Rice
  { name: "Veg Fried Rice", category: "Chinese", price: 110, description: "Classic veg fried rice", available: true },
  { name: "Chilli Garlic Fried Rice", category: "Chinese", price: 120, description: "Spicy chilli garlic fried rice", available: true },
  { name: "Paneer Fried Rice", category: "Chinese", price: 150, description: "Fried rice with paneer", available: true },

  // Salads
  { name: "Caesar Salad", category: "Salads", price: 170, description: "Classic Caesar with croutons and dressing", available: true },
  { name: "Greek Salad", category: "Salads", price: 190, description: "Fresh Greek salad with olives and feta", available: true },

  // Burgers (served with fries/wedges)
  { name: "Aloo Burger", category: "Burgers", price: 120, description: "Served with French fries / wedges", available: true },
  { name: "Cheese Burger", category: "Burgers", price: 140, description: "Served with French fries / wedges", available: true },
  { name: "Barbeque Burger", category: "Burgers", price: 180, description: "Served with French fries / wedges", available: true },
  { name: "Paneer Burger", category: "Burgers", price: 160, description: "Served with French fries / wedges", available: true },

  // Sandwiches (served with fries/wedges)
  { name: "Club Sandwich", category: "Sandwiches", price: 220, description: "Served with French fries / wedges", available: true },
  { name: "Veg Grill Sandwich", category: "Sandwiches", price: 130, description: "Served with French fries / wedges", available: true },
  { name: "Cheese Corn Sandwich", category: "Sandwiches", price: 140, description: "Served with French fries / wedges", available: true },
  { name: "Bombay Sandwich", category: "Sandwiches", price: 120, description: "Served with French fries / wedges", available: true },
  { name: "Pesto Paneer Sandwich", category: "Sandwiches", price: 180, description: "Served with French fries / wedges", available: true },

  // Pasta
  { name: "Alfredo Pasta", category: "Pasta", price: 199, description: "Creamy white sauce Alfredo pasta", available: true },
  { name: "Arrabbiata Pasta", category: "Pasta", price: 219, description: "Spicy tomato Arrabbiata pasta", available: true },
  { name: "Parmesan Veg Pesto", category: "Pasta", price: 250, description: "Pesto pasta with parmesan and veggies", available: true },
  { name: "Spaghetti Pesto", category: "Pasta", price: 180, description: "Spaghetti in basil pesto sauce", available: true },

  // Fries
  { name: "Salted Fries", category: "Fries", price: 99, description: "Classic salted crispy fries", available: true },
  { name: "Peri Peri Fries", category: "Fries", price: 119, description: "Fries tossed in peri peri seasoning", available: true },
  { name: "Loaded Fries", category: "Fries", price: 159, description: "Fries loaded with cheese and toppings", available: true },

  // Pizza
  { name: "Margherita", category: "Pizza", price: 199, description: "Classic margherita with mozzarella", available: true },
  { name: "Farmhouse Pizza", category: "Pizza", price: 249, description: "Loaded farmhouse vegetable pizza", available: true },
  { name: "Peri Peri Tikka Pizza", category: "Pizza", price: 279, description: "Paneer tikka with peri peri base", available: true },
  { name: "Corn Jalapeño", category: "Pizza", price: 259, description: "Sweet corn and jalapeño pizza", available: true },

  // Wraps
  { name: "Falafel Wrap", category: "Wraps", price: 180, description: "Crispy falafel in a soft wrap", available: true },
  { name: "Veg Wrap", category: "Wraps", price: 120, description: "Fresh vegetable wrap", available: true },
  { name: "Cottage Cheese Wrap", category: "Wraps", price: 160, description: "Paneer cottage cheese wrap", available: true },
  { name: "Peri Peri Paneer Wrap", category: "Wraps", price: 200, description: "Spicy peri peri paneer wrap", available: true },

  // Maggi
  { name: "Plain Maggi", category: "Maggi", price: 69, description: "Classic plain Maggi noodles", available: true },
  { name: "Masala Maggi", category: "Maggi", price: 99, description: "Maggi with masala spice blend", available: true },
  { name: "Cheese Maggi", category: "Maggi", price: 89, description: "Maggi topped with melted cheese", available: true },
  { name: "Punjabi Tadka Maggi", category: "Maggi", price: 109, description: "Maggi with desi Punjabi tadka", available: true },
  { name: "Cheese Corn Maggi", category: "Maggi", price: 99, description: "Maggi with cheese and corn", available: true },

  // Garlic Bread / Toasts
  { name: "Plain Garlic Bread", category: "Garlic Bread", price: 99, description: "Toasted garlic bread", available: true },
  { name: "Cheese Garlic Bread", category: "Garlic Bread", price: 139, description: "Garlic bread with melted cheese", available: true },
  { name: "Tomato Bruschetta", category: "Garlic Bread", price: 129, description: "Toasted bread with fresh tomato bruschetta", available: true },

  // Hot Coffee
  { name: "Hot Coffee", category: "Hot Coffee", price: 50, description: "Classic hot coffee", available: true },
  { name: "Black Coffee", category: "Hot Coffee", price: 40, description: "Strong black coffee", available: true },

  // Iced Coffee Bar
  { name: "Orange Iced Americano", category: "Iced Coffee Bar", price: 110, description: "Refreshing orange iced americano", available: true },
  { name: "Vietnamese Iced Coffee", category: "Iced Coffee Bar", price: 120, description: "Vietnamese style iced coffee with condensed milk", available: true },
  { name: "Iced Latte", category: "Iced Coffee Bar", price: 100, description: "Smooth iced latte", available: true },
  { name: "Nutella Iced Latte", category: "Iced Coffee Bar", price: 120, description: "Iced latte with Nutella", available: true },
  { name: "Chocolate Latte", category: "Iced Coffee Bar", price: 110, description: "Rich chocolate latte", available: true },
  { name: "Iced Americano", category: "Iced Coffee Bar", price: 90, description: "Classic iced americano", available: true },
  { name: "Cold Coffee", category: "Iced Coffee Bar", price: 110, description: "Creamy cold coffee", available: true },

  // Mojitos & Coolers
  { name: "Cola Mojito", category: "Mojitos & Coolers", price: 140, description: "Refreshing cola mojito", available: true },
  { name: "Blue Lagoon", category: "Mojitos & Coolers", price: 110, description: "Blue curacao and lime cooler", available: true },
  { name: "Pina Colada", category: "Mojitos & Coolers", price: 190, description: "Tropical pineapple and coconut colada", available: true },
  { name: "Sunset Cooler", category: "Mojitos & Coolers", price: 150, description: "Fruity sunset cooler", available: true },
  { name: "Lemongrass Cooler", category: "Mojitos & Coolers", price: 150, description: "Refreshing lemongrass cooler", available: true },
  { name: "The Hawaiian Punch", category: "Mojitos & Coolers", price: 180, description: "Tropical Hawaiian punch blend", available: true },

  // Other Cold Drinks
  { name: "Iced Lemon Tea", category: "Other Cold Drinks", price: 105, description: "Refreshing iced lemon tea", available: true },
  { name: "Lemon Soda", category: "Other Cold Drinks", price: 60, description: "Fizzy lemon soda", available: true },
  { name: "Mint Mojito", category: "Other Cold Drinks", price: 130, description: "Fresh mint mojito", available: true },
  { name: "Watermelon Mojito", category: "Other Cold Drinks", price: 130, description: "Fresh watermelon mojito", available: true },

  // Shakes
  { name: "Strawberry Shake", category: "Shakes", price: 110, description: "Creamy strawberry milkshake", available: true },
  { name: "Mango Shake", category: "Shakes", price: 110, description: "Fresh mango milkshake", available: true },
  { name: "Oreo Shake", category: "Shakes", price: 139, description: "Thick Oreo cookie milkshake", available: true },
  { name: "KitKat Shake", category: "Shakes", price: 129, description: "KitKat chocolate milkshake", available: true },

  // Chai Ke Sang (Retail)
  { name: "Maska Bun", category: "Chai ke Sang", price: 35, description: "Butter bun to go with chai", available: true, isRetail: true },
  { name: "Chocolate Bun", category: "Chai ke Sang", price: 50, description: "Soft chocolate bun", available: true, isRetail: true },
  { name: "Nutella Bun", category: "Chai ke Sang", price: 80, description: "Bun filled with Nutella", available: true, isRetail: true },
];

async function updateMenu() {
  // 1. Get all existing menu items (excluding Chai / Chai ke Sang category)
  const snapshot = await db.collection('menuItems').get();
  
  const batch1 = db.batch();
  let deleteCount = 0;
  
  snapshot.forEach(doc => {
    const data = doc.data();
    const cat = (data.category || '').toLowerCase();
    // Keep existing chai / chai ke sang items — only delete non-chai items
    if (cat !== 'chai' && cat !== 'chai ke sang' && cat !== 'chai ke sang') {
      batch1.delete(doc.ref);
      deleteCount++;
    }
  });

  await batch1.commit();
  console.log(`✅ Deleted ${deleteCount} old menu items (kept Chai category)`);

  // 2. Add all new items
  let addCount = 0;
  for (const item of newMenuItems) {
    // Skip Chai ke Sang items from newMenu since we're keeping originals
    // Actually user said replace all EXCEPT chai — but their Chai ke Sang items in the list
    // are the new ones they want. So we add all items EXCEPT we skip "Chai ke Sang" from
    // the new list because we preserve whatever was there.
    // Re-reading user request: "keep the chai category as it is and replace all other items"
    // So: delete non-chai, add everything from the new list except Chai ke Sang
    if ((item.category || '').toLowerCase() === 'chai ke sang') {
      // Only add if not already existing (check by name)
      const existing = snapshot.docs.find(d => d.data().name === item.name && (d.data().category || '').toLowerCase() === 'chai ke sang');
      if (!existing) {
        await db.collection('menuItems').add({
          ...item,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          archived: false,
        });
        addCount++;
      }
    } else {
      await db.collection('menuItems').add({
        ...item,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        archived: false,
      });
      addCount++;
    }
  }

  console.log(`✅ Added ${addCount} new menu items`);
  console.log('🎉 Menu update complete!');
  process.exit(0);
}

updateMenu().catch(e => { console.error(e); process.exit(1); });
