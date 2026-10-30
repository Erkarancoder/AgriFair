import { useState, useEffect, useMemo } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Tractor,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Store,
  Info,
  UploadCloud,
  Image as ImageIcon,
  X,
  Loader2
} from 'lucide-react';
import Breadcrumbs from '../../components/common/Breadcrumbs';
import Modal from '../../components/common/Modal';
import MandiRateModal from '../../components/mandi/MandiRateModal';
import { ROUTES } from '../../constants/routes';
import catalogService from '../../services/catalog.service';

const ALLOWED_UNITS = [
  { value: 'quintal', label: 'Quintal (100 kg)' },
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'ton', label: 'Metric Ton' },
  { value: 'box', label: 'Box' },
  { value: 'crate', label: 'Crate' },
  { value: 'bag', label: 'Standard Bag (50kg)' },
  { value: 'bale', label: 'Bale' }
];

const INITIAL_FORM = {
  name: '',
  variety: '',
  qualityGrade: '',
  minOrderQuantity: '1',
  description: '',
  categoryId: '',
  price: '',
  quantity: '',
  unit: 'quintal',
  pincode: '',
  state: '',
  district: '',
  village: '',
  mandi: '',
  status: 'active'
};

export default function FarmerListingsPage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reloadIndex, setReloadIndex] = useState(0);
  const [isMandiModalOpen, setIsMandiModalOpen] = useState(false);

  // Real Storage Provider state
  const [storageStatus, setStorageStatus] = useState(null);

  // Form modal state (Create / Edit)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successBanner, setSuccessBanner] = useState('');
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [villageOptions, setVillageOptions] = useState([]);
  const [locationSuccessNote, setLocationSuccessNote] = useState('');

  // Image Upload state
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [imageUploadError, setImageUploadError] = useState('');
  const [existingImageAssets, setExistingImageAssets] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  // Delete confirmation modal state
  const [deleteProductTarget, setDeleteProductTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Fetch storage configuration status once on mount
  useEffect(() => {
    let ignore = false;
    catalogService
      .getStorageStatus()
      .then((res) => {
        if (!ignore && res && res.data) {
          setStorageStatus(res.data);
        }
      })
      .catch((err) => {
        console.warn('[FarmerListingsPage] Could not retrieve storage status:', err.message);
      });

    return () => {
      ignore = true;
    };
  }, []);

  // Fetch farmer's own products and active categories
  useEffect(() => {
    let ignore = false;

    Promise.all([
      catalogService.getMyProducts(),
      catalogService.getCategories()
    ])
      .then(([prodRes, catRes]) => {
        if (!ignore) {
          setProducts(prodRes?.data || []);
          setCategories(catRes?.data || []);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('[FarmerListingsPage] Load failed:', err);
          setError(err.message || 'Failed to load your produce listings.');
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [reloadIndex]);

  const handleRetry = () => {
    setLoading(true);
    setError(null);
    setReloadIndex((prev) => prev + 1);
  };

  // Auto open create modal if navigating to /farmer/sell or ?action=new
  useEffect(() => {
    if (location.pathname === '/farmer/sell' || searchParams.get('action') === 'new') {
      handleOpenCreate();
    }
  }, [location.pathname, searchParams]);

  // Open modal to Create new listing
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      ...INITIAL_FORM,
      categoryId: categories.length > 0 ? categories[0]._id : ''
    });
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageUploadError('');
    setUploadProgress(0);
    setExistingImageAssets([]);
    setExistingImages([]);
    setVillageOptions([]);
    setLocationSuccessNote('');
    setFormError('');
    setIsFormOpen(true);
  };

  // Open modal to Edit existing listing
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      variety: prod.variety || '',
      qualityGrade: prod.qualityGrade || '',
      minOrderQuantity: prod.minOrderQuantity !== undefined ? String(prod.minOrderQuantity) : '1',
      description: prod.description || '',
      categoryId: prod.category?._id || prod.category || '',
      price: prod.price ? String(prod.price) : '',
      quantity: prod.quantity !== undefined ? String(prod.quantity) : '',
      unit: prod.unit || 'quintal',
      pincode: prod.location?.pincode || '',
      state: prod.location?.state || '',
      district: prod.location?.district || '',
      village: prod.location?.village || prod.location?.mandi || '',
      mandi: prod.location?.village || prod.location?.mandi || '',
      status: prod.status || 'active'
    });

    setSelectedImageFile(null);
    setImageUploadError('');
    setUploadProgress(0);
    setVillageOptions([]);
    setLocationSuccessNote(prod.location?.pincode ? `✓ Location: ${prod.location.state}` : '');

    const existingAssets = Array.isArray(prod.imageAssets) ? prod.imageAssets : [];
    const existingImgs = Array.isArray(prod.images) ? prod.images : [];
    setExistingImageAssets(existingAssets);
    setExistingImages(existingImgs);

    if (existingImgs.length > 0) {
      setImagePreviewUrl(existingImgs[0]);
    } else {
      setImagePreviewUrl(null);
    }

    setFormError('');
    setIsFormOpen(true);
  };

  // Local image file selection with validation
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageUploadError('');

    // Format validation
    const validMimes = ['image/jpeg', 'image/png', 'image/webp'];
    const validExts = /\.(jpe?g|png|webp)$/i;
    if (!validMimes.includes(file.type.toLowerCase()) || !validExts.test(file.name)) {
      setImageUploadError(
        'Unsupported format. Please select a valid JPEG, PNG, or WebP image.'
      );
      return;
    }

    // Size validation (5MB max)
    const maxBytes = 5 * 1024 * 1024;
    if (file.size > maxBytes) {
      setImageUploadError(
        `File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 5 MB limit. Please choose a smaller photo.`
      );
      return;
    }

    setSelectedImageFile(file);
    const localUrl = URL.createObjectURL(file);
    setImagePreviewUrl(localUrl);
  };

  // Remove selected/existing image
  const handleRemoveImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
    setImageUploadError('');
    setUploadProgress(0);
    setExistingImageAssets([]);
    setExistingImages([]);
  };

  // Form input change handler
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // PIN Code change handler with automatic real-time location fetch
  const handlePincodeChange = async (e) => {
    const rawVal = e.target.value.replace(/\D/g, '').slice(0, 6);
    setFormData((prev) => ({ ...prev, pincode: rawVal }));
    setLocationSuccessNote('');

    if (rawVal.length === 6) {
      try {
        setFetchingLocation(true);
        const res = await catalogService.lookupPincode(rawVal);
        if (res && res.success && res.data) {
          const { state, district, villages, defaultVillage } = res.data;
          setVillageOptions(villages || []);
          setFormData((prev) => ({
            ...prev,
            state: state || prev.state,
            district: district || prev.district,
            village: defaultVillage || prev.village || villages?.[0] || '',
            mandi: defaultVillage || prev.mandi || villages?.[0] || ''
          }));
          setLocationSuccessNote(`✓ Auto-detected: ${district}, ${state}`);
          window.dispatchEvent(
            new CustomEvent('agrifair:voice_speak', {
              detail: {
                hindiText: `पिन कोड पहचान लिया गया है। राज्य ${state} और जिला ${district} अपने आप भर गया है। अब नीचे अपना गाँव चुन लें।`,
                romanText: `Pincode auto-detected: ${district}, ${state}. Ab apna gaon chunein.`,
                key: `pincode-detected-${rawVal}`
              }
            })
          );
        }
      } catch (err) {
        console.warn('Pincode lookup error:', err.message);
      } finally {
        setFetchingLocation(false);
      }
    }
  };


  // Submit listing form (Create or Update)
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validations
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      setFormError('Product name must be at least 2 characters long.');
      return;
    }
    if (!formData.categoryId) {
      setFormError('Please select a valid agricultural category.');
      return;
    }
    const numPrice = Number(formData.price);
    if (isNaN(numPrice) || numPrice <= 0) {
      setFormError('Please enter a valid price greater than 0.');
      return;
    }
    const numQuantity = Number(formData.quantity);
    if (isNaN(numQuantity) || numQuantity < 0) {
      setFormError('Quantity cannot be negative.');
      return;
    }
    if (!formData.state.trim()) {
      setFormError('State location is required.');
      return;
    }

    try {
      setFormSubmitting(true);

      let finalImageAssets = [...existingImageAssets];
      let finalImages = [...existingImages];

      // Handle real image upload if a file was selected
      if (selectedImageFile) {
        if (!storageStatus?.isConfigured) {
          setFormError(
            'Image storage provider is not configured in server environment. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env, or remove the photo to publish.'
          );
          setFormSubmitting(false);
          return;
        }

        setUploadingImage(true);
        const uploadRes = await catalogService.uploadProductImage(
          selectedImageFile,
          setUploadProgress
        );
        setUploadingImage(false);

        if (uploadRes && uploadRes.success && uploadRes.data) {
          finalImageAssets = [
            {
              url: uploadRes.data.url,
              publicId: uploadRes.data.publicId,
              format: uploadRes.data.format || '',
              bytes: uploadRes.data.bytes || 0
            }
          ];
          finalImages = [uploadRes.data.url];
        } else {
          throw new Error('Image storage provider did not confirm upload.');
        }
      }

      const payload = {
        name: formData.name.trim(),
        variety: formData.variety?.trim() || '',
        qualityGrade: formData.qualityGrade?.trim() || '',
        minOrderQuantity: formData.minOrderQuantity ? Number(formData.minOrderQuantity) : 1,
        description: formData.description.trim(),
        categoryId: formData.categoryId,
        price: numPrice,
        quantity: numQuantity,
        unit: formData.unit,
        location: {
          state: formData.state.trim(),
          district: formData.district.trim(),
          village: (formData.village || formData.mandi || '').trim(),
          pincode: (formData.pincode || '').trim(),
          mandi: (formData.village || formData.mandi || '').trim()
        },
        status: formData.status,
        images: finalImages,
        imageAssets: finalImageAssets
      };


      if (editingProduct) {
        // UPDATE existing listing
        const res = await catalogService.updateProduct(editingProduct._id, payload);
        if (res && res.success && res.data) {
          // Update in local state immediately
          setProducts((prev) =>
            prev.map((item) => (item._id === editingProduct._id ? res.data : item))
          );
          setSuccessBanner(`Listing "${res.data.name}" updated successfully in MongoDB.`);
          setIsFormOpen(false);
        }
      } else {
        // CREATE new listing
        const res = await catalogService.createProduct(payload);
        if (res && res.success && res.data) {
          // Add to local state immediately at the beginning
          setProducts((prev) => [res.data, ...prev]);
          setSuccessBanner(`Listing "${res.data.name}" published live to MongoDB Atlas!`);
          setIsFormOpen(false);
        }
      }
    } catch (err) {
      console.error('[FarmerListingsPage] Submit failed:', err);
      setFormError(err.message || 'Failed to save product listing. Please try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Delete Confirmation
  const handleOpenDelete = (prod) => {
    setDeleteProductTarget(prod);
    setDeleteError('');
  };

  // Execute Delete
  const handleConfirmDelete = async () => {
    if (!deleteProductTarget) return;

    try {
      setDeleting(true);
      setDeleteError('');

      await catalogService.deleteProduct(deleteProductTarget._id);

      // Remove from local state immediately
      setProducts((prev) => prev.filter((p) => p._id !== deleteProductTarget._id));
      setSuccessBanner(`Listing "${deleteProductTarget.name}" removed from MongoDB.`);
      setDeleteProductTarget(null);
    } catch (err) {
      console.error('[FarmerListingsPage] Delete failed:', err);
      setDeleteError(err.message || 'Failed to delete listing. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  // Stats
  const activeCount = useMemo(() => {
    return products.filter((p) => p.status === 'active').length;
  }, [products]);

  const totalQuintals = useMemo(() => {
    return products.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  }, [products]);

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb Navigation */}
      <Breadcrumbs
        items={[
          { label: 'Marketplace', href: ROUTES.MARKETPLACE },
          { label: 'Farmer Produce Listings' }
        ]}
      />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-2">
            <Tractor className="w-3.5 h-3.5" />
            <span>Farmer Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            My Produce Listings
          </h1>
          <p className="text-stone-600 text-sm sm:text-base mt-1.5 max-w-2xl leading-relaxed">
            Manage your live agricultural produce lots stored in MongoDB Atlas. Created lots become immediately discoverable in the public AgriFair marketplace.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => setIsMandiModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-300 bg-emerald-50/90 hover:bg-emerald-100 text-xs sm:text-sm font-bold text-emerald-900 shadow-2xs hover:shadow-xs transition-all"
          >
            <MapPin className="w-4 h-4 text-emerald-700 animate-pulse" />
            <span>Mandi Rates / मंडी भाव</span>
          </button>

          <Link
            to={ROUTES.MARKETPLACE}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs sm:text-sm font-semibold text-stone-700 transition-colors"
          >
            <Store className="w-4 h-4 text-stone-500" />
            <span>View Marketplace</span>
          </Link>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Post New Produce Listing</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex items-center justify-between gap-3 text-xs sm:text-sm shadow-2xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{successBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessBanner('')}
            className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mandi Benchmark Helper Banner */}
      <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-[#164e3b] to-emerald-950 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm border border-emerald-800/60">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/20">
            <MapPin className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Mandi Benchmark Rates (Reference)</span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">APMC Reference</span>
            </h3>
            <p className="text-xs text-emerald-100/80 mt-0.5">
              Check regional arrival rates across Lucknow, Gorakhpur, Delhi, Pune, Bihar & more before pricing your crops.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsMandiModalOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white text-[#164e3b] text-xs font-bold hover:bg-emerald-50 transition-colors shrink-0 shadow-xs"
        >
          <span>Search All Mandis</span>
          <span className="text-emerald-700">→</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Total Listings
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {products.length}
            </span>
            <span className="text-xs text-stone-500">lots in database</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Active Marketplace Lots
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
              {activeCount}
            </span>
            <span className="text-xs text-stone-500">publicly visible</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-2xs">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Total Volume Listed
          </span>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
              {totalQuintals.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-stone-500">total units</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-stone-100 border border-stone-200 rounded-2xl p-5" />
          ))}
        </div>
      )}

      {/* Error State with Retry */}
      {!loading && error && (
        <div className="p-8 rounded-2xl bg-red-50/80 border border-red-200 text-center max-w-xl mx-auto my-12">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-900 mb-2">Failed to Load Listings</h3>
          <p className="text-sm text-red-700 mb-5 leading-relaxed">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] text-white text-xs sm:text-sm font-semibold hover:bg-[#123826] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Connection</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div className="bg-white rounded-3xl border border-stone-200/90 p-10 sm:p-14 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <Tractor className="w-8 h-8 text-emerald-700" />
          </div>
          <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight mb-2">
            No Produce Listings Yet
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed mb-6">
            You haven't published any agricultural produce listings yet. Click the button below to add your first crop to MongoDB Atlas and make it discoverable to buyers.
          </p>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-sm font-bold shadow-xs hover:shadow-md transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create First Produce Listing</span>
          </button>
        </div>
      )}

      {/* Listings Grid */}
      {!loading && !error && products.length > 0 && (
        <div className="space-y-4">
          {products.map((item) => {
            const locationText = [
              item.location?.village || item.location?.mandi,
              item.location?.district,
              item.location?.state
            ]
              .filter(Boolean)
              .join(', ');

            const hasImage = item.images && item.images.length > 0 && item.images[0];

            return (
              <div
                key={item._id}
                className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs hover:shadow-md hover:border-emerald-500/60 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                  {/* Real Image or Neutral Produce Placeholder */}
                  {hasImage ? (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0">
                      <img
                        src={item.images[0]}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex flex-col items-center justify-center text-emerald-800 shrink-0">
                      <Store className="w-6 h-6 text-emerald-600 mb-1" />
                      <span className="text-[10px] font-bold text-emerald-700">No Image</span>
                    </div>
                  )}

                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-bold text-xs">
                        {item.category?.name || 'General Crop'}
                      </span>
                      {item.variety && (
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 text-[11px] font-semibold">
                          Var: {item.variety}
                        </span>
                      )}
                      {item.qualityGrade && (
                        <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-semibold border border-blue-200">
                          Grade {item.qualityGrade}
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                          item.status === 'active'
                            ? 'bg-emerald-100 text-emerald-900'
                            : 'bg-stone-100 text-stone-700'
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-stone-400">
                        Listed on {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg sm:text-xl font-bold text-stone-900">{item.name}</h3>

                    {item.description && (
                      <p className="text-xs sm:text-sm text-stone-600 line-clamp-2 max-w-3xl">
                        {item.description}
                      </p>
                    )}

                    {locationText && (
                      <div className="flex items-center gap-1.5 text-xs text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{locationText}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Side: Rate, Quantity, & Controls */}
                <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-3 md:pt-0 border-t md:border-t-0 border-stone-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs text-stone-500 block">Rate / Unit</span>
                    <span className="text-lg font-extrabold text-stone-900">
                      ₹{item.price?.toLocaleString('en-IN')}{' '}
                      <span className="text-xs font-normal text-stone-600">/ {item.unit}</span>
                    </span>
                    <span className="text-xs text-emerald-800 font-semibold block">
                      {item.quantity} {item.unit} available
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 transition-colors"
                      title="Edit this listing"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-stone-500" />
                      <span>Edit</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleOpenDelete(item)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-semibold text-red-700 transition-colors"
                      title="Delete this listing"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}


      {/* CREATE / EDIT LISTING MODAL */}
      {isFormOpen && (
        <Modal
          isOpen={isFormOpen}
          onClose={() => !formSubmitting && setIsFormOpen(false)}
          title={editingProduct ? 'Edit Produce Listing' : 'Post New Produce Listing'}
          maxWidth="max-w-xl"
        >
          <form onSubmit={handleFormSubmit} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Produce Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Produce / Crop Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                placeholder="e.g. Sharbati Wheat Grade A, Desi Chana Bold, etc."
                required
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Agricultural Category *
              </label>
              <select
                name="categoryId"
                value={formData.categoryId}
                onChange={handleFormChange}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
              >
                <option value="">Select Category</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Variety, Quality Grade & Min Order Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Variety / Cultivar
                </label>
                <input
                  type="text"
                  name="variety"
                  value={formData.variety}
                  onChange={handleFormChange}
                  placeholder="e.g. Sharbati, Desi, 1121"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Quality Grade
                </label>
                <input
                  type="text"
                  name="qualityGrade"
                  value={formData.qualityGrade}
                  onChange={handleFormChange}
                  placeholder="e.g. Grade A, FAQ, Premium"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Min. Order Qty ({formData.unit})
                </label>
                <input
                  type="number"
                  name="minOrderQuantity"
                  value={formData.minOrderQuantity}
                  onChange={handleFormChange}
                  min="1"
                  step="any"
                  placeholder="1"
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>
            </div>

            {/* Price & Quantity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Price (INR ₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleFormChange}
                  min="0.01"
                  step="any"
                  placeholder="2800"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Available Quantity *
                </label>
                <input
                  type="number"
                  name="quantity"
                  value={formData.quantity}
                  onChange={handleFormChange}
                  min="0"
                  step="any"
                  placeholder="100"
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Trade Unit *
                </label>
                <select
                  name="unit"
                  value={formData.unit}
                  onChange={handleFormChange}
                  className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
                >
                  {ALLOWED_UNITS.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Real Location Section: PIN Code with Auto-fetch & Village Replacement */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Farm Location & PIN Code</span>
                </span>
                {fetchingLocation && (
                  <span className="text-[11px] font-semibold text-emerald-800 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Auto-fetching location...</span>
                  </span>
                )}
                {locationSuccessNote && !fetchingLocation && (
                  <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{locationSuccessNote}</span>
                  </span>
                )}
              </div>

              {/* PIN Code Field */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Postal PIN Code (6-Digit) * <span className="text-stone-500 font-normal normal-case">(Type PIN code to auto-detect location)</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handlePincodeChange}
                    maxLength={6}
                    placeholder="Enter 6-digit PIN code (e.g. 226001, 141401)"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-mono tracking-wider font-semibold text-stone-900"
                  />
                  {fetchingLocation ? (
                    <Loader2 className="w-4 h-4 text-emerald-700 animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
                  ) : formData.pincode?.length === 6 ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute right-3.5 top-1/2 -translate-y-1/2" />
                  ) : null}
                </div>
              </div>

              {/* State, District, Village (Mandi replaced by Village / Local Area) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleFormChange}
                    placeholder="e.g. Punjab"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    District
                  </label>
                  <input
                    type="text"
                    name="district"
                    value={formData.district}
                    onChange={handleFormChange}
                    placeholder="e.g. Ludhiana"
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-stone-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Village / Local Area *
                  </label>
                  <input
                    type="text"
                    name="village"
                    list="village-suggestions"
                    value={formData.village}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData((prev) => ({ ...prev, village: val, mandi: val }));
                    }}
                    placeholder="e.g. Khanna / Canal Colony"
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-700 font-medium text-stone-900"
                  />
                  {villageOptions.length > 0 && (
                    <datalist id="village-suggestions">
                      {villageOptions.map((v, idx) => (
                        <option key={idx} value={v} />
                      ))}
                    </datalist>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Lot Specifications & Moisture Details
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                rows={3}
                placeholder="Describe moisture percentage, grain grade, storage method, packaging details..."
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700"
              />
            </div>

            {/* Status (Active / Draft) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                Listing Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleFormChange}
                className="w-full px-3.5 py-2.5 text-sm bg-stone-50 border border-stone-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-700 cursor-pointer"
              >
                <option value="active">Active (Visible in Marketplace)</option>
                <option value="draft">Draft (Saved only in My Listings)</option>
              </select>
            </div>

            {/* Product Image Upload Section */}
            <div className="space-y-2 pt-2 border-t border-stone-200/80">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Product / Harvest Photo
                </label>
                <span className="text-[11px] text-stone-500">Supported: JPEG, PNG, WebP (Max 5 MB)</span>
              </div>

              {/* Clear notice if real image storage is not configured */}
              {storageStatus && !storageStatus.isConfigured && (
                <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 text-xs text-amber-950 space-y-1.5">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900">
                        Real Image Storage Provider Not Configured
                      </p>
                      <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
                        Cloudinary credentials (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">CLOUDINARY_CLOUD_NAME</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">CLOUDINARY_API_KEY</code>, <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">CLOUDINARY_API_SECRET</code>) are not configured in the server environment. Add these to <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[10px]">server/.env</code> to enable live uploads.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Local Preview Card if file selected or existing image present */}
              {imagePreviewUrl ? (
                <div className="relative p-3 rounded-2xl bg-stone-50 border border-stone-200 flex items-center gap-3.5">
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-100 border border-stone-200 shrink-0 relative">
                    <img
                      src={imagePreviewUrl}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                    {uploadingImage && (
                      <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center text-white">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900 truncate">
                        {selectedImageFile ? selectedImageFile.name : 'Attached Product Photo'}
                      </span>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={uploadingImage || formSubmitting}
                        className="text-stone-400 hover:text-red-600 p-1 transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedImageFile && (
                      <p className="text-[11px] text-stone-500">
                        {(selectedImageFile.size / (1024 * 1024)).toFixed(2)} MB • Ready to upload
                      </p>
                    )}

                    {uploadingImage && (
                      <div className="space-y-1">
                        <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-600 h-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-emerald-800 font-semibold block">
                          Uploading to storage: {uploadProgress}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* File Picker Input */
                <label
                  className={`border-2 border-dashed rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    storageStatus && !storageStatus.isConfigured
                      ? 'border-stone-200 bg-stone-50/60 opacity-80'
                      : 'border-stone-300 hover:border-emerald-600 hover:bg-emerald-50/30 bg-stone-50'
                  }`}
                >
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={uploadingImage || formSubmitting}
                    className="hidden"
                  />
                  <UploadCloud className="w-6 h-6 text-emerald-700 mb-1.5" />
                  <span className="text-xs font-bold text-stone-800">
                    Click to select product harvest photo
                  </span>
                  <span className="text-[11px] text-stone-500 mt-0.5">
                    JPEG, PNG, or WebP up to 5 MB
                  </span>
                </label>
              )}

              {/* Local Image Validation Error */}
              {imageUploadError && (
                <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{imageUploadError}</span>
                </div>
              )}
            </div>


            {/* Modal Actions */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                disabled={formSubmitting}
                className="px-4 py-2.5 rounded-xl border border-stone-200 text-stone-700 text-xs sm:text-sm font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs sm:text-sm font-bold shadow-xs disabled:opacity-60"
              >
                {formSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{editingProduct ? 'Save Changes' : 'Publish Listing'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteProductTarget && (
        <Modal
          isOpen={Boolean(deleteProductTarget)}
          onClose={() => !deleting && setDeleteProductTarget(null)}
          title="Delete Produce Listing"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            {deleteError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-900 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              Are you sure you want to delete <strong className="text-stone-900">"{deleteProductTarget.name}"</strong>?
            </p>
            <p className="text-xs text-stone-500">
              This lot will be permanently removed from MongoDB Atlas and will no longer appear in the public marketplace.
            </p>

            <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs disabled:opacity-60"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Live Mandi Rate Search & Benchmark Modal */}
      <MandiRateModal
        isOpen={isMandiModalOpen}
        onClose={() => setIsMandiModalOpen(false)}
      />
    </div>
  );
}
