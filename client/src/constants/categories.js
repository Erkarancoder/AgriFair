export const CATEGORIES = [
  {
    id: 'grains-cereals',
    name: 'Grains & Cereals',
    tagline: 'Staple harvests & field crops',
    description: 'Wheat, basmati rice, organic millets, maize, and coarse grains harvested from prime agricultural regions.',
    badge: 'High Volume Demand',
    iconName: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#2d6a4f',
    popularCrops: ['Sharbati Wheat', 'Basmati Rice', 'Yellow Maize', 'Pearl Millet (Bajra)', 'Sorghum (Jowar)'],
    sampleItems: [
      {
        id: 'grain-1',
        name: 'MP Sharbati Premium Wheat',
        variety: 'Grade A Golden',
        region: 'Sehore, Madhya Pradesh',
        moisture: '10.5%',
        packaging: '50kg Jute Sacks',
        season: 'Rabi Harvest',
        minLot: '50 Quintals',
        sampleRateRange: '₹2,650 - ₹2,900 / Qtl'
      },
      {
        id: 'grain-2',
        name: 'Traditional 1121 Steam Basmati Rice',
        variety: 'Extra Long Grain (8.35mm)',
        region: 'Karnal, Haryana',
        moisture: '11.8%',
        packaging: '25kg Non-Woven Bags',
        season: 'Kharif Harvest',
        minLot: '100 Quintals',
        sampleRateRange: '₹7,800 - ₹8,400 / Qtl'
      },
      {
        id: 'grain-3',
        name: 'Hybrid Yellow Feed & Grain Maize',
        variety: 'Grade I Commercial',
        region: 'Davangere, Karnataka',
        moisture: '13.0%',
        packaging: '50kg HDPE Bags',
        season: 'Kharif Harvest',
        minLot: '80 Quintals',
        sampleRateRange: '₹2,150 - ₹2,380 / Qtl'
      }
    ]
  },
  {
    id: 'fresh-vegetables',
    name: 'Fresh Vegetables',
    tagline: 'Farm-picked daily staples',
    description: 'Direct-from-field potatoes, red onions, table tomatoes, cauliflower, green chillies, and leafy produce.',
    badge: 'Daily Market Flow',
    iconName: 'Carrot',
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#1f6b52',
    popularCrops: ['Nashik Red Onion', 'Jyoti Potato', 'Roma Table Tomatoes', 'Green Bell Peppers', 'Fresh Ginger'],
    sampleItems: [
      {
        id: 'veg-1',
        name: 'Nashik Medium Red Onion',
        variety: 'Garwa Crop (45mm - 55mm)',
        region: 'Lasalgaon, Maharashtra',
        moisture: 'Cured & Dry',
        packaging: '40kg Mesh Leno Bags',
        season: 'Late Kharif',
        minLot: '30 Quintals',
        sampleRateRange: '₹1,900 - ₹2,250 / Qtl'
      },
      {
        id: 'veg-2',
        name: 'Table Grade Chipsona / Jyoti Potato',
        variety: 'Sugar-Free Cold Grade',
        region: 'Agra, Uttar Pradesh',
        moisture: 'Clean Stored',
        packaging: '50kg Perforated Sacks',
        season: 'Winter Harvest',
        minLot: '60 Quintals',
        sampleRateRange: '₹1,350 - ₹1,650 / Qtl'
      },
      {
        id: 'veg-3',
        name: 'Himachal Farm-Fresh Green Capsicum',
        variety: 'Bell Green Select',
        region: 'Solan, Himachal Pradesh',
        moisture: 'Direct Plucked',
        packaging: '10kg Corrugated Crates',
        season: 'Summer Hill Harvest',
        minLot: '15 Quintals',
        sampleRateRange: '₹3,400 - ₹4,100 / Qtl'
      }
    ]
  },
  {
    id: 'fruits-orchards',
    name: 'Fruits & Orchards',
    tagline: 'Orchard-grown seasonal produce',
    description: 'Crisp apples, Alphonso & Dasheri mangoes, Cavendish bananas, sweet oranges, and pomegranate lots.',
    badge: 'High Value Per Lot',
    iconName: 'Apple',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#c25e00',
    popularCrops: ['Royal Delicious Apples', 'Ratnagiri Alphonso', 'Nagpur Sweet Oranges', 'Cavendish Banana', 'Bhagwa Pomegranate'],
    sampleItems: [
      {
        id: 'fruit-1',
        name: 'Kinnaur Royal Delicious Apples',
        variety: 'Premium Grade Extra Red',
        region: 'Kinnaur, Himachal Pradesh',
        moisture: 'Cold-Chain Ready',
        packaging: '20kg Layered Cartons',
        season: 'Autumn Harvest',
        minLot: '40 Boxes',
        sampleRateRange: '₹1,800 - ₹2,350 / Box'
      },
      {
        id: 'fruit-2',
        name: 'Solapur Bhagwa Pomegranate',
        variety: 'Export Grade (300g+ Arils)',
        region: 'Solapur, Maharashtra',
        moisture: 'Waxed & Graded',
        packaging: '3.5kg Net Master Crates',
        season: 'Mrig Bahar Harvest',
        minLot: '100 Crates',
        sampleRateRange: '₹850 - ₹1,120 / Crate'
      }
    ]
  },
  {
    id: 'pulses-legumes',
    name: 'Pulses & Legumes',
    tagline: 'Protein-dense grains & dals',
    description: 'Chickpeas (Chana), yellow toor dal, moong beans, black urad, and whole lentils directly from agricultural belts.',
    badge: 'Year-Round Storage',
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#92400e',
    popularCrops: ['Desi Chickpeas (Chana)', 'Latur Toor Whole', 'Green Moong Whole', 'Bikaneri Moth', 'Black Urad'],
    sampleItems: [
      {
        id: 'pulse-1',
        name: 'Desi Brown Chickpeas (Kabuli & Chana)',
        variety: 'Machine Cleaned Bold (Grade A)',
        region: 'Bikaner, Rajasthan',
        moisture: '9.2%',
        packaging: '50kg Polypropylene Bags',
        season: 'Rabi Harvest',
        minLot: '40 Quintals',
        sampleRateRange: '₹5,400 - ₹5,850 / Qtl'
      },
      {
        id: 'pulse-2',
        name: 'Marathwada Whole Pigeon Peas (Toor)',
        variety: 'White Bold Cleaned',
        region: 'Latur, Maharashtra',
        moisture: '10.0%',
        packaging: '50kg Gunny Sacks',
        season: 'Winter Harvest',
        minLot: '50 Quintals',
        sampleRateRange: '₹9,200 - ₹9,850 / Qtl'
      }
    ]
  },
  {
    id: 'oilseeds-commercial',
    name: 'Oilseeds & Commercial Crops',
    tagline: 'Processing & industrial staples',
    description: 'Yellow mustard seeds, groundnut pods, soybean, sunflower seeds, and clean raw cotton bales.',
    badge: 'Industrial Demand',
    iconName: 'Flame',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#854d0e',
    popularCrops: ['Yellow Mustard (Sarson)', 'Bold Groundnuts', 'Madhya Pradesh Soybean', 'Raw Clean Cotton', 'Sesame Seeds (Til)'],
    sampleItems: [
      {
        id: 'oil-1',
        name: 'Rajasthan Bold Yellow Mustard Seeds',
        variety: 'High Oil Yield (41%+ Oil Content)',
        region: 'Alwar, Rajasthan',
        moisture: '7.5%',
        packaging: '50kg New Jute Bags',
        season: 'Rabi Harvest',
        minLot: '50 Quintals',
        sampleRateRange: '₹5,650 - ₹6,100 / Qtl'
      },
      {
        id: 'oil-2',
        name: 'Malwa Yellow Soybean Lots',
        variety: 'JS-335 Certified Quality',
        region: 'Ujjain, Madhya Pradesh',
        moisture: '8.8%',
        packaging: '50kg HDPE Sacks',
        season: 'Kharif Harvest',
        minLot: '80 Quintals',
        sampleRateRange: '₹4,400 - ₹4,820 / Qtl'
      }
    ]
  },
  {
    id: 'spices-organics',
    name: 'Spices & Natural Farming',
    tagline: 'High-aroma crops & certified organics',
    description: 'Whole dry turmeric fingers, high-curcumin Salem roots, cumin seeds, green cardamom, and coriander seeds.',
    badge: 'Specialty Produce',
    iconName: 'Leaf',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    fallbackBg: '#b45309',
    popularCrops: ['Nizamabad Dry Turmeric', 'Unjha Cumin (Jeera)', 'Idukki Green Cardamom', 'Kota Coriander', 'Dry Red Chilli (Guntur)'],
    sampleItems: [
      {
        id: 'spice-1',
        name: 'Nizamabad Polished Turmeric Fingers',
        variety: 'Curcumin 3.8%+ High Aromatic',
        region: 'Nizamabad, Telangana',
        moisture: '9.0%',
        packaging: '60kg Double Jute Bags',
        season: 'Spring Harvest',
        minLot: '25 Quintals',
        sampleRateRange: '₹14,500 - ₹16,200 / Qtl'
      },
      {
        id: 'spice-2',
        name: 'Unjha Super Bold Cumin Seeds (Jeera)',
        variety: 'Machine Cleaned 99.5% Purity',
        region: 'Unjha, Gujarat',
        moisture: '8.0%',
        packaging: '25kg Poly Bags',
        season: 'Rabi Harvest',
        minLot: '20 Quintals',
        sampleRateRange: '₹24,000 - ₹26,500 / Qtl'
      }
    ]
  }
];
