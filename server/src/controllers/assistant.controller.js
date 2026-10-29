const MandiRate = require('../models/MandiRate');
const Product = require('../models/Product');
const Category = require('../models/Category');

/**
 * Knowledge Base for AgriFair Platform
 */
const AGRIFAIR_KNOWLEDGE = {
  platform: {
    name: 'AgriFair',
    tagline: 'Connecting Farmers Directly to Bulk Markets',
    mission:
      'Bridging rural Indian agricultural producers directly with wholesalers, retailers, and commercial buyers across India. We eliminate excessive middleman markups, provide real APMC mandi price benchmarks, and offer end-to-end order tracking.',
    features: [
      'Direct Farm-to-Market Produce Listings',
      'Regional Mandi Benchmark Price Discovery (Lucknow, Gorakhpur, Delhi, Pune, Patna, etc.)',
      'Transparent Crop Quality & Moisture Specifications',
      'Real-Time Purchase Order Tracking Timeline',
      'Role-based dashboards for Farmers, Wholesalers, Retailers, and Institutional Buyers'
    ]
  },
  roles: {
    farmer: {
      title: 'Farmer / Producer (किसान)',
      capabilities: [
        'Free registration with verified phone & email',
        'Post produce listings with variety, quantity (quintals), and target price',
        'Check live APMC mandi benchmarks before setting crop prices',
        'Receive incoming purchase orders from verified wholesale buyers',
        'Update order progress (Pending -> Confirmed -> Processing -> Out for Delivery -> Delivered)'
      ],
      portalUrl: '/farmer/listings'
    },
    wholesaler: {
      title: 'Wholesaler (थोक व्यापारी)',
      capabilities: [
        'Bulk lot discovery with tiered pricing and moisture metrics',
        'Direct connection with regional farmer clusters',
        'Formal purchase inquiries with destination addresses',
        'Live shipment status progress timeline'
      ],
      portalUrl: '/marketplace'
    },
    retailer: {
      title: 'Retailer (खुदरा व्यापारी)',
      capabilities: [
        'Smaller commercial lot sourcing for retail supply',
        'Direct farmer negotiations without commission agent cuts',
        'Consolidated purchase order history'
      ],
      portalUrl: '/marketplace'
    },
    institutional: {
      title: 'Institutional Buyer (संस्थागत खरीदार)',
      capabilities: [
        'Contract and high-volume seasonal agricultural procurement',
        'Quality-certified produce specifications',
        'Enterprise procurement tracking'
      ],
      portalUrl: '/marketplace'
    }
  }
};

/**
 * Intelligent helper to detect query intent and extract entities
 */
function analyzeUserQuery(query = '') {
  const q = query.toLowerCase().trim();

  // 1. Mandi rate intent
  const mandiKeywords = ['mandi', 'rate', 'bhav', 'bhaav', 'price', 'daam', 'dam', 'bhao', 'मंडी', 'भाव', 'रेट', 'दाम'];
  const isMandiIntent = mandiKeywords.some((k) => q.includes(k));

  // City detection
  const cities = [
    'lucknow', 'gorakhpur', 'delhi', 'pune', 'patna',
    'indore', 'khanna', 'kota', 'karnal', 'bihar',
    'uttar pradesh', 'maharashtra', 'punjab', 'rajasthan'
  ];
  const detectedCity = cities.find((c) => q.includes(c));

  // Commodity detection
  const commodities = [
    'wheat', 'gehun', 'gehu', 'गेहूं',
    'potato', 'aloo', 'alu', 'आलू',
    'onion', 'pyaz', 'pyaaz', 'प्याज',
    'tomato', 'tamatar', 'टमाटर',
    'rice', 'paddy', 'dhan', 'चावल', 'धान',
    'mustard', 'sarson', 'सरसों',
    'mango', 'aam', 'आम',
    'maize', 'makka', 'मक्का',
    'gram', 'chana', 'चना'
  ];
  const detectedCommodity = commodities.find((c) => q.includes(c));

  // 2. Farmer produce listing intent
  const listingKeywords = ['list', 'sell', 'bech', 'fasal', 'produce', 'post', 'khet', 'crop', 'बेचना', 'लिस्ट'];
  const isListingIntent = listingKeywords.some((k) => q.includes(k));

  // 3. Order tracking intent
  const orderKeywords = ['order', 'track', 'status', 'delivery', 'kharid', 'buy', 'ऑर्डर', 'ट्रैक'];
  const isOrderIntent = orderKeywords.some((k) => q.includes(k));

  // 4. Role intent
  const roleKeywords = ['role', 'who', 'farmer', 'buyer', 'wholesaler', 'retailer', 'kaun'];
  const isRoleIntent = roleKeywords.some((k) => q.includes(k));

  // 5. General greeting
  const greetingKeywords = ['hi', 'hello', 'namaste', 'hey', 'kaise', 'help', 'kya kar', 'नमस्ते', 'हेलो'];
  const isGreeting = greetingKeywords.some((k) => q.includes(k)) && q.length < 25;

  return {
    isMandiIntent,
    detectedCity,
    detectedCommodity,
    isListingIntent,
    isOrderIntent,
    isRoleIntent,
    isGreeting,
    raw: q
  };
}

