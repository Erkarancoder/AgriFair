// RouteVoiceAnnouncer — fires a Hindi voice welcome whenever the route changes.
// Mounted once in App.jsx (inside BrowserRouter). Renders nothing visible.
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import voiceGuideService from '../../services/voiceGuide.service';

// Map of pathname patterns → Hindi voice messages
// Only fires once per distinct route visit (debounced 600ms after navigation).
const ROUTE_MESSAGES = [
  {
    match: (p) => p === '/',
    key: 'page-home',
    hindi:
      'नमस्ते किसान भाई! एग्रीफेयर के होम पेज पर आपका स्वागत है। ' +
      'यहाँ आप मार्केटप्लेस देख सकते हैं, मंडी भाव जान सकते हैं और अपनी फसल बेचने के लिए लिस्टिंग डाल सकते हैं। ' +
      'ऊपर नेविगेशन बार में सभी विकल्प दिए हैं।',
  },
  {
    match: (p) => p === '/marketplace' || p.startsWith('/marketplace'),
    key: 'page-marketplace',
    hindi:
      'यह एग्रीफेयर का बाज़ार है। यहाँ देशभर के किसानों की ताज़ा फसलें उपलब्ध हैं। ' +
      'आप किसी भी फसल पर क्लिक करके उसकी पूरी जानकारी देख सकते हैं, ' +
      'किसान से सीधे सौदा कर सकते हैं और ऑनलाइन ऑर्डर दे सकते हैं।',
  },
  {
    match: (p) => p === '/categories' || p.startsWith('/categories'),
    key: 'page-categories',
    hindi:
      'यह श्रेणी पृष्ठ है। यहाँ आप फसल के प्रकार के अनुसार खोज सकते हैं — ' +
      'जैसे अनाज, दालें, फल, सब्जियां या मसाले। अपनी ज़रूरत की श्रेणी पर क्लिक करें।',
  },
  {
    match: (p) => p === '/farmer/listings' || p === '/farmer/sell',
    key: 'page-farmer-listings',
    hindi:
      'किसान भाई, यह आपकी फसल लिस्टिंग का पेज है। ' +
      'यहाँ आप अपनी कटी हुई फसल बेचने के लिए जोड़ सकते हैं। ' +
      '"नई फसल जोड़ें" बटन पर क्लिक करें। ' +
      'फसल का नाम, पिन कोड, भाव और फोटो डालें — ' +
      'पिन कोड डालने से आपका गाँव, ज़िला और राज्य अपने आप आ जाएगा।',
  },
  {
    match: (p) => p === '/farmer/orders',
    key: 'page-farmer-orders',
    hindi:
      'किसान भाई, यह आपके ऑर्डर का पेज है। ' +
      'यहाँ आप देख सकते हैं कि कौन से खरीदार ने आपकी फसल का ऑर्डर दिया है। ' +
      'ऑर्डर पर क्लिक करके उसे स्वीकार करें, अस्वीकार करें, या GPS से गाड़ी ट्रैक करें।',
  },
  {
    match: (p) => p === '/buyer/orders',
    key: 'page-buyer-orders',
    hindi:
      'यह आपके खरीदारी के ऑर्डर का पेज है। ' +
      'यहाँ आप देख सकते हैं कि आपने कौन सी फसल का ऑर्डर दिया है और उसका क्या स्टेटस है। ' +
      '"Track Consignment" से गाड़ी की लाइव लोकेशन देखें।',
  },
  {
    match: (p) => p === '/conversations',
    key: 'page-chat',
    hindi:
      'यह चैट और बातचीत का पेज है। ' +
      'यहाँ आप किसान और खरीदार से सीधे बात कर सकते हैं, ' +
      'भाव पर मोलभाव कर सकते हैं और सौदा पक्का कर सकते हैं।',
  },
  {
    match: (p) => p === '/register',
    key: 'page-register',
    hindi:
      'एग्रीफेयर में आपका स्वागत है! ' +
      'नया खाता बनाने के लिए कृपया अपना नाम, मोबाइल नंबर और पासवर्ड भरें। ' +
      'क्या आप किसान हैं जो फसल बेचना चाहते हैं, या व्यापारी जो फसल खरीदना चाहते हैं — ' +
      'वह भी चुनें।',
  },
  {
    match: (p) => p === '/login',
    key: 'page-login',
    hindi:
      'एग्रीफेयर में लॉगिन करें। ' +
      'अपना ईमेल या मोबाइल नंबर और पासवर्ड डालें। ' +
      'अगर खाता नहीं है तो "रजिस्टर" पर क्लिक करें।',
  },
  {
    match: (p) => p === '/profile',
    key: 'page-profile',
    hindi:
      'यह आपकी प्रोफ़ाइल का पेज है। ' +
      'यहाँ आप अपना नाम, पता और अन्य जानकारी अपडेट कर सकते हैं।',
  },
  {
    match: (p) => p === '/how-it-works',
    key: 'page-how-it-works',
    hindi:
      'यह पेज बताता है कि एग्रीफेयर कैसे काम करता है। ' +
      'किसान फसल जोड़ता है, खरीदार ऑर्डर देता है, ' +
      'सौदा होता है और रेजरपे से सीधे पैसे मिलते हैं।',
  },
];

export default function RouteVoiceAnnouncer() {
  const location = useLocation();
  const timerRef = useRef(null);
  const lastPathRef = useRef('');

  useEffect(() => {
    const pathname = location.pathname;

    // Don't repeat for same path
    if (pathname === lastPathRef.current) return;
    lastPathRef.current = pathname;

    // Clear any pending timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Small delay so the page finishes rendering before speaking
    timerRef.current = setTimeout(() => {
      const match = ROUTE_MESSAGES.find((r) => r.match(pathname));
      if (match) {
        voiceGuideService.speak({
          hindiText: match.hindi,
          romanText: '',
          key: match.key,
          force: false, // won't repeat if same page within 15s
        });
      }
    }, 600);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [location.pathname]);

  return null; // renders nothing
}

