import { Lock, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import Modal from './Modal';
import { USER_ROLES } from '../../constants/roles';

export default function AuthModalPreview({ isOpen, onClose, mode, onSelectRole }) {
  const isRegister = mode === 'register';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isRegister ? 'Join AgriFair Marketplace' : 'Account Sign In'}
      maxWidth="max-w-md"
    >
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-700 text-white shrink-0">
            {isRegister ? <Sparkles className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-950">
              {isRegister ? 'User Registration Preview' : 'Portal Sign In Preview'}
            </h4>
            <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
              Full authentication, role verification, and profile management will be implemented in <strong>Phase 2</strong>.
            </p>
          </div>
        </div>

        <div className="text-sm text-stone-600 leading-relaxed">
          <p className="mb-2">
            In the upcoming phase, you will be able to register and sign in under tailored roles:
          </p>
          <ul className="space-y-2 text-xs text-stone-700 bg-stone-50 p-3.5 rounded-xl border border-stone-200/80">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Farmer Portal:</strong> Crop lot uploads, mandi rates & direct buyer bids</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Wholesaler Portal:</strong> Bulk multi-ton bidding & warehouse logistics</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Retailer & Buyer:</strong> Regular inventory replenishment & specs review</span>
            </li>
          </ul>
        </div>

        <div className="pt-2 border-t border-stone-100 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onSelectRole) onSelectRole(USER_ROLES.FARMER);
              const el = document.getElementById('roles');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#164e3b] text-white text-sm font-semibold hover:bg-[#123826] transition-colors"
          >
            <span>Explore Participant Roles in Phase 1</span>
            <ArrowRight className="w-4 h-4 text-emerald-300" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 px-4 rounded-xl text-stone-600 hover:bg-stone-100 text-xs font-medium transition-colors"
          >
            Close Preview
          </button>
        </div>
      </div>
    </Modal>
  );
}
