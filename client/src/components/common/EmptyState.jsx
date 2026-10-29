import { Link } from 'react-router-dom';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionHref,
  onAction
}) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 p-8 sm:p-12 text-center max-w-lg mx-auto shadow-2xs space-y-4">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[#faf9f5] border border-stone-200 flex items-center justify-center mx-auto text-[#164e3b]">
          <Icon className="w-7 h-7" />
        </div>
      )}

      <div className="space-y-1.5">
        <h3 className="text-lg font-bold text-stone-900 tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        )}
      </div>

      {(actionLabel && (actionHref || onAction)) && (
        <div className="pt-2">
          {actionHref ? (
            <Link
              to={actionHref}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>{actionLabel}</span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={onAction}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#164e3b] hover:bg-[#123826] text-white text-xs font-bold transition-all shadow-xs"
            >
              <span>{actionLabel}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
