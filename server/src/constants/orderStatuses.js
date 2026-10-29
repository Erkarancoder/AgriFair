/**
 * AgriFair Order Statuses and Transition Constants
 * Phase 4C: Real Order Tracking & Status Timeline
 */

const ORDER_STATUSES = [
  'pending',
  'accepted',
  'ready_for_dispatch',
  'shipped',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
];

// Terminal states that cannot transition further
const TERMINAL_STATUSES = ['delivered', 'rejected', 'cancelled'];

// Sequential stages in an active delivery lifecycle
const DELIVERY_STAGES = [
  'pending',
  'accepted',
  'ready_for_dispatch',
  'shipped',
  'out_for_delivery',
  'delivered'
];

// Valid strict status transitions
const VALID_TRANSITIONS = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['ready_for_dispatch', 'cancelled'],
  ready_for_dispatch: ['shipped'],
  shipped: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  rejected: [],
  cancelled: []
};

// Human-friendly labels for each stage
const STATUS_LABELS = {
  pending: 'Pending Review',
  accepted: 'Order Accepted',
  ready_for_dispatch: 'Ready for Dispatch',
  shipped: 'Shipped',
  out_for_delivery: 'Out for Delivery',
  delivered: 'Delivered',
  rejected: 'Declined',
  cancelled: 'Cancelled'
};

// Next action labels for farmer order management
const FARMER_NEXT_ACTIONS = {
  pending: [
    { targetStatus: 'accepted', label: 'Accept Order', variant: 'primary' },
    { targetStatus: 'rejected', label: 'Decline Order', variant: 'danger' }
  ],
  accepted: [
    { targetStatus: 'ready_for_dispatch', label: 'Mark Ready for Dispatch', variant: 'primary' }
  ],
  ready_for_dispatch: [
    { targetStatus: 'shipped', label: 'Mark Shipped', variant: 'primary' }
  ],
  shipped: [
    { targetStatus: 'out_for_delivery', label: 'Mark Out for Delivery', variant: 'primary' }
  ],
  out_for_delivery: [
    { targetStatus: 'delivered', label: 'Mark Delivered', variant: 'success' }
  ]
};

// Payment lifecycle statuses and valid transition rules (Phase 6E)
const PAYMENT_STATUSES = [
  'payment_pending',
  'paid',
  'payment_failed',
  'failed',
  'refund_pending',
  'refunded'
];

const VALID_PAYMENT_TRANSITIONS = {
  payment_pending: ['paid', 'payment_failed', 'failed'],
  payment_failed: ['paid', 'payment_failed'],
  failed: ['paid', 'payment_failed'],
  paid: ['refund_pending', 'refunded'],
  refund_pending: ['refunded', 'paid'],
  refunded: []
};

const PAYMENT_LABELS = {
  payment_pending: 'Payment Pending',
  paid: 'Paid & Cleared',
  payment_failed: 'Payment Failed',
  failed: 'Payment Failed',
  refund_pending: 'Refund Pending',
  refunded: 'Refund Processed'
};

module.exports = {
  ORDER_STATUSES,
  TERMINAL_STATUSES,
  DELIVERY_STAGES,
  VALID_TRANSITIONS,
  STATUS_LABELS,
  FARMER_NEXT_ACTIONS,
  PAYMENT_STATUSES,
  VALID_PAYMENT_TRANSITIONS,
  PAYMENT_LABELS
};

