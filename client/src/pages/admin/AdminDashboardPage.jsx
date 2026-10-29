import { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Users,
  Package,
  ShoppingBag,
  FileText,
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  UserX,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  CreditCard,
  Lock,
  Loader2
} from 'lucide-react';
import adminService from '../../services/admin.service';
import EmptyState from '../../components/common/EmptyState';
import Modal from '../../components/common/Modal';

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'products' | 'orders' | 'audit'

  // Overview State
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState(null);

  // Users State
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState(null);
  const [usersPage, setUsersPage] = useState(1);
  const [usersPagination, setUsersPagination] = useState({ total: 0, pages: 1 });
  const [usersSearch, setUsersSearch] = useState('');
  const [usersRoleFilter, setUsersRoleFilter] = useState('all');
  const [usersStatusFilter, setUsersStatusFilter] = useState('all');

  // Products State
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [productsPage, setProductsPage] = useState(1);
  const [productsPagination, setProductsPagination] = useState({ total: 0, pages: 1 });
  const [productsSearch, setProductsSearch] = useState('');
  const [productsStatusFilter, setProductsStatusFilter] = useState('all');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState(null);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPagination, setOrdersPagination] = useState({ total: 0, pages: 1 });
  const [ordersSearch, setOrdersSearch] = useState('');
  const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
  const [ordersPaymentFilter, setOrdersPaymentFilter] = useState('all');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const [auditPage, setAuditPage] = useState(1);
  const [auditPagination, setAuditPagination] = useState({ total: 0, pages: 1 });
  const [auditTypeFilter, setAuditTypeFilter] = useState('all');

  // Interactive Action Modals
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalType, setModalType] = useState(''); // 'user_status' | 'product_moderation'
  const [selectedItem, setSelectedItem] = useState(null);
  const [actionTargetStatus, setActionTargetStatus] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Load Overview Data
  const loadOverview = useCallback(async () => {
    try {
      setOverviewLoading(true);
      setOverviewError(null);
      const res = await adminService.getOverview();
      if (res && res.success) {
        setOverview(res.data);
      }
    } catch (err) {
      setOverviewError(err.message || 'Failed to load operational overview.');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // Load Users Data
  const loadUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await adminService.getUsers({
        page: usersPage,
        limit: 12,
        q: usersSearch,
        role: usersRoleFilter,
        status: usersStatusFilter
      });
      if (res && res.success) {
        setUsers(res.data || []);
        setUsersPagination(res.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      setUsersError(err.message || 'Failed to fetch users list.');
    } finally {
      setUsersLoading(false);
    }
  }, [usersPage, usersSearch, usersRoleFilter, usersStatusFilter]);

  // Load Products Data
  const loadProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const res = await adminService.getProducts({
        page: productsPage,
        limit: 12,
        q: productsSearch,
        status: productsStatusFilter
      });
      if (res && res.success) {
        setProducts(res.data || []);
        setProductsPagination(res.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      setProductsError(err.message || 'Failed to fetch produce listings.');
    } finally {
      setProductsLoading(false);
    }
  }, [productsPage, productsSearch, productsStatusFilter]);

  // Load Orders Data
  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      setOrdersError(null);
      const res = await adminService.getOrders({
        page: ordersPage,
        limit: 12,
        q: ordersSearch,
        status: ordersStatusFilter,
        paymentStatus: ordersPaymentFilter
      });
      if (res && res.success) {
        setOrders(res.data || []);
        setOrdersPagination(res.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      setOrdersError(err.message || 'Failed to fetch marketplace orders.');
    } finally {
      setOrdersLoading(false);
    }
  }, [ordersPage, ordersSearch, ordersStatusFilter, ordersPaymentFilter]);

  // Load Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      setAuditLoading(true);
      setAuditError(null);
      const res = await adminService.getAuditLogs({
        page: auditPage,
        limit: 15,
        targetType: auditTypeFilter
      });
      if (res && res.success) {
        setAuditLogs(res.data || []);
        setAuditPagination(res.pagination || { total: 0, pages: 1 });
      }
    } catch (err) {
      setAuditError(err.message || 'Failed to fetch audit log records.');
    } finally {
      setAuditLoading(false);
    }
  }, [auditPage, auditTypeFilter]);

  // Tab switching effect
  useEffect(() => {
    if (activeTab === 'overview') loadOverview();
    if (activeTab === 'users') loadUsers();
    if (activeTab === 'products') loadProducts();
    if (activeTab === 'orders') loadOrders();
    if (activeTab === 'audit') loadAuditLogs();
  }, [activeTab, loadOverview, loadUsers, loadProducts, loadOrders, loadAuditLogs]);

  // Handle User Status Change Submission
  const handleUserStatusSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !actionTargetStatus) return;

    try {
      setActionSubmitting(true);
      setActionError(null);
      await adminService.updateUserStatus(selectedItem._id, {
        status: actionTargetStatus,
        reason: actionReason.trim()
      });
      setActionModalOpen(false);
      loadUsers();
      loadOverview();
    } catch (err) {
      setActionError(err.message || 'Failed to update user account status.');
    } finally {
      setActionSubmitting(false);
    }
  };

  // Handle Product Moderation Submission
  const handleProductModerationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItem || !actionTargetStatus) return;

    if (!actionReason.trim() || actionReason.trim().length < 5) {
      setActionError('Please provide a descriptive moderation reason (min 5 characters).');
      return;
    }

    try {
      setActionSubmitting(true);
      setActionError(null);
      await adminService.moderateProduct(selectedItem._id, {
        action: actionTargetStatus, // 'suspend' | 'reinstate'
        reason: actionReason.trim()
      });
      setActionModalOpen(false);
      loadProducts();
      loadOverview();
    } catch (err) {
      setActionError(err.message || 'Failed to moderate product listing.');
    } finally {
      setActionSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f5] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Banner */}
        <div className="p-6 rounded-3xl bg-gradient-to-r from-stone-900 via-[#164e3b] to-stone-900 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider mb-2 border border-emerald-400/30">
                <Shield className="w-3.5 h-3.5" />
                <span>Admin Operations Portal</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Marketplace Operational Control
              </h1>
              <p className="text-stone-300 text-xs sm:text-sm mt-1 max-w-xl">
                Server-enforced operational management for users, agricultural produce lots, orders,
                settlements, and tamper-evident audit trails.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (activeTab === 'overview') loadOverview();
                  if (activeTab === 'users') loadUsers();
                  if (activeTab === 'products') loadProducts();
                  if (activeTab === 'orders') loadOrders();
                  if (activeTab === 'audit') loadAuditLogs();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/20 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Data</span>
              </button>
            </div>
          </div>
          {/* Subtle decorative glow */}
          <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-2 border-b border-stone-200">
          {[
            { id: 'overview', label: 'Operational Overview', icon: TrendingUp },
            { id: 'users', label: 'User Directory', icon: Users },
            { id: 'products', label: 'Produce Listings & Moderation', icon: Package },
            { id: 'orders', label: 'Orders & Payments', icon: ShoppingBag },
            { id: 'audit', label: 'Audit Trail Logs', icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#164e3b] text-white shadow-md shadow-emerald-950/15'
                    : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-300' : 'text-stone-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OPERATIONAL OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {overviewLoading ? (
              <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-700" />
                <span className="text-sm font-semibold">Aggregating real operational metrics...</span>
              </div>
            ) : overviewError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
                {overviewError}
              </div>
            ) : overview ? (
              <div className="space-y-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Users Metric */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <span>Total Registered Users</span>
                      <Users className="w-4 h-4 text-emerald-700" />
                    </div>
                    <p className="text-3xl font-black text-stone-900">{overview.users.total}</p>
                    <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-100">
                      <div>Farmers: <strong>{overview.users.farmers}</strong> • Buyers: <strong>{overview.users.buyers}</strong></div>
                      <div>Suspended Accounts: <strong className="text-rose-700">{overview.users.suspended}</strong></div>
                    </div>
                  </div>

                  {/* Listings Metric */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <span>Crop Listings</span>
                      <Package className="w-4 h-4 text-amber-700" />
                    </div>
                    <p className="text-3xl font-black text-stone-900">{overview.products.total}</p>
                    <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-100">
                      <div>Active in Marketplace: <strong className="text-emerald-700">{overview.products.active}</strong></div>
                      <div>Moderation Suspended: <strong className="text-rose-700">{overview.products.suspended}</strong></div>
                    </div>
                  </div>

                  {/* Orders Metric */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <span>Marketplace Orders</span>
                      <ShoppingBag className="w-4 h-4 text-teal-700" />
                    </div>
                    <p className="text-3xl font-black text-stone-900">{overview.orders.total}</p>
                    <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-100">
                      <div>Pending / In Progress: <strong>{overview.orders.pending + overview.orders.accepted}</strong></div>
                      <div>Completed / Delivered: <strong className="text-emerald-700">{overview.orders.delivered}</strong></div>
                    </div>
                  </div>

                  {/* Unresolved Issues Metric */}
                  <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
                      <span>Unresolved Issues</span>
                      <AlertTriangle className={`w-4 h-4 ${overview.unresolvedIssuesCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
                    </div>
                    <p className={`text-3xl font-black ${overview.unresolvedIssuesCount > 0 ? 'text-rose-600' : 'text-stone-900'}`}>
                      {overview.unresolvedIssuesCount}
                    </p>
                    <div className="text-[11px] text-stone-500 space-y-0.5 pt-1 border-t border-stone-100">
                      <div>Payment Failures: <strong>{overview.payments.failed}</strong></div>
                      <div>Refunds Pending: <strong>{overview.payments.refundPending}</strong></div>
                    </div>
                  </div>
                </div>

                {/* Recent Audit Activities */}
                <div className="p-6 rounded-3xl bg-white border border-stone-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-emerald-700" />
                      <h2 className="text-base font-extrabold text-stone-900">
                        Recent Administrative Audit Trail
                      </h2>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('audit')}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View full audit log</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {overview.recentAuditLogs && overview.recentAuditLogs.length > 0 ? (
                    <div className="divide-y divide-stone-100">
                      {overview.recentAuditLogs.map((log) => (
                        <div key={log._id} className="py-3 flex items-start justify-between gap-4 text-xs">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">{log.action}</span>
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 font-mono text-[10px]">
                                {log.targetType} #{log.targetId ? log.targetId.slice(-6) : ''}
                              </span>
                            </div>
                            <p className="text-stone-500 text-[11px] mt-0.5">
                              Actor: {log.actorEmail} • {log.details?.reason || log.details?.note || 'Administrative action'}
                            </p>
                          </div>
                          <span className="text-stone-400 text-[11px] shrink-0 font-mono">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-stone-400 py-4 text-center">
                      No administrative audit entries recorded yet.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: USER DIRECTORY & STATUS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search user by name, email, phone..."
                  value={usersSearch}
                  onChange={(e) => {
                    setUsersSearch(e.target.value);
                    setUsersPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={usersRoleFilter}
                  onChange={(e) => {
                    setUsersRoleFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                >
                  <option value="all">All Roles</option>
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                  <option value="wholesaler">Wholesaler</option>
                  <option value="retailer">Retailer</option>
                  <option value="admin">Administrator</option>
                </select>

                <select
                  value={usersStatusFilter}
                  onChange={(e) => {
                    setUsersStatusFilter(e.target.value);
                    setUsersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            {usersLoading ? (
              <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <span className="text-xs font-semibold">Loading user records...</span>
              </div>
            ) : usersError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {usersError}
              </div>
            ) : users.length === 0 ? (
              <EmptyState
                title="No Users Found"
                description="No user records matched your search query or filter criteria."
              />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#faf9f5] border-b border-stone-200 text-stone-600 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">User</th>
                        <th className="py-3 px-4">Contact</th>
                        <th className="py-3 px-4">Role</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Joined</th>
                        <th className="py-3 px-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {users.map((u) => (
                        <tr key={u._id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-stone-900">{u.name}</p>
                            <p className="text-[11px] text-stone-500 font-mono">{u.email}</p>
                          </td>
                          <td className="py-3 px-4 font-mono text-stone-600">
                            {u.phone || 'N/A'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 text-[10px] font-bold uppercase tracking-wider">
                              {u.role}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                u.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : 'bg-rose-100 text-rose-900'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-500 text-[11px]">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {u.role !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(u);
                                  setModalType('user_status');
                                  setActionTargetStatus(u.status === 'active' ? 'suspended' : 'active');
                                  setActionReason('');
                                  setActionError(null);
                                  setActionModalOpen(true);
                                }}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
                                  u.status === 'active'
                                    ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend User' : 'Activate User'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 bg-[#faf9f5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Showing {users.length} of {usersPagination.total} users
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={usersPage <= 1}
                      onClick={() => setUsersPage((p) => p - 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-stone-700">
                      Page {usersPage} of {usersPagination.pages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={usersPage >= usersPagination.pages}
                      onClick={() => setUsersPage((p) => p + 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PRODUCE LISTINGS & MODERATION */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search produce by name..."
                  value={productsSearch}
                  onChange={(e) => {
                    setProductsSearch(e.target.value);
                    setProductsPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={productsStatusFilter}
                  onChange={(e) => {
                    setProductsStatusFilter(e.target.value);
                    setProductsPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>

            {/* Products Table */}
            {productsLoading ? (
              <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <span className="text-xs font-semibold">Loading product listings...</span>
              </div>
            ) : productsError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {productsError}
              </div>
            ) : products.length === 0 ? (
              <EmptyState
                title="No Produce Found"
                description="No produce listings match the selected filters."
              />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#faf9f5] border-b border-stone-200 text-stone-600 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Produce Lot</th>
                        <th className="py-3 px-4">Producer (Farmer)</th>
                        <th className="py-3 px-4">Price / Stock</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Moderation Details</th>
                        <th className="py-3 px-4 text-right">Moderation Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((p) => (
                        <tr key={p._id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-stone-900">{p.name}</p>
                            <p className="text-[11px] text-stone-500">
                              {p.variety ? `${p.variety} • ` : ''}{p.qualityGrade || 'Grade A'}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-800">{p.owner?.name || 'Unknown'}</p>
                            <p className="text-[11px] text-stone-500">{p.owner?.email || ''}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-extrabold text-emerald-800">
                              ₹{p.price}/{p.unit}
                            </p>
                            <p className="text-[11px] text-stone-500">
                              {p.quantity} {p.unit} available
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                p.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : p.status === 'suspended'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-stone-500 max-w-xs">
                            {p.moderation?.reason ? (
                              <div>
                                <span className="font-semibold text-stone-700">Reason: </span>
                                <span>{p.moderation.reason}</span>
                              </div>
                            ) : (
                              <span className="italic text-stone-400">Standard listing</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {p.status === 'suspended' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(p);
                                  setModalType('product_moderation');
                                  setActionTargetStatus('reinstate');
                                  setActionReason('');
                                  setActionError(null);
                                  setActionModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 cursor-pointer"
                              >
                                Reinstate Listing
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedItem(p);
                                  setModalType('product_moderation');
                                  setActionTargetStatus('suspend');
                                  setActionReason('');
                                  setActionError(null);
                                  setActionModalOpen(true);
                                }}
                                className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
                              >
                                Suspend Listing
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 bg-[#faf9f5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Showing {products.length} of {productsPagination.total} produce listings
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={productsPage <= 1}
                      onClick={() => setProductsPage((p) => p - 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-stone-700">
                      Page {productsPage} of {productsPagination.pages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={productsPage >= productsPagination.pages}
                      onClick={() => setProductsPage((p) => p + 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: ORDERS & SETTLEMENT VISIBILITY */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {/* Search & Filters */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search order by order number or notes..."
                  value={ordersSearch}
                  onChange={(e) => {
                    setOrdersSearch(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={ordersStatusFilter}
                  onChange={(e) => {
                    setOrdersStatusFilter(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                >
                  <option value="all">All Order Stages</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <select
                  value={ordersPaymentFilter}
                  onChange={(e) => {
                    setOrdersPaymentFilter(e.target.value);
                    setOrdersPage(1);
                  }}
                  className="px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
                >
                  <option value="all">All Payment States</option>
                  <option value="paid">Paid</option>
                  <option value="payment_pending">Payment Pending</option>
                  <option value="payment_failed">Payment Failed</option>
                  <option value="refund_pending">Refund Pending</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>

            {/* Orders Table */}
            {ordersLoading ? (
              <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <span className="text-xs font-semibold">Loading marketplace orders...</span>
              </div>
            ) : ordersError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {ordersError}
              </div>
            ) : orders.length === 0 ? (
              <EmptyState
                title="No Orders Found"
                description="No orders match your filter criteria."
              />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#faf9f5] border-b border-stone-200 text-stone-600 font-extrabold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Parties</th>
                        <th className="py-3 px-4">Total Amount</th>
                        <th className="py-3 px-4">Fulfilment Stage</th>
                        <th className="py-3 px-4">Payment State</th>
                        <th className="py-3 px-4">Fulfilment Record</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {orders.map((o) => (
                        <tr key={o._id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-stone-900">
                            #{o.orderNumber || o._id.slice(-6)}
                            <p className="text-[10px] text-stone-400 font-normal">
                              {new Date(o.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-stone-800">Buyer: {o.buyer?.name || 'N/A'}</p>
                            <p className="text-stone-500 text-[11px]">Farmer: {o.farmer?.name || 'N/A'}</p>
                          </td>
                          <td className="py-3 px-4 font-extrabold text-stone-900">
                            ₹{o.totalAmount?.toLocaleString('en-IN')}
                            <p className="text-[10px] font-normal text-stone-500">
                              {o.requestedQuantity} {o.unit}
                            </p>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[10px] font-extrabold uppercase tracking-wider">
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                                o.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-900'
                                  : o.paymentStatus === 'payment_failed' || o.paymentStatus === 'failed'
                                  ? 'bg-rose-100 text-rose-900'
                                  : 'bg-amber-100 text-amber-900'
                              }`}
                            >
                              {o.paymentStatus}
                            </span>
                            <p className="text-[10px] text-stone-500 mt-0.5">
                              {o.paymentMethod || 'Direct Mandi'}
                            </p>
                          </td>
                          <td className="py-3 px-4 text-[11px] text-stone-500">
                            {o.fulfilment?.transporterName ? (
                              <div>
                                <span className="font-semibold text-stone-700">{o.fulfilment.transporterName}</span>
                                {o.fulfilment.vehicleNumber && <span> ({o.fulfilment.vehicleNumber})</span>}
                              </div>
                            ) : (
                              <span className="italic text-stone-400">No transport note</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="p-3 bg-[#faf9f5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Showing {orders.length} of {ordersPagination.total} orders
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={ordersPage <= 1}
                      onClick={() => setOrdersPage((p) => p - 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-stone-700">
                      Page {ordersPage} of {ordersPagination.pages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={ordersPage >= ordersPagination.pages}
                      onClick={() => setOrdersPage((p) => p + 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT TRAIL LOGS */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Filter */}
            <div className="p-4 rounded-2xl bg-white border border-stone-200 shadow-xs flex items-center justify-between">
              <span className="text-xs font-bold text-stone-700">Audit Target Type:</span>
              <select
                value={auditTypeFilter}
                onChange={(e) => {
                  setAuditTypeFilter(e.target.value);
                  setAuditPage(1);
                }}
                className="px-3 py-1.5 rounded-xl border border-stone-300 text-xs text-stone-700 bg-white"
              >
                <option value="all">All Targets</option>
                <option value="User">User</option>
                <option value="Product">Product</option>
                <option value="Order">Order</option>
              </select>
            </div>

            {/* Audit Logs List */}
            {auditLoading ? (
              <div className="p-12 text-center text-stone-500 flex flex-col items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-700" />
                <span className="text-xs font-semibold">Loading immutable audit log...</span>
              </div>
            ) : auditError ? (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {auditError}
              </div>
            ) : auditLogs.length === 0 ? (
              <EmptyState
                title="No Audit Logs"
                description="No administrative mutations have been logged under the selected criteria."
              />
            ) : (
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {auditLogs.map((log) => (
                    <div key={log._id} className="p-4 text-xs space-y-1 hover:bg-stone-50/70 transition-colors">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 text-white font-mono text-[10px] font-bold">
                            {log.action}
                          </span>
                          <span className="text-stone-700 font-extrabold">
                            Target: {log.targetType} #{log.targetId}
                          </span>
                        </div>
                        <span className="text-stone-400 font-mono text-[11px]">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-stone-500 text-[11px]">
                        <span>Actor: <strong>{log.actorEmail}</strong></span>
                        {log.ip && <span> • IP: {log.ip}</span>}
                      </div>
                      {log.details && (
                        <div className="p-2 rounded-lg bg-stone-50 border border-stone-100 font-mono text-[10px] text-stone-600 mt-1">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="p-3 bg-[#faf9f5] border-t border-stone-200 flex items-center justify-between text-xs text-stone-500">
                  <span>
                    Showing {auditLogs.length} of {auditPagination.total} audit entries
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={auditPage <= 1}
                      onClick={() => setAuditPage((p) => p - 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-2 font-bold text-stone-700">
                      Page {auditPage} of {auditPagination.pages || 1}
                    </span>
                    <button
                      type="button"
                      disabled={auditPage >= auditPagination.pages}
                      onClick={() => setAuditPage((p) => p + 1)}
                      className="p-1 rounded-lg border border-stone-200 bg-white disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Confirmation Modal */}
        {actionModalOpen && (
          <Modal
            isOpen={actionModalOpen}
            onClose={() => setActionModalOpen(false)}
            title={
              modalType === 'user_status'
                ? `Confirm User ${actionTargetStatus === 'suspended' ? 'Suspension' : 'Activation'}`
                : `Confirm Produce Listing ${actionTargetStatus === 'suspend' ? 'Suspension' : 'Reinstatement'}`
            }
          >
            <form
              onSubmit={
                modalType === 'user_status'
                  ? handleUserStatusSubmit
                  : handleProductModerationSubmit
              }
              className="space-y-4 text-xs"
            >
              {actionError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                  {actionError}
                </div>
              )}

              <p className="text-stone-700">
                You are about to transition{' '}
                <strong>
                  {modalType === 'user_status' ? selectedItem?.name : selectedItem?.name}
                </strong>{' '}
                to status <strong className="uppercase">{actionTargetStatus}</strong>.
              </p>

              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Reason for Action (Recorded in Audit Trail):
                </label>
                <textarea
                  required
                  rows={3}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Provide an honest, specific operational reason (minimum 5 characters)..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionSubmitting}
                  className={`px-4 py-2 rounded-xl text-white font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer ${
                    actionTargetStatus === 'suspended' || actionTargetStatus === 'suspend'
                      ? 'bg-rose-700 hover:bg-rose-800'
                      : 'bg-[#164e3b] hover:bg-[#123826]'
                  }`}
                >
                  {actionSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : null}
                  <span>Confirm Action</span>
                </button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
}
