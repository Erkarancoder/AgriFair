import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  Check,
  ShoppingBag,
  CreditCard,
  MessageSquare,
  Info,
  Clock,
  Loader2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import notificationService from '../../services/notification.service';
import socketService from '../../services/socket.service';

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}d ago`;
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'order':
      return <ShoppingBag className="w-4 h-4 text-emerald-700" />;
    case 'payment':
      return <CreditCard className="w-4 h-4 text-amber-700" />;
    case 'negotiation':
      return <MessageSquare className="w-4 h-4 text-teal-700" />;
    default:
      return <Info className="w-4 h-4 text-stone-600" />;
  }
};

export default function NotificationBell({ isAuthenticated }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const dropdownRef = useRef(null);

  // Load unread count and latest notifications
  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const [listRes, countRes] = await Promise.all([
        notificationService.getNotifications({ limit: 15 }),
        notificationService.getUnreadCount()
      ]);

      if (listRes && listRes.success) {
        setNotifications(listRes.notifications || []);
      }
      if (countRes && countRes.success) {
        setUnreadCount(countRes.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[NotificationBell] Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Initial load and periodic refresh
  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotifications();

    // Listen for live socket notifications
    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev.filter((n) => n._id !== notif._id)]);
      setUnreadCount((prev) => prev + 1);
    };

    socketService.on('notification:new', handleNewNotification);

    return () => {
      socketService.off('notification:new', handleNewNotification);
    };
  }, [isAuthenticated, loadNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleItemClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await notificationService.markAsRead(notif._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.warn('Failed to mark read:', err);
      }
    }
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isAuthenticated) return null;

  const displayedList =
    activeTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-stone-200 bg-white hover:border-emerald-500/60 hover:bg-stone-50 transition-all text-stone-700 shadow-2xs group focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
        title="Notifications & Alerts"
        aria-label="View notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4 text-stone-700 group-hover:text-[#164e3b] transition-colors" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-xs animate-in zoom-in duration-150">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-stone-200/90 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="p-3.5 bg-[#faf9f5] border-b border-stone-200/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-stone-900">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-[#164e3b] text-[10px] font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={markingAll}
                className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 transition-colors cursor-pointer"
              >
                {markingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-stone-100 bg-white px-3 pt-2 text-xs font-semibold gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'all'
                  ? 'border-emerald-700 text-[#164e3b] font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`pb-2 transition-colors border-b-2 cursor-pointer ${
                activeTab === 'unread'
                  ? 'border-emerald-700 text-[#164e3b] font-bold'
                  : 'border-transparent text-stone-500 hover:text-stone-800'
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                <span>Loading notifications...</span>
              </div>
            ) : displayedList.length === 0 ? (
              <div className="p-8 text-center text-xs text-stone-500 flex flex-col items-center justify-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <p className="font-bold text-stone-800 text-sm">All caught up!</p>
                <p className="text-[11px] text-stone-500 max-w-xs">
                  {activeTab === 'unread'
                    ? 'No unread notifications right now.'
                    : 'Order, payment, and price negotiation updates will appear here in real-time.'}
                </p>
              </div>
            ) : (
              displayedList.map((notif) => (
                <div
                  key={notif._id}
                  onClick={() => handleItemClick(notif)}
                  className={`p-3.5 transition-colors cursor-pointer flex items-start gap-3 hover:bg-stone-50 ${
                    !notif.isRead ? 'bg-emerald-50/40' : 'bg-white'
                  }`}
                >
                  {/* Icon badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border ${
                      !notif.isRead
                        ? 'bg-emerald-100/70 border-emerald-300'
                        : 'bg-stone-100 border-stone-200'
                    }`}
                  >
                    {getTypeIcon(notif.type)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={`text-xs truncate ${
                          !notif.isRead
                            ? 'font-extrabold text-stone-900'
                            : 'font-semibold text-stone-700'
                        }`}
                      >
                        {notif.title}
                      </p>
                      {!notif.isRead && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-stone-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(notif.createdAt)}
                      </span>
                      {notif.link && (
                        <span className="text-emerald-700 flex items-center gap-0.5 font-bold hover:underline">
                          View details <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with honest status */}
          <div className="p-2.5 bg-[#faf9f5] border-t border-stone-200/70 text-[10px] text-stone-500 flex items-center justify-between px-3">
            <span className="flex items-center gap-1 font-semibold text-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              In-App Alerts Active • Live Sync
            </span>
            <button
              type="button"
              onClick={() => {
                loadNotifications();
              }}
              className="text-stone-500 hover:text-stone-800 font-bold hover:underline cursor-pointer"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
