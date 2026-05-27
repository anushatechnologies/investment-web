import { Link } from 'react-router-dom';

function OnboardingGatePage({ title, description, ctaTo, ctaLabel }) {
  return (
    <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-600">Onboarding</p>
      <h1 className="mt-3 font-heading text-3xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-7">
        <Link className="btn-primary inline-flex" to={ctaTo}>
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export default OnboardingGatePage;