/**
 * Handle Mandi Rates query with live database lookup
 */
async function handleMandiRateQuery(analysis) {
  const { detectedCity, detectedCommodity } = analysis;

  const queryFilter = { isActive: true };
  if (detectedCity) {
    const escaped = detectedCity.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'i');
    queryFilter.$or = [{ district: regex }, { state: regex }, { mandi: regex }];
  }

  const mandis = await MandiRate.find(queryFilter).limit(4).lean();

  if (mandis.length === 0) {
    return {
      reply: `Mujhe **${detectedCity || 'is ilaqe'}** ki koi mandi abhi database me nahi mili. Aap hamare database me **Lucknow, Gorakhpur, Delhi, Pune, Patna, Indore, Khanna, Kota, Karnal** ke rates check kar sakte hain.\n\nAap website ke top header me **"📍 Mandi Rates"** button par click karke kisi bhi mandi ka rate khoj sakte hain!`,
      suggestions: [
        'Lucknow mandi rate kya hai?',
        'Gorakhpur mandi rate kya hai?',
        'Delhi Azadpur mandi rate',
        'Fasal kaise bechein?'
      ]
    };
  }

  let text = '';
  if (detectedCity) {
    text += `🌾 **${detectedCity.toUpperCase()} ki Mandiyon ke Benchmark Rates:**\n\n`;
  } else {
    text += `🌾 **Mandi Benchmark Rates (Sample APMC Data):**\n\n`;
  }

  for (const m of mandis) {
    text += `📍 **${m.mandi}** (${m.district}, ${m.state})\n`;
    text += `*Type:* ${m.marketType}\n`;

    let cropsToShow = m.commodities || [];
    if (detectedCommodity) {
      cropsToShow = cropsToShow.filter((c) =>
        c.commodity.toLowerCase().includes(detectedCommodity)
      );
    }

    if (cropsToShow.length === 0) {
      cropsToShow = (m.commodities || []).slice(0, 3);
    } else {
      cropsToShow = cropsToShow.slice(0, 4);
    }

    cropsToShow.forEach((c) => {
      text += `  • **${c.commodity}** (${c.variety}): **₹${c.modalPrice?.toLocaleString('en-IN')}/${c.unit || 'quintal'}** (Range: ₹${c.minPrice} - ₹${c.maxPrice})\n`;
    });
    text += `\n`;
  }

  text += `💡 *Tip:* Kisi bhi mandi ka live rate dekhne ke liye top header me **"📍 Mandi Rates"** par click karein aur Google Maps-style autocomplete se khojein!`;

  return {
    reply: text,
    suggestions: [
      'Gorakhpur mandi rate kya hai?',
      'Delhi mandi rate kya hai?',
      'Farmer fasal kaise list kare?',
      'AgriFair par order kaise track karein?'
    ]
  };
}

/**
 * Handle Farmer produce listing query
 */
function handleListingQuery() {
  return {
    reply: `🚜 **Farmer (किसान) apni fasal AgriFair par kaise bechein:**\n\n` +
      `1. **Login ya Register karein:** Pehle Farmer role chun kar apna account banayein.\n` +
      `2. **Farmer Portal par jayein:** Top menu me **"Listings"** ya link [/farmer/listings](/farmer/listings) par click karein.\n` +
      `3. **Mandi Bhav dekhein:** Price dalne se pehle **"Check Mandi Rates"** banner par click karke apne ilaqe ka modal rate check karein.\n` +
      `4. **"Post New Produce Listing" par click karein:**\n` +
      `   • Fasal ka naam (e.g. Sharbati Wheat, Red Onion)\n` +
      `   • Category, Quantity (Quintals me), aur Target Price (₹/Quintal)\n` +
      `   • Apna State, District aur Mandi chunein\n` +
      `5. **Publish karein:** Save karte hi aapka lot live Marketplace me wholesale buyers aur retailers ko dikhne lagega!`,
    suggestions: [
      'Lucknow mandi rate kya hai?',
      'Buyer se payment kaise milti hai?',
      'Order kaise track karein?',
      'AgriFair me kaun-kaun se role hain?'
    ]
  };
}

/**
 * Handle Order Tracking query
 */
function handleOrderTrackingQuery() {
  return {
    reply: `📦 **AgriFair me Order Tracking kaise kaam karta hai:**\n\n` +
      `AgriFair me har order ka **database-backed real-time timeline** hota hai:\n\n` +
      `1. **Pending (प्रतीक्षारत):** Buyer ne purchase request bheji hai.\n` +
      `2. **Confirmed (पुष्टि की गई):** Farmer ne request accept ki aur quantity confirm ki.\n` +
      `3. **Processing (प्रक्रिया में):** Fasal packaging, quality inspection aur grading me hai.\n` +
      `4. **Out for Delivery (डिलीवरी के लिए निकला):** Shipment truck dispatch ho gaya hai.\n` +
      `5. **Delivered (सफलतापूर्वक प्राप्त):** Buyer ko lot mil gaya aur trade complete ho gayi.\n\n` +
      `👉 **Buyer Orders dekhne ke liye:** [/buyer/orders](/buyer/orders)\n` +
      `👉 **Farmer Orders manage karne ke liye:** [/farmer/orders](/farmer/orders)`,
    suggestions: [
      'Farmer fasal kaise beche?',
      'Lucknow mandi rate kya hai?',
      'Wholesaler kaise khareede?',
      'AgriFair kya hai?'
    ]
  };
}

