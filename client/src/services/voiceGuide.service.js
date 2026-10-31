// Smart AI Voice Guide Service for AgriFair (AgriFair Bolta Sahayak / Kisan Voice Guide)
// Designed for farmers who prefer audio guidance in simple, respectful Hindi.

class VoiceGuideService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.selectedVoice = null;
    this.isMuted = typeof window !== 'undefined' && localStorage.getItem('agrifair_voice_muted') === 'true';
    this.isSpeaking = false;
    this.lastSpokenKey = '';
    this.lastSpokenTime = 0;
    this.lastSpokenText = '';
    this.lastSpokenRoman = '';
    this.currentText = '';
    this.currentRoman = '';
    this.subscribers = new Set();
    this.hasUserInteracted = false;
    this.initialized = false;

    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;

    // Load available voices
    this.loadVoices();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }

    // Attach global listeners for click and focus across the entire application
    const markInteracted = () => {
      this.hasUserInteracted = true;
      window.removeEventListener('click', markInteracted);
      window.removeEventListener('keydown', markInteracted);
    };
    window.addEventListener('click', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });

    // Global focusin listener (for inputs, selects, textareas)
    document.addEventListener('focusin', (e) => {
      this.handleElementEvent(e.target, 'focus');
    }, true);

    // Global click listener (for buttons, links, cards)
    document.addEventListener('click', (e) => {
      const clickable = e.target.closest('button, a, [role="button"], input[type="radio"], input[type="checkbox"], [data-voice-guide]');
      if (clickable) {
        this.handleElementEvent(clickable, 'click');
      }
    }, true);

    // Custom event listener for components to trigger dynamic voice messages
    window.addEventListener('agrifair:voice_speak', (e) => {
      if (e.detail) {
        this.speak(e.detail);
      }
    });
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    // Prioritize high-quality Hindi voices, then Indian English, then system default
    this.selectedVoice =
      this.voices.find((v) => v.lang === 'hi-IN' || v.lang.startsWith('hi')) ||
      this.voices.find((v) => v.lang === 'en-IN' || v.name.includes('India')) ||
      this.voices[0] ||
      null;
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.getState());
    return () => this.subscribers.delete(callback);
  }

  notify() {
    const state = this.getState();
    this.subscribers.forEach((cb) => {
      try {
        cb(state);
      } catch (err) {
        console.error('Voice guide subscriber error:', err);
      }
    });
  }

  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isMuted: this.isMuted,
      currentText: this.currentText,
      currentRoman: this.currentRoman,
      lastSpokenText: this.lastSpokenText,
      lastSpokenRoman: this.lastSpokenRoman,
      hasUserInteracted: this.hasUserInteracted
    };
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrifair_voice_muted', this.isMuted ? 'true' : 'false');
    }
    if (this.isMuted) {
      this.stop();
    }
    this.notify();
    return !this.isMuted;
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.notify();
  }

  replay() {
    if (!this.lastSpokenText) return;
    this.speak({
      hindiText: this.lastSpokenText,
      romanText: this.lastSpokenRoman,
      key: this.lastSpokenKey,
      force: true
    });
  }

  speak({ hindiText, romanText = '', key = '', force = false }) {
    if (!hindiText) return;

    // "ye nahi ki bar bar bolega, ek bar hi bolega" rule:
    // If exact same element/action happened in the last 15 seconds, skip duplicate speech unless forced (e.g. Replay button)
    const now = Date.now();
    if (!force && key && key === this.lastSpokenKey && now - this.lastSpokenTime < 15000) {
      return;
    }

    this.lastSpokenKey = key;
    this.lastSpokenTime = now;
    this.lastSpokenText = hindiText;
    this.lastSpokenRoman = romanText;
    this.currentText = hindiText;
    this.currentRoman = romanText;

    if (this.isMuted) {
      this.notify();
      return;
    }

    if (!this.synth) {
      this.notify();
      return;
    }

    try {
      this.synth.cancel(); // Stop prior sentence immediately

      const utterance = new SpeechSynthesisUtterance(hindiText);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.92; // Natural, polite, relaxed pace for farmers
      utterance.pitch = 1.0;

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      utterance.onstart = () => {
        this.isSpeaking = true;
        this.notify();
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.notify();
      };

      utterance.onerror = (e) => {
        this.isSpeaking = false;
        this.notify();
      };

      this.synth.speak(utterance);
    } catch (err) {
      console.warn('VoiceGuide speak error:', err);
      this.isSpeaking = false;
      this.notify();
    }
  }

  // Smart interpreter for any element clicked or focused
  handleElementEvent(el, eventType) {
    if (!el || typeof el.getAttribute !== 'function') return;

    // Check explicit voice guide attribute first
    const explicitGuide = el.getAttribute('data-voice-guide');
    if (explicitGuide) {
      this.speak({
        hindiText: explicitGuide,
        romanText: el.getAttribute('data-voice-roman') || '',
        key: `custom-${explicitGuide.slice(0, 20)}`
      });
      return;
    }

    const tagName = el.tagName.toLowerCase();
    const name = (el.name || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const placeholder = (el.placeholder || '').toLowerCase();
    const text = (el.innerText || el.textContent || '').trim().toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
    const type = (el.type || '').toLowerCase();

    // 1. Post New Listing / Sell Crop button
    if (
      text.includes('post new produce') ||
      text.includes('post / manage produce') ||
      text.includes('sell produce') ||
      text.includes('fasal bechein') ||
      text.includes('cell crop') ||
      ariaLabel.includes('post produce')
    ) {
      this.speak({
        hindiText: 'नमस्ते किसान भाई! यहाँ आप अपनी फसल बेचने के लिए जोड़ सकते हैं। आइए हम आपको स्टेप-बाय-स्टेप बताते हैं कि क्या भरना है।',
        romanText: 'Namaste kisan bhai! Yahan aap apni fasal bechne ke liye jod sakte hain. Aaiye hum aapko step-by-step batate hain ki kya bharna hai.',
        key: 'action-sell-produce'
      });
      return;
    }

    // 2. Crop / Produce Name input
    if (
      name === 'title' ||
      name === 'cropname' ||
      name === 'producename' ||
      placeholder.includes('sharbati') ||
      placeholder.includes('crop name') ||
      id.includes('crop')
    ) {
      this.speak({
        hindiText: 'यहाँ अपनी फसल का नाम लिखें, जैसे शरबती गेहूँ, बासमati चावल, या देसी चना।',
        romanText: 'Yahan apni fasal ka naam likhein, jaise Sharbati Gehun, Basmati Chawal ya Chana.',
        key: 'field-crop-name'
      });
      return;
    }

    // 3. Category Select
    if (name === 'category' || placeholder.includes('category')) {
      this.speak({
        hindiText: 'यहाँ फसल की श्रेणी चुनें, जैसे अनाज (Grains), दालें (Pulses), या फल और ताज़ा सब्जियां।',
        romanText: 'Yahan fasal ki category chunein, jaise Anaj, Daal ya Sabzi.',
        key: 'field-category'
      });
      return;
    }

    // 4. Variety / Cultivar
    if (name === 'variety' || placeholder.includes('variety') || placeholder.includes('cultivar')) {
      this.speak({
        hindiText: 'यहाँ फसल की किस्म या वैरायटी लिखें, जैसे 1121 बासमती या देसी वैरायटी।',
        romanText: 'Yahan fasal ki variety likhein, jaise 1121 Basmati ya Desi variety.',
        key: 'field-variety'
      });
      return;
    }

    // 5. Quality Grade
    if (name === 'qualitygrade' || placeholder.includes('grade')) {
      this.speak({
        hindiText: 'यहाँ फसल की गुणवत्ता या ग्रेड चुनें, जैसे ग्रेड A या बढ़िया माल।',
        romanText: 'Yahan fasal ka quality grade chunein, jaise Grade A ya FAQ.',
        key: 'field-grade'
      });
      return;
    }

    // 6. Price Per Unit
    if (
      name === 'priceperunit' ||
      name === 'price' ||
      placeholder.includes('price') ||
      placeholder.includes('2800')
    ) {
      this.speak({
        hindiText: 'यहाँ अपनी फसल का बिक्री भाव भरें, कि आप 1 क्विंटल का कितना रुपया लेना चाहते हैं।',
        romanText: 'Yahan apni fasal ka daam bharein, ki 1 quintal ka kitna rupya lena chahte hain.',
        key: 'field-price'
      });
      return;
    }

    // 7. Available Quantity
    if (
      name === 'totalquantity' ||
      name === 'quantity' ||
      placeholder.includes('available quantity') ||
      placeholder.includes('100')
    ) {
      this.speak({
        hindiText: 'यहाँ लिखें कि आपके पास बेचने के लिए कुल कितने क्विंटल या किलो फसल तैयार है।',
        romanText: 'Yahan likhein ki aapke paas bechne ke liye kitni fasal taiyar hai.',
        key: 'field-quantity'
      });
      return;
    }

    // 8. Trade Unit
    if (name === 'unit') {
      this.speak({
        hindiText: 'यहाँ वजन की इकाई चुनें, जैसे क्विंटल (100 किलो) या किलोग्राम।',
        romanText: 'Yahan wazan ki ikai chunein, jaise Quintal ya KG.',
        key: 'field-unit'
      });
      return;
    }

    // 9. PIN Code Input
    if (
      name === 'pincode' ||
      placeholder.includes('pin code') ||
      placeholder.includes('226001')
    ) {
      this.speak({
        hindiText: 'यहाँ अपने गाँव का 6 अंकों का पिन कोड डालें, आपका राज्य, जिला और गाँव अपने आप आ जाएगा।',
        romanText: 'Yahan apna 6-digit PIN code dalein, rajya, zila aur gaon apne aap aa jayega.',
        key: 'field-pincode'
      });
      return;
    }

    // 10. Village / Local Area Input
    if (
      name === 'village' ||
      placeholder.includes('khanna / canal colony') ||
      placeholder.includes('village')
    ) {
      this.speak({
        hindiText: 'यहाँ अपने गाँव या नजदीकी पोस्ट ऑफिस का नाम चुनें।',
        romanText: 'Yahan apne gaon ya local area ka naam chunein.',
        key: 'field-village'
      });
      return;
    }

    // 11. Description / Moisture
    if (
      name === 'description' ||
      placeholder.includes('moisture') ||
      placeholder.includes('specifications')
    ) {
      this.speak({
        hindiText: 'यहाँ अपनी फसल की खासियत, जैसे नमी की मात्रा या कटाई की जानकारी लिख सकते हैं।',
        romanText: 'Yahan fasal ki nami ya khasiyat likh sakte hain.',
        key: 'field-description'
      });
      return;
    }

    // 12. Harvest Photo
    if (type === 'file' || text.includes('harvest photo') || text.includes('select product')) {
      this.speak({
        hindiText: 'यहाँ क्लिक करके अपनी कटी हुई फसल की ताज़ा फोटो लगाएं, ताकि खरीदार देखकर भरोसा कर सकें।',
        romanText: 'Yahan fasal ki taaza photo lagayein, taaki khareedaar dekh sakein.',
        key: 'field-photo'
      });
      return;
    }

    // 13. Create Listing Button
    if (
      text.includes('create listing') ||
      text.includes('post listing') ||
      text.includes('publish produce')
    ) {
      this.speak({
        hindiText: 'बहुत बढ़िया! आपकी फसल एग्रीफेयर बाज़ार में सभी व्यापारियों के लिए जुड़ रही है।',
        romanText: 'Bahut badhiya! Aapki fasal AgriFair marketplace me jud rahi hai.',
        key: 'action-create-listing'
      });
      return;
    }

    // 14. Mandi Rates / मंडी भाव Button
    if (
      text.includes('mandi rates') ||
      text.includes('मंडी भाव') ||
      text.includes('mandi rate') ||
      text.includes('mandi benchmark')
    ) {
      this.speak({
        hindiText: 'मंडी भाव केंद्र खुल गया है। ऊपर सर्च बॉक्स में अपने शहर या मंडी का नाम लिखें, जैसे लखनऊ या गोरखपुर।',
        romanText: 'Mandi Bhav kendra khul gaya hai. Upar search me apne sheher ka naam likhein, jaise Lucknow ya Gorakhpur.',
        key: 'action-open-mandi'
      });
      return;
    }

    // 15. Mandi Search Input
    if (
      id.includes('mandi') ||
      placeholder.includes('apmc') ||
      placeholder.includes('mandi') ||
      placeholder.includes('lucknow')
    ) {
      this.speak({
        hindiText: 'सर्च में अपने नजदीकी शहर, ज़िले या मंडी का नाम लिखें, जैसे लखनऊ, कानपुर या खन्ना।',
        romanText: 'Search me apne sheher ya mandi ka naam likhein, jaise Lucknow ya Khanna.',
        key: 'field-mandi-search'
      });
      return;
    }

    // 16. Quick Mandi Hubs (e.g. Lucknow, Gorakhpur, Delhi, Pune, etc.)
    const hubs = ['lucknow', 'gorakhpur', 'delhi', 'pune', 'patna', 'indore', 'khanna', 'kota', 'karnal'];
    for (const hub of hubs) {
      if (text === hub || text.startsWith(hub)) {
        const capitalHub = hub.charAt(0).toUpperCase() + hub.slice(1);
        this.speak({
          hindiText: `${capitalHub} मंडी का आज का ताज़ा सरकारी और आवक भाव नीचे आ गया है। इसे देखकर आप अपनी फसल का सही दाम तय कर सकते हैं।`,
          romanText: `${capitalHub} mandi ka taaza bhav aa gaya hai. Isse dekhkar sahi daam tay karein.`,
          key: `mandi-hub-${hub}`
        });
        return;
      }
    }

    // 17. Register / Create Account
    if (text.includes('create an account') || text.includes('register') || text.includes('खाता बनाएं')) {
      this.speak({
        hindiText: 'एग्रीफेयर में आपका स्वागत है। नया खाता बनाने के लिए नीचे अपनी जानकारी भरें।',
        romanText: 'AgriFair me swagat hai. Naya khata banane ke liye jankari bharein.',
        key: 'action-register-page'
      });
      return;
    }

    // 18. Register Name field
    if (name === 'name' && (placeholder.includes('name') || placeholder.includes('ramesh'))) {
      this.speak({
        hindiText: 'यहाँ किसान भाई अपना पूरा नाम लिखें।',
        romanText: 'Yahan kisan bhai apna poora naam likhein.',
        key: 'field-register-name'
      });
      return;
    }

    // 19. Register Phone field
    if (name === 'phone' || placeholder.includes('phone') || placeholder.includes('98765')) {
      this.speak({
        hindiText: 'यहाँ अपना 10 अंकों का मोबाइल नंबर दर्ज करें।',
        romanText: 'Yahan apna 10-digit mobile number dalein.',
        key: 'field-register-phone'
      });
      return;
    }

    // 20. Email field
    if (name === 'email' || type === 'email' || placeholder.includes('email')) {
      this.speak({
        hindiText: 'यहाँ अपना ईमेल पता दर्ज करें।',
        romanText: 'Yahan apna email pata dalein.',
        key: 'field-email'
      });
      return;
    }

    // 21. Role Selection (Farmer vs Buyer)
    if (text.includes('farmer') || text.includes('grower') || text.includes('list crops')) {
      this.speak({
        hindiText: 'आपने किसान (Farmer) चुना है। इससे आप अपनी फसलें ऑनलाइन सीधे व्यापारियों को बेच सकेंगे।',
        romanText: 'Aapne Farmer chuna hai. Isse aap fasal seedhe vyapariyon ko bech sakenge.',
        key: 'role-select-farmer'
      });
      return;
    }

    if (text.includes('wholesaler') || text.includes('retailer') || text.includes('bulk / institutional')) {
      this.speak({
        hindiText: 'आपने खरीदार (Buyer) चुना है। यहाँ से आप सीधे किसानों से थोक माल खरीद सकेंगे।',
        romanText: 'Aapne Buyer chuna hai. Yahan se aap kisanon se seedhe fasal khareed sakenge.',
        key: 'role-select-buyer'
      });
      return;
    }

    // 22. Password field
    if (name === 'password' || type === 'password') {
      this.speak({
        hindiText: 'यहाँ अपना 6 या 8 अंकों का गुप्त पासवर्ड बनाएं जो आपको याद रहे।',
        romanText: 'Yahan apna surakshit password banayein.',
        key: 'field-password'
      });
      return;
    }

    // 23. Confirm Password field
    if (name === 'confirmpassword') {
      this.speak({
        hindiText: 'यहाँ वही पासवर्ड दोबारा डालें ताकि कोई गलती न रहे।',
        romanText: 'Yahan wahi password dobara dalein taaki galti na ho.',
        key: 'field-confirm-password'
      });
      return;
    }

    // 24. Chat / Deal button (Direct negotiation)
    if (
      text.includes('chat / deal') ||
      text.includes('deal') ||
      text.includes('negotiate') ||
      ariaLabel.includes('chat')
    ) {
      this.speak({
        hindiText: 'किसान और खरीदार की सीधी बातचीत शुरू हो गई है। यहाँ आप भाव पर मोलभाव करके अंतिम सौदा पक्का कर सकते हैं।',
        romanText: 'Kisan aur khareedaar ki seedhi baat shuru ho gayi hai. Yahan mol-bhav karke sauda pakka karein.',
        key: 'action-chat-deal'
      });
      return;
    }

    // 25. View Lot Details
    if (text.includes('view lot details') || text.includes('lot details')) {
      this.speak({
        hindiText: 'यहाँ फसल की पूरी परख, फोटो, नमी और किसान के गाँव की जानकारी देख सकते हैं।',
        romanText: 'Yahan fasal ki jaankari, photo, nami aur kisan ke gaon ki jaankari dekhein.',
        key: 'action-view-lot'
      });
      return;
    }

    // 26. Pay Online (Razorpay)
    if (text.includes('pay online') || text.includes('razorpay')) {
      this.speak({
        hindiText: 'यहाँ से रेजरपे द्वारा 100% सुरक्षित ऑनलाइन भुगतान कर सकते हैं।',
        romanText: 'Yahan se Razorpay dwara surakshit online payment kar sakte hain.',
        key: 'action-pay-online'
      });
      return;
    }

    // 27. Live Map Track
    if (text.includes('live map track') || text.includes('map track') || text.includes('gps map')) {
      this.speak({
        hindiText: 'लाइव जीपीएस मैप ट्रैकिंग खुल गई है। यहाँ आप अपनी फसल की गाड़ी को सड़क पर चलते हुए देख सकते हैं। कुल दूरी और पहुँचने का समय नीचे दिया गया है।',
        romanText: 'Live GPS Map tracking khul gayi hai. Yahan gaadi aur pahunchne ka samay dekh sakte hain.',
        key: 'action-live-map-track'
      });
      return;
    }

    // 28. Track Consignment
    if (text.includes('track consignment') || text.includes('tracking')) {
      this.speak({
        hindiText: 'यहाँ से देखें कि आपकी फसल की गाड़ी कहाँ तक पहुँची है और डिलीवरी का क्या स्टेटस है।',
        romanText: 'Yahan se dekhein ki aapki gaadi kahan tak pahunchi hai.',
        key: 'action-track-consignment'
      });
      return;
    }

    // 28. Sahayak Chat toggle
    if (text.includes('agrifair sahayak') || id.includes('agrifair-assistant-toggle')) {
      this.speak({
        hindiText: 'नमस्ते! मैं एग्रीफेयर एआई सहायक हूँ। आप मुझसे बोलकर या लिखकर मंडी भाव और फसलों के बारे में कुछ भी पूछ सकते हैं।',
        romanText: 'Namaste! Mai AgriFair AI Sahayak hoon. Mujhse mandi bhav ya fasal ke baare me pooch sakte hain.',
        key: 'action-open-sahayak'
      });
      return;
    }

    // 29. Marketplace Link
    if (text.includes('marketplace') || text.includes('view marketplace')) {
      this.speak({
        hindiText: 'यह एग्रीफेयर बाज़ार है। यहाँ देशभर की ताज़ा फसलें और किसानों की लिस्टिंग उपलब्ध हैं।',
        romanText: 'Yeh AgriFair marketplace hai, yahan taaza faslein uplabdh hain.',
        key: 'nav-marketplace'
      });
      return;
    }

    // 30. My Orders Link
    if (text.includes('my orders') || text.includes('orders')) {
      this.speak({
        hindiText: 'यहाँ आपके द्वारा किए गए सभी सौदे और ऑर्डर की सूची दिखेगी।',
        romanText: 'Yahan aapke sabhi orders aur saude dikhenge.',
        key: 'nav-orders'
      });
    }
  }
}

const voiceGuideService = new VoiceGuideService();
export default voiceGuideService;

