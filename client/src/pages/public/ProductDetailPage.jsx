import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  Phone,
  PhoneCall,
  MessageSquare,
  DollarSign,
  PackageCheck,
  AlertCircle,
  Calendar,
  Layers,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Send,
  Loader2,
  CheckCircle2,
  ShoppingCart
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Modal from '../../components/common/Modal';
import OrderRequestModal from '../../components/orders/OrderRequestModal';
import { ROUTES } from '../../constants/routes';
import { BUYER_ROLES } from '../../constants/roles';
import { useAuth } from '../../context/AuthContext';
import catalogService from '../../services/catalog.service';
import conversationService from '../../services/conversation.service';
import negotiationService from '../../services/negotiation.service';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Offer Modal State
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerQuantity, setOfferQuantity] = useState('');
  const [offerUnit, setOfferUnit] = useState('quintal');
  const [offerMessage, setOfferMessage] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState('');
  const [offerSuccess, setOfferSuccess] = useState('');

  // Purchase Order Request Modal (standard direct order)
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Call Request State
  const [callingState, setCallingState] = useState({ loading: false, sent: false, error: '' });

  // Starting conversation state
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    let ignore = false;
    setLoading(true);
    setError(null);

    catalogService
      .getProductById(id)
      .then((res) => {
        if (!ignore && res && res.data) {
          setProduct(res.data);
          setOfferPrice(String(res.data.price || ''));
          setOfferQuantity(String(res.data.minOrderQuantity || 1));
          setOfferUnit(res.data.unit || 'quintal');
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Unable to retrieve listing details from AgriFair server.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [id]);

  // Handle Start Chat
  const handleStartChat = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setStartingChat(true);
      const res = await conversationService.getOrCreateConversation(product._id);
      if (res && res.data) {
        navigate(`/conversations?id=${res.data._id}`);
      }
    } catch (err) {
      console.error('[ProductDetail] Chat init failed:', err);
      alert(err.message || 'Unable to initialize conversation thread with the producer.');
    } finally {
      setStartingChat(false);
    }
  };

  // Handle Safe Call Request
  const handleRequestCall = async () => {
    if (!user) {
      navigate(ROUTES.LOGIN);
      return;
    }

    try {
      setCallingState({ loading: true, sent: false, error: '' });
      const convRes = await conversationService.getOrCreateConversation(product._id);
      if (convRes && convRes.data) {
        await conversationService.requestCall(convRes.data._id);
        setCallingState({ loading: false, sent: true, error: '' });
      }
    } catch (err) {
      setCallingState({
        loading: false,
        sent: false,
        error: err.message || 'Failed to dispatch call request to producer.'
      });
    }
  };

  // Handle Offer Submission
  const handleSendOffer = async (e) => {
    e.preventDefault();
    setOfferError('');
    setOfferSuccess('');

    const numPrice = Number(offerPrice);
    const numQty = Number(offerQuantity);

    if (isNaN(numPrice) || numPrice <= 0) {
      setOfferError('Offer price must be greater than zero.');
      return;
    }

    if (isNaN(numQty) || numQty <= 0) {
      setOfferError('Offer quantity must be greater than zero.');
      return;
    }

    if (numQty > (product.quantity || 0)) {
      setOfferError(`Quantity exceeds current available stock (${product.quantity} ${product.unit}).`);
      return;
    }

    if (product.minOrderQuantity && numQty < product.minOrderQuantity) {
      setOfferError(`Quantity must meet the minimum order quantity (${product.minOrderQuantity} ${product.unit}).`);
      return;
    }

    try {
      setOfferSubmitting(true);
      // 1. Get or create conversation thread
      const convRes = await conversationService.getOrCreateConversation(product._id);
      const conversationId = convRes.data._id;

      // 2. Post negotiation offer
      await negotiationService.createOffer({
        conversationId,
        price: numPrice,
        quantity: numQty,
        unit: offerUnit,
        message: offerMessage.trim()
      });

      setOfferSuccess('Price proposal submitted successfully! Redirecting to chat negotiation...');
      setTimeout(() => {
        setIsOfferModalOpen(false);
        navigate(`/conversations?id=${conversationId}`);
      }, 1200);
    } catch (err) {
      setOfferError(err.message || 'Failed to submit offer to producer.');
      setOfferSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-4 bg-stone-200 rounded w-48 mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="h-96 bg-stone-200 rounded-3xl" />
          <div className="space-y-4">
            <div className="h-8 bg-stone-200 rounded w-3/4" />
            <div className="h-6 bg-stone-200 rounded w-1/3" />
            <div className="h-24 bg-stone-100 rounded-2xl" />
            <div className="h-12 bg-stone-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="p-8 rounded-3xl bg-red-50 border border-red-200">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Listing Unavailable</h2>
          <p className="text-sm text-red-700 mb-6">{error || 'This agricultural lot could not be found or has been removed.'}</p>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-semibold hover:bg-stone-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Marketplace</span>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = user && product.owner && String(product.owner._id) === String(user._id);
  const isAvailable = product.status === 'active' && (product.quantity || 0) > 0;
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];
  const locationText = [product.location?.mandi, product.location?.district, product.location?.state]
    .filter(Boolean)
    .join(', ') || 'Direct Farm Origin, India';

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Breadcrumb Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={ROUTES.MARKETPLACE}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-stone-600 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Marketplace</span>
        </Link>
        <span className="text-xs text-stone-500 font-medium">
          Listing #{product._id.slice(-6).toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Image Gallery & Lot Badges */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-3xl border border-stone-200/90 overflow-hidden shadow-sm relative">
            {images.length > 0 ? (
              <div className="h-80 sm:h-96 w-full bg-stone-100 flex items-center justify-center overflow-hidden">
                <img
                  src={images[activeImageIndex] || images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-all duration-300"
                />
              </div>
            ) : (
              <div className="h-80 sm:h-96 w-full bg-gradient-to-br from-emerald-900 to-[#123826] p-8 flex flex-col justify-between text-white">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold tracking-wider uppercase border border-emerald-400/30">
                    {product.category?.name || 'Farm Lot'}
                  </span>
                  <PackageCheck className="w-8 h-8 text-emerald-300 opacity-80" />
                </div>
                <div>
                  <h3 className="text-2xl font-black mb-1">{product.name}</h3>
                  <p className="text-xs text-emerald-200">Verified Mandi Produce</p>
                </div>
              </div>
            )}

            {/* Inactive or Sold Out Overlay */}
            {!isAvailable && (
              <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-6 text-center text-white">
                <div className="bg-white text-stone-900 p-5 rounded-2xl max-w-sm shadow-xl">
                  <AlertCircle className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <h4 className="font-extrabold text-base mb-1">Produce Currently Unavailable</h4>
                  <p className="text-xs text-stone-600">
                    {product.status !== 'active'
                      ? 'This listing is archived or paused by the producer.'
                      : 'Available stock is completely sold out.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Multiple Image Thumbnails */}
          {images.length > 1 && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx ? 'border-emerald-600 shadow-md ring-2 ring-emerald-600/30' : 'border-stone-200 opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={imgUrl} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Safe Provenance & Quality Notice */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-100/90 text-xs text-emerald-950 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-stone-900 block text-xs">Direct Farmer Traceability</span>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Listed directly by registered farmer in MongoDB Atlas. Prices are transparent with real-time bargaining and escrow-ready settlement.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Listing Specifications & Actions */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-xs font-semibold uppercase tracking-wider">
                {product.category?.name || 'Agriculture'}
              </span>
              {product.variety && (
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-900 text-xs font-semibold">
                  Variety: {product.variety}
                </span>
              )}
              {product.qualityGrade && (
                <span className="px-2.5 py-0.5 rounded-md bg-blue-100 text-blue-900 text-xs font-semibold">
                  Grade {product.qualityGrade}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight leading-tight mb-2">
              {product.name}
            </h1>

            <div className="flex items-center gap-2 text-xs text-stone-600">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0" />
              <span className="font-medium">{locationText}</span>
            </div>
          </div>

          {/* Pricing & Stock Card */}
          <div className="p-5 rounded-3xl bg-[#faf9f5] border border-stone-200/90 shadow-xs">
            <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-stone-200/60">
              <div>
                <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">Listing Price</span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-3xl font-black text-stone-900">
                    ₹{product.price?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-sm font-semibold text-stone-600">
                    / {product.unit || 'quintal'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-semibold text-stone-500 block uppercase tracking-wider">Available Stock</span>
                <span className="text-xl font-extrabold text-emerald-900 block mt-0.5">
                  {product.quantity} {product.unit || 'quintal'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-2xl bg-white border border-stone-200/80">
                <span className="text-stone-500 block mb-0.5">Min. Order Qty</span>
                <span className="font-bold text-stone-900 text-sm">
                  {product.minOrderQuantity || 1} {product.unit || 'quintal'}
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-white border border-stone-200/80">
                <span className="text-stone-500 block mb-0.5">Trade Terms</span>
                <span className="font-bold text-stone-900 text-sm">
                  Negotiable & Direct
                </span>
              </div>
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider">Lot Description</h3>
              <p className="text-sm text-stone-600 leading-relaxed whitespace-pre-line bg-white p-4 rounded-2xl border border-stone-200/80">
                {product.description}
              </p>
            </div>
          )}

          {/* Producer Information Card (Safe Contact Control) */}
          <div className="p-5 rounded-3xl bg-white border border-stone-200/90 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">Producer Profile</span>
                <h4 className="text-base font-bold text-stone-900">{product.owner?.name || 'Registered Producer'}</h4>
                <p className="text-xs text-stone-500 capitalize">{product.owner?.role || 'Farmer'}</p>
              </div>

              {/* Safe Contact Option: Only display tel: if consent given */}
              {product.owner?.phone ? (
                <a
                  href={`tel:${product.owner.phone}`}
                  className="px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Call {product.owner.phone}</span>
                </a>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestCall}
                  disabled={callingState.loading || callingState.sent || isOwner}
                  className="px-3.5 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {callingState.loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : callingState.sent ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <PhoneCall className="w-3.5 h-3.5 text-stone-600" />
                  )}
                  <span>{callingState.sent ? 'Call Requested' : 'Request Call'}</span>
                </button>
              )}
            </div>

            {callingState.sent && (
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-800 font-medium">
                Call request dispatched to the producer inside your private conversation thread.
              </div>
            )}
            {callingState.error && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-[11px] text-red-700">
                {callingState.error}
              </div>
            )}
          </div>

          {/* Interactive Trading & Negotiation Actions */}
          <div className="space-y-3 pt-2">
            {isOwner ? (
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium text-center">
                This is your active produce listing. You can manage or update stock from your{' '}
                <Link to={ROUTES.FARMER_LISTINGS} className="font-bold underline hover:text-amber-950">
                  Farmer Dashboard
                </Link>.
              </div>
            ) : BUYER_ROLES.includes(user?.role) ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Real-time Bargaining / Offer Trigger */}
                  <button
                    type="button"
                    onClick={() => setIsOfferModalOpen(true)}
                    disabled={!isAvailable}
                    className="w-full py-3.5 px-4 rounded-2xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-300" />
                    <span>Make Price Offer</span>
                  </button>

                  {/* Real-Time Chat Trigger */}
                  <button
                    type="button"
                    onClick={handleStartChat}
                    disabled={startingChat}
                    className="w-full py-3.5 px-4 rounded-2xl bg-[#164e3b] hover:bg-[#123826] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    {startingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4 text-emerald-300" />
                    )}
                    <span>Chat & Bargain</span>
                  </button>
                </div>

                {/* Instant Order at Listing Price */}
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(true)}
                  disabled={!isAvailable}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-stone-300 hover:border-stone-900 text-stone-800 hover:text-stone-900 font-bold text-xs inline-flex items-center justify-center gap-2 transition-all bg-white disabled:opacity-40"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Direct Purchase Order (At Listed ₹{product.price?.toLocaleString('en-IN')})</span>
                </button>
              </div>
            ) : user?.role === 'farmer' ? (
              <div className="p-4 rounded-2xl bg-stone-100 text-stone-700 text-xs text-center font-medium">
                You are signed in as a Producer account. Buying and bargaining is available to registered Buyers and Traders.
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-stone-100 text-center space-y-2">
                <p className="text-xs text-stone-600">Sign in to start negotiations, make price offers, or purchase lot.</p>
                <Link
                  to={ROUTES.LOGIN}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-stone-900 text-white text-xs font-bold hover:bg-stone-800 transition-colors"
                >
                  <span>Sign In as Buyer / Trader</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Offer Negotiation Proposal Modal */}
      {isOfferModalOpen && (
        <Modal
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          title={`Propose Offer: ${product.name}`}
          maxWidth="max-w-lg"
        >
          <form onSubmit={handleSendOffer} className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-700" />
                <span>Real-Time Mandi Price Bargaining</span>
              </div>
              <p className="text-[11px] leading-relaxed text-stone-600">
                Submit your counter-offer terms directly to the producer. If accepted, an escrow-protected order agreement will be generated automatically.
              </p>
            </div>

            {offerError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {offerError}
              </div>
            )}
            {offerSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
                {offerSuccess}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Offer Price (₹ / {product.unit}) *
                </label>
                <input
                  type="number"
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  min="0.01"
                  step="any"
                  required
                  placeholder={String(product.price)}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Quantity ({product.unit}) *
                </label>
                <input
                  type="number"
                  value={offerQuantity}
                  onChange={(e) => setOfferQuantity(e.target.value)}
                  min={product.minOrderQuantity || 1}
                  max={product.quantity || 1}
                  step="any"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Total Calculation Preview */}
            {offerPrice && offerQuantity && (
              <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-semibold">Estimated Proposed Total:</span>
                <span className="font-extrabold text-stone-900 text-base">
                  ₹{(Number(offerPrice) * Number(offerQuantity)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Optional Note / Delivery Term
              </label>
              <textarea
                value={offerMessage}
                onChange={(e) => setOfferMessage(e.target.value)}
                rows={2}
                placeholder="e.g. Can take delivery this Friday at your local mandi yard..."
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsOfferModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={offerSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {offerSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>Submit Price Proposal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Direct Order Request Modal */}
      {isOrderModalOpen && (
        <OrderRequestModal
          product={product}
          isOpen={isOrderModalOpen}
          onClose={() => setIsOrderModalOpen(false)}
          onSuccess={() => {
            setIsOrderModalOpen(false);
            navigate(ROUTES.BUYER_ORDERS);
          }}
        />
      )}
    </div>
  );
}
