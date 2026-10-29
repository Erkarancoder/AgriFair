const dns = require('dns');
const mongoose = require('mongoose');
const config = require('../config/env');
const Category = require('../models/Category');

// Configure reliable DNS servers to prevent Windows querySrv ECONNREFUSED with Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch {
  // Ignore
}

const CATEGORY_TAXONOMY = [
  {
    name: 'Grains & Cereals',
    slug: 'grains-cereals',
    tagline: 'Staple harvests & field crops',
    description: 'Wheat, basmati rice, millets, maize, barley, and coarse grains from prime agricultural belts.',
    iconName: 'Wheat',
    image: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Vegetables',
    slug: 'vegetables',
    tagline: 'Farm-picked fresh staples',
    description: 'Potatoes, red onions, table tomatoes, cauliflower, chillies, garlic, and leafy farm harvests.',
    iconName: 'Carrot',
    image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Fruits',
    slug: 'fruits',
    tagline: 'Orchard-grown seasonal produce',
    description: 'Apples, mangoes, bananas, citrus oranges, pomegranates, and fresh orchard crops.',
    iconName: 'Apple',
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Pulses & Legumes',
    slug: 'pulses-legumes',
    tagline: 'Protein-dense grains & dals',
    description: 'Desi chana, toor dal, moong beans, black urad, masoor, and whole lentils directly from growers.',
    iconName: 'Sparkles',
    image: 'https://images.unsplash.com/photo-1515543237350-b3eea1ec8082?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Oilseeds',
    slug: 'oilseeds',
    tagline: 'High-yield commercial & processing crops',
    description: 'Mustard seeds, groundnuts, soybean, sunflower seeds, and sesame crops for processing.',
    iconName: 'Flame',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Spices',
    slug: 'spices',
    tagline: 'High-curcumin roots & aromatic spices',
    description: 'Turmeric fingers, cumin seeds (jeera), green cardamom, coriander seeds, and dry red chillies.',
    iconName: 'Leaf',
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=800&q=80',
    isActive: true
  },
  {
    name: 'Organic Produce',
    slug: 'organic-produce',
    tagline: 'Naturally farmed certified produce',
    description: 'Chemical-free and zero-residue agricultural produce verified under organic farming practices.',
    iconName: 'ShieldCheck',
    image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=800&q=80',
    isActive: true
  }
];

const seedCategories = async () => {
  const isDirectRun = require.main === module;

  if (mongoose.connection.readyState !== 1) {
    console.log('[Seed] Connecting to MongoDB...');
    await mongoose.connect(config.mongodbUri);
    console.log(`[Seed] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  }

  console.log(`[Seed] Processing ${CATEGORY_TAXONOMY.length} standard agricultural categories...`);

  let upsertedCount = 0;
  for (const cat of CATEGORY_TAXONOMY) {
    const result = await Category.findOneAndUpdate(
      { slug: cat.slug },
      {
        $set: {
          name: cat.name,
          slug: cat.slug,
          tagline: cat.tagline,
          description: cat.description,
          iconName: cat.iconName,
          image: cat.image,
          isActive: cat.isActive
        }
      },
      {
        upsert: true,
        returnDocument: 'after',
        setDefaultsOnInsert: true
      }
    );
    if (result) upsertedCount++;
  }

  const totalCategories = await Category.countDocuments();
  console.log(`[Seed] Successfully processed ${upsertedCount} categories. Total active categories in DB: ${totalCategories}`);

  if (isDirectRun) {
    await mongoose.disconnect();
    console.log('[Seed] Disconnected cleanly.');
  }

  return { upsertedCount, totalCategories };
};

if (require.main === module) {
  seedCategories()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error] Failed:', err);
      process.exit(1);
    });
}

module.exports = {
  seedCategories,
  CATEGORY_TAXONOMY
};
