import { useState, useEffect, useCallback } from 'react';
import {
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
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  Loader2,
  User,
  ShoppingBag
} from 'lucide-react';
import orderService from '../../services/order.service';
import { DELIVERY_STAGES, STATUS_CONFIG } from '../../constants/orderStatuses';
import LiveMapTrackingModal from './LiveMapTrackingModal';

export default function OrderTrackingTimeline({ orderId, initialOrder, onClose }) {
  const [order, setOrder] = useState(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder && Boolean(orderId));
  const [error, setError] = useState(null);
  const [copiedId, setCopiedId] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(false);

  const fetchTracking = useCallback(async () => {
    const targetId = orderId || initialOrder?._id;
    if (!targetId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await orderService.getOrderTracking(targetId);
      if (res && res.data) {
        setOrder(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to retrieve tracking data for this order.');
    } finally {
      setLoading(false);
    }
  }, [orderId, initialOrder]);

  useEffect(() => {
    if (orderId && (!initialOrder || initialOrder._id !== orderId)) {
      fetchTracking();
    }
  }, [orderId, initialOrder, fetchTracking]);

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const getStatusIcon = (statusKey, className = 'w-4 h-4') => {
    switch (statusKey) {
      case 'pending':
        return <Clock className={className} />;
      case 'accepted':
        return <CheckCircle2 className={className} />;
      case 'ready_for_dispatch':
        return <PackageCheck className={className} />;
      case 'shipped':
        return <Truck className={className} />;
      case 'out_for_delivery':
        return <Navigation className={className} />;
      case 'delivered':
        return <CheckCheck className={className} />;
      case 'rejected':
        return <XCircle className={className} />;
      case 'cancelled':
        return <Ban className={className} />;
      default:
        return <Clock className={className} />;
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <Loader2 className="w-8 h-8 text-emerald-700 animate-spin mx-auto" />
        <p className="text-xs sm:text-sm text-stone-600 font-medium">
          Loading verified tracking timeline...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
        <p className="text-xs sm:text-sm text-red-900 font-semibold">{error}</p>
        <button
          type="button"
          onClick={fetchTracking}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-12 text-center text-xs text-stone-500">
        No order tracking details found.
      </div>
    );
  }

  const product = order.product || {};
  const farmer = order.farmer || {};
  const buyer = order.buyer || {};
  const statusCfg = STATUS_CONFIG[order.status] || {
    label: order.status,
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200'
  };

  const isTerminalCancelled = order.status === 'cancelled';
  const isTerminalRejected = order.status === 'rejected';
  const isDelivered = order.status === 'delivered';

  // Build a lookup map of historical status records for exact DB timestamps
  const historyMap = {};
  if (Array.isArray(order.statusHistory)) {
    order.statusHistory.forEach((h) => {
      // Keep earliest or latest entry for this status
      historyMap[h.status] = h;
    });
  }

  // Find index of current stage in DELIVERY_STAGES
  const currentStageIndex = DELIVERY_STAGES.findIndex((s) => s.key === order.status);

  return (
    <div className="space-y-6 text-stone-900">
      {/* Top Bar: Order Identifier & Status */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
                Consignment Reference
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-semibold">
                AGF-{order._id.slice(-8).toUpperCase()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono text-stone-500 truncate max-w-[200px] sm:max-w-none">
                ID: {order._id}
              </span>
              <button
                type="button"
                onClick={() => handleCopyId(order._id)}
                title="Copy Full Order ID"
                className="text-stone-400 hover:text-stone-700 transition-colors p-1"
              >
                {copiedId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setShowLiveMap(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-colors shadow-2xs group"
              title="Open Full GPS Road Map"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-600 group-hover:scale-110 transition-transform" />
              <span>Live GPS Map</span>
            </button>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider border ${statusCfg.badgeClass}`}
            >
              {getStatusIcon(order.status, 'w-3.5 h-3.5')}
              <span>{statusCfg.label}</span>
            </span>

            <button
              type="button"
              onClick={fetchTracking}
              disabled={loading}
              title="Refresh tracking status from server"
              className="p-1.5 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Date Placed & Produce Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-2 text-stone-600">
            <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              Placed: <strong className="text-stone-800">{new Date(order.createdAt).toLocaleString()}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-stone-600">
            <User className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              Farmer: <strong className="text-stone-800">{farmer.name || 'Verified Producer'}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2 text-stone-600">
            <ShoppingBag className="w-3.5 h-3.5 text-stone-400 shrink-0" />
            <span>
              Buyer: <strong className="text-stone-800">{buyer.name || 'Verified Buyer'}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Lot & Valuation Summary Card */}
      <div className="p-4 rounded-2xl bg-[#faf9f5] border border-stone-200/80 space-y-3 text-xs">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
              Produce Lot
            </span>
            <h4 className="text-base font-extrabold text-stone-900 leading-tight">
              {product.name || 'Produce Lot'}
            </h4>
            {product.location && (
              <p className="text-stone-600 flex items-center gap-1 mt-1 text-[11px]">
                <MapPin className="w-3 h-3 text-emerald-700 shrink-0" />
                <span>
                  {[product.location.mandi, product.location.district, product.location.state]
                    .filter(Boolean)
                    .join(', ')}
                </span>
              </p>
            )}
          </div>

          <div className="text-right">
            <span className="text-[11px] text-stone-500 block">Total Amount</span>
            <span className="text-base font-extrabold text-[#164e3b]">
              ₹{order.totalAmount?.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200/60 text-stone-700">
          <div>
            <span className="text-stone-500 block text-[11px]">Requested Stock:</span>
            <span className="font-extrabold text-stone-900">
              {order.requestedQuantity} {order.unit}
            </span>
          </div>
          <div>
            <span className="text-stone-500 block text-[11px]">Price Snapshot:</span>
            <span className="font-bold text-stone-900">
              ₹{order.priceSnapshot?.toLocaleString('en-IN')} / {order.unit}
            </span>
          </div>
        </div>
      </div>

      {/* Terminal Notification Banners */}
      {isTerminalCancelled && (
        <div className="p-4 rounded-2xl bg-stone-100 border border-stone-300 text-xs text-stone-800 space-y-1">
          <div className="flex items-center gap-2 font-bold text-stone-900">
            <Ban className="w-4 h-4 text-stone-600" />
            <span>Order Cancelled by Buyer</span>
          </div>
          <p className="leading-relaxed">
            This purchase request was withdrawn by the buyer while pending review. No stock was deducted and no further transit actions can occur.
          </p>
          {historyMap.cancelled?.changedAt && (
            <p className="text-[11px] text-stone-500 pt-1">
              Cancelled on: {new Date(historyMap.cancelled.changedAt).toLocaleString()}
            </p>
          )}
          {order.statusNote && (
            <p className="text-[11px] italic bg-white p-2 rounded-lg border border-stone-200 mt-1">
              Note: {order.statusNote}
            </p>
          )}
        </div>
      )}

      {isTerminalRejected && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-950 space-y-1">
          <div className="flex items-center gap-2 font-bold text-rose-900">
            <XCircle className="w-4 h-4 text-rose-700" />
            <span>Order Request Declined by Producer</span>
          </div>
          <p className="leading-relaxed">
            The assigned farmer declined this purchase inquiry. This order is closed and no further delivery stages can be executed.
          </p>
          {historyMap.rejected?.changedAt && (
            <p className="text-[11px] text-rose-800 pt-1">
              Declined on: {new Date(historyMap.rejected.changedAt).toLocaleString()}
            </p>
          )}
          {order.statusNote && (
            <p className="text-[11px] italic bg-white p-2 rounded-lg border border-rose-200 mt-1">
              Producer Note: {order.statusNote}
            </p>
          )}
        </div>
      )}

      {/* Honest Farmer-Managed Fulfilment Record */}
      {order.fulfilment &&
        (order.fulfilment.transporterName ||
          order.fulfilment.vehicleNumber ||
          order.fulfilment.receivedBy ||
          order.fulfilment.settlementNote) && (
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-2xs space-y-2.5 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <Truck className="w-4 h-4 text-emerald-800" />
              <span className="font-extrabold text-stone-900 uppercase tracking-wider text-[11px]">
                Farmer Dispatch & Logistics Record
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
              {order.fulfilment.transporterName && (
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase">Transporter / Driver:</span>
                  <span className="font-bold text-stone-900">{order.fulfilment.transporterName}</span>
                </div>
              )}
              {order.fulfilment.vehicleNumber && (
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase">Vehicle / Consignment No:</span>
                  <span className="font-mono font-bold text-stone-900">{order.fulfilment.vehicleNumber}</span>
                </div>
              )}
              {order.fulfilment.dispatchedAt && (
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase">Dispatched On:</span>
                  <span className="font-medium text-stone-800">
                    {new Date(order.fulfilment.dispatchedAt).toLocaleString()}
                  </span>
                </div>
              )}
              {order.fulfilment.deliveredAt && (
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase">Delivered On:</span>
                  <span className="font-medium text-stone-800">
                    {new Date(order.fulfilment.deliveredAt).toLocaleString()}
                  </span>
                </div>
              )}
              {order.fulfilment.receivedBy && (
                <div>
                  <span className="text-stone-500 block text-[10px] uppercase">Received By:</span>
                  <span className="font-bold text-emerald-900">{order.fulfilment.receivedBy}</span>
                </div>
              )}
              {order.fulfilment.settlementNote && (
                <div className="sm:col-span-2 p-2 bg-emerald-50/70 border border-emerald-100 rounded-lg text-emerald-950">
                  <span className="text-[10px] uppercase font-bold text-emerald-900 block">
                    Offline Settlement Note:
                  </span>
                  <span className="italic">{order.fulfilment.settlementNote}</span>
                </div>
              )}
            </div>
          </div>
        )}

      {/* Real Shipping Progress Timeline */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div>
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
              Consignment Progress Timeline
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Real-time audit stages recorded directly in the AgriFair ledger
            </p>
          </div>
          {isDelivered && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider">
              All Stages Complete
            </span>
          )}
        </div>

        {/* Vertical Shipping Timeline */}
        <div className="relative pl-6 sm:pl-8 space-y-6 sm:space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-2 before:bottom-3 before:w-0.5 before:bg-stone-200">
          {DELIVERY_STAGES.map((stage, idx) => {
            const historyEntry = historyMap[stage.key];
            const hasOccurred = Boolean(historyEntry);

            // Determine status for this specific stage in the sequence
            let stageState = 'upcoming'; // 'completed' | 'current' | 'upcoming'
            if (order.status === stage.key) {
              stageState = 'current';
            } else if (hasOccurred) {
              stageState = 'completed';
            } else if (
              currentStageIndex >= 0 &&
              idx < currentStageIndex &&
              !isTerminalCancelled &&
              !isTerminalRejected
            ) {
              stageState = 'completed';
            }

            return (
              <div key={stage.key} className="relative">
                {/* Node Indicator Dot */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center border-2 transition-all ${
                    stageState === 'completed'
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : stageState === 'current'
                      ? 'bg-white border-[#164e3b] text-[#164e3b] ring-4 ring-emerald-100 shadow-sm'
                      : 'bg-white border-stone-300 text-stone-400'
                  }`}
                >
                  {stageState === 'completed' ? (
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  ) : stageState === 'current' ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-[#164e3b] animate-pulse" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-stone-300" />
                  )}
                </div>

                {/* Stage Content */}
                <div className="space-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-bold ${
                          stageState === 'current'
                            ? 'text-stone-900 font-extrabold'
                            : stageState === 'completed'
                            ? 'text-stone-900 font-semibold'
                            : 'text-stone-500 font-medium'
                        }`}
                      >
                        {stage.title}
                      </span>

                      {stageState === 'current' && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#164e3b] text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                          Current Stage
                        </span>
                      )}
                    </div>

                    {/* Verified DB Timestamp (NEVER simulated or invented) */}
                    {historyEntry?.changedAt ? (
                      <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/80 inline-block w-fit">
                        {new Date(historyEntry.changedAt).toLocaleString()}
                      </span>
                    ) : (
                      <span className="text-[11px] text-stone-400 italic">
                        {stageState === 'upcoming' ? 'Pending transition' : ''}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed">
                    {stage.subtitle}
                  </p>

                  {/* Optional stage note from authorized actor */}
                  {historyEntry?.note && (
                    <div className="mt-1.5 p-2 rounded-lg bg-[#faf9f5] border border-stone-200 text-[11px] text-stone-700">
                      <span className="font-semibold text-stone-800">Logistics Note: </span>
                      <span className="italic">{historyEntry.note}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Verified Status Audit Log */}
      {Array.isArray(order.statusHistory) && order.statusHistory.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-stone-50 border border-stone-200/90 text-xs space-y-3">
          <span className="font-bold text-stone-800 block text-xs uppercase tracking-wider">
            Verified Status Transition History:
          </span>
          <div className="space-y-2.5 divide-y divide-stone-200/60">
            {order.statusHistory.map((history, idx) => (
              <div key={idx} className="pt-2 first:pt-0 flex items-start justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="font-bold capitalize text-stone-900 block">
                    {STATUS_CONFIG[history.status]?.label || history.status}
                  </span>
                  {history.note && (
                    <p className="text-[11px] text-stone-600 italic">
                      &ldquo;{history.note}&rdquo;
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[11px] text-stone-500 block">
                    {new Date(history.changedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Close button if inside modal */}
      {onClose && (
        <div className="pt-3 border-t border-stone-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold transition-colors"
          >
            Close Tracking
          </button>
        </div>
      )}

      {/* Live Map Modal */}
      {showLiveMap && (
        <LiveMapTrackingModal
          order={order}
          onClose={() => setShowLiveMap(false)}
        />
      )}
    </div>
  );
}
