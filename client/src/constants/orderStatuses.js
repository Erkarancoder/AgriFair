/**
 * AgriFair Frontend Order Statuses & Timeline Constants
 * Phase 4C: Real Order Tracking & Status Timeline
 */

export const ORDER_STATUSES = [
  'pending',
  'accepted',
  'ready_for_dispatch',
  'shipped',
  'out_for_delivery',
  'delivered',
  'rejected',
  'cancelled'
];

export const TERMINAL_STATUSES = ['delivered', 'rejected', 'cancelled'];

// 6 sequential stages representing a genuine order lifecycle
export const DELIVERY_STAGES = [
  {
    key: 'pending',
    title: 'Order Placed',
    subtitle: 'Purchase inquiry logged in database',
    shortLabel: 'Pending'
  },
  {
    key: 'accepted',
    title: 'Confirmed by Producer',
    subtitle: 'Farmer accepted batch allocation',
    shortLabel: 'Accepted'
  },
  {
    key: 'ready_for_dispatch',
    title: 'Ready for Dispatch',
    subtitle: 'Produce inspected, bagged & packed at farm/mandi',
    shortLabel: 'Packed'
  },
  {
    key: 'shipped',
    title: 'Shipped / Dispatched',
    subtitle: 'Consignment handed to transit carrier',
    shortLabel: 'Shipped'
  },
  {
    key: 'out_for_delivery',
    title: 'Out for Delivery',
    subtitle: 'Arrived at local destination hub for final delivery',
    shortLabel: 'Out for Delivery'
  },
  {
    key: 'delivered',
    title: 'Delivered',
    subtitle: 'Produce received and confirmed at destination',
    shortLabel: 'Delivered'
  }
];

export const STATUS_CONFIG = {
  pending: {
    label: 'Pending Review',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-200',
    dotClass: 'bg-amber-500',
    iconName: 'Clock'
  },
  accepted: {
    label: 'Order Accepted',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    dotClass: 'bg-emerald-500',
    iconName: 'CheckCircle2'
  },
  ready_for_dispatch: {
    label: 'Ready for Dispatch',
    badgeClass: 'bg-indigo-100 text-indigo-900 border-indigo-200',
    dotClass: 'bg-indigo-500',
    iconName: 'PackageCheck'
  },
  shipped: {
    label: 'Shipped in Transit',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-200',
    dotClass: 'bg-blue-500',
    iconName: 'Truck'
  },
  out_for_delivery: {
    label: 'Out for Delivery',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-200',
    dotClass: 'bg-purple-500',
    iconName: 'Navigation'
  },
  delivered: {
    label: 'Delivered',
    badgeClass: 'bg-emerald-100 text-[#164e3b] border-emerald-300 font-extrabold',
    dotClass: 'bg-emerald-600',
    iconName: 'CheckCheck'
  },
  rejected: {
    label: 'Declined',
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-200',
    dotClass: 'bg-rose-500',
    iconName: 'XCircle'
  },
  cancelled: {
    label: 'Cancelled',
    badgeClass: 'bg-stone-100 text-stone-700 border-stone-200',
    dotClass: 'bg-stone-500',
    iconName: 'Ban'
  }
};

/**
 * Returns the single next valid stage for the farmer
 */
export const getFarmerNextAction = (currentStatus) => {
  switch (currentStatus) {
    case 'accepted':
      return {
        nextStatus: 'ready_for_dispatch',
        buttonLabel: 'Mark Ready for Dispatch',
        modalTitle: 'Ready for Dispatch Confirmation',
        promptText: 'Confirm that this agricultural lot has been harvested, quality-checked, and packaged for carrier dispatch.',
        placeholder: 'e.g. 50 bags packed and tagged at Ludhiana mandi warehouse.'
      };
    case 'ready_for_dispatch':
      return {
        nextStatus: 'shipped',
        buttonLabel: 'Mark Shipped / In Transit',
        modalTitle: 'Shipment Dispatch Confirmation',
        promptText: 'Confirm that the produce batch has left your farm/facility and is in active transit to the buyer.',
        placeholder: 'e.g. Dispatched via tractor-trailer / local freight carrier.'
      };
    case 'shipped':
      return {
        nextStatus: 'out_for_delivery',
        buttonLabel: 'Mark Out for Delivery',
        modalTitle: 'Out for Delivery Confirmation',
        promptText: 'Confirm that the shipment has arrived at the destination distribution mandi or local dock.',
        placeholder: 'e.g. Arrived at destination city mandi terminal, unloading in progress.'
      };
    case 'out_for_delivery':
      return {
        nextStatus: 'delivered',
        buttonLabel: 'Mark Delivered',
        modalTitle: 'Delivery Completion Confirmation',
        promptText: 'Confirm final handover of produce to the buyer. This will finalize the order lifecycle.',
        placeholder: 'e.g. Lot received and signed off by buyer at destination warehouse.'
      };
    default:
      return null;
  }
};