/**
 * Handle Role Guidance query
 */
function handleRoleQuery() {
  return {
    reply: `👥 **AgriFair par 4 mukhya Participants (Roles) hain:**\n\n` +
      `1. **Farmer (किसान):** Direct fasal list karte hain, mandi rates check karte hain, aur purchase orders manage karte hain.\n` +
      `2. **Wholesaler (थोक व्यापारी):** Badi quantity (bulk lots) direct kisan se khareedte hain bina kisi bicholiye ke.\n` +
      `3. **Retailer (खुदra व्यापारी):** Local dukanon aur mandi supply ke liye fresh quality crops source karte hain.\n` +
      `4. **Institutional Buyer:** Food processors, hotel chains aur corporate mills jo certified standard lots procure karte hain.\n\n` +
      `Aap [/roles](/roles) page par jakar sabhi roles ke baare me detail me padh sakte hain!`,
    suggestions: [
      'Farmer portal kaise use karein?',
      'Marketplace me crops kaise dekhein?',
      'Live mandi rate kaise check karein?',
      'AgriFair me register kaise karein?'
    ]
  };
}

/**
 * Handle General Greetings and Overview
 */
function handleGreeting(userName, userRole) {
  const greeting = userName ? `Namaste **${userName}** ji!` : 'Namaste! Welcome to AgriFair.';
  const roleText = userRole ? ` Aap **${userRole.toUpperCase()}** ke roop me logged in hain.` : '';

  return {
    reply: `${greeting}${roleText} Mai **AgriFair AI Sahayak** hoon.\n\nMai aapko AgriFair ke baare me sab kuch bata sakta hoon:\n\n` +
      `• 🌾 **Real Mandi Rates:** Lucknow, Gorakhpur, Delhi, Pune, Patna ityadi ka mandi bhav\n` +
      `• 🚜 **Farmer Produce:** Fasal kaise list karein aur daam kaise tay karein\n` +
      `• 🛒 **Marketplace:** Bulk agricultural lots kaise khojein aur khareedein\n` +
      `• 📦 **Order Tracking:** Shipping progress timeline aur status updates\n\n` +
      `Aap mujhse Hindi, Hinglish ya English me kuch bhi pooch sakte hain!`,
    suggestions: [
      'Lucknow mandi rate kya hai?',
      'Gorakhpur mandi rate kya hai?',
      'Farmer apni fasal kaise beche?',
      'Order kaise track karein?'
    ]
  };
}

/**
 * Main Chat Endpoint Handler
 * POST /api/assistant/chat
 * Body: { message: string, userContext?: { name, role, email } }
 */
const handleChatMessage = async (req, res, next) => {
  try {
    const { message, userContext } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message cannot be empty.'
      });
    }

    const userName = userContext?.name || req.user?.name || null;
    const userRole = userContext?.role || req.user?.role || null;

    const analysis = analyzeUserQuery(message);

    let result;

    if (analysis.isMandiIntent || analysis.detectedCity || analysis.detectedCommodity) {
      result = await handleMandiRateQuery(analysis);
    } else if (analysis.isListingIntent) {
      result = handleListingQuery();
    } else if (analysis.isOrderIntent) {
      result = handleOrderTrackingQuery();
    } else if (analysis.isRoleIntent) {
      result = handleRoleQuery();
    } else if (analysis.isGreeting) {
      result = handleGreeting(userName, userRole);
    } else {
      // General / FAQ response with fallback to platform capabilities
      result = {
        reply: `Aapka sawal tha: *" ${message} "*\n\n` +
          `**AgriFair Ek Direct Agricultural Marketplace Hai.**\n\n` +
          `Yahan par:\n` +
          `• Kisan apni fasal bina bicholiye (middlemen) ke sidhe bulk buyers ko bech sakte hain.\n` +
          `• Har kisan kisi bhi shehar (Lucknow, Gorakhpur, Delhi, Pune, Patna) ka **real Mandi Rate** check kar sakta hai.\n` +
          `• Buyers marketplace me verify kiye gaye lots browse karke purchase orders place karte hain.\n` +
          `• Har order ka complete shipping timeline track hota hai.\n\n` +
          `Aap specific sawal pooch sakte hain jaise:\n` +
          `- *"Lucknow me gehun ka mandi rate kya hai?"*\n` +
          `- *"Fasal kaise list karein?"*\n` +
          `- *"Order track kaise karein?"*`,
        suggestions: [
          'Lucknow mandi rate kya hai?',
          'Farmer fasal kaise list kare?',
          'Order kaise track karein?',
          'AgriFair me kaun-kaun se role hain?'
        ]
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        reply: result.reply,
        suggestions: result.suggestions || [],
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleChatMessage
};
