function SectionCard({ title, subtitle, action, className = '', children }) {
  return (
    <section className={`glass-card p-5 sm:p-6 ${className}`}>
      {(title || action || subtitle) && (
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && (
              <h3 className="theme-panel-title font-heading text-xl font-semibold text-slate-900">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="theme-panel-subtitle mt-2 text-sm text-slate-500">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export default SectionCard;
