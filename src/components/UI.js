export function Btn({ children, onClick, variant='rose', size='md', className='', disabled=false, type='button' }) {
  const variants = {
    rose:   'bg-[#1A6B5A] text-[#F5CC5A] hover:opacity-90',
    teal:   'bg-[#1A6B5A] text-[#F5CC5A] hover:opacity-90',
    amber:  'bg-[#C8952A] text-white hover:opacity-90',
    ghost:  'bg-transparent border border-[#DDD0B3] text-[#6B8C84] hover:bg-[#F0E9D8]',
    danger: 'bg-transparent border border-[#DDD0B3] text-[#C0392B] hover:bg-[#FEF0F0]',
    purple: 'bg-[#534AB7] text-white hover:opacity-90',
  };
  const sizes = { xs:'px-2.5 py-1 text-xs', sm:'px-3 py-1.5 text-xs', md:'px-4 py-2 text-sm', lg:'px-5 py-2.5 text-sm' };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} font-semibold rounded-lg transition-opacity active:opacity-75 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}>
      {children}
    </button>
  );
}

export function Card({ children, className='', onClick }) {
  return (
    <div onClick={onClick}
      className={`bg-white border border-[#DDD0B3] rounded-xl shadow-sm ${onClick ? 'cursor-pointer hover:border-[#E8B84B] transition-colors active:bg-[#FBF3DF]' : ''} ${className}`}>
      {children}
    </div>
  );
}

export function CardBatik({ children, className='' }) {
  return (
    <div className={`bg-white border border-[#DDD0B3] rounded-xl shadow-sm overflow-hidden ${className}`}>
      <div style={{height:'4px',background:'repeating-linear-gradient(90deg, #1A6B5A 0px, #1A6B5A 10px, #E8B84B 10px, #E8B84B 20px, #259078 20px, #259078 30px, #C8952A 30px, #C8952A 40px)'}}/>
      <div className="p-4">{children}</div>
    </div>
  );
}

export function Badge({ status }) {
  const map = {
    planning: 'bg-[#FBF3DF] text-[#C8952A] border border-[#E8B84B]',
    ongoing:  'bg-[#DCF0EB] text-[#1A6B5A] border border-[#7ECFC3]',
    done:     'bg-[#EEE5CC] text-[#6B8C84] border border-[#DDD0B3]',
  };
  const label = { planning:'Planning', ongoing:'Ongoing', done:'Done' };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[status]||map.planning}`}>{label[status]||status}</span>;
}

export function StatusPill({ status, onChange }) {
  const map = {
    belum: 'bg-[#FEF0F0] text-[#C0392B]',
    dp:    'bg-[#FBF3DF] text-[#C8952A]',
    lunas: 'bg-[#DCF0EB] text-[#1A6B5A]',
  };
  return (
    <select value={status} onChange={(e) => onChange(e.target.value)} onClick={(e) => e.stopPropagation()}
      className={`text-xs font-semibold px-2.5 py-1.5 rounded-full border-none cursor-pointer appearance-none ${map[status]||map.belum}`}>
      <option value="belum">Belum Bayar</option>
      <option value="dp">Sudah DP</option>
      <option value="lunas">Lunas</option>
    </select>
  );
}

export function Input({ label, type='text', value, onChange, placeholder, required, className='' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-[#6B8C84]">{label}</label>}
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required}
        className="w-full px-3 py-2.5 border-[1.5px] border-[#DDD0B3] rounded-lg text-sm bg-white text-[#1A2E28] focus:outline-none focus:border-[#C8952A] transition-colors"/>
    </div>
  );
}

export function Select({ label, value, onChange, options, className='' }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-xs font-medium text-[#6B8C84]">{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 border-[1.5px] border-[#DDD0B3] rounded-lg text-sm bg-white text-[#1A2E28] focus:outline-none focus:border-[#C8952A] transition-colors appearance-none">
        {options.map((o) => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
      </select>
    </div>
  );
}

export function MetricCard({ label, value, color='text-[#1A2E28]', sub }) {
  return (
    <div className="bg-white border border-[#DDD0B3] rounded-xl p-3 relative overflow-hidden">
      <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:'linear-gradient(90deg, #1A6B5A, #E8B84B)'}}/>
      <div className="text-xs text-[#6B8C84] mb-1 mt-1">{label}</div>
      <div className={`text-lg font-bold leading-tight ${color}`}>{value}</div>
      {sub && <div className="text-xs text-[#6B8C84] mt-1">{sub}</div>}
    </div>
  );
}

export function ProgressBar({ pct, color='#1A6B5A', height=6 }) {
  const bg = pct > 90 ? '#C0392B' : pct > 70 ? '#C8952A' : color;
  return (
    <div className="w-full bg-[#DDD0B3] rounded-full overflow-hidden" style={{height}}>
      <div className="h-full rounded-full transition-all" style={{width:`${Math.min(pct,100)}%`, background:bg}}/>
    </div>
  );
}

export function Empty({ text='Belum ada data.', icon='📭' }) {
  return (
    <div className="text-center py-10 text-[#6B8C84]">
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex items-center justify-center py-10">
      <div className="w-8 h-8 border-4 border-[#DDD0B3] border-t-[#C8952A] rounded-full animate-spin"/>
    </div>
  );
}

export function Alert({ type='red', children }) {
  const map = {
    red:   'bg-[#FEF0F0] text-[#A32D2D] border-[#F5B7B1]',
    amber: 'bg-[#FBF3DF] text-[#854F0B] border-[#E8B84B]',
    teal:  'bg-[#DCF0EB] text-[#085041] border-[#7ECFC3]',
  };
  return (
    <div className={`flex gap-2 items-start px-3.5 py-2.5 rounded-lg border text-xs mb-2 ${map[type]}`}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <div style={{width:'8px',height:'8px',background:'#C8952A',transform:'rotate(45deg)',flexShrink:0}}/>
        <h3 className="text-sm font-bold text-[#1A2E28]">{title}</h3>
      </div>
      {action}
    </div>
  );
}

export function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}/>
      <div className="relative bg-[#FDFAF2] rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto shadow-xl border border-[#DDD0B3]">
        <div style={{height:'4px',background:'repeating-linear-gradient(90deg,#1A6B5A 0,#1A6B5A 10px,#E8B84B 10px,#E8B84B 20px,#259078 20px,#259078 30px,#C8952A 30px,#C8952A 40px)'}} className="rounded-t-2xl"/>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DDD0B3]">
          <div className="flex items-center gap-2">
            <div style={{width:'8px',height:'8px',background:'#C8952A',transform:'rotate(45deg)'}}/>
            <h2 className="text-base font-bold text-[#1A2E28]">{title}</h2>
          </div>
          <button onClick={onClose} className="text-[#6B8C84] hover:text-[#1A2E28] text-xl leading-none">×</button>
        </div>
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function Toast({ message, type='teal' }) {
  const colors = { teal:'bg-[#1A6B5A]', red:'bg-[#C0392B]', amber:'bg-[#C8952A]' };
  return (
    <div className={`fixed bottom-20 left-1/2 -translate-x-1/2 ${colors[type]} text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-lg z-50 whitespace-nowrap`}>
      {message}
    </div>
  );
}
