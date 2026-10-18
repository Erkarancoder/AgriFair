import { ShieldCheck, Compass, CheckCircle2, Sliders, Truck, RefreshCw } from 'lucide-react';

export default function PlatformBenefitsSection() {
  const benefits = [
    {
      title: 'Direct Market Discovery',
      description: 'Connect growers directly with institutional buyers, wholesalers, and retail chains, bypassing multiple opaque middlemen who erode farm-gate revenues.',
      icon: Compass,
      points: [
        'Broader regional reach for localized harvests',
        'Direct buyer inquiries straight to producer groups',
        'Reduced dependency on physical commission agents'
      ]
    },
    {
      title: 'Standardized Quality & Specs',
      description: 'Every traded commodity listing communicates clear parameters—moisture percentages, grain length, grading, and packaging formats—reducing post-arrival disputes.',
      icon: Sliders,
      points: [
        'Objective parameters rather than vague descriptions',
        'Transparent grading standards for commercial lots',
        'Fewer delivery rejections due to clear upfront expectations'
      ]
    },
    {
      title: 'Fair Trade & Mandi Transparency',
      description: 'Benchmark listed crop lots against published APMC mandi rates to make data-backed pricing decisions that reflect authentic supply and demand dynamics.',
      icon: RefreshCw,
      points: [
        'Access to regional mandi trends across commodities',
        'Informed pricing for farmers during harvest peaks',
        'Predictable cost forecasting for commercial buyers'
      ]
    },
    {
      title: 'Tailored for Multi-Tier Stakeholders',
      description: 'Whether handling multi-ton container shipments or weekly fresh produce crates, AgriFair supports specific lot sizes and commercial requirements.',
      icon: ShieldCheck,
      points: [
        'Wholesalers discover multi-quintal agricultural batches',
        'Retailers procure predictable weekly restaurant/store stock',
        'Farmers select the buyer lot size that matches their field yield'
      ]
    },
    {
      title: 'Organized Trade Logistics Flow',
      description: 'Future integrations aim to simplify multi-point rural dispatch, transport tracking, and standardized packaging standards.',
      icon: Truck,
      points: [
        'Planned coordination with regional freight providers',
        'Standardized packaging guidelines to reduce transit spoilage',
        'Clear dispatch and arrival confirmation workflows'
      ]
    }
  ];

  return (
    <section id="benefits" className="py-16 sm:py-24 bg-[#faf9f5] border-t border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-[#164e3b] text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Marketplace Advantages</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Designed for Trust & Agricultural Clarity
          </h2>
          <p className="text-stone-600 text-sm sm:text-base mt-3 leading-relaxed">
            AgriFair focuses on practical, grounded improvements to traditional agricultural trading channels, establishing trust through transparent specifications and direct communication.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, idx) => {
            const Icon = benefit.icon;

            return (
              <div
                key={benefit.title}
                className={`bg-white rounded-2xl p-6 border border-stone-200/90 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between group hover:border-emerald-600/60 ${
                  idx === 0 ? 'lg:col-span-2 bg-gradient-to-br from-white via-white to-emerald-50/30' : ''
                }`}
              >
                <div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-100/80 text-[#164e3b] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                    <Icon className="w-5.5 h-5.5 text-emerald-800" />
                  </div>

                  <h3 className="text-lg font-bold text-stone-900 group-hover:text-[#164e3b] transition-colors">
                    {benefit.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-600 mt-2.5 leading-relaxed">
                    {benefit.description}
                  </p>

                  <ul className="mt-4 space-y-2 pt-3 border-t border-stone-100">
                    {benefit.points.map((pt) => (
                      <li key={pt} className="flex items-start gap-2 text-xs text-stone-700">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
