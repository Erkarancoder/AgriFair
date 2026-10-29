export const USER_ROLES = {
  FARMER: 'farmer',
  WHOLESALER: 'wholesaler',
  RETAILER: 'retailer',
  BUYER: 'buyer',
  CONSUMER: 'consumer',
};

export const BUYER_ROLES = [
  USER_ROLES.BUYER,
  USER_ROLES.WHOLESALER,
  USER_ROLES.RETAILER,
  USER_ROLES.CONSUMER,
];

export const ROLE_PROFILES = [
  {
    id: USER_ROLES.FARMER,
    badge: 'Producers & Growers',
    title: 'Farmers & Cultivators',
    tagline: 'Direct Market Reach Without Intermediary Disadvantage',
    description: 'List harvested crops directly, review competitive offers from verified bulk buyers and wholesalers, and access transparent mandi benchmarks to make informed selling decisions.',
    iconName: 'Tractor',
    primaryColor: '#164e3b',
    features: [
      'Publish harvest batches with moisture, grade, and packaging specs',
      'Receive direct purchasing bids from verified wholesalers & retailers',
      'Compare local mandi rates against broader market demand',
      'Retain full control over acceptable offer pricing and delivery timelines'
    ],
    actionLabel: 'Explore Farmer Features',
    modalNote: 'Farmer account registration and crop listing management will launch in Phase 2.'
  },
  {
    id: USER_ROLES.WHOLESALER,
    badge: 'Aggregators & Mandi Traders',
    title: 'Wholesalers & Traders',
    tagline: 'Predictable Bulk Sourcing at Source Level',
    description: 'Source quality agricultural commodities in commercial lots directly from regional farmer clusters with verifiable harvest data and transparent trade negotiations.',
    iconName: 'Building2',
    primaryColor: '#1f6b52',
    features: [
      'Discover multi-ton crop availability across different harvesting zones',
      'Submit volume-based bids with custom delivery & packaging requirements',
      'Track incoming harvest schedules to plan warehouse inventory',
      'Establish dependable seasonal relationships with regional farmer cooperatives'
    ],
    actionLabel: 'Explore Wholesaler Features',
    modalNote: 'Wholesaler commercial onboarding and bidding portals are scheduled for Phase 2.'
  },
  {
    id: USER_ROLES.RETAILER,
    badge: 'Shops & Supermarkets',
    title: 'Retailers & Grocery Businesses',
    tagline: 'Fresh Produce Sourced Reliably for Retail Shelves',
    description: 'Keep your store stocked with farm-fresh produce, reduce storage delays, and secure stable procurement pricing by connecting directly with growers and local distribution hubs.',
    iconName: 'Store',
    primaryColor: '#2e8b68',
    features: [
      'Order medium-to-large produce batches aligned with weekly retail demand',
      'Verify harvest dates and produce freshness metrics before commitment',
      'Streamline local store deliveries with transparent logistics updates',
      'Offer your customers traceable farm-origin goods at competitive pricing'
    ],
    actionLabel: 'Explore Retailer Features',
    modalNote: 'Retailer procurement and ordering tools will become active in Phase 2.'
  },
  {
    id: USER_ROLES.BUYER,
    badge: 'Food Processors & Institutions',
    title: 'Bulk & Institutional Buyers',
    tagline: 'Standardized Raw Material Procurement at Scale',
    description: 'Procure agricultural raw materials meeting rigid quality parameters for food processing units, hospitality chains, educational institutions, and export operations.',
    iconName: 'Briefcase',
    primaryColor: '#164e3b',
    features: [
      'Broadcast institutional procurement tenders with technical grade criteria',
      'Review verified laboratory test certifications and moisture percentages',
      'Secure contract-farming agreements and forward delivery pipelines',
      'Manage multi-origin logistics with consolidated invoicing'
    ],
    actionLabel: 'Explore Buyer Features',
    modalNote: 'Institutional procurement contracts and RFP mechanisms will launch in Phase 2.'
  },
  {
    id: USER_ROLES.CONSUMER,
    badge: 'Households & Communities',
    title: 'Direct Consumers',
    tagline: 'Authentic Farm-Fresh Goods for Your Family',
    description: 'Support local agricultural families while enjoying nutritious, unadulterated grains, seasonal fruits, and vegetables harvested at peak ripeness.',
    iconName: 'ShoppingBag',
    primaryColor: '#42b285',
    features: [
      'Browse farm-fresh seasonal baskets directly from nearby producer groups',
      'Know exactly which farm and region your daily food was grown in',
      'Support fair remuneration for hardworking farming households',
      'Access wholesome heirloom pulses and natural farm produce'
    ],
    actionLabel: 'Explore Consumer Features',
    modalNote: 'Consumer direct retail carts and community basket delivery will roll out in Phase 2.'
  }
];
