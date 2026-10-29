import { useState, useId } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, AlertCircle, CheckCircle2, Info, Loader2, MapPin } from 'lucide-react';
import Modal from '../common/Modal';
import orderService from '../../services/order.service';
import { ROUTES } from '../../constants/routes';

export default function OrderRequestModal({ product, isOpen, onClose, onSuccess }) {
  const navigate = useNavigate();
  const quantityInputId = useId();
  const messageInputId = useId();
  const [quantity, setQuantity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!product) return null;

  const numQuantity = Number(quantity);
  const isQuantityValid = !isNaN(numQuantity) && numQuantity > 0 && numQuantity <= product.quantity;
  const estimatedTotal = isQuantityValid ? (numQuantity * product.price).toFixed(2) : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isQuantityValid) {
      if (isNaN(numQuantity) || numQuantity <= 0) {
        setError('Please enter a valid positive quantity.');
      } else if (numQuantity > product.quantity) {
        setError(`Requested quantity cannot exceed available stock (${product.quantity} ${product.unit}).`);
      }
      return;
    }

    try {
      setSubmitting(true);
      const res = await orderService.createOrder({
        productId: product._id,
        quantity: numQuantity,
        unit: product.unit,
        buyerMessage: message.trim()
      });

      setSuccessData(res.data);
      if (onSuccess) {
        onSuccess(res.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit order request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuantity('');
    setMessage('');
    setError(null);
    setSuccessData(null);
    onClose();
  };

  const handleGoToOrders = () => {
    handleClose();
    navigate(ROUTES.BUYER_ORDERS);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={successData ? 'Order Request Submitted' : `Inquire / Request: ${product.name}`}
      maxWidth="max-w-lg"
    >
      {successData ? (
        <div className="space-y-5 text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-[#164e3b] flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-700" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-stone-900 tracking-tight">
              Request Sent to Producer!
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 mt-1 leading-relaxed">
              Your purchase inquiry for{' '}
              <span className="font-semibold text-stone-900">{successData.requestedQuantity} {successData.unit}</span> of{' '}
              <span className="font-semibold text-stone-900">{product.name}</span> has been logged with status{' '}
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase">
                {successData.status}
              </span>.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 text-xs space-y-2 text-left">
            <div className="flex justify-between items-center text-stone-600">
              <span>Price Snapshot:</span>
              <span className="font-bold text-stone-900">₹{successData.priceSnapshot?.toLocaleString('en-IN')} / {successData.unit}</span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Estimated Total Amount:</span>
              <span className="font-extrabold text-[#164e3b] text-sm">
                ₹{successData.totalAmount?.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex justify-between items-center text-stone-600">
              <span>Producer Assigned:</span>
              <span className="font-semibold text-stone-900">{successData.farmer?.name || 'Farmer'}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-left text-xs text-amber-950 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              This request is pending producer confirmation. Stock is not yet reserved and no payment has been processed. The farmer will review your offer.
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors"
            >
              Continue Browsing
            </button>
            <button
              type="button"
              onClick={handleGoToOrders}
              className="px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs"
            >
              View My Orders
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Produce Summary Card */}
          <div className="p-3.5 rounded-xl bg-[#faf9f5] border border-stone-200/80 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  {product.category?.name || 'Produce Lot'}
                </span>
                <h4 className="text-sm sm:text-base font-extrabold text-stone-900 leading-snug">
                  {product.name}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="text-xs text-stone-500 block">Listed Rate</span>
                <span className="text-sm font-extrabold text-stone-900">
                  ₹{product.price?.toLocaleString('en-IN')}{' '}
                  <span className="text-xs font-normal text-stone-600">/ {product.unit}</span>
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-stone-200/60 text-stone-600">
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span>
                  {[product.location?.mandi, product.location?.district, product.location?.state]
                    .filter(Boolean)
                    .join(', ') || 'India'}
                </span>
              </span>
              <span className="font-semibold text-stone-800 shrink-0">
                Stock: {product.quantity} {product.unit}
              </span>
            </div>
          </div>

          {/* Form Error Banner */}
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-900">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quantity Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={quantityInputId} className="text-xs font-bold text-stone-800">
                Requested Quantity <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-stone-500">
                Max available: {product.quantity} {product.unit}
              </span>
            </div>
            <div className="relative">
              <input
                id={quantityInputId}
                type="number"
                min="0.001"
                max={product.quantity}
                step="any"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder={`e.g. 10`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs sm:text-sm text-stone-900 bg-white transition-all pr-20"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-600 uppercase">
                {product.unit}
              </span>
            </div>
          </div>

          {/* Live Total Calculation Preview */}
          {isQuantityValid && estimatedTotal && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between text-xs">
              <span className="text-emerald-950 font-medium">Estimated Order Amount:</span>
              <span className="text-sm font-extrabold text-[#164e3b]">
                ₹{Number(estimatedTotal).toLocaleString('en-IN')}{' '}
                <span className="text-[10px] font-normal text-stone-600">({quantity} {product.unit} &times; ₹{product.price})</span>
              </span>
            </div>
          )}

          {/* Optional Buyer Message */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={messageInputId} className="text-xs font-bold text-stone-800">
                Inquiry / Delivery Note <span className="text-[10px] text-stone-500 font-normal">(Optional)</span>
              </label>
              <span className="text-[10px] text-stone-500">{message.length}/1000</span>
            </div>
            <textarea
              id={messageInputId}
              rows={3}
              maxLength={1000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g. Required delivery by next Monday at mandi dock; please confirm batch grade."
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20 text-xs text-stone-900 bg-white transition-all leading-relaxed"
            />
          </div>

          {/* Transparency & Non-Reservation Notice */}
          <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-950 flex items-start gap-2">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Order Request Notice:</strong> Submitting this request sends an inquiry directly to the producer. Stock is <em>not reserved</em> and payment is <em>not charged</em> until the producer explicitly reviews and accepts your request.
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isQuantityValid}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] active:bg-[#0c2619] text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  <span>Send Purchase Request</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
