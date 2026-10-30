const https = require('https');

// Fallback directory of major Indian PIN codes for instant zero-latency response during presentations
const PINCODE_FALLBACKS = {
  // Uttar Pradesh
  '226001': { state: 'Uttar Pradesh', district: 'Lucknow', villages: ['Lucknow G.P.O.', 'Canal Colony', 'Lalbagh', 'Hazratganj'] },
  '226010': { state: 'Uttar Pradesh', district: 'Lucknow', villages: ['Gomti Nagar', 'Vibhuti Khand', 'Ujariyaon'] },
  '221001': { state: 'Uttar Pradesh', district: 'Varanasi', villages: ['Varanasi Cantt', 'Kashi', 'Shivpur'] },
  '273001': { state: 'Uttar Pradesh', district: 'Gorakhpur', villages: ['Gorakhpur H.O', 'Golghar', 'Mohaddipur'] },
  '208001': { state: 'Uttar Pradesh', district: 'Kanpur Nagar', villages: ['Kanpur H.O', 'Civil Lines', 'Collectorganj'] },
  '211001': { state: 'Uttar Pradesh', district: 'Prayagraj', villages: ['Allahabad H.O', 'Civil Lines', 'Katra'] },
  '250001': { state: 'Uttar Pradesh', district: 'Meerut', villages: ['Meerut Cantt', 'Sadar Bazar', 'Kankerkhera'] },
  '282001': { state: 'Uttar Pradesh', district: 'Agra', villages: ['Agra Fort', 'Rakabganj', 'Sadar Bazar'] },
  '243001': { state: 'Uttar Pradesh', district: 'Bareilly', villages: ['Bareilly H.O', 'Civil Lines', 'Subhash Nagar'] },
  // Punjab & Haryana
  '141401': { state: 'Punjab', district: 'Ludhiana', villages: ['Khanna', 'Amloh Road', 'Nai Mandi'] },
  '141001': { state: 'Punjab', district: 'Ludhiana', villages: ['Ludhiana H.O', 'Civil Lines', 'Miller Ganj'] },
  '151001': { state: 'Punjab', district: 'Bathinda', villages: ['Bathinda H.O', 'Mandi Phul', 'Goniana'] },
  '132001': { state: 'Haryana', district: 'Karnal', villages: ['Karnal H.O', 'Model Town', 'Taraori'] },
  '122001': { state: 'Haryana', district: 'Gurgaon', villages: ['Gurgaon H.O', 'Civil Lines', 'Sadar Bazar'] },
  // Delhi & NCR
  '110001': { state: 'Delhi', district: 'Central Delhi', villages: ['Connaught Place', 'Janpath', 'Barakhamba Road'] },
  // Madhya Pradesh
  '452001': { state: 'Madhya Pradesh', district: 'Indore', villages: ['Indore H.O', 'Rajwada', 'Siyaganj Mandi'] },
  '462001': { state: 'Madhya Pradesh', district: 'Bhopal', villages: ['Bhopal H.O', 'TT Nagar', 'Shahjahanabad'] },
  // Rajasthan
  '302001': { state: 'Rajasthan', district: 'Jaipur', villages: ['Jaipur G.P.O.', 'C Scheme', 'Johari Bazar'] },
  // Gujarat
  '380001': { state: 'Gujarat', district: 'Ahmedabad', villages: ['Ahmedabad G.P.O.', 'Lal Darwaja', 'Bhadra'] },
  // Maharashtra
  '400001': { state: 'Maharashtra', district: 'Mumbai', villages: ['Mumbai G.P.O.', 'Fort', 'Colaba'] },
  '411001': { state: 'Maharashtra', district: 'Pune', villages: ['Pune H.O', 'Shivajinagar', 'Camp'] },
  '422001': { state: 'Maharashtra', district: 'Nashik', villages: ['Nashik H.O', 'Panchavati', 'Satpur'] },
  // Bihar
  '800001': { state: 'Bihar', district: 'Patna', villages: ['Patna G.P.O.', 'Fraser Road', 'Gandhi Maidan'] },
  // Karnataka
  '560001': { state: 'Karnataka', district: 'Bangalore', villages: ['Bangalore G.P.O.', 'MG Road', 'Shivajinagar'] }
};

/**
 * GET /api/location/pincode/:pincode
 * Real postal API fetch with instant fallback for reliable hackathon execution
 */
const lookupPincode = async (req, res) => {
  const { pincode } = req.params;

  if (!pincode || !/^[1-9][0-9]{5}$/.test(pincode.trim())) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 6-digit Indian PIN Code.'
    });
  }

  const cleanPin = pincode.trim();

  // If known in instant dictionary, return immediately for sub-millisecond response
  if (PINCODE_FALLBACKS[cleanPin]) {
    const cached = PINCODE_FALLBACKS[cleanPin];
    return res.status(200).json({
      success: true,
      data: {
        pincode: cleanPin,
        state: cached.state,
        district: cached.district,
        villages: cached.villages,
        defaultVillage: cached.villages[0] || ''
      }
    });
  }

  // Fetch live from Postal Department of India API for any other PIN code in India
  const fetchLivePostal = () => {
    return new Promise((resolve, reject) => {
      const apiReq = https.get(
        `https://api.postalpincode.in/pincode/${cleanPin}`,
        { timeout: 4000 },
        (apiRes) => {
          let raw = '';
          apiRes.on('data', (chunk) => (raw += chunk));
          apiRes.on('end', () => {
            try {
              const parsed = JSON.parse(raw);
              if (
                Array.isArray(parsed) &&
                parsed[0]?.Status === 'Success' &&
                Array.isArray(parsed[0].PostOffice) &&
                parsed[0].PostOffice.length > 0
              ) {
                const poList = parsed[0].PostOffice;
                const state = poList[0].State || '';
                const district = poList[0].District || '';
                const villages = [...new Set(poList.map((p) => p.Name).filter(Boolean))];
                resolve({
                  pincode: cleanPin,
                  state,
                  district,
                  villages,
                  defaultVillage: villages[0] || ''
                });
              } else {
                reject(new Error('PIN code not found in postal database'));
              }
            } catch (err) {
              reject(err);
            }
          });
        }
      );

      apiReq.on('error', reject);
      apiReq.on('timeout', () => {
        apiReq.destroy();
        reject(new Error('Postal API timeout'));
      });
    });
  };

  try {
    const liveData = await fetchLivePostal();
    return res.status(200).json({
      success: true,
      data: liveData
    });
  } catch (liveErr) {
    return res.status(404).json({
      success: false,
      message: 'PIN Code not found. Please enter village and state manually.'
    });
  }
};

module.exports = {
  lookupPincode
};

