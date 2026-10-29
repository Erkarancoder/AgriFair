import { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  DollarSign,
  Phone,
  PhoneCall,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ArrowLeft,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Package,
  Layers,
  Sparkles,
  Loader2,
  ExternalLink
} from 'lucide-react';
import Modal from '../../components/common/Modal';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../constants/routes';
import conversationService from '../../services/conversation.service';
import negotiationService from '../../services/negotiation.service';
import socketService from '../../services/socket.service';

export default function ConversationsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvIdFromUrl = searchParams.get('id');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [error, setError] = useState(null);

  // New message input
  const [inputText, setInputText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Counter-offer modal state
  const [counterTargetOffer, setCounterTargetOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [counterQuantity, setCounterQuantity] = useState('');
  const [counterMessage, setCounterMessage] = useState('');
  const [submittingCounter, setSubmittingCounter] = useState(false);
  const [counterError, setCounterError] = useState('');

  // Propose new offer modal state
  const [isNewOfferOpen, setIsNewOfferOpen] = useState(false);
  const [newOfferPrice, setNewOfferPrice] = useState('');
  const [newOfferQuantity, setNewOfferQuantity] = useState('');
  const [newOfferMessage, setNewOfferMessage] = useState('');
  const [submittingNewOffer, setSubmittingNewOffer] = useState(false);
  const [newOfferError, setNewOfferError] = useState('');

  // Action status state
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');

  // Auto-scroll ref
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Initial Load of all conversations
  useEffect(() => {
    let ignore = false;
    setLoadingConversations(true);

    conversationService
      .getConversations()
      .then((res) => {
        if (!ignore && res && res.data) {
          setConversations(res.data);

          // Select conversation from URL query or first conversation
          if (activeConvIdFromUrl) {
            const found = res.data.find((c) => String(c._id) === String(activeConvIdFromUrl));
            if (found) {
              setActiveConversation(found);
            } else if (res.data.length > 0) {
              setActiveConversation(res.data[0]);
            }
          } else if (res.data.length > 0) {
            setActiveConversation(res.data[0]);
          }
          setLoadingConversations(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load conversations');
          setLoadingConversations(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [activeConvIdFromUrl]);

  // 2. Load Messages when Active Conversation changes
  useEffect(() => {
    if (!activeConversation) return;

    let ignore = false;
    setLoadingMessages(true);

    // Join Socket.io room for active conversation
    socketService.joinConversation(activeConversation._id);

    conversationService
      .getMessages(activeConversation._id)
      .then((res) => {
        if (!ignore && res && res.data) {
          setMessages(res.data);
          setLoadingMessages(false);
          setTimeout(scrollToBottom, 100);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[ConversationsPage] Message fetch error:', err);
          setLoadingMessages(false);
        }
      });

    return () => {
      ignore = true;
      socketService.leaveConversation(activeConversation._id);
    };
  }, [activeConversation?._id]);

  // 3. Socket.IO Real-time listeners
  useEffect(() => {
    const handleNewMessage = (msg) => {
      if (activeConversation && String(msg.conversation) === String(activeConversation._id)) {
        setMessages((prev) => {
          // Prevent duplicates
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        });
        setTimeout(scrollToBottom, 100);
      }

      // Update conversation snippet in sidebar
      setConversations((prev) =>
        prev.map((c) => {
          if (String(c._id) === String(msg.conversation)) {
            return {
              ...c,
              lastMessage: msg.text || 'Offer / Update',
              lastMessageAt: msg.createdAt || new Date()
            };
          }
          return c;
        })
      );
    };

    const handleOfferUpdate = () => {
      // Reload active conversation messages to sync status
      if (activeConversation) {
        conversationService.getMessages(activeConversation._id).then((res) => {
          if (res?.data) {
            setMessages(res.data);
            setTimeout(scrollToBottom, 100);
          }
        });
      }
    };

    socketService.on('new_message', handleNewMessage);
    socketService.on('offer_created', handleOfferUpdate);
    socketService.on('offer_countered', handleOfferUpdate);
    socketService.on('offer_accepted', handleOfferUpdate);
    socketService.on('offer_rejected', handleOfferUpdate);

    return () => {
      socketService.off('new_message', handleNewMessage);
      socketService.off('offer_created', handleOfferUpdate);
      socketService.off('offer_countered', handleOfferUpdate);
      socketService.off('offer_accepted', handleOfferUpdate);
      socketService.off('offer_rejected', handleOfferUpdate);
    };
  }, [activeConversation]);

  // Handle Send Text Message
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeConversation || sendingMessage) return;

    const textToSend = inputText.trim();
    setInputText('');
    setSendingMessage(true);

    try {
      const res = await conversationService.sendMessage(activeConversation._id, {
        text: textToSend
      });

      if (res && res.data) {
        setMessages((prev) => {
          if (prev.some((m) => String(m._id) === String(res.data._id))) return prev;
          return [...prev, res.data];
        });
        setTimeout(scrollToBottom, 100);
      }
    } catch (err) {
      console.error('[ConversationsPage] Send message failed:', err);
      alert(err.message || 'Failed to send message.');
      setInputText(textToSend); // Restore unsent text
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle Safe Call Request
  const handleRequestCall = async () => {
    if (!activeConversation) return;
    try {
      setActionMessage('Dispatching call request...');
      await conversationService.requestCall(activeConversation._id);
      setActionMessage('Call request posted to conversation.');
      setTimeout(() => setActionMessage(''), 3000);
    } catch (err) {
      alert(err.message || 'Failed to dispatch call request.');
    }
  };

  // Handle Accept Offer
  const handleAcceptOffer = async (offerId) => {
    try {
      setActionLoadingId(offerId);
      const res = await negotiationService.acceptOffer(offerId);
      if (res && res.success) {
        setActionMessage(`Offer accepted! Order #${res.data?.order?._id?.slice(-6).toUpperCase()} created.`);
        // Reload messages
        const msgRes = await conversationService.getMessages(activeConversation._id);
        if (msgRes?.data) setMessages(msgRes.data);
      }
    } catch (err) {
      alert(err.message || 'Failed to accept offer. Stock might have changed.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject Offer
  const handleRejectOffer = async (offerId) => {
    if (!window.confirm('Are you sure you want to decline this price offer?')) return;
    try {
      setActionLoadingId(offerId);
      await negotiationService.rejectOffer(offerId, 'Offer terms declined');
      const msgRes = await conversationService.getMessages(activeConversation._id);
      if (msgRes?.data) setMessages(msgRes.data);
    } catch (err) {
      alert(err.message || 'Failed to reject offer.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Counter Offer Modal Open
  const handleOpenCounter = (offer) => {
    setCounterTargetOffer(offer);
    setCounterPrice(String(offer.price));
    setCounterQuantity(String(offer.quantity));
    setCounterMessage('');
    setCounterError('');
  };

  // Submit Counter Offer
  const handleSubmitCounter = async (e) => {
    e.preventDefault();
    if (!counterTargetOffer) return;

    const numPrice = Number(counterPrice);
    const numQty = Number(counterQuantity);

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numQty) || numQty <= 0) {
      setCounterError('Valid positive price and quantity are required.');
      return;
    }

    try {
      setSubmittingCounter(true);
      await negotiationService.counterOffer(counterTargetOffer._id, {
        price: numPrice,
        quantity: numQty,
        unit: counterTargetOffer.unit,
        message: counterMessage.trim()
      });

      setCounterTargetOffer(null);
      const msgRes = await conversationService.getMessages(activeConversation._id);
      if (msgRes?.data) setMessages(msgRes.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setCounterError(err.message || 'Failed to submit counter-offer.');
    } finally {
      setSubmittingCounter(false);
    }
  };

  // Handle Propose New Offer Modal Submit
  const handleOpenNewOffer = () => {
    const prod = activeConversation?.product;
    setNewOfferPrice(prod?.price ? String(prod.price) : '');
    setNewOfferQuantity(prod?.minOrderQuantity ? String(prod.minOrderQuantity) : '1');
    setNewOfferMessage('');
    setNewOfferError('');
    setIsNewOfferOpen(true);
  };

  const handleSubmitNewOffer = async (e) => {
    e.preventDefault();
    const numPrice = Number(newOfferPrice);
    const numQty = Number(newOfferQuantity);

    if (isNaN(numPrice) || numPrice <= 0 || isNaN(numQty) || numQty <= 0) {
      setNewOfferError('Valid positive price and quantity are required.');
      return;
    }

    try {
      setSubmittingNewOffer(true);
      await negotiationService.createOffer({
        conversationId: activeConversation._id,
        price: numPrice,
        quantity: numQty,
        unit: activeConversation.product?.unit || 'quintal',
        message: newOfferMessage.trim()
      });

      setIsNewOfferOpen(false);
      const msgRes = await conversationService.getMessages(activeConversation._id);
      if (msgRes?.data) setMessages(msgRes.data);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      setNewOfferError(err.message || 'Failed to propose offer.');
    } finally {
      setSubmittingNewOffer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Banner Status */}
      {actionMessage && (
        <div className="mb-3 p-3 rounded-2xl bg-emerald-600 text-white text-xs font-semibold flex items-center justify-between shadow-sm animate-fade-in">
          <span>{actionMessage}</span>
          <button type="button" onClick={() => setActionMessage('')} className="text-white hover:opacity-80">
            &times;
          </button>
        </div>
      )}

      <div className="flex-1 bg-white rounded-3xl border border-stone-200/90 shadow-sm overflow-hidden flex flex-col md:flex-row">
        {/* Left Sidebar: Conversations Directory */}
        <div className="w-full md:w-80 lg:w-96 border-r border-stone-200 flex flex-col bg-[#faf9f5]">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-white">
            <div>
              <h2 className="text-base font-extrabold text-stone-900">Conversations</h2>
              <p className="text-xs text-stone-500">Live chat & price bargaining</p>
            </div>
            <Link
              to={ROUTES.MARKETPLACE}
              className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>Market</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-stone-100">
            {loadingConversations ? (
              <div className="p-8 text-center text-stone-400 text-xs">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                <span>Loading trade conversations...</span>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-stone-500 text-xs space-y-3">
                <MessageSquare className="w-10 h-10 text-stone-300 mx-auto" />
                <p>No active conversations yet.</p>
                <Link
                  to={ROUTES.MARKETPLACE}
                  className="inline-flex px-4 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold"
                >
                  Explore Produce Listings
                </Link>
              </div>
            ) : (
              conversations.map((conv) => {
                const isSelected = activeConversation?._id === conv._id;
                const isBuyer = String(conv.buyer?._id) === String(user?._id);
                const otherParty = isBuyer ? conv.farmer : conv.buyer;
                const unreadCount = isBuyer ? conv.unreadBuyer : conv.unreadFarmer;
                const thumbnail = conv.product?.images?.[0];

                return (
                  <button
                    key={conv._id}
                    type="button"
                    onClick={() => {
                      setActiveConversation(conv);
                      setSearchParams({ id: conv._id });
                    }}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isSelected ? 'bg-emerald-50/80 border-l-4 border-emerald-700' : 'hover:bg-stone-50'
                    }`}
                  >
                    {/* Produce Thumbnail */}
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-200">
                      {thumbnail ? (
                        <img src={thumbnail} alt={conv.product?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-emerald-800 text-white text-xs font-bold">
                          {conv.product?.name?.slice(0, 2).toUpperCase() || 'AG'}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-xs font-bold text-stone-900 truncate">
                          {otherParty?.name || 'AgriFair Participant'}
                        </span>
                        <span className="text-[10px] text-stone-600">
                          {conv.lastMessageAt ? new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-emerald-950 truncate mb-1">
                        {conv.product?.name || 'Produce Lot'}
                      </p>

                      <p className="text-[11px] text-stone-600 truncate">
                        {conv.lastMessage || 'Conversation started'}
                      </p>
                    </div>

                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-[10px] font-bold">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Main Pane: Chat Transcript & Bargaining Feed */}
        <div className="flex-1 flex flex-col bg-white overflow-hidden">
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/60">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-900 font-bold flex items-center justify-center text-sm shrink-0">
                    {(String(activeConversation.buyer?._id) === String(user?._id)
                      ? activeConversation.farmer?.name
                      : activeConversation.buyer?.name)?.slice(0, 2).toUpperCase()}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-stone-900 truncate">
                        {String(activeConversation.buyer?._id) === String(user?._id)
                          ? activeConversation.farmer?.name
                          : activeConversation.buyer?.name}
                      </h3>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold uppercase bg-stone-200 text-stone-700">
                        {String(activeConversation.buyer?._id) === String(user?._id) ? 'Producer' : 'Buyer'}
                      </span>
                    </div>
                    <Link
                      to={`/marketplace/${activeConversation.product?._id}`}
                      className="text-xs text-emerald-800 hover:underline flex items-center gap-1 font-medium truncate"
                    >
                      <span>Lot: {activeConversation.product?.name}</span>
                      <span>(₹{activeConversation.product?.price}/{activeConversation.product?.unit})</span>
                      <ExternalLink className="w-3 h-3 inline shrink-0" />
                    </Link>
                  </div>
                </div>

                {/* Safe Contact & Bargaining Trigger Header Actions */}
                <div className="flex items-center gap-2">
                  {/* Phone direct call if allowed */}
                  {activeConversation.farmer?.allowDirectCalls && activeConversation.farmer?.phone ? (
                    <a
                      href={`tel:${activeConversation.farmer.phone}`}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200 text-xs font-bold inline-flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-700" />
                      <span className="hidden sm:inline">Call</span>
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={handleRequestCall}
                      className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-stone-600" />
                      <span className="hidden sm:inline">Request Call</span>
                    </button>
                  )}

                  {/* Make an Offer Button */}
                  <button
                    type="button"
                    onClick={handleOpenNewOffer}
                    className="px-3 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <DollarSign className="w-3.5 h-3.5" />
                    <span>Propose Offer</span>
                  </button>
                </div>
              </div>

              {/* Message Transcript Area */}
              <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-stone-50/30">
                {loadingMessages ? (
                  <div className="py-12 text-center text-xs text-stone-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>Loading message history...</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="py-12 text-center text-stone-400 text-xs">
                    <Sparkles className="w-8 h-8 mx-auto mb-2 text-emerald-700 opacity-60" />
                    <p className="font-semibold text-stone-700">Private Negotiation Started</p>
                    <p className="text-stone-500 mt-1">Send a message or propose a price counter-offer below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = String(msg.sender?._id || msg.sender) === String(user?._id);

                    // 1. CALL REQUEST CARD
                    if (msg.type === 'call_request') {
                      return (
                        <div key={msg._id} className="max-w-md mx-auto my-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/90 text-xs text-amber-950 flex items-center justify-between shadow-xs">
                          <div className="flex items-center gap-2.5">
                            <PhoneCall className="w-5 h-5 text-amber-700 shrink-0" />
                            <div>
                              <span className="font-bold block">{isMe ? 'You requested a phone call' : `${msg.sender?.name || 'Buyer'} requested a phone call`}</span>
                              <span className="text-[10px] text-amber-800">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                          {isMe ? (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800">Sent</span>
                          ) : (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-200 text-amber-900">Incoming</span>
                          )}
                        </div>
                      );
                    }

                    // 2. NEGOTIATION OFFER CARD
                    if (msg.type === 'offer' && msg.offer) {
                      const offer = msg.offer;
                      const isOfferByMe = String(offer.proposedBy?._id || offer.proposedBy || offer.proposer) === String(user?._id);
                      const isPending = offer.status === 'pending';
                      const isAccepted = offer.status === 'accepted' || offer.status === 'ordered';
                      const isRejected = offer.status === 'rejected';
                      const isCountered = offer.status === 'countered';

                      return (
                        <div
                          key={msg._id}
                          className={`max-w-lg mx-auto my-4 p-5 rounded-3xl border shadow-sm transition-all ${
                            isAccepted
                              ? 'bg-emerald-50/90 border-emerald-300 ring-2 ring-emerald-500/20'
                              : isRejected
                              ? 'bg-stone-50 border-stone-300 opacity-80'
                              : 'bg-white border-stone-200'
                          }`}
                        >
                          {/* Offer Header */}
                          <div className="flex items-center justify-between pb-3 mb-3 border-b border-stone-200/80">
                            <div className="flex items-center gap-2">
                              <DollarSign className={`w-5 h-5 ${isAccepted ? 'text-emerald-700' : 'text-stone-700'}`} />
                              <span className="text-xs font-bold uppercase tracking-wider text-stone-800">
                                {isOfferByMe ? 'Your Price Proposal' : `${msg.sender?.name || 'Trader'}'s Proposal`}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider ${
                                isAccepted
                                  ? 'bg-emerald-200 text-emerald-900'
                                  : isRejected
                                  ? 'bg-red-100 text-red-800'
                                  : isCountered
                                  ? 'bg-stone-200 text-stone-700'
                                  : 'bg-amber-100 text-amber-900 animate-pulse'
                              }`}
                            >
                              {isAccepted ? 'accepted' : offer.status}
                            </span>
                          </div>

                          {/* Terms Grid */}
                          <div className="grid grid-cols-3 gap-2 text-xs mb-3 text-center">
                            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                              <span className="text-stone-600 block text-[10px] font-semibold">Offered Rate</span>
                              <span className="font-extrabold text-stone-900 text-sm">
                                ₹{offer.price} / {offer.unit}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                              <span className="text-stone-600 block text-[10px] font-semibold">Quantity</span>
                              <span className="font-extrabold text-stone-900 text-sm">
                                {offer.quantity} {offer.unit}
                              </span>
                            </div>
                            <div className="p-2.5 rounded-2xl bg-stone-50 border border-stone-200">
                              <span className="text-stone-600 block text-[10px] font-semibold">Total Amount</span>
                              <span className="font-extrabold text-emerald-800 text-sm">
                                ₹{(offer.totalAmount || offer.price * offer.quantity).toLocaleString('en-IN')}
                              </span>
                            </div>
                          </div>

                          {offer.message && (
                            <p className="text-xs text-stone-600 italic mb-3 bg-stone-50/70 p-2.5 rounded-xl border border-stone-200/60">
                              "{offer.message}"
                            </p>
                          )}

                          {/* Accepted Agreement Notice */}
                          {isAccepted && (
                            <div className="p-3 rounded-2xl bg-emerald-100/90 border border-emerald-300 text-xs text-emerald-950 flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                                <span className="font-bold">Negotiation Agreed & Bound to Order</span>
                              </div>
                              <Link
                                to={user?.role === 'farmer' ? ROUTES.FARMER_ORDERS : ROUTES.BUYER_ORDERS}
                                className="font-bold text-emerald-900 underline hover:text-emerald-950 flex items-center gap-1"
                              >
                                <span>Track Order</span>
                                <ExternalLink className="w-3 h-3" />
                              </Link>
                            </div>
                          )}

                          {/* Action Buttons for Recipient when Pending */}
                          {!isOfferByMe && isPending && (
                            <div className="pt-2 flex items-center justify-end gap-2">
                              <button
                                type="button"
                                disabled={actionLoadingId === offer._id}
                                onClick={() => handleRejectOffer(offer._id)}
                                className="px-3.5 py-1.5 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors"
                              >
                                Decline
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === offer._id}
                                onClick={() => handleOpenCounter(offer)}
                                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-1"
                              >
                                <span>Counter-Offer</span>
                              </button>

                              <button
                                type="button"
                                disabled={actionLoadingId === offer._id}
                                onClick={() => handleAcceptOffer(offer._id)}
                                className="px-4 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                              >
                                {actionLoadingId === offer._id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Accept & Confirm Order</span>
                              </button>
                            </div>
                          )}

                          <div className="text-[10px] text-stone-600 text-right mt-2">
                            {new Date(offer.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      );
                    }

                    // 3. REGULAR TEXT MESSAGE
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[78%] sm:max-w-md px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                            isMe
                              ? 'bg-[#164e3b] text-white rounded-br-xs shadow-xs'
                              : 'bg-white text-stone-900 border border-stone-200/90 rounded-bl-xs shadow-xs'
                          }`}
                        >
                          {!isMe && (
                            <span className="block text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                              {msg.sender?.name || 'Trader'}
                            </span>
                          )}
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <span
                            className={`block text-[10px] text-right mt-1 ${
                              isMe ? 'text-emerald-200' : 'text-stone-600'
                            }`}
                          >
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Composer Footer */}
              <div className="p-3 sm:p-4 border-t border-stone-200 bg-white">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenNewOffer}
                    title="Submit Price Offer / Counter"
                    className="p-2.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 transition-colors shrink-0"
                  >
                    <DollarSign className="w-4 h-4 text-emerald-700" />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message or discuss terms..."
                    className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim() || sendingMessage}
                    className="px-4 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold inline-flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50 shrink-0"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-stone-400 text-xs">
              <MessageSquare className="w-12 h-12 text-stone-300 mb-3" />
              <h3 className="text-base font-bold text-stone-700 mb-1">Select a Conversation</h3>
              <p className="max-w-xs text-stone-500">
                Choose a trade thread from the left or visit the Marketplace to start chatting with a producer.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Counter-Offer Modal */}
      {counterTargetOffer && (
        <Modal
          isOpen={Boolean(counterTargetOffer)}
          onClose={() => setCounterTargetOffer(null)}
          title="Submit Counter-Offer"
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitCounter} className="space-y-4">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              Countering previous proposal of ₹{counterTargetOffer.price} / {counterTargetOffer.unit} for {counterTargetOffer.quantity} {counterTargetOffer.unit}.
            </div>

            {counterError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {counterError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Counter Rate (₹ / {counterTargetOffer.unit}) *
                </label>
                <input
                  type="number"
                  value={counterPrice}
                  onChange={(e) => setCounterPrice(e.target.value)}
                  min="0.01"
                  step="any"
                  required
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Quantity ({counterTargetOffer.unit}) *
                </label>
                <input
                  type="number"
                  value={counterQuantity}
                  onChange={(e) => setCounterQuantity(e.target.value)}
                  min="1"
                  step="any"
                  required
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {counterPrice && counterQuantity && (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-semibold">New Proposed Total:</span>
                <span className="font-extrabold text-stone-900 text-sm">
                  ₹{(Number(counterPrice) * Number(counterQuantity)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Note on terms / conditions
              </label>
              <textarea
                value={counterMessage}
                onChange={(e) => setCounterMessage(e.target.value)}
                rows={2}
                placeholder="Reason for rate revision or transport arrangement..."
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setCounterTargetOffer(null)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingCounter}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                {submittingCounter ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                <span>Send Counter-Offer</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Propose New Offer Modal */}
      {isNewOfferOpen && (
        <Modal
          isOpen={isNewOfferOpen}
          onClose={() => setIsNewOfferOpen(false)}
          title={`Propose Price: ${activeConversation?.product?.name}`}
          maxWidth="max-w-md"
        >
          <form onSubmit={handleSubmitNewOffer} className="space-y-4">
            {newOfferError && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {newOfferError}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Proposed Rate (₹) *
                </label>
                <input
                  type="number"
                  value={newOfferPrice}
                  onChange={(e) => setNewOfferPrice(e.target.value)}
                  min="0.01"
                  step="any"
                  required
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Quantity ({activeConversation?.product?.unit || 'quintal'}) *
                </label>
                <input
                  type="number"
                  value={newOfferQuantity}
                  onChange={(e) => setNewOfferQuantity(e.target.value)}
                  min="1"
                  step="any"
                  required
                  className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {newOfferPrice && newOfferQuantity && (
              <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-between text-xs">
                <span className="text-stone-500 font-semibold">Total Amount:</span>
                <span className="font-extrabold text-stone-900 text-sm">
                  ₹{(Number(newOfferPrice) * Number(newOfferQuantity)).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Optional Message
              </label>
              <textarea
                value={newOfferMessage}
                onChange={(e) => setNewOfferMessage(e.target.value)}
                rows={2}
                placeholder="Message regarding pickup, quality or timeline..."
                className="w-full px-3 py-2 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewOfferOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submittingNewOffer}
                className="px-5 py-2 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold inline-flex items-center gap-1.5"
              >
                {submittingNewOffer ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <DollarSign className="w-3.5 h-3.5" />}
                <span>Submit Proposal</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
