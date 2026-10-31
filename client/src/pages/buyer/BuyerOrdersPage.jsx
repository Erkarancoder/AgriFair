import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingBag,
  RefreshCw,
  Clock,
  CheckCircle2,
  PackageCheck,
  Truck,
  Navigation,
  CheckCheck,
  XCircle,
  Ban,
  Calendar,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Store
} from 'lucide-react';
import orderService from '../../services/order.service';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import OrderTrackingTimeline from '../../components/orders/OrderTrackingTimeline';
import LiveMapTrackingModal from '../../components/orders/LiveMapTrackingModal';
import RazorpayPaymentButton from '../../components/orders/RazorpayPaymentButton';
import { STATUS_CONFIG } from '../../constants/orderStatuses';
import { ROUTES } from '../../constants/routes';


export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmingDeliveryId, setConfirmingDeliveryId] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [liveMapOrder, setLiveMapOrder] = useState(null);

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    orderService
      .getMyOrders({
        role: 'buyer',
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page: currentPage,
        limit: 12
      })
      .then((res) => {
        if (!ignore) {
          setOrders(res.data || []);
          setTotalPages(res.totalPages || 1);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          setError(err.message || 'Failed to load your purchase requests.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, currentPage, refreshIndex]);

  const handleConfirmDelivery = async (orderId) => {
    if (!window.confirm('Confirm that you have received this consignment in good order?')) {
      return;
    }

    try {
      setConfirmingDeliveryId(orderId);
      setActionError(null);
      await orderService.updateOrderStatus(orderId, {
        status: 'delivered',
        note: 'Consignment delivery confirmed received by buyer'
      });
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || 'Failed to confirm delivery.');
    } finally {
      setConfirmingDeliveryId(null);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this pending order request?')) {
      return;
    }

    try {
      setCancellingId(orderId);
      setActionError(null);
      await orderService.updateOrderStatus(orderId, {
        status: 'cancelled',
        note: 'Order request cancelled by buyer'
      });
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel order request.');
    } finally {
      setCancellingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const config = STATUS_CONFIG[status] || {
      label: status,
      badgeClass: 'bg-stone-100 text-stone-700 border-stone-200'
    };

    const getIcon = () => {
      switch (status) {
        case 'pending': return <Clock className="w-3.5 h-3.5" />;
        case 'accepted': return <CheckCircle2 className="w-3.5 h-3.5" />;
        case 'ready_for_dispatch': return <PackageCheck className="w-3.5 h-3.5" />;
        case 'shipped': return <Truck className="w-3.5 h-3.5" />;
        case 'out_for_delivery': return <Navigation className="w-3.5 h-3.5" />;
        case 'delivered': return <CheckCheck className="w-3.5 h-3.5" />;
        case 'rejected': return <XCircle className="w-3.5 h-3.5" />;
        case 'cancelled': return <Ban className="w-3.5 h-3.5" />;
        default: return <Clock className="w-3.5 h-3.5" />;
      }
    };

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${config.badgeClass}`}>
        {getIcon()}
        <span>{config.label}</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Breadcrumbs items={[{ label: 'Buyer Dashboard' }, { label: 'My Purchase Requests' }]} />

      {/* Header Banner */}
      <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Buyer Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            My Purchase Requests & Orders
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Track and manage your agricultural commodity inquiries and purchase requests submitted to producers.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={fetchOrders}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Store className="w-4 h-4" />
            <span>Explore Marketplace</span>
          </Link>
        </div>
      </div>

      {/* Action Error Notice */}
      {actionError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 flex items-center justify-between">
          <span>{actionError}</span>
          <button
            type="button"
            onClick={() => setActionError(null)}
            className="text-red-700 hover:text-red-900 font-bold ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls: Status Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 shadow-xs mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-stone-500 uppercase px-2 shrink-0">
            Filter Status:
          </span>
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'accepted', label: 'Accepted' },
            { id: 'ready_for_dispatch', label: 'Packed' },
            { id: 'shipped', label: 'Shipped' },
            { id: 'out_for_delivery', label: 'Out for Delivery' },
            { id: 'delivered', label: 'Delivered' },
            { id: 'rejected', label: 'Declined' },
            { id: 'cancelled', label: 'Cancelled' }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setStatusFilter(tab.id);
                setCurrentPage(1);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-[#164e3b] text-white shadow-xs'
                  : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>


      {/* Loading State */}
      {loading && (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto mb-3" />
          <p className="text-stone-600 text-sm">Fetching your purchase requests from database...</p>
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center max-w-lg mx-auto">
          <p className="text-sm text-red-800 font-semibold mb-4">{error}</p>
          <button
            type="button"
            onClick={fetchOrders}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-xs font-bold"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <EmptyState
          icon={ShoppingBag}
          title={statusFilter === 'all' ? 'No Purchase Requests Found' : `No ${statusFilter} Requests`}
          description={
            statusFilter === 'all'
              ? 'You have not submitted any produce purchase inquiries yet. Browse the live marketplace and connect directly with farmers.'
              : `There are currently no requests with '${statusFilter}' status.`
          }
          actionLabel="Browse Live Marketplace"
          actionHref={ROUTES.MARKETPLACE}
        />
      )}

      {/* Orders Grid / Cards */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const product = order.product || {};
              const farmer = order.farmer || {};
              const locationText = [
                product.location?.mandi,
                product.location?.district,
                product.location?.state
              ]
                .filter(Boolean)
                .join(', ');

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-5 flex-1 space-y-3">
                    {/* Header Row: Status Badge & Date */}
                    <div className="flex items-center justify-between gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {/* Product Name & Negotiated Badge */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          Agricultural Lot
                        </span>
                        {order.isNegotiated && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                            Negotiated Agreement
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                        {product.name || 'Produce Lot'}
                      </h3>
                      {locationText && (
                        <p className="text-xs text-stone-600 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                          <span>{locationText}</span>
                        </p>
                      )}
                    </div>

                    {/* Order Metrics Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-[#faf9f5] p-3 rounded-xl border border-stone-200/70">
                      <div>
                        <span className="text-stone-500 block text-[11px]">Requested</span>
                        <span className="font-extrabold text-stone-900 text-sm">
                          {order.requestedQuantity} <span className="text-xs font-normal text-stone-600">{order.unit}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[11px]">{order.isNegotiated ? 'Negotiated Rate' : 'Agreed Rate'}</span>
                        <span className="font-bold text-stone-900 text-sm">
                          ₹{order.priceSnapshot?.toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal text-stone-600">/ {order.unit}</span>
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-stone-600 font-medium text-xs">Total Amount:</span>
                        <span className="font-extrabold text-[#164e3b] text-base">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Payment Status & Gateway Settlement */}
                    <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-stone-500 font-medium">Payment State:</span>
                        <span
                          className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                            order.paymentStatus === 'paid'
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : order.paymentStatus === 'payment_failed' || order.paymentStatus === 'failed'
                              ? 'bg-rose-100 text-rose-900 border border-rose-300'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {order.paymentStatus === 'paid'
                            ? order.paymentMethod === 'Razorpay'
                              ? 'Paid via Razorpay'
                              : 'Settled via Mandi'
                            : order.paymentStatus === 'payment_failed' || order.paymentStatus === 'failed'
                            ? 'Payment Failed'
                            : 'Payment Pending'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-stone-500">
                        <span>Method:</span>
                        <span className="font-semibold text-stone-700">
                          {order.paymentMethod || 'Direct Mandi / Bank Settlement'}
                        </span>
                      </div>

                      {order.razorpayPaymentId && (
                        <div className="flex items-center justify-between text-[10px] text-stone-400">
                          <span>Payment ID:</span>
                          <span className="font-mono text-stone-600">{order.razorpayPaymentId}</span>
                        </div>
                      )}

                      {/* Razorpay Online Checkout Action (if order not cancelled, declined, or already paid) */}
                      {order.status !== 'cancelled' &&
                        order.status !== 'rejected' &&
                        order.paymentStatus !== 'paid' && (
                          <div className="pt-2 border-t border-stone-200/70">
                            <RazorpayPaymentButton
                              order={order}
                              onPaymentSuccess={fetchOrders}
                              className="w-full justify-center"
                            />
                          </div>
                        )}
                    </div>

                    {/* Producer Assigned */}
                    <div className="text-xs text-stone-600 flex items-center justify-between">
                      <span>Producer:</span>
                      <span className="font-semibold text-stone-900">{farmer.name || 'Registered Farmer'}</span>
                    </div>

                    {/* Buyer Message if present */}
                    {order.buyerMessage && (
                      <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-600">
                        <span className="font-semibold text-stone-700 block text-[10px] uppercase">My Note:</span>
                        <p className="line-clamp-2 italic">{order.buyerMessage}</p>
                      </div>
                    )}

                    {/* Farmer Status Note if present */}
                    {order.statusNote && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950">
                        <span className="font-semibold text-emerald-900 block text-[10px] uppercase">Producer Response:</span>
                        <p className="line-clamp-2">{order.statusNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-5 py-3 border-t border-stone-100 bg-[#faf9f5]/50 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedOrderDetails(order)}
                        className="text-xs font-bold text-[#164e3b] hover:text-[#123826] flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 transition-colors shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Track Consignment</span>
                      </button>

                      {/* Live GPS Map Tracking Button */}
                      <button
                        type="button"
                        onClick={() => setLiveMapOrder(order)}
                        className="text-xs font-bold text-blue-800 hover:text-blue-950 flex items-center gap-1.5 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-xl border border-blue-200 transition-all shadow-2xs hover:shadow-xs group"
                        title="Open Live GPS Map Tracking"
                      >
                        <Navigation className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
                        <span>Live Map Track</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {(order.status === 'out_for_delivery' || order.status === 'shipped') && (
                        <button
                          type="button"
                          onClick={() => handleConfirmDelivery(order._id)}
                          disabled={confirmingDeliveryId === order._id}
                          className="px-3 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs disabled:opacity-50"
                        >
                          <CheckCheck className="w-3.5 h-3.5" />
                          <span>
                            {confirmingDeliveryId === order._id
                              ? 'Confirming...'
                              : 'Confirm Delivery'}
                          </span>
                        </button>
                      )}

                      {order.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => handleCancelOrder(order._id)}
                          disabled={cancellingId === order._id}
                          className="px-3 py-1.5 rounded-lg bg-stone-200 hover:bg-rose-100 text-stone-700 hover:text-rose-900 text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {cancellingId === order._id ? 'Cancelling...' : 'Cancel Request'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
              <span className="text-xs text-stone-600 font-medium px-2">
                Page <span className="font-bold text-stone-900">{currentPage}</span> of{' '}
                <span className="font-bold text-stone-900">{totalPages}</span>
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-4 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Real Consignment Tracking Timeline Modal */}
      {selectedOrderDetails && (
        <Modal
          isOpen={Boolean(selectedOrderDetails)}
          onClose={() => setSelectedOrderDetails(null)}
          title={`Consignment Tracking: ${selectedOrderDetails.product?.name || 'Produce Lot'}`}
          maxWidth="max-w-2xl"
        >
          <OrderTrackingTimeline
            initialOrder={selectedOrderDetails}
            orderId={selectedOrderDetails._id}
            onClose={() => setSelectedOrderDetails(null)}
          />
        </Modal>
      )}

      {/* Live GPS Map Tracking Modal */}
      {liveMapOrder && (
        <LiveMapTrackingModal
          order={liveMapOrder}
          onClose={() => setLiveMapOrder(null)}
        />
      )}
    </div>
  );
}

