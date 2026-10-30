import { useState } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, RefreshCw, Lock } from 'lucide-react';
import paymentService, { loadRazorpayScript } from '../../services/payment.service';

/**
 * Razorpay Payment Component
 * Handles real checkout script loading, server-side order initiation,
 * cryptographic verification callback, cancellation, and missing-configuration states.
 */
export default function RazorpayPaymentButton({
  order,
  onPaymentSuccess,
  className = ''
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [modalInfo, setModalInfo] = useState({ title: '', message: '', isError: false });

  const [reconciling, setReconciling] = useState(false);
  const [refunding, setRefunding] = useState(false);

  if (!order) return null;

  const isPaid = order.paymentStatus === 'paid';
  const isRefunded = order.paymentStatus === 'refunded';
  const isRefundPending = order.paymentStatus === 'refund_pending';
  const isFailed = order.paymentStatus === 'payment_failed' || order.paymentStatus === 'failed';
  const isCancelledOrRejected = order.status === 'cancelled' || order.status === 'rejected';
  const isRazorpayMethod = order.paymentMethod === 'Razorpay';

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      setErrorMessage(null);
      const res = await paymentService.reconcilePayment(order._id);
      setReconciling(false);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      setReconciling(false);
      setErrorMessage(err.message || 'Failed to reconcile payment status.');
    }
  };

  const handleRefundClick = async () => {
    if (!window.confirm(`Are you sure you want to cancel this order and request a full refund of ₹${order.totalAmount?.toLocaleString('en-IN')} via Razorpay?`)) {
      return;
    }

    try {
      setRefunding(true);
      setErrorMessage(null);
      const res = await paymentService.initiateRefund({
        orderId: order._id,
        reason: 'Order cancelled by buyer request'
      });
      setRefunding(false);
      setModalInfo({
        title: 'Refund Initiated',
        message: res.message || 'Refund successfully initiated via Razorpay.',
        isError: false
      });
      setInfoModalOpen(true);
      if (onPaymentSuccess) {
        onPaymentSuccess(res.data);
      }
    } catch (err) {
      setRefunding(false);
      setErrorMessage(err.message || 'Failed to initiate refund.');
    }
  };

  // 1. If already refunded
  if (isRefunded) {
    const refundRecord = order.refunds?.[order.refunds.length - 1];
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 text-purple-900 border border-purple-200">
        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
        <span>Refund Processed {refundRecord?.providerRefundId ? `(${refundRecord.providerRefundId})` : ''}</span>
      </div>
    );
  }

  // 2. If refund pending
  if (isRefundPending) {
    return (
      <div className="flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200">
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          <span>Refund Pending (Processing)</span>
        </div>
        <button
          type="button"
          onClick={handleReconcile}
          disabled={reconciling}
          title="Reconcile with Razorpay"
          className="p-1 rounded-lg hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
        </button>
      </div>
    );
  }

  // 3. If already paid
  if (isPaid) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
            isRazorpayMethod
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-stone-100 text-stone-800 border border-stone-200'
          }`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {isRazorpayMethod ? 'Paid via Razorpay (Online)' : 'Direct Mandi / Bank Settlement'}
            </span>
          </div>

          {isRazorpayMethod && (
            <button
              type="button"
              onClick={handleReconcile}
              disabled={reconciling}
              title="Sync status with Razorpay"
              className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>

        {/* Cancellation with Refund Option before Dispatch */}
        {isRazorpayMethod && (order.status === 'pending' || order.status === 'accepted') && (
          <button
            type="button"
            onClick={handleRefundClick}
            disabled={refunding}
            className="text-[11px] font-semibold text-rose-700 hover:text-rose-900 underline text-left w-fit mt-0.5 disabled:opacity-50"
          >
            {refunding ? 'Processing Refund...' : 'Cancel Order & Request Full Refund'}
          </button>
        )}
      </div>
    );
  }

  // 4. If order cancelled or declined without payment
  if (isCancelledOrRejected) {
    return (
      <span className="text-xs text-stone-400 italic">
        Order {order.status} (Ineligible for payment)
      </span>
    );
  }

  const handlePayClick = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      // 1. Check server configuration status
      const config = await paymentService.getConfig();
      if (!config || !config.configured) {
        setLoading(false);
        setModalInfo({
          title: 'Razorpay Gateway Configuration',
          message:
            'Razorpay payment gateway credentials are not configured. Please check RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET in server/.env.',
          isError: true
        });
        setInfoModalOpen(true);
        return;
      }

      // 2. Load official Razorpay Checkout SDK
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        setLoading(false);
        setErrorMessage('Failed to load Razorpay payment SDK. Please check your internet connection.');
        return;
      }

      // 3. Initiate payment order on server with verified server-calculated total
      const orderData = await paymentService.initiatePayment(order._id);
      if (!orderData || !orderData.providerOrderId) {
        throw new Error('Server failed to initialize Razorpay transaction.');
      }

      // 4. Configure Checkout Options
      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'AgriFair Marketplace',
        description: `Order #${order._id.toString().slice(-6).toUpperCase()} - ${orderData.productName}`,
        order_id: orderData.providerOrderId,
        prefill: {
          name: orderData.buyerDetails?.name || '',
          email: orderData.buyerDetails?.email || '',
          contact: orderData.buyerDetails?.phone || ''
        },
        theme: {
          color: '#164e3b'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            setErrorMessage('Payment window was closed. Your order remains pending and can be retried at any time.');
          }
        },
        handler: async (response) => {
          try {
            setLoading(true);
            setErrorMessage(null);

            // 5. Submit client callback data to server for cryptographic signature verification
            const verifyRes = await paymentService.verifyPayment({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature
            });

            setLoading(false);
            if (verifyRes.success) {
              setModalInfo({
                title: 'Payment Successful!',
                message: `Your payment of ₹${order.totalAmount?.toLocaleString('en-IN')} has been verified and settled via Razorpay. Payment ID: ${response.razorpay_payment_id}`,
                isError: false
              });
              setInfoModalOpen(true);
              if (onPaymentSuccess) {
                onPaymentSuccess(verifyRes.data);
              }
            } else {
              setErrorMessage(verifyRes.message || 'Signature verification failed.');
            }
          } catch (verifyErr) {
            setLoading(false);
            setErrorMessage(verifyErr.message || 'Payment verification failed on server.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on('payment.failed', (failResponse) => {
        setLoading(false);
        const reason = failResponse.error?.description || 'Payment was declined by bank/gateway.';
        setErrorMessage(`Payment Failed: ${reason}`);
      });

      razorpayInstance.open();
    } catch (err) {
      setLoading(false);
      setErrorMessage(err.message || 'Failed to initiate payment.');
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handlePayClick}
          disabled={loading}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 ${
            isFailed
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-[#164e3b] hover:bg-[#123826] text-white'
          } ${className}`}
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : isFailed ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Razorpay Payment</span>
            </>
          ) : (
            <>
              <CreditCard className="w-3.5 h-3.5" />
              <span>Pay Online (Razorpay)</span>
            </>
          )}
        </button>

        <span className="text-[11px] text-stone-500 flex items-center gap-1">
          <Lock className="w-3 h-3 text-emerald-700" />
          <span>100% Secure</span>
        </span>
      </div>

      {errorMessage && (
        <p className="text-[11px] text-rose-700 flex items-center gap-1 font-medium mt-0.5">
          <AlertCircle className="w-3 h-3 shrink-0" />
          <span>{errorMessage}</span>
        </p>
      )}

      {/* Truthful Config / Result Modal */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-stone-900">{modalInfo.title}</h3>
                <p className="text-xs text-stone-600 mt-2 leading-relaxed">{modalInfo.message}</p>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setInfoModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-[#164e3b] text-white text-xs font-bold hover:bg-[#123826] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
