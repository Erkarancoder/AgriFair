import { useState, useEffect, useCallback, useId } from 'react';
import { Link } from 'react-router-dom';
import {
  Tractor,
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
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  X,
  Package,
  ArrowRight
} from 'lucide-react';
import orderService from '../../services/order.service';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';
import OrderTrackingTimeline from '../../components/orders/OrderTrackingTimeline';
import { STATUS_CONFIG, getFarmerNextAction } from '../../constants/orderStatuses';
import { ROUTES } from '../../constants/routes';

export default function FarmerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [actionModal, setActionModal] = useState(null); // { order, action, meta }
  const [actionNote, setActionNote] = useState('');
  const [transporterName, setTransporterName] = useState('');
  const [vehicleNumber, setVehicleNumber] = useState('');
  const [confirmSettlement, setConfirmSettlement] = useState(false);
  const [settlementNote, setSettlementNote] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const actionNoteInputId = useId();

  const fetchOrders = useCallback(() => {
    setLoading(true);
    setRefreshIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let ignore = false;

    orderService
      .getMyOrders({
        role: 'farmer',
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
          setError(err.message || 'Failed to load incoming purchase requests.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [statusFilter, currentPage, refreshIndex]);

  const handleOpenAction = (order, action, meta = null) => {
    setActionModal({ order, action, meta });
    setActionNote('');
    setTransporterName('');
    setVehicleNumber('');
    setConfirmSettlement(false);
    setSettlementNote('');
    setActionError(null);
  };

  const handleConfirmAction = async (e) => {
    e.preventDefault();
    if (!actionModal) return;

    try {
      setActionSubmitting(true);
      setActionError(null);
      await orderService.updateOrderStatus(actionModal.order._id, {
        status: actionModal.action,
        note: actionNote.trim(),
        transporterName: transporterName.trim(),
        vehicleNumber: vehicleNumber.trim(),
        confirmSettlement,
        settlementNote: settlementNote.trim()
      });

      setActionModal(null);
      await fetchOrders();
    } catch (err) {
      setActionError(err.message || `Failed to update order to ${actionModal.action}.`);
    } finally {
      setActionSubmitting(false);
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
      <Breadcrumbs items={[{ label: 'Farmer Portal' }, { label: 'Incoming Purchase Requests' }]} />

      {/* Header Banner */}
      <div className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-950 text-xs font-bold uppercase tracking-wider mb-3">
            <Tractor className="w-3.5 h-3.5 text-amber-800" />
            <span>Producer Management</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Incoming Purchase Requests
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-2 max-w-2xl leading-relaxed">
            Review, accept, and manage verified delivery milestones for purchase inquiries submitted for your listed produce.
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
            to={ROUTES.FARMER_LISTINGS}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors"
          >
            <Package className="w-4 h-4" />
            <span>My Produce Listings</span>
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-3 sm:p-4 shadow-xs mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-stone-500 uppercase px-2 shrink-0">
            Filter Status:
          </span>
          {[
            { id: 'all', label: 'All Inquiries' },
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
          <p className="text-stone-600 text-sm">Fetching incoming buyer requests...</p>
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
          icon={Package}
          title={statusFilter === 'all' ? 'No Incoming Orders Yet' : `No ${statusFilter} Orders`}
          description={
            statusFilter === 'all'
              ? 'You have not received any purchase inquiries for your listed crops yet. Keep your listings updated with active prices to attract buyers.'
              : `There are currently no orders with '${statusFilter}' status.`
          }
          actionLabel="Manage Produce Listings"
          actionHref={ROUTES.FARMER_LISTINGS}
        />
      )}

      {/* Orders Grid */}
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => {
              const product = order.product || {};
              const buyer = order.buyer || {};

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="p-5 flex-1 space-y-3">
                    {/* Header: Status and Date */}
                    <div className="flex items-center justify-between gap-2">
                      {getStatusBadge(order.status)}
                      <span className="text-[11px] text-stone-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </span>
                    </div>

                    {/* Produce Title & Negotiated Badge */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          My Listed Produce
                        </span>
                        {order.isNegotiated && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                            Negotiated Agreement
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-extrabold text-stone-900 leading-tight">
                        {product.name || 'Crop Listing'}
                      </h3>
                    </div>

                    {/* Buyer Information */}
                    <div className="p-3 rounded-xl bg-[#faf9f5] border border-stone-200/70 text-xs space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500">Inquiring Buyer:</span>
                        <span className="font-bold text-stone-900">{buyer.name || 'Buyer'}</span>
                      </div>
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-stone-500">Role:</span>
                        <span className="px-1.5 py-0.2 rounded bg-stone-200 text-stone-800 font-semibold uppercase">
                          {buyer.role || 'Buyer'}
                        </span>
                      </div>
                    </div>

                    {/* Financial Metrics */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-3 rounded-xl border border-stone-200/70">
                      <div>
                        <span className="text-stone-500 block text-[11px]">Requested Stock</span>
                        <span className="font-extrabold text-stone-900 text-sm">
                          {order.requestedQuantity} <span className="text-xs font-normal text-stone-600">{order.unit}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 block text-[11px]">{order.isNegotiated ? 'Negotiated Rate' : 'Snapshot Rate'}</span>
                        <span className="font-bold text-stone-900 text-sm">
                          ₹{order.priceSnapshot?.toLocaleString('en-IN')}{' '}
                          <span className="text-xs font-normal text-stone-600">/ {order.unit}</span>
                        </span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-stone-200/60 flex items-center justify-between">
                        <span className="text-stone-600 font-medium text-xs">Total Order Value:</span>
                        <span className="font-extrabold text-[#164e3b] text-base">
                          ₹{order.totalAmount?.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Payment State */}
                    <div className="flex items-center justify-between text-xs py-1.5 px-3 rounded-xl bg-[#faf9f5] border border-stone-200/80">
                      <span className="text-stone-500 font-medium">Payment State:</span>
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded-md ${
                          order.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : order.paymentStatus === 'refunded'
                            ? 'bg-purple-100 text-purple-900 border border-purple-300'
                            : order.paymentStatus === 'refund_pending'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : order.paymentStatus === 'payment_failed' || order.paymentStatus === 'failed'
                            ? 'bg-rose-100 text-rose-900 border border-rose-300'
                            : 'bg-stone-100 text-stone-800 border border-stone-200'
                        }`}
                      >
                        {order.paymentStatus === 'paid'
                          ? order.paymentMethod === 'Razorpay'
                            ? 'Paid via Razorpay'
                            : 'Direct Mandi Settlement'
                          : order.paymentStatus === 'refunded'
                          ? 'Refund Processed'
                          : order.paymentStatus === 'refund_pending'
                          ? 'Refund Pending'
                          : order.paymentStatus === 'payment_failed' || order.paymentStatus === 'failed'
                          ? 'Payment Failed'
                          : order.paymentMethod === 'Razorpay'
                          ? 'Awaiting Online Payment'
                          : 'Payment Pending (Direct Mandi Settlement)'}
                      </span>
                    </div>

                    {/* Buyer's Inquiry Message */}
                    {order.buyerMessage && (
                      <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-100 text-xs text-stone-600">
                        <span className="font-semibold text-stone-700 block text-[10px] uppercase">Buyer Request Note:</span>
                        <p className="line-clamp-2 italic">{order.buyerMessage}</p>
                      </div>
                    )}

                    {/* Producer's previous note if any */}
                    {order.statusNote && (
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-xs text-emerald-950">
                        <span className="font-semibold text-emerald-900 block text-[10px] uppercase">My Response Note:</span>
                        <p className="line-clamp-2">{order.statusNote}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Bar */}
                  <div className="px-5 py-3 border-t border-stone-100 bg-[#faf9f5]/50 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedOrderDetails(order)}
                      className="text-xs font-bold text-[#164e3b] hover:text-[#123826] flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100/80 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 transition-colors shadow-2xs"
                    >
                      <Truck className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Tracking</span>
                    </button>

                    {order.status === 'pending' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order, 'rejected')}
                          className="px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-rose-100 text-stone-700 hover:text-rose-900 text-xs font-bold transition-colors inline-flex items-center gap-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Decline</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenAction(order, 'accepted')}
                          className="px-3 py-1.5 rounded-lg bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-colors inline-flex items-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3 h-3" />
                          <span>Accept</span>
                        </button>
                      </div>
                    ) : (() => {
                      const isAwaitingOnlinePayment =
                        order.paymentMethod === 'Razorpay' &&
                        order.paymentStatus !== 'paid' &&
                        order.status === 'accepted';

                      if (isAwaitingOnlinePayment) {
                        return (
                          <span
                            title="Online Razorpay payment has not been confirmed yet. Dispatch unlocks once buyer completes payment."
                            className="text-[11px] font-semibold text-amber-900 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl"
                          >
                            Awaiting Online Payment
                          </span>
                        );
                      }

                      const nextAction = getFarmerNextAction(order.status);
                      if (nextAction) {
                        return (
                          <button
                            type="button"
                            onClick={() => handleOpenAction(order, nextAction.nextStatus, nextAction)}
                            className="px-3 py-1.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all inline-flex items-center gap-1.5 shadow-2xs"
                          >
                            <span>{nextAction.buttonLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        );
                      }
                      if (order.status === 'delivered') {
                        return (
                          <span className="inline-flex items-center gap-1 text-[11px] text-[#164e3b] font-bold bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300">
                            <CheckCheck className="w-3.5 h-3.5" />
                            <span>Delivered</span>
                          </span>
                        );
                      }
                      return (
                        <span className="text-[11px] text-stone-500 font-medium px-2 py-1">
                          Request Closed
                        </span>
                      );
                    })()}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
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

      {/* Stage Transition Action Modal */}
      {actionModal && (
        <Modal
          isOpen={Boolean(actionModal)}
          onClose={() => setActionModal(null)}
          title={
            actionModal.meta?.modalTitle ||
            `${actionModal.action === 'accepted' ? 'Accept' : 'Decline'} Purchase Request`
          }
          maxWidth="max-w-md"
        >
          <form onSubmit={handleConfirmAction} className="space-y-4 text-xs">
            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900">
                {actionError}
              </div>
            )}

            <p className="text-stone-600 text-xs sm:text-sm leading-relaxed">
              {actionModal.meta?.promptText || (
                <>
                  You are about to{' '}
                  <strong className={actionModal.action === 'accepted' ? 'text-emerald-700' : 'text-rose-700'}>
                    {actionModal.action === 'accepted' ? 'accept' : 'decline'}
                  </strong>{' '}
                  the purchase inquiry from <span className="font-bold text-stone-900">{actionModal.order.buyer?.name}</span> for{' '}
                  <span className="font-bold text-stone-900">{actionModal.order.requestedQuantity} {actionModal.order.unit}</span> of{' '}
                  <span className="font-bold text-stone-900">{actionModal.order.product?.name}</span> (Total Valuation: ₹{actionModal.order.totalAmount?.toLocaleString('en-IN')}).
                </>
              )}
            </p>

            {actionModal.action === 'shipped' && (
              <div className="space-y-2.5 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <span className="font-bold text-stone-900 block text-[11px] uppercase tracking-wider">
                  Honest Farmer Dispatch Details
                </span>
                <div className="space-y-1">
                  <label className="text-stone-600 block text-[11px]">
                    Transporter / Driver Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={transporterName}
                    onChange={(e) => setTransporterName(e.target.value)}
                    placeholder="e.g. Kisan Logistics / Driver Ramesh"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-stone-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-stone-600 block text-[11px]">
                    Vehicle / Consignment Number (Optional)
                  </label>
                  <input
                    type="text"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="e.g. UP32 AB 1234"
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-300 text-stone-900 font-mono"
                  />
                </div>
              </div>
            )}

            {actionModal.order.paymentMethod === 'Direct Mandi / Bank Settlement' &&
              actionModal.order.paymentStatus !== 'paid' && (
                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmSettlement}
                      onChange={(e) => setConfirmSettlement(e.target.checked)}
                      className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <div className="text-[11px] leading-tight">
                      <span className="font-bold text-emerald-950 block">
                        Confirm Direct Mandi / Bank Settlement
                      </span>
                      <span className="text-emerald-800">
                        Check this box if the buyer has completed payment offline via cash or bank transfer.
                      </span>
                    </div>
                  </label>
                  {confirmSettlement && (
                    <input
                      type="text"
                      value={settlementNote}
                      onChange={(e) => setSettlementNote(e.target.value)}
                      placeholder="e.g. Received ₹ at Mandi gate / NEFT Ref"
                      className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-emerald-300 bg-white"
                    />
                  )}
                </div>
              )}

            <div className="space-y-1.5">
              <label htmlFor={actionNoteInputId} className="font-bold text-stone-800 block">
                Logistics / Audit Note (Optional)
              </label>
              <textarea
                id={actionNoteInputId}
                rows={3}
                maxLength={500}
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder={
                  actionModal.meta?.placeholder ||
                  (actionModal.action === 'accepted'
                    ? 'e.g. Batch is bagged and ready for inspection at Khanna mandi dock.'
                    : 'e.g. Batch already allocated to pre-existing contract.')
                }
                className="w-full px-3 py-2 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-stone-900"
              />
            </div>

            <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                disabled={actionSubmitting}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionSubmitting}
                className={`px-5 py-2 rounded-xl text-white font-bold inline-flex items-center gap-1.5 ${
                  actionModal.action === 'rejected'
                    ? 'bg-rose-700 hover:bg-rose-800'
                    : 'bg-[#164e3b] hover:bg-[#123826]'
                }`}
              >
                {actionSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>
                  {actionModal.meta?.buttonLabel ||
                    `Confirm ${actionModal.action === 'accepted' ? 'Acceptance' : 'Decline'}`}
                </span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Consignment Tracking Timeline Modal */}
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
    </div>
  );
}

