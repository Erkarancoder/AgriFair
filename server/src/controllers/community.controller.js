const CommunityMember = require('../models/CommunityMember');
const COMMUNITY_SEED_MEMBERS = require('../seeds/communityMembersSeed');

/**
 * Ensures initial community members exist in MongoDB
 */
const autoSeedCommunityMembers = async () => {
  try {
    const count = await CommunityMember.countDocuments();
    if (count === 0) {
      console.log('[Community] Auto-seeding 20 initial farmer & trader community members...');
      await CommunityMember.insertMany(COMMUNITY_SEED_MEMBERS);
      console.log(`[Community] Successfully seeded ${COMMUNITY_SEED_MEMBERS.length} members across India.`);
    }
  } catch (error) {
    console.error(`[Community Auto-Seed Error]: ${error.message}`);
  }
};

/**
 * GET /api/community/members
 * Fetch community members with optional pagination & filtering
 */
const getCommunityMembers = async (req, res) => {
  try {
    // Run lazy seed check if collection is empty
    const currentCount = await CommunityMember.countDocuments();
    if (currentCount === 0) {
      await autoSeedCommunityMembers();
    }

    const { limit = 20, page = 1, role, state, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.role = role;
    }

    if (state && state !== 'all') {
      filter.state = new RegExp(`^${state.trim()}$`, 'i');
    }

    if (search && search.trim()) {
      const q = search.trim();
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { primaryCrop: { $regex: q, $options: 'i' } },
        { district: { $regex: q, $options: 'i' } },
        { state: { $regex: q, $options: 'i' } },
        { roleTitle: { $regex: q, $options: 'i' } }
      ];
    }

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [members, totalCount] = await Promise.all([
      CommunityMember.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .lean(),
      CommunityMember.countDocuments(filter)
    ]);

    // Real dynamic overall count + base social proof offset for ecosystem size
    const realTotal = await CommunityMember.countDocuments();
    // E.g., showing 2,400 + real registered count
    const displayTotalCount = 2400 + realTotal;

    res.status(200).json({
      success: true,
      members,
      pagination: {
        total: totalCount,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(totalCount / parsedLimit)
      },
      stats: {
        totalRealRegistered: realTotal,
        displayTotalCount
      }
    });
  } catch (error) {
    console.error(`[Community Controller Error]: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve community members',
      error: error.message
    });
  }
};

/**
 * POST /api/community/join
 * Register a new member in the AgriFair Community
 */
const joinCommunity = async (req, res) => {
  try {
    const {
      name,
      role = 'farmer',
      roleTitle,
      state,
      district,
      primaryCrop,
      avatar,
      farmSize,
      experienceYears,
      bio
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Name is required to join the community'
      });
    }

    if (!state || !state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'State is required'
      });
    }

    // Role-based title fallbacks
    const roleTitleMap = {
      farmer: 'Kisan / Farm Producer',
      trader: 'Licensed Mandi Trader',
      wholesaler: 'Bulk Produce Wholesaler',
      fpo_head: 'Farmer Producer Organisation Head',
      retailer: 'Agri Retailer & Distributor',
      agritech: 'Modern AgriTech Specialist'
    };

    const finalRoleTitle = (roleTitle && roleTitle.trim()) || roleTitleMap[role] || 'AgriFair Member';

    // Avatar fallback: if user didn't specify, assign an attractive avatar
    const defaultAvatars = [
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop&crop=faces&auto=format&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces&auto=format&q=80'
    ];
    const finalAvatar = (avatar && avatar.trim()) || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];

    const newMember = await CommunityMember.create({
      name: name.trim(),
      role: role || 'farmer',
      roleTitle: finalRoleTitle,
      state: state.trim(),
      district: (district && district.trim()) || '',
      primaryCrop: (primaryCrop && primaryCrop.trim()) || 'Seasonal Produce',
      avatar: finalAvatar,
      farmSize: (farmSize && farmSize.trim()) || '5 Acres',
      experienceYears: parseInt(experienceYears, 10) || 5,
      bio: (bio && bio.trim()) || `Farmer/trader connected via AgriFair from ${state}.`,
      badge: 'New Member',
      isVerified: true
    });

    const realTotal = await CommunityMember.countDocuments();

    res.status(201).json({
      success: true,
      message: `Welcome to the AgriFair Community, ${newMember.name}!`,
      member: newMember,
      stats: {
        totalRealRegistered: realTotal,
        displayTotalCount: 2400 + realTotal
      }
    });
  } catch (error) {
    console.error(`[Community Join Error]: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Failed to join community',
      error: error.message
    });
  }
};

module.exports = {
  autoSeedCommunityMembers,
  getCommunityMembers,
  joinCommunity
};
