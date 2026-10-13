import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n');

initializeApp({
  credential: cert({
    projectId: "dbcafe-3f5ee",
    clientEmail: "firebase-adminsdk-fbsvc@dbcafe-3f5ee.iam.gserviceaccount.com",
    privateKey: PRIVATE_KEY,
  })
});

const db = getFirestore();

const newMenuItems = [
  // Chinese
  { name: "Hakka Noodles", category: "Chinese", price: 109, description: "Classic stir-fried Hakka noodles", available: true },
  { name: "Chilli Garlic Noodles", category: "Chinese", price: 139, description: "Spicy chilli garlic tossed noodles", available: true },
  { name: "Veg Noodles", category: "Chinese", price: 129, description: "Freshly tossed vegetable noodles", available: true },
  { name: "Honey Chilli Potato", category: "Chinese", price: 150, description: "Crispy potatoes in honey chilli sauce", available: true },
  { name: "Chilli Potato", category: "Chinese", price: 139, description: "Spicy crispy chilli potato", available: true },
  { name: "Chilli Paneer Dry", category: "Chinese", price: 180, description: "Dry tossed paneer in chilli sauce", available: true },
  { name: "Chilli Paneer Gravy", category: "Chinese", price: 200, description: "Paneer in rich chilli gravy", available: true },
  { name: "Gravy Manchurian", category: "Chinese", price: 180, description: "Veg balls in manchurian gravy", available: true },
  { name: "Dry Manchurian", category: "Chinese", price: 160, description: "Dry tossed veg manchurian balls", available: true },
  { name: "Veg Steam Momos", category: "Chinese", price: 100, description: "Steamed veg dumplings", available: true },
  { name: "Veg Fried Momos", category: "Chinese", price: 120, description: "Crispy fried veg dumplings", available: true },
  { name: "Veg Fried Rice", category: "Chinese", price: 110, description: "Classic veg fried rice", available: true },
  { name: "Chilli Garlic Fried Rice", category: "Chinese", price: 120, description: "Spicy chilli garlic fried rice", available: true },
  { name: "Paneer Fried Rice", category: "Chinese", price: 150, description: "Fried rice with paneer", available: true },
  // Salads
  { name: "Caesar Salad", category: "Salads", price: 170, description: "Classic Caesar with croutons and dressing", available: true },
  { name: "Greek Salad", category: "Salads", price: 190, description: "Fresh Greek salad with olives and feta", available: true },
  // Burgers
  { name: "Aloo Burger", category: "Burgers", price: 120, description: "Served with French fries / wedges", available: true },
  { name: "Cheese Burger", category: "Burgers", price: 140, description: "Served with French fries / wedges", available: true },
  { name: "Barbeque Burger", category: "Burgers", price: 180, description: "Served with French fries / wedges", available: true },
  { name: "Paneer Burger", category: "Burgers", price: 160, description: "Served with French fries / wedges", available: true },
  // Sandwiches
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
  // Garlic Bread
  { name: "Plain Garlic Bread", category: "Garlic Bread", price: 99, description: "Toasted garlic bread", available: true },
  { name: "Cheese Garlic Bread", category: "Garlic Bread", price: 139, description: "Garlic bread with melted cheese", available: true },
  { name: "Tomato Bruschetta", category: "Garlic Bread", price: 129, description: "Toasted bread with fresh tomato bruschetta", available: true },
  // Hot Coffee
  { name: "Hot Coffee", category: "Hot Coffee", price: 50, description: "Classic hot coffee", available: true },
  { name: "Black Coffee", category: "Hot Coffee", price: 40, description: "Strong black coffee", available: true },
  // Iced Coffee Bar
  { name: "Orange Iced Americano", category: "Iced Coffee Bar", price: 110, description: "Refreshing orange iced americano", available: true },
  { name: "Vietnamese Iced Coffee", category: "Iced Coffee Bar", price: 120, description: "Vietnamese style iced coffee", available: true },
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
  // Chai ke Sang (new items only — existing preserved)
  { name: "Maska Bun", category: "Chai ke Sang", price: 35, description: "Butter bun to go with chai", available: true, isRetail: true },
  { name: "Chocolate Bun", category: "Chai ke Sang", price: 50, description: "Soft chocolate bun", available: true, isRetail: true },
  { name: "Nutella Bun", category: "Chai ke Sang", price: 80, description: "Bun filled with Nutella", available: true, isRetail: true },
];

async function updateMenu() {
  // 1. Fetch all existing items
  const snapshot = await db.collection('menuItems').get();
  
  // Categories to preserve (chai related)
  const KEEP_CATEGORIES = ['chai', 'chai ke sang'];
  
  // Delete non-chai items in batches of 500
  const toDelete = snapshot.docs.filter(d => {
    const cat = (d.data().category || '').toLowerCase().trim();
    return !KEEP_CATEGORIES.includes(cat);
  });
  
  // Batch delete (max 500 per batch)
  let deleteCount = 0;
  for (let i = 0; i < toDelete.length; i += 400) {
    const batch = db.batch();
    toDelete.slice(i, i + 400).forEach(d => batch.delete(d.ref));
    await batch.commit();
    deleteCount += Math.min(400, toDelete.length - i);
  }
  console.log(`✅ Deleted ${deleteCount} old menu items`);

  // 2. Get existing Chai ke Sang item names to avoid duplicates
  const existingChaiNames = new Set(
    snapshot.docs
      .filter(d => KEEP_CATEGORIES.includes((d.data().category || '').toLowerCase().trim()))
      .map(d => d.data().name?.toLowerCase())
  );

  // 3. Add new items
  let addCount = 0;
  for (let i = 0; i < newMenuItems.length; i += 400) {
    const batch = db.batch();
    const chunk = newMenuItems.slice(i, i + 400);
    for (const item of chunk) {
      const isChai = KEEP_CATEGORIES.includes(item.category.toLowerCase().trim());
      // Skip chai ke sang if already exists by name
      if (isChai && existingChaiNames.has(item.name.toLowerCase())) {
        continue;
      }
      const ref = db.collection('menuItems').doc();
      batch.set(ref, {
        ...item,
        archived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      addCount++;
    }
    await batch.commit();
  }

  console.log(`✅ Added ${addCount} new menu items`);
  console.log('🎉 Menu update complete!');
  process.exit(0);
}

updateMenu().catch(e => { console.error(e); process.exit(1); });
