// ── BUTTON ────────────────────────────────────────────────────────────────────
export function Btn({ children, onClick, variant = 'rose', size = 'md', className = '', disabled = false, type = 'button' }) {
  const variants = {
    rose:    'bg-[#D4537E] text-white hover:opacity-90',
    teal:    'bg-[#1D9E75] text-white hover:opacity-90',
    amber:   'bg-[#BA7517] text-white hover:opacity-90',
    ghost:   'bg-transparent border border-[#E5E0D8] text-gray-500 hover:bg-[#FAF9F7]',
    danger:  'bg-transparent border border-[#E5E0D8] text-[#E24B4A] hover:bg-[#FCEBEB]',
    purple:  'bg-[#534AB7] text-white hover:opacity-90',
  };
  const sizes = {
    xs: 'px-2.5 py-1 text-xs',
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-sm',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} font-semibold rounded-lg transition-opacity active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

// ── CARD ──────────────────────────────────────────────────────────────────────
export function Card({ children, className = '', onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-[#E5E0D8] rounded-xl shadow-sm ${onClick ? 'cursor-pointer hover:border-[#ED93B1] transition-colors active:bg-[#FBEAF0]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

// ── BADGE ─────────────────────────────────────────────────────────────────────
export function Badge({ status }) {
  const map = {
    planning: 'bg-[#FAEEDA] text-[#BA7517]',
    ongoing:  'bg-[#E1F5EE] text-[#085041]',
    done:     'bg-gray-100 text-gray-500',
  };
  const label = { planning: 'Planning', ongoing: 'Ongoing', done: 'Done' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status] || map.planning}`}>
      {label[status] || status}
    </span>
  );
}

// ── STATUS PILL ───────────────────────────────────────────────────────────────
export function StatusPill({ status, onChange }) {
  const map = {
    belum: 'bg-[#FCEBEB] text-[#E24B4A]',
    dp:    'bg-[#FAEEDA] text-[#BA7517]',
    lunas: 'bg-[#E1F5EE] text-[#085041]',
  };
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-none cursor-pointer appearance-none ${map[status] || map.belum}`}
    >
      <option value="belum">Belum Bayar</option>
      <option value="dp">Sudah DP</option>
      <option value="lunas">Lunas</option>
    </select>
  );
}

// ── INPUT ─────────────────────────────────────────────────────────────────────
export function Input({ label, type = 'text', value, onChange, placeholder, required, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-3 py-2.5 border-[1.5px] border-[#E5E0D8] rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#D4537E] transition-colors"
      />
    </div>
  );
}

// ── SELECT ────────────────────────────────────────────────────────────────────
export function Select({ label, value, onChange, options, className = '' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-gray-500">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border-[1.5px] border-[#E5E0D8] rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:border-[#D4537E] transition-colors appearance-none"
      >
        {options.map((o) => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  );
}

// ── METRIC CARD ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, color = 'text-gray-900', sub }) {
  return (
    <div className="bg-[#F4F0EC] rounded-xl p-3">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-lg font-bold leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

// ── PROGRESS BAR ─────────────────────────────────────────────────────────────
export function ProgressBar({ pct, color = '#D4537E', height = 6 }) {
  const bg = pct > 90 ? '#E24B4A' : pct > 70 ? '#BA7517' : color;
  return (
    <div className="w-full bg-[#E5E0D8] rounded-full overflow-hidden" style={{ height }}>
      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: bg }} />
    </div>
  );
}

// ── EMPTY STATE ───────────────────────────────────────────────────────────────
export function Empty({ text = 'Belum ada data.', icon = '📭' }) {
  return (
    <div className="text-center py-10 text-gray-400">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

// ── SPINNER ───────────────────────────────────────────────────────────────────
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-[#E5E0D8] border-t-[#D4537E] rounded-full animate-spin" />
    </div>
  );
}

// ── ALERT ─────────────────────────────────────────────────────────────────────
export function Alert({ type = 'red', children }) {
  const map = {
    red:   'bg-[#FCEBEB] text-[#A32D2D] border-[#F09595]',
    amber: 'bg-[#FAEEDA] text-[#854F0B] border-[#E5B96A]',
    teal:  'bg-[#E1F5EE] text-[#085041] border-[#6FCFAD]',
  };
  return (
    <div className={`flex gap-2 items-start px-3.5 py-2.5 rounded-lg border text-xs mb-2 ${map[type]}`}>
      {children}
    </div>
  );
}

// ── SECTION HEADER ────────────────────────────────────────────────────────────
export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-gray-900">{title}</h3>
      {action}
    </div>
  );
}

// ── MODAL ─────────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E0D8]">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
export function Toast({ message, type = 'teal', onDone }) {
  const colors = { teal: 'bg-[#1D9E75]', red: 'bg-[#E24B4A]', amber: 'bg-[#BA7517]' };
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg z-50 whitespace-nowrap animate-bounce`}>
      {message}
    </div>
  );
}
