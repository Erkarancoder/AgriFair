/**
 * Comprehensive Indian Mandi Benchmark Benchmark Dataset
 * Covers major mandis across Uttar Pradesh, Bihar, Maharashtra, Delhi,
 * Madhya Pradesh, Punjab, Haryana, Rajasthan, etc.
 */

const MANDI_SEED_DATA = [
  // ==================== LUCKNOW, UTTAR PRADESH ====================
  {
    mandi: 'Dubagga Fruit & Vegetable Mandi',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    marketType: 'Principal APMC Sub-Yard',
    commodities: [
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Desi Red / Kufri', minPrice: 1450, maxPrice: 1750, modalPrice: 1600, unit: 'quintal', arrivalQuantity: '140 Tonnes', trend: 'up', priceChange: 50 },
      { commodity: 'Onion (Pyaz)', category: 'Vegetables', variety: 'Nasik Medium', minPrice: 2200, maxPrice: 2600, modalPrice: 2450, unit: 'quintal', arrivalQuantity: '95 Tonnes', trend: 'down', priceChange: -40 },
      { commodity: 'Tomato (Tamatar)', category: 'Vegetables', variety: 'Hybrid Round', minPrice: 1800, maxPrice: 2300, modalPrice: 2100, unit: 'quintal', arrivalQuantity: '70 Tonnes', trend: 'up', priceChange: 100 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'PBW-502 / Lokwan', minPrice: 2350, maxPrice: 2520, modalPrice: 2440, unit: 'quintal', arrivalQuantity: '110 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Cauliflower (Gobhi)', category: 'Vegetables', variety: 'Snowball', minPrice: 1200, maxPrice: 1600, modalPrice: 1400, unit: 'quintal', arrivalQuantity: '35 Tonnes', trend: 'down', priceChange: -50 }
    ]
  },
  {
    mandi: 'Sitapur Road Krishi Upaj Mandi',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    marketType: 'Principal APMC Yard',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Sharbati / Desi', minPrice: 2420, maxPrice: 2650, modalPrice: 2550, unit: 'quintal', arrivalQuantity: '220 Tonnes', trend: 'up', priceChange: 30 },
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: '1509 Basmati', minPrice: 3200, maxPrice: 3650, modalPrice: 3450, unit: 'quintal', arrivalQuantity: '180 Tonnes', trend: 'up', priceChange: 75 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Black / Pili Mustard', minPrice: 5100, maxPrice: 5650, modalPrice: 5400, unit: 'quintal', arrivalQuantity: '65 Tonnes', trend: 'up', priceChange: 60 },
      { commodity: 'Maize (Makka)', category: 'Grains & Cereals', variety: 'Yellow Hybrid', minPrice: 1950, maxPrice: 2250, modalPrice: 2100, unit: 'quintal', arrivalQuantity: '45 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Gram (Chana)', category: 'Pulses', variety: 'Desi Chana', minPrice: 5600, maxPrice: 6100, modalPrice: 5850, unit: 'quintal', arrivalQuantity: '40 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Mohanlalganj Grain & Produce Mandi',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    marketType: 'Sub-Mandi Yard',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Dara / Mill Quality', minPrice: 2300, maxPrice: 2480, modalPrice: 2400, unit: 'quintal', arrivalQuantity: '90 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'Common Non-Basmati', minPrice: 2180, maxPrice: 2320, modalPrice: 2260, unit: 'quintal', arrivalQuantity: '120 Tonnes', trend: 'up', priceChange: 20 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Pukhraj', minPrice: 1350, maxPrice: 1550, modalPrice: 1450, unit: 'quintal', arrivalQuantity: '60 Tonnes', trend: 'down', priceChange: -30 }
    ]
  },
  {
    mandi: 'Malihabad Horticultural Mandi',
    district: 'Lucknow',
    state: 'Uttar Pradesh',
    marketType: 'Specialized Produce Mandi',
    commodities: [
      { commodity: 'Mango (Aam)', category: 'Fruits', variety: 'Dasheri / Chausa', minPrice: 3800, maxPrice: 5200, modalPrice: 4500, unit: 'quintal', arrivalQuantity: '80 Tonnes', trend: 'up', priceChange: 150 },
      { commodity: 'Guava (Amrood)', category: 'Fruits', variety: 'Allahabadi Safeda', minPrice: 2200, maxPrice: 3100, modalPrice: 2700, unit: 'quintal', arrivalQuantity: '40 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Green Chilli (Hari Mirch)', category: 'Vegetables', variety: 'Spicy Long', minPrice: 3400, maxPrice: 4200, modalPrice: 3800, unit: 'quintal', arrivalQuantity: '25 Tonnes', trend: 'up', priceChange: 120 }
    ]
  },

  // ==================== GORAKHPUR, UTTAR PRADESH ====================
  {
    mandi: 'Gorakhpur Main Krishi Mandi',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    marketType: 'Principal APMC Yard',
    commodities: [
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'Sarjoo-52 / Basmati Hybrid', minPrice: 2240, maxPrice: 2580, modalPrice: 2420, unit: 'quintal', arrivalQuantity: '160 Tonnes', trend: 'up', priceChange: 35 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'HD-2967', minPrice: 2380, maxPrice: 2540, modalPrice: 2460, unit: 'quintal', arrivalQuantity: '130 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Bold Black', minPrice: 5200, maxPrice: 5750, modalPrice: 5500, unit: 'quintal', arrivalQuantity: '50 Tonnes', trend: 'up', priceChange: 80 },
      { commodity: 'Garlic (Lahsun)', category: 'Spices', variety: 'Desi White', minPrice: 11000, maxPrice: 14500, modalPrice: 12800, unit: 'quintal', arrivalQuantity: '18 Tonnes', trend: 'up', priceChange: 400 },
      { commodity: 'Onion (Pyaz)', category: 'Vegetables', variety: 'Local / Nasik', minPrice: 2300, maxPrice: 2700, modalPrice: 2520, unit: 'quintal', arrivalQuantity: '85 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Sahjanwa Mandi',
    district: 'Gorakhpur',
    state: 'Uttar Pradesh',
    marketType: 'Sub-Mandi Yard',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Desi Lokwan', minPrice: 2340, maxPrice: 2490, modalPrice: 2410, unit: 'quintal', arrivalQuantity: '75 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'Common Paddy', minPrice: 2190, maxPrice: 2340, modalPrice: 2270, unit: 'quintal', arrivalQuantity: '90 Tonnes', trend: 'up', priceChange: 15 },
      { commodity: 'Maize (Makka)', category: 'Grains & Cereals', variety: 'Hybrid Feed Grain', minPrice: 1980, maxPrice: 2210, modalPrice: 2120, unit: 'quintal', arrivalQuantity: '30 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },

  // ==================== DELHI ====================
  {
    mandi: 'Azadpur Mandi (Asia Largest)',
    district: 'North Delhi',
    state: 'Delhi',
    marketType: 'National Mega Terminal Market',
    commodities: [
      { commodity: 'Apple (Seb)', category: 'Fruits', variety: 'Kinnaur / Kashmiri Royal Delicious', minPrice: 7500, maxPrice: 11500, modalPrice: 9400, unit: 'quintal', arrivalQuantity: '320 Tonnes', trend: 'up', priceChange: 200 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Agra Red / Chipsona', minPrice: 1550, maxPrice: 1950, modalPrice: 1780, unit: 'quintal', arrivalQuantity: '450 Tonnes', trend: 'up', priceChange: 40 },
      { commodity: 'Onion (Pyaz)', category: 'Vegetables', variety: 'Lasalgaon Red', minPrice: 2400, maxPrice: 2900, modalPrice: 2680, unit: 'quintal', arrivalQuantity: '380 Tonnes', trend: 'down', priceChange: -60 },
      { commodity: 'Tomato (Tamatar)', category: 'Vegetables', variety: 'Himachal / Bangalore Hybrid', minPrice: 2100, maxPrice: 2800, modalPrice: 2450, unit: 'quintal', arrivalQuantity: '260 Tonnes', trend: 'up', priceChange: 80 },
      { commodity: 'Banana (Kela)', category: 'Fruits', variety: 'Grand Naine / Robusta', minPrice: 1800, maxPrice: 2400, modalPrice: 2150, unit: 'quintal', arrivalQuantity: '180 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Ghazipur Grain & Vegetable Mandi',
    district: 'East Delhi',
    state: 'Delhi',
    marketType: 'APMC Principal Market',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'MP Sharbati', minPrice: 2650, maxPrice: 2950, modalPrice: 2800, unit: 'quintal', arrivalQuantity: '190 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Paddy / Basmati Rice', category: 'Grains & Cereals', variety: '1121 Pusa Basmati', minPrice: 4200, maxPrice: 4900, modalPrice: 4600, unit: 'quintal', arrivalQuantity: '140 Tonnes', trend: 'up', priceChange: 110 },
      { commodity: 'Mustard Oilseed', category: 'Oilseeds', variety: 'Yellow Mustard', minPrice: 5350, maxPrice: 5850, modalPrice: 5600, unit: 'quintal', arrivalQuantity: '75 Tonnes', trend: 'up', priceChange: 50 }
    ]
  },

  // ==================== PUNE, MAHARASHTRA ====================
  {
    mandi: 'Gultekdi APMC Market Yard',
    district: 'Pune',
    state: 'Maharashtra',
    marketType: 'Principal APMC Yard',
    commodities: [
      { commodity: 'Onion (Pyaz)', category: 'Vegetables', variety: 'Nashik / Pune Red', minPrice: 2100, maxPrice: 2550, modalPrice: 2380, unit: 'quintal', arrivalQuantity: '290 Tonnes', trend: 'down', priceChange: -50 },
      { commodity: 'Soybean', category: 'Oilseeds', variety: 'Yellow Soybean Grade-A', minPrice: 4400, maxPrice: 4850, modalPrice: 4650, unit: 'quintal', arrivalQuantity: '180 Tonnes', trend: 'up', priceChange: 65 },
      { commodity: 'Pomegranate (Anar)', category: 'Fruits', variety: 'Bhagwa Red Super', minPrice: 8500, maxPrice: 14000, modalPrice: 11200, unit: 'quintal', arrivalQuantity: '95 Tonnes', trend: 'up', priceChange: 350 },
      { commodity: 'Sugarcane Jaggery (Gud)', category: 'Commodities', variety: 'Kolhapur Yellow', minPrice: 3600, maxPrice: 4300, modalPrice: 3950, unit: 'quintal', arrivalQuantity: '60 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Sihore Lokwan', minPrice: 2550, maxPrice: 2850, modalPrice: 2700, unit: 'quintal', arrivalQuantity: '110 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Mosshi Sub-Mandi',
    district: 'Pune',
    state: 'Maharashtra',
    marketType: 'Sub-Yard',
    commodities: [
      { commodity: 'Tomato (Tamatar)', category: 'Vegetables', variety: 'Narayangaon Hybrid', minPrice: 1900, maxPrice: 2450, modalPrice: 2200, unit: 'quintal', arrivalQuantity: '85 Tonnes', trend: 'up', priceChange: 70 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Manchar Jyoti', minPrice: 1600, maxPrice: 1950, modalPrice: 1780, unit: 'quintal', arrivalQuantity: '110 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Green Peas (Matar)', category: 'Vegetables', variety: 'Fresh Pods', minPrice: 3200, maxPrice: 4500, modalPrice: 3900, unit: 'quintal', arrivalQuantity: '45 Tonnes', trend: 'down', priceChange: -120 }
    ]
  },

  // ==================== PATNA / BIHAR ====================
  {
    mandi: 'Patna Bazar Samiti (Mithapur)',
    district: 'Patna',
    state: 'Bihar',
    marketType: 'Principal Mandi Yard',
    commodities: [
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'Swarna / Sonam', minPrice: 2183, maxPrice: 2390, modalPrice: 2290, unit: 'quintal', arrivalQuantity: '175 Tonnes', trend: 'up', priceChange: 25 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Kundan / Desi', minPrice: 2360, maxPrice: 2580, modalPrice: 2470, unit: 'quintal', arrivalQuantity: '140 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Maize (Makka)', category: 'Grains & Cereals', variety: 'Gulabkhas / Bihar Gold', minPrice: 2050, maxPrice: 2380, modalPrice: 2240, unit: 'quintal', arrivalQuantity: '220 Tonnes', trend: 'up', priceChange: 55 },
      { commodity: 'Litchi', category: 'Fruits', variety: 'Shahi Litchi (Muzaffarpur)', minPrice: 4800, maxPrice: 7200, modalPrice: 6100, unit: 'quintal', arrivalQuantity: '65 Tonnes', trend: 'up', priceChange: 200 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Lal Aloo / Desi', minPrice: 1400, maxPrice: 1680, modalPrice: 1540, unit: 'quintal', arrivalQuantity: '130 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Muzaffarpur Agricultural Mandi',
    district: 'Muzaffarpur',
    state: 'Bihar',
    marketType: 'Principal APMC Yard',
    commodities: [
      { commodity: 'Maize (Makka)', category: 'Grains & Cereals', variety: 'Yellow Feed Grain', minPrice: 2020, maxPrice: 2320, modalPrice: 2200, unit: 'quintal', arrivalQuantity: '310 Tonnes', trend: 'up', priceChange: 45 },
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'Kasturi / Katarni', minPrice: 2600, maxPrice: 3200, modalPrice: 2900, unit: 'quintal', arrivalQuantity: '90 Tonnes', trend: 'up', priceChange: 80 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Rai / Yellow', minPrice: 5150, maxPrice: 5600, modalPrice: 5380, unit: 'quintal', arrivalQuantity: '45 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },

  // ==================== MADHYA PRADESH ====================
  {
    mandi: 'Indore Krishi Upaj Mandi (Chhavani)',
    district: 'Indore',
    state: 'Madhya Pradesh',
    marketType: 'Major Commercial APMC',
    commodities: [
      { commodity: 'Soybean', category: 'Oilseeds', variety: 'JS-9560 / Yellow Gold', minPrice: 4550, maxPrice: 4980, modalPrice: 4790, unit: 'quintal', arrivalQuantity: '350 Tonnes', trend: 'up', priceChange: 90 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Malwa Sharbati Gold', minPrice: 2750, maxPrice: 3400, modalPrice: 3100, unit: 'quintal', arrivalQuantity: '280 Tonnes', trend: 'up', priceChange: 120 },
      { commodity: 'Gram (Chana)', category: 'Pulses', variety: 'Dollar Chana / Chickpea', minPrice: 7800, maxPrice: 10500, modalPrice: 9200, unit: 'quintal', arrivalQuantity: '90 Tonnes', trend: 'up', priceChange: 250 },
      { commodity: 'Garlic (Lahsun)', category: 'Spices', variety: 'Ooty / Malwa Bold', minPrice: 12500, maxPrice: 17000, modalPrice: 14800, unit: 'quintal', arrivalQuantity: '70 Tonnes', trend: 'down', priceChange: -200 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Jyoti / LR', minPrice: 1480, maxPrice: 1720, modalPrice: 1610, unit: 'quintal', arrivalQuantity: '160 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },
  {
    mandi: 'Ashta Krishi Upaj Mandi',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    marketType: 'Principal Mandi',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Sharbati C-306', minPrice: 2850, maxPrice: 3350, modalPrice: 3120, unit: 'quintal', arrivalQuantity: '180 Tonnes', trend: 'up', priceChange: 80 },
      { commodity: 'Soybean', category: 'Oilseeds', variety: 'Yellow Soybean', minPrice: 4480, maxPrice: 4860, modalPrice: 4710, unit: 'quintal', arrivalQuantity: '140 Tonnes', trend: 'up', priceChange: 40 },
      { commodity: 'Gram (Chana)', category: 'Pulses', variety: 'Desi Chana Bold', minPrice: 5700, maxPrice: 6250, modalPrice: 5980, unit: 'quintal', arrivalQuantity: '60 Tonnes', trend: 'stable', priceChange: 0 }
    ]
  },

  // ==================== PUNJAB ====================
  {
    mandi: 'Khanna Grain Market (Asia Largest)',
    district: 'Ludhiana',
    state: 'Punjab',
    marketType: 'Principal Grain Terminal',
    commodities: [
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'PBW-725 / HD-3086', minPrice: 2320, maxPrice: 2450, modalPrice: 2400, unit: 'quintal', arrivalQuantity: '580 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Paddy (Dhan)', category: 'Grains & Cereals', variety: 'PR-126 / PR-131', minPrice: 2203, maxPrice: 2360, modalPrice: 2300, unit: 'quintal', arrivalQuantity: '620 Tonnes', trend: 'up', priceChange: 20 },
      { commodity: 'Basmati Rice Paddy', category: 'Grains & Cereals', variety: '1121 Pusa Basmati', minPrice: 4300, maxPrice: 4950, modalPrice: 4680, unit: 'quintal', arrivalQuantity: '240 Tonnes', trend: 'up', priceChange: 140 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Pusa Bold', minPrice: 5300, maxPrice: 5800, modalPrice: 5550, unit: 'quintal', arrivalQuantity: '80 Tonnes', trend: 'up', priceChange: 50 }
    ]
  },

  // ==================== RAJASTHAN ====================
  {
    mandi: 'Kota Bhamashah Krishi Upaj Mandi',
    district: 'Kota',
    state: 'Rajasthan',
    marketType: 'Major Grain & Spice Terminal',
    commodities: [
      { commodity: 'Coriander (Dhaniya)', category: 'Spices', variety: 'Badami / Eagle', minPrice: 6800, maxPrice: 8400, modalPrice: 7600, unit: 'quintal', arrivalQuantity: '130 Tonnes', trend: 'up', priceChange: 220 },
      { commodity: 'Soybean', category: 'Oilseeds', variety: 'Kota Gold', minPrice: 4520, maxPrice: 4910, modalPrice: 4740, unit: 'quintal', arrivalQuantity: '210 Tonnes', trend: 'up', priceChange: 50 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'Tukdi / Sharbati', minPrice: 2580, maxPrice: 2950, modalPrice: 2780, unit: 'quintal', arrivalQuantity: '170 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Bold 42% Oil', minPrice: 5400, maxPrice: 5920, modalPrice: 5690, unit: 'quintal', arrivalQuantity: '115 Tonnes', trend: 'up', priceChange: 75 }
    ]
  },
  {
    mandi: 'Jaipur Muhana Terminal Mandi',
    district: 'Jaipur',
    state: 'Rajasthan',
    marketType: 'Mega Terminal Yard',
    commodities: [
      { commodity: 'Onion (Pyaz)', category: 'Vegetables', variety: 'Nashik / Sikar Red', minPrice: 2250, maxPrice: 2750, modalPrice: 2500, unit: 'quintal', arrivalQuantity: '240 Tonnes', trend: 'down', priceChange: -40 },
      { commodity: 'Potato (Aloo)', category: 'Vegetables', variety: 'Chipsona / Desi', minPrice: 1500, maxPrice: 1820, modalPrice: 1680, unit: 'quintal', arrivalQuantity: '190 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Bajra (Pearl Millet)', category: 'Grains & Cereals', variety: 'Hybrid Desi', minPrice: 2150, maxPrice: 2450, modalPrice: 2320, unit: 'quintal', arrivalQuantity: '140 Tonnes', trend: 'up', priceChange: 30 }
    ]
  },

  // ==================== HARYANA ====================
  {
    mandi: 'Karnal Grain & Vegetable Market',
    district: 'Karnal',
    state: 'Haryana',
    marketType: 'Principal APMC Yard',
    commodities: [
      { commodity: 'Basmati Rice Paddy', category: 'Grains & Cereals', variety: 'Super Basmati / 1509', minPrice: 3800, maxPrice: 4600, modalPrice: 4250, unit: 'quintal', arrivalQuantity: '310 Tonnes', trend: 'up', priceChange: 90 },
      { commodity: 'Wheat (Gehun)', category: 'Grains & Cereals', variety: 'WH-1105 / HD-2967', minPrice: 2340, maxPrice: 2480, modalPrice: 2420, unit: 'quintal', arrivalQuantity: '290 Tonnes', trend: 'stable', priceChange: 0 },
      { commodity: 'Mustard (Sarson)', category: 'Oilseeds', variety: 'Haryana Black', minPrice: 5350, maxPrice: 5800, modalPrice: 5600, unit: 'quintal', arrivalQuantity: '70 Tonnes', trend: 'up', priceChange: 40 }
    ]
  }
];

module.exports = MANDI_SEED_DATA;
