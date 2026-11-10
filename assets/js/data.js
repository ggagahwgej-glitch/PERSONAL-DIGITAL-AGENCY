/*
 * THE FOOD GARDEN: demo data
 * ---------------------------------------------------------------------------
 * Everything in this file is FICTIONAL sample data for a demo restaurant.
 * Edit it to change the menu, sample reviews and booking settings.
 * (Restaurant name, address, masked phone and opening hours are plain text in index.html.)
 */
window.FOOD_GARDEN = {

  /* ------------------------------ Settings ------------------------------ */
  site: {
    name: 'The Food Garden',
    shortAddress: 'GS Road, Christian Basti, Guwahati',

    /*
     * WhatsApp destination for table requests.
     * PLACEHOLDER: left empty on purpose so the demo never messages a real person.
     * While empty, WhatsApp opens with the message ready and asks the visitor to pick a chat.
     * For a real restaurant, enter the number with country code and digits only,
     * in the form 91XXXXXXXXXX.
     */
    whatsappNumber: '',

    /* Time zone of the restaurant (used for "today" in the opening-hours list). */
    timeZone: 'Asia/Kolkata',

    /* Table-request form options (demo values). */
    booking: {
      firstSlot: '12:00',   // first selectable time, 24-hour HH:MM
      lastSlot: '22:00',    // last selectable time
      stepMinutes: 30,
      maxGuests: 10,        // a "More than N" option is added automatically
      maxDaysAhead: 60
    }
  },

  /* ----------------------------- Categories ----------------------------- */
  categories: [
    { id: 'starters', label: 'Starters' },
    { id: 'main-course', label: 'Main Course' },
    { id: 'pizza-fast-food', label: 'Pizza & Fast Food' },
    { id: 'desserts', label: 'Desserts' },
    { id: 'beverages', label: 'Beverages' }
  ],

  /* -------------------------------- Menu --------------------------------
   * price        in rupees
   * rating       fictional listed rating (shown as given, not calculated)
   * diet         'veg' | 'non-veg'
   * availability status: 'available' | 'limited' | 'unavailable', plus an optional note
   * image        file prefix in assets/img/dishes/ (…-400.webp, …-640.webp, …-960.webp)
   */
  dishes: [
    {
      id: 'chicken-biryani',
      name: 'Chicken Biryani',
      category: 'main-course',
      price: 249,
      rating: 4.8,
      diet: 'non-veg',
      summary: 'Fragrant basmati rice layered with tender chicken, saffron and crisp fried onions.',
      description: 'Long-grain basmati rice slow-cooked with marinated chicken, saffron and whole spices, then finished with crisp fried onions, mint and coriander. Served with cooling raita on the side.',
      ingredients: ['Basmati rice', 'Chicken', 'Yoghurt', 'Fried onions', 'Saffron', 'Mint & coriander', 'Whole spices', 'Ghee'],
      availability: { status: 'available' },
      image: 'chicken-biryani',
      alt: 'Chicken biryani with fried onions and mint in a ceramic bowl, served with raita'
    },
    {
      id: 'paneer-butter-masala',
      name: 'Paneer Butter Masala',
      category: 'main-course',
      price: 219,
      rating: 4.7,
      diet: 'veg',
      summary: 'Soft paneer cubes in a rich, creamy tomato and butter gravy.',
      description: 'Soft cubes of paneer simmered in a smooth tomato and butter gravy, lightly sweet and gently spiced, finished with fresh cream and coriander. Best enjoyed with butter naan.',
      ingredients: ['Paneer', 'Tomato', 'Butter', 'Fresh cream', 'Cashew', 'Ginger & garlic', 'Kasuri methi', 'Spices'],
      availability: { status: 'available' },
      image: 'paneer-butter-masala',
      alt: 'Paneer butter masala with a swirl of cream in a ceramic bowl'
    },
    {
      id: 'butter-naan',
      name: 'Butter Naan',
      category: 'main-course',
      price: 45,
      rating: 4.6,
      diet: 'veg',
      summary: 'Soft, freshly baked flatbread brushed with melted butter. Price per piece.',
      description: 'Soft, pillowy flatbread baked until lightly charred, then brushed with melted butter and sprinkled with coriander. Priced per piece and made to pair with any of our curries.',
      ingredients: ['Refined flour', 'Yoghurt', 'Milk', 'Butter', 'Coriander', 'Salt'],
      availability: { status: 'available' },
      image: 'butter-naan',
      alt: 'Three butter naans sprinkled with coriander on a ceramic plate'
    },
    {
      id: 'chicken-tikka',
      name: 'Chicken Tikka',
      category: 'starters',
      price: 229,
      rating: 4.8,
      diet: 'non-veg',
      summary: 'Boneless chicken marinated in yoghurt and spices, char-grilled until smoky.',
      description: 'Boneless chicken marinated in yoghurt, chilli and warm spices, then char-grilled until smoky and juicy. Served with onion rings, a wedge of lemon and mint chutney.',
      ingredients: ['Chicken', 'Hung yoghurt', 'Kashmiri chilli', 'Ginger & garlic', 'Lemon', 'Mustard oil', 'Spices'],
      availability: { status: 'available' },
      image: 'chicken-tikka',
      alt: 'Char-grilled chicken tikka with onion rings, lemon and mint chutney'
    },
    {
      id: 'veg-spring-rolls',
      name: 'Veg Spring Rolls',
      category: 'starters',
      price: 149,
      rating: 4.5,
      diet: 'veg',
      summary: 'Crispy golden rolls filled with seasoned cabbage, carrot and capsicum.',
      description: 'Crisp golden rolls packed with seasoned cabbage, carrot and capsicum, fried until crunchy and served hot with a sweet chilli dip. A light starter that is easy to share.',
      ingredients: ['Cabbage', 'Carrot', 'Capsicum', 'Spring onion', 'Soy sauce', 'Pastry sheets', 'Sweet chilli sauce'],
      availability: { status: 'available' },
      image: 'veg-spring-rolls',
      alt: 'Crispy vegetable spring rolls with sweet chilli sauce'
    },
    {
      id: 'margherita-pizza',
      name: 'Margherita Pizza',
      category: 'pizza-fast-food',
      price: 199,
      rating: 4.6,
      diet: 'veg',
      summary: 'Classic pizza with tomato sauce, melted mozzarella and fresh basil.',
      description: 'A classic done simply: a hand-stretched base with a puffy, blistered crust, bright tomato sauce, melted mozzarella and fresh basil leaves. Baked to order.',
      ingredients: ['Pizza dough', 'Tomato sauce', 'Mozzarella', 'Fresh basil', 'Olive oil', 'Oregano'],
      availability: { status: 'available' },
      image: 'margherita-pizza',
      alt: 'Margherita pizza with mozzarella and basil on a wooden board'
    },
    {
      id: 'chicken-burger',
      name: 'Chicken Burger',
      category: 'pizza-fast-food',
      price: 179,
      rating: 4.7,
      diet: 'non-veg',
      summary: 'Crispy chicken fillet with lettuce, tomato and cheese in a toasted sesame bun.',
      description: 'A crispy fried chicken fillet stacked with fresh lettuce, tomato, a slice of cheese and creamy mayo in a toasted sesame bun. Served with golden fries.',
      ingredients: ['Chicken fillet', 'Sesame bun', 'Lettuce', 'Tomato', 'Cheese slice', 'Mayonnaise', 'French fries'],
      availability: { status: 'available' },
      image: 'chicken-burger',
      alt: 'Crispy chicken burger with lettuce, tomato and cheese, served with fries'
    },
    {
      id: 'chocolate-brownie',
      name: 'Chocolate Brownie',
      category: 'desserts',
      price: 129,
      rating: 4.9,
      diet: 'veg',
      summary: 'Warm, fudgy eggless brownie with walnuts, vanilla ice cream and chocolate sauce.',
      description: 'A warm, fudgy eggless chocolate brownie with a crackly top and walnut pieces, served with a scoop of vanilla ice cream and a drizzle of chocolate sauce.',
      ingredients: ['Dark chocolate', 'Cocoa', 'Butter', 'Flour', 'Condensed milk', 'Walnuts', 'Vanilla ice cream', 'Chocolate sauce'],
      availability: { status: 'limited', note: 'Baked in small batches, so it can sell out later in the day.' },
      image: 'chocolate-brownie',
      alt: 'Chocolate brownie with walnuts, vanilla ice cream and chocolate sauce'
    },
    {
      id: 'fresh-lime-soda',
      name: 'Fresh Lime Soda',
      category: 'beverages',
      price: 79,
      rating: 4.5,
      diet: 'veg',
      summary: 'Freshly squeezed lime topped with chilled soda. Sweet, salted or mixed.',
      description: 'Freshly squeezed lime topped with chilled soda, ice and a sprig of mint. Have it sweet, salted or mixed. A refreshing match for spicy food.',
      ingredients: ['Fresh lime juice', 'Soda', 'Sugar syrup or salt', 'Mint', 'Ice'],
      availability: { status: 'available' },
      image: 'fresh-lime-soda',
      alt: 'Tall glass of fresh lime soda with ice, lime slices and mint'
    },
    {
      id: 'cold-coffee',
      name: 'Cold Coffee',
      category: 'beverages',
      price: 119,
      rating: 4.7,
      diet: 'veg',
      summary: 'Chilled, creamy coffee blended with milk and ice, finished with a swirl of chocolate.',
      description: 'Chilled coffee blended with milk and ice until smooth and creamy, served tall over ice with a swirl of chocolate syrup and a light, frothy top. Cold, creamy and just sweet enough.',
      ingredients: ['Coffee', 'Chilled milk', 'Sugar', 'Chocolate syrup', 'Ice'],
      availability: { status: 'available' },
      image: 'cold-coffee',
      alt: 'Tall glass of creamy iced cold coffee with a chocolate syrup swirl and a paper straw'
    }
  ],

  /* --------------------------- Sample reviews ---------------------------
   * Exactly 3 per dish. These are SAMPLE reviews for demonstration purposes,
   * not verified customer feedback. Dates are YYYY-MM-DD.
   */
  sampleReviews: {
    'chicken-biryani': [
      { name: 'Rahul', rating: 5, date: '2026-10-28', comment: 'Amazing flavour and perfectly cooked rice. Loved it!' },
      { name: 'Priya', rating: 4, date: '2026-10-12', comment: 'Really delicious. The portion size was good.' },
      { name: 'Arjun', rating: 5, date: '2026-09-21', comment: "One of the best biryanis I've tried!" }
    ],
    'paneer-butter-masala': [
      { name: 'Sneha', rating: 5, date: '2026-11-02', comment: 'Creamy, rich gravy and really soft paneer. Perfect with butter naan.' },
      { name: 'Vikram', rating: 4, date: '2026-10-09', comment: 'Tasty and not too sweet. I would have liked it a little spicier.' },
      { name: 'Ananya', rating: 5, date: '2026-09-14', comment: "Our family's favourite here. We order it every single time." }
    ],
    'butter-naan': [
      { name: 'Rohit', rating: 5, date: '2026-10-30', comment: 'Soft, fluffy and served hot. Exactly how naan should be.' },
      { name: 'Meghna', rating: 4, date: '2026-10-03', comment: 'Nice and buttery. It went well with every curry we ordered.' },
      { name: 'Kabir', rating: 4, date: '2026-09-08', comment: 'Fresh and lightly charred. Simple, but very well made.' }
    ],
    'chicken-tikka': [
      { name: 'Dipankar', rating: 5, date: '2026-11-04', comment: 'Juicy pieces with a lovely smoky flavour. The mint chutney is great too.' },
      { name: 'Ishita', rating: 5, date: '2026-10-17', comment: 'Perfectly grilled and well marinated. A must-try starter.' },
      { name: 'Nikhil', rating: 4, date: '2026-09-26', comment: "Great taste. Slightly spicy for me, but I'd order it again." }
    ],
    'veg-spring-rolls': [
      { name: 'Pooja', rating: 4, date: '2026-10-25', comment: 'Crispy outside with a fresh veggie filling. Good with the dip.' },
      { name: 'Sandeep', rating: 5, date: '2026-10-06', comment: 'Light, crunchy and not oily at all. The kids loved them.' },
      { name: 'Tanvi', rating: 4, date: '2026-09-12', comment: 'A nice starter to share. Served hot and crisp.' }
    ],
    'margherita-pizza': [
      { name: 'Riya', rating: 5, date: '2026-10-22', comment: 'Fresh basil, stretchy cheese and a lovely crust. Simple and satisfying.' },
      { name: 'Manish', rating: 4, date: '2026-10-01', comment: 'Good pizza with a light tomato sauce. I would like a bit more cheese.' },
      { name: 'Jyoti', rating: 4, date: '2026-09-05', comment: 'Nicely baked and not greasy. Great for sharing.' }
    ],
    'chicken-burger': [
      { name: 'Karan', rating: 5, date: '2026-11-01', comment: 'Crispy chicken, soft bun and fresh veggies. Really filling.' },
      { name: 'Aditi', rating: 5, date: '2026-10-14', comment: "Best burger I've had in a while. The fries were crisp too." },
      { name: 'Imran', rating: 4, date: '2026-09-19', comment: 'Tasty and good value. The chicken was crunchy and juicy.' }
    ],
    'chocolate-brownie': [
      { name: 'Neha', rating: 5, date: '2026-11-05', comment: 'Warm, gooey and so chocolatey. Perfect with the ice cream.' },
      { name: 'Bhaskar', rating: 5, date: '2026-10-19', comment: 'The best way to end a meal here. Rich without being too sweet.' },
      { name: 'Simran', rating: 5, date: '2026-09-28', comment: 'Soft in the centre with a crackly top. Absolutely loved it.' }
    ],
    'fresh-lime-soda': [
      { name: 'Abhishek', rating: 5, date: '2026-10-27', comment: 'So refreshing on a hot afternoon. Just the right amount of fizz.' },
      { name: 'Barsha', rating: 4, date: '2026-10-08', comment: 'Fresh lime taste and nicely chilled. I had the sweet and salted mix.' },
      { name: 'Mridul', rating: 4, date: '2026-09-16', comment: 'Simple and refreshing. A good match for spicy food.' }
    ],
    'cold-coffee': [
      { name: 'Pallavi', rating: 5, date: '2026-10-31', comment: 'Thick, creamy and not overly sweet. Just how I like it.' },
      { name: 'Farhan', rating: 4, date: '2026-10-11', comment: 'Strong coffee flavour and served really cold. A good pick-me-up.' },
      { name: 'Rupam', rating: 5, date: '2026-09-23', comment: 'Smooth and frothy. I always order one with my meal.' }
    ]
  }
};
