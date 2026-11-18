// AgriFair Kisan Bolta Sahayak - Voice Guide Service
// Saaf aur simple Hindi mein farmer ko har chiz samjhata hai.

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
    this.currentText = '';
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

    this.loadVoices();
    if (this.synth && this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = () => this.loadVoices();
    }

    // Mark user interaction (needed for autoplay policy)
    const markInteracted = () => {
      this.hasUserInteracted = true;
    };
    window.addEventListener('click', markInteracted, { once: true });
    window.addEventListener('keydown', markInteracted, { once: true });

    // Listen for focus on form fields
    document.addEventListener('focusin', (e) => {
      this.handleElement(e.target);
    }, true);

    // Listen for clicks on buttons, links, cards
    document.addEventListener('click', (e) => {
      const el = e.target.closest('button, a, [role="button"], select, label, [data-voice]');
      if (el) this.handleElement(el);
    }, true);

    // Custom event from anywhere in app
    window.addEventListener('agrifair:voice_speak', (e) => {
      if (e.detail) this.speak(e.detail);
    });
  }

  loadVoices() {
    if (!this.synth) return;
    this.voices = this.synth.getVoices() || [];
    // Best Hindi voice first, then Indian English, then any
    this.selectedVoice =
      this.voices.find((v) => v.lang === 'hi-IN') ||
      this.voices.find((v) => v.lang.startsWith('hi')) ||
      this.voices.find((v) => v.lang === 'en-IN') ||
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
    this.subscribers.forEach((cb) => { try { cb(state); } catch {} });
  }

  getState() {
    return {
      isSpeaking: this.isSpeaking,
      isMuted: this.isMuted,
      currentText: this.currentText,
      lastSpokenText: this.lastSpokenText,
      hasUserInteracted: this.hasUserInteracted,
    };
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrifair_voice_muted', this.isMuted ? 'true' : 'false');
    }
    if (this.isMuted) this.stop();
    this.notify();
    return !this.isMuted;
  }

  stop() {
    if (this.synth) this.synth.cancel();
    this.isSpeaking = false;
    this.notify();
  }

  replay() {
    if (!this.lastSpokenText) return;
    this.speak({ hindiText: this.lastSpokenText, key: this.lastSpokenKey, force: true });
  }

  // Clean text — remove characters that cause garbled speech
  cleanText(text) {
    return text
      .replace(/—/g, ' ')
      .replace(/–/g, ' ')
      .replace(/\(/g, ' ')
      .replace(/\)/g, ' ')
      .replace(/["""]/g, ' ')
      .replace(/\|/g, ' ')
      .replace(/\//g, ' ')
      .replace(/&/g, ' aur ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  speak({ hindiText, romanText = '', key = '', force = false }) {
    if (!hindiText) return;

    const now = Date.now();
    // Same key within 12 seconds — skip (ek baar hi bolega rule)
    if (!force && key && key === this.lastSpokenKey && now - this.lastSpokenTime < 12000) return;

    const cleaned = this.cleanText(hindiText);

    this.lastSpokenKey = key;
    this.lastSpokenTime = now;
    this.lastSpokenText = cleaned;
    this.currentText = cleaned;

    this.notify();

    if (this.isMuted || !this.synth) return;

    try {
      this.synth.cancel();

      const utterance = new SpeechSynthesisUtterance(cleaned);
      utterance.lang = 'hi-IN';
      utterance.rate = 0.85;   // Thoda slow — farmer clearly samjhe
      utterance.pitch = 1.05;  // Thoda upar — clear lagti hai
      utterance.volume = 1.0;

      if (this.selectedVoice) utterance.voice = this.selectedVoice;

      utterance.onstart = () => { this.isSpeaking = true; this.notify(); };
      utterance.onend = () => { this.isSpeaking = false; this.notify(); };
      utterance.onerror = () => { this.isSpeaking = false; this.notify(); };

      this.synth.speak(utterance);
    } catch {
      this.isSpeaking = false;
      this.notify();
    }
  }

  // ─── Main handler: figure out what was clicked/focused ───────────────────────
  handleElement(el) {
    if (!el || typeof el.getAttribute !== 'function') return;

    // data-voice attribute — highest priority
    const custom = el.getAttribute('data-voice');
    if (custom) {
      this.speak({ hindiText: custom, key: 'custom-' + custom.slice(0, 15) });
      return;
    }

    const tag = el.tagName.toLowerCase();
    const name = (el.name || el.getAttribute('name') || '').toLowerCase();
    const id = (el.id || '').toLowerCase();
    const ph = (el.placeholder || '').toLowerCase();
    const txt = (el.innerText || el.textContent || '').trim().toLowerCase().slice(0, 80);
    const type = (el.type || '').toLowerCase();
    const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();

    // ── FORM FIELDS ──────────────────────────────────────────────────────────

    // Fasal ka naam
    if (name === 'title' || name === 'cropname' || id.includes('crop') || ph.includes('sharbati') || ph.includes('crop name')) {
      this.speak({ hindiText: 'Yahan apni fasal ka naam likhein. Jaise gehun, chawal, chana ya makka.', key: 'f-crop' });
      return;
    }

    // PIN Code
    if (name === 'pincode' || ph.includes('pin') || ph.includes('226001') || id.includes('pin')) {
      this.speak({ hindiText: 'Yahan apne gaon ka 6 ank ka pin code dalein. Pin code dalne ke baad aapka rajya, jila aur gaon apne aap aa jayega.', key: 'f-pin' });
      return;
    }

    // Village
    if (name === 'village' || ph.includes('village') || ph.includes('khanna') || id.includes('village')) {
      this.speak({ hindiText: 'Yahan apne gaon ka naam chunein. Yeh pin code se apne aap aa jata hai.', key: 'f-village' });
      return;
    }

    // State
    if (name === 'state' || ph.includes('punjab') || ph.includes('state')) {
      this.speak({ hindiText: 'Yahan aapka rajya dikhega. Yeh pin code se apne aap bhar jata hai.', key: 'f-state' });
      return;
    }

    // District
    if (name === 'district' || ph.includes('ludhiana') || ph.includes('district')) {
      this.speak({ hindiText: 'Yahan aapka jila dikhega. Yeh pin code se apne aap bhar jata hai.', key: 'f-district' });
      return;
    }

    // Category
    if (name === 'category' || id.includes('category') || ph.includes('category')) {
      this.speak({ hindiText: 'Yahan fasal ki shreni chunein. Jaise Anaj, Daal, Phal ya Sabzi.', key: 'f-category' });
      return;
    }

    // Variety
    if (name === 'variety' || ph.includes('variety') || ph.includes('cultivar')) {
      this.speak({ hindiText: 'Yahan fasal ki variety ya kism likhein. Jaise 1121 Basmati ya Desi.', key: 'f-variety' });
      return;
    }

    // Quality Grade
    if (name === 'qualitygrade' || ph.includes('grade') || id.includes('grade')) {
      this.speak({ hindiText: 'Yahan fasal ki quality grade chunein. Jaise Grade A ya badhiya maal.', key: 'f-grade' });
      return;
    }

    // Price
    if (name === 'priceperunit' || name === 'price' || ph.includes('2800') || ph.includes('price')) {
      this.speak({ hindiText: 'Yahan apni fasal ka daam bharein. Matlab 1 quintal ka kitna rupaya lena chahte hain.', key: 'f-price' });
      return;
    }

    // Quantity
    if (name === 'totalquantity' || name === 'quantity' || ph.includes('100') || ph.includes('quantity')) {
      this.speak({ hindiText: 'Yahan likhein ki aapke paas kitne quintal ya kilo fasal bechne ke liye taiyar hai.', key: 'f-qty' });
      return;
    }

    // Trade Unit / Weight unit
    if (name === 'unit' || id.includes('unit')) {
      this.speak({ hindiText: 'Yahan wazan ki ikai chunein. Jaise Quintal jo 100 kilo hota hai, ya Kilogram.', key: 'f-unit' });
      return;
    }

    // Min Order Qty
    if (name === 'minorderqty' || ph.includes('min') || id.includes('minorder')) {
      this.speak({ hindiText: 'Yahan woh kam se kam matra likhein jo ek khareeddaar ko khareedni hogi.', key: 'f-minqty' });
      return;
    }

    // Description / Moisture
    if (name === 'description' || ph.includes('moisture') || ph.includes('specification')) {
      this.speak({ hindiText: 'Yahan fasal ki khas baatein likhein. Jaise nami ka percentage, katai ki taareekh ya packaging ka tarika.', key: 'f-desc' });
      return;
    }

    // Photo upload
    if (type === 'file' || txt.includes('harvest photo') || txt.includes('select product') || txt.includes('click to select')) {
      this.speak({ hindiText: 'Yahan click karke apni fasal ki taaza photo lagaein. Achhi photo hogi to khareedaar jaldi bharosa karega.', key: 'f-photo' });
      return;
    }

    // Listing Status
    if (name === 'status' || txt.includes('active') || txt.includes('visible in marketplace')) {
      this.speak({ hindiText: 'Yahan chunein ki aapki fasal listing abhi marketplace mein dikhni chahiye ya nahin.', key: 'f-status' });
      return;
    }

    // Name field (register)
    if ((name === 'name' || id === 'name') && (ph.includes('name') || ph.includes('ramesh'))) {
      this.speak({ hindiText: 'Yahan apna poora naam likhein.', key: 'f-regname' });
      return;
    }

    // Phone
    if (name === 'phone' || type === 'tel' || ph.includes('phone') || ph.includes('98765')) {
      this.speak({ hindiText: 'Yahan apna 10 ank ka mobile number dalein.', key: 'f-phone' });
      return;
    }

    // Email
    if (type === 'email' || name === 'email' || ph.includes('email') || ph.includes('gmail')) {
      this.speak({ hindiText: 'Yahan apna email pata dalein.', key: 'f-email' });
      return;
    }

    // Password
    if (name === 'password' || type === 'password' || id === 'password') {
      this.speak({ hindiText: 'Yahan apna gupt password banayein. Kam se kam 6 ank ka hona chahiye.', key: 'f-pass' });
      return;
    }

    // Confirm Password
    if (name === 'confirmpassword' || id.includes('confirm')) {
      this.speak({ hindiText: 'Yahan wahi password dobara dalein taaki koi galti na ho.', key: 'f-cpass' });
      return;
    }

    // Search fields
    if (type === 'search' || ph.includes('search') || ph.includes('lucknow') || ph.includes('apmc') || ph.includes('mandi')) {
      this.speak({ hindiText: 'Yahan apne sheher ya mandi ka naam likhein. Jaise Lucknow, Kanpur ya Gorakhpur.', key: 'f-search' });
      return;
    }

    // ── BUTTONS AND LINKS ────────────────────────────────────────────────────

    // Sell / Post Listing button
    if (txt.includes('post new produce') || txt.includes('post / manage') || txt.includes('sell produce') || txt.includes('fasal bechein') || txt.includes('new listing')) {
      this.speak({ hindiText: 'Yahan click karein apni fasal bechne ke liye. Hum aapko step by step batayenge kya bharna hai.', key: 'btn-sell' });
      return;
    }

    // Create Listing
    if (txt.includes('create listing') || txt.includes('post listing') || txt.includes('publish')) {
      this.speak({ hindiText: 'Bahut badhiya. Aapki fasal listing AgriFair market mein jud rahi hai. Khareedaar jald aapse sampark karenge.', key: 'btn-create' });
      return;
    }

    // Mandi Rates button
    if (txt.includes('mandi') || txt.includes('mandi rates') || txt.includes('mandi bhav') || ariaLabel.includes('mandi')) {
      this.speak({ hindiText: 'Mandi Bhav kendra khul raha hai. Upar search mein apne sheher ka naam likhein jaise Lucknow ya Khanna. Wahan ka aaj ka bhav dikhega.', key: 'btn-mandi' });
      return;
    }

    // Pay Online / Razorpay
    if (txt.includes('pay online') || txt.includes('razorpay') || txt.includes('pay now')) {
      this.speak({ hindiText: 'Razorpay se 100 pratishat surakshit online payment ho rahi hai. Apna UPI, card ya net banking chunein.', key: 'btn-pay' });
      return;
    }

    // Live Map Track
    if (txt.includes('live map') || txt.includes('map track') || txt.includes('gps map') || txt.includes('track map')) {
      this.speak({ hindiText: 'Live GPS Map tracking khul rahi hai. Yahan aap apni fasal ki gaadi ko sadak par chalte hue dekh sakte hain. Neeche kul doori aur pahunchne ka samay bhi dikhega.', key: 'btn-maptrack' });
      return;
    }

    // Track Consignment
    if (txt.includes('track consignment') || txt.includes('consignment')) {
      this.speak({ hindiText: 'Yahan se dekhein ki aapki fasal ki gaadi kahan tak pahunchi hai aur delivery ka kya status hai.', key: 'btn-track' });
      return;
    }

    // Chat / Deal
    if (txt.includes('chat') || txt.includes('deal') || txt.includes('negotiate') || ariaLabel.includes('chat')) {
      this.speak({ hindiText: 'Kisan aur khareedaar ki seedhi baat shuru ho rahi hai. Yahan aap daam par mol bhav karke antim sauda pakka kar sakte hain.', key: 'btn-chat' });
      return;
    }

    // View Lot / Details
    if (txt.includes('view lot') || txt.includes('lot details') || txt.includes('view details')) {
      this.speak({ hindiText: 'Yahan fasal ki poori jankari dikhegi. Jaise photo, nami ka percent, gaon ka naam aur kisan ka vivaran.', key: 'btn-lot' });
      return;
    }

    // Register button
    if (txt.includes('create an account') || txt.includes('register') || id.includes('register')) {
      this.speak({ hindiText: 'AgriFair mein aapka swagat hai. Naya khata banane ke liye neeche apni jankari bharein.', key: 'btn-register' });
      return;
    }

    // Login button
    if (txt.includes('login') || txt.includes('sign in') || id.includes('login')) {
      this.speak({ hindiText: 'Apna email ya mobile number aur password dalein aur login karein.', key: 'btn-login' });
      return;
    }

    // Farmer role selection
    if (txt.includes('farmer') || txt.includes('grower') || txt.includes('list crops')) {
      this.speak({ hindiText: 'Aapne Kisan chuna hai. Isse aap apni fasalein online seedhe khareeddaron ko bech sakenge.', key: 'role-farmer' });
      return;
    }

    // Buyer role selection
    if (txt.includes('wholesaler') || txt.includes('retailer') || txt.includes('buyer') || txt.includes('bulk')) {
      this.speak({ hindiText: 'Aapne Khareedaar chuna hai. Yahan se aap seedhe kisanon se taza maal khareed sakenge.', key: 'role-buyer' });
      return;
    }

    // Cancel Request
    if (txt.includes('cancel request') || txt.includes('cancel order')) {
      this.speak({ hindiText: 'Kya aap sach mein yeh order cancel karna chahte hain. Ek baar cancel ho gaya to wapas nahin hoga.', key: 'btn-cancel' });
      return;
    }

    // Accept / Confirm order
    if (txt.includes('accept') || txt.includes('confirm order')) {
      this.speak({ hindiText: 'Is order ko sweekar karne ke liye confirm karein. Khareedaar ko soochna bhej di jayegi.', key: 'btn-accept' });
      return;
    }

    // Agrifair Sahayak chat toggle
    if (txt.includes('agrifair sahayak') || id.includes('assistant')) {
      this.speak({ hindiText: 'Namaste. Main AgriFair AI Sahayak hoon. Aap mujhse mandi bhav ya fasal ke baare mein kuch bhi pooch sakte hain.', key: 'btn-sahayak' });
      return;
    }

    // Nav: Marketplace
    if (txt === 'marketplace' || txt.includes('view marketplace')) {
      this.speak({ hindiText: 'Yeh AgriFair ka baazaar hai. Yahan deshbhar ke kisanon ki taaza fasalein uplabdh hain.', key: 'nav-market' });
      return;
    }

    // Nav: My Orders
    if (txt.includes('my orders') || txt === 'orders') {
      this.speak({ hindiText: 'Yahan aapke sabhi orders aur saude ki suchi dikhegi.', key: 'nav-orders' });
      return;
    }

    // Nav: Categories
    if (txt === 'categories') {
      this.speak({ hindiText: 'Yahan aap fasal ki shreni ke anusaar dekh sakte hain jaise Anaj, Daal ya Phal.', key: 'nav-cat' });
      return;
    }
  }
}

const voiceGuideService = new VoiceGuideService();
export default voiceGuideService;
