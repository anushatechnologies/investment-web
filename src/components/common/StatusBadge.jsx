import React from 'react';
import { getStatusStyle } from '../../utils/formatters';

export default function StatusBadge({ status, className = '' }) {
  const style = getStatusStyle(status);
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {style.label}
    </span>
  );
}
