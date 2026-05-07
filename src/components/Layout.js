import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'events',    label: 'Events',    icon: '◫' },
  { id: 'cashflow',  label: 'Keuangan',  icon: '◈' },
  { id: 'settings',  label: 'Pengaturan',icon: '⚙' },
];

const SidomuktiBg = () => (
  <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',opacity:0.28,pointerEvents:'none'}}
    viewBox="0 0 220 640" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <defs>
      <pattern id="sm" x="0" y="0" width="72" height="72" patternUnits="userSpaceOnUse">
        <rect x="4" y="4" width="64" height="64" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <rect x="8" y="8" width="56" height="56" stroke="#E8B84B" strokeWidth="0.5" fill="none" opacity="0.5"/>
        <path d="M36 36 C28 26 18 24 20 32 C22 38 30 37 36 36Z" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <path d="M36 36 C44 26 54 24 52 32 C50 38 42 37 36 36Z" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <path d="M36 36 C26 40 20 48 24 52 C28 56 34 46 36 36Z" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <path d="M36 36 C46 40 52 48 48 52 C44 56 38 46 36 36Z" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <ellipse cx="36" cy="36" rx="2" ry="4" fill="#F5CC5A"/>
        <path d="M35 32 C33 28 31 26 30 25" stroke="#E8B84B" strokeWidth="0.8" fill="none"/>
        <path d="M37 32 C39 28 41 26 42 25" stroke="#E8B84B" strokeWidth="0.8" fill="none"/>
        <circle cx="30" cy="25" r="1.2" fill="#E8B84B"/>
        <circle cx="42" cy="25" r="1.2" fill="#E8B84B"/>
        <circle cx="16" cy="16" r="3" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <circle cx="16" cy="16" r="1.2" fill="#F5CC5A"/>
        <path d="M16 11 L16 13 M16 19 L16 21 M11 16 L13 16 M19 16 L21 16" stroke="#E8B84B" strokeWidth="0.8"/>
        <circle cx="56" cy="16" r="3" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <circle cx="56" cy="16" r="1.2" fill="#F5CC5A"/>
        <path d="M56 11 L56 13 M56 19 L56 21 M51 16 L53 16 M59 16 L61 16" stroke="#E8B84B" strokeWidth="0.8"/>
        <circle cx="16" cy="56" r="3" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <circle cx="16" cy="56" r="1.2" fill="#F5CC5A"/>
        <path d="M16 51 L16 53 M16 59 L16 61 M11 56 L13 56 M19 56 L21 56" stroke="#E8B84B" strokeWidth="0.8"/>
        <circle cx="56" cy="56" r="3" stroke="#E8B84B" strokeWidth="1" fill="none"/>
        <circle cx="56" cy="56" r="1.2" fill="#F5CC5A"/>
        <path d="M56 51 L56 53 M56 59 L56 61 M51 56 L53 56 M59 56 L61 56" stroke="#E8B84B" strokeWidth="0.8"/>
        <path d="M19 16 C24 16 24 24 28 28" stroke="#E8B84B" strokeWidth="0.7" fill="none" opacity="0.6"/>
        <path d="M53 16 C48 16 48 24 44 28" stroke="#E8B84B" strokeWidth="0.7" fill="none" opacity="0.6"/>
        <path d="M19 56 C24 56 24 48 28 44" stroke="#E8B84B" strokeWidth="0.7" fill="none" opacity="0.6"/>
        <path d="M53 56 C48 56 48 48 44 44" stroke="#E8B84B" strokeWidth="0.7" fill="none" opacity="0.6"/>
      </pattern>
      <linearGradient id="smFade" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="white" stopOpacity="0"/>
        <stop offset="12%" stopColor="white" stopOpacity="1"/>
        <stop offset="88%" stopColor="white" stopOpacity="1"/>
        <stop offset="100%" stopColor="white" stopOpacity="0"/>
      </linearGradient>
      <mask id="smMask"><rect width="220" height="640" fill="url(#smFade)"/></mask>
    </defs>
    <rect width="220" height="640" fill="url(#sm)" mask="url(#smMask)"/>
  </svg>
);

const BatikStrip = ({height=8}) => (
  <svg viewBox="0 0 800 8" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
    style={{width:'100%',height:`${height}px`,display:'block'}}>
    <defs>
      <pattern id="topbatik" x="0" y="0" width="40" height="8" patternUnits="userSpaceOnUse">
        <rect width="10" height="8" fill="#1A6B5A"/>
        <rect x="10" width="10" height="8" fill="#E8B84B"/>
        <rect x="20" width="10" height="8" fill="#259078"/>
        <rect x="30" width="10" height="8" fill="#C8952A"/>
        <rect x="4" y="2" width="2" height="4" fill="rgba(255,255,255,0.25)"/>
        <rect x="14" y="2" width="2" height="4" fill="rgba(0,0,0,0.15)"/>
        <rect x="24" y="2" width="2" height="4" fill="rgba(255,255,255,0.25)"/>
        <rect x="34" y="2" width="2" height="4" fill="rgba(0,0,0,0.15)"/>
      </pattern>
    </defs>
    <rect width="800" height="8" fill="url(#topbatik)"/>
  </svg>
);

const KawungStrip = () => (
  <svg viewBox="0 0 220 32" xmlns="http://www.w3.org/2000/svg" style={{display:'block',width:'100%',height:'32px'}}>
    <defs>
      <pattern id="kwStrip" x="0" y="0" width="36" height="32" patternUnits="userSpaceOnUse">
        <circle cx="18" cy="16" r="5" stroke="#E8B84B" strokeWidth="1.2" fill="none"/>
        <circle cx="18" cy="16" r="2" fill="#F5CC5A"/>
        <path d="M18 9 L18 11 M18 21 L18 23 M11 16 L13 16 M23 16 L25 16" stroke="#E8B84B" strokeWidth="1"/>
        <path d="M13.5 11.5 L15 13 M21 19 L22.5 20.5 M22.5 11.5 L21 13 M15 19 L13.5 20.5" stroke="#E8B84B" strokeWidth="0.8"/>
      </pattern>
    </defs>
    <rect width="220" height="32" fill="url(#kwStrip)" opacity="0.55"/>
  </svg>
);

const Gem = ({size=8, color='#F5CC5A'}) => (
  <div style={{width:size,height:size,background:color,transform:'rotate(45deg)',flexShrink:0}}/>
);

export default function Layout({ page, setPage, children, urgentCount=0 }) {
  const { user, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const navItems = (
    <nav style={{flex:1,padding:'12px 10px'}}>
      {NAV.map(n => (
        <button key={n.id} onClick={() => { setPage(n.id); setMobileOpen(false); }}
          style={{
            display:'flex',alignItems:'center',gap:'10px',
            padding:'9px 12px',borderRadius:'8px',marginBottom:'4px',
            width:'100%',border:'none',cursor:'pointer',fontSize:'13px',
            fontWeight:500,textAlign:'left',transition:'all 0.15s',
            background: page===n.id ? '#E8B84B' : 'transparent',
            color: page===n.id ? '#0F4A3C' : 'rgba(255,255,255,0.5)',
          }}>
          <span style={{fontSize:'16px'}}>{n.icon}</span>
          {n.label}
          {n.id==='dashboard' && urgentCount>0 && (
            <span style={{marginLeft:'auto',background:'#C0392B',color:'#fff',fontSize:'10px',fontWeight:700,padding:'1px 6px',borderRadius:'99px'}}>{urgentCount}</span>
          )}
        </button>
      ))}
    </nav>
  );

  const sidebarContent = (
    <div style={{position:'relative',width:'220px',height:'100%',overflow:'hidden',flexShrink:0}}>
      <div style={{position:'absolute',inset:0,background:'#0F4A3C'}}/>
      <SidomuktiBg />
      <div style={{position:'relative',zIndex:2,display:'flex',flexDirection:'column',height:'100%'}}>
        {/* Brand */}
        <div style={{padding:'18px 16px 14px',borderBottom:'1px solid rgba(255,255,255,0.15)',textAlign:'center'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',marginBottom:'4px'}}>
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.6}}/>
            <Gem/><Gem color="#E8B84B"/><Gem/>
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.6}}/>
          </div>
          <div style={{fontSize:'26px',fontWeight:500,color:'#F5CC5A',letterSpacing:'3px'}}>Wedly</div>
          <div style={{fontSize:'8px',color:'rgba(255,255,255,0.35)',letterSpacing:'3px',marginTop:'2px'}}>WEDDING ORGANIZER</div>
          <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'5px',marginTop:'6px'}}>
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.6}}/>
            <Gem/><Gem color="#E8B84B"/><Gem/>
            <div style={{flex:1,height:'1px',background:'#E8B84B',opacity:0.6}}/>
          </div>
        </div>

        {navItems}

        {/* Kawung strip */}
        <div style={{borderTop:'1px solid rgba(255,255,255,0.12)',background:'rgba(0,0,0,0.15)'}}>
          <KawungStrip/>
        </div>

        {/* Footer */}
        <div style={{padding:'8px 16px',fontSize:'10px',color:'rgba(255,255,255,0.3)',textAlign:'center',letterSpacing:'1.5px'}}>
          ✦ {user?.email?.split('@')[0]} ✦
        </div>
        <button onClick={signOut} style={{padding:'6px',fontSize:'11px',color:'rgba(255,255,255,0.3)',background:'transparent',border:'none',cursor:'pointer',textDecoration:'underline',marginBottom:'10px'}}>
          Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div style={{display:'flex',height:'100vh',height:'100dvh',overflow:'hidden',background:'#FDFAF2'}}>

      {/* Sidebar desktop */}
      {isDesktop && sidebarContent}

      {/* Mobile sidebar overlay */}
      {!isDesktop && mobileOpen && (
        <div style={{position:'fixed',inset:0,zIndex:50}}>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,0.5)'}} onClick={() => setMobileOpen(false)}/>
          <div style={{position:'absolute',left:0,top:0,bottom:0,display:'flex'}}>
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main area */}
      <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',minWidth:0}}>

        {/* Topbar */}
        <div style={{background:'#FDFAF2',borderBottom:'1px solid #DDD0B3',flexShrink:0}}>
          <BatikStrip height={8}/>
          <div style={{padding:'10px 16px',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            {!isDesktop && (
              <button onClick={() => setMobileOpen(true)} style={{background:'transparent',border:'none',fontSize:'22px',color:'#1A2E28',cursor:'pointer',marginRight:'8px'}}>☰</button>
            )}
            <div style={{display:'flex',alignItems:'center',gap:'8px',fontSize:'15px',fontWeight:500,color:'#1A2E28'}}>
              <Gem color="#C8952A"/>
              {NAV.find(n => n.id===page)?.label || 'Wedly'}
            </div>
            <div style={{display:'flex',gap:'8px',alignItems:'center'}}>
              {urgentCount > 0 && (
                <span style={{background:'#C0392B',color:'#fff',fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'99px'}}>
                  {urgentCount} jatuh tempo
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Page content */}
        <main style={{flex:1,overflowY:'auto'}}>{children}</main>

        {/* Mobile bottom nav */}
        {!isDesktop && (
          <div style={{background:'#FDFAF2',borderTop:'1px solid #DDD0B3',display:'flex',flexShrink:0}}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)}
                style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:'2px',padding:'10px 4px',background:'none',border:'none',cursor:'pointer',fontSize:'10px',fontWeight:600,color:page===n.id?'#C8952A':'#6B8C84'}}>
                <span style={{fontSize:'18px'}}>{n.icon}</span>{n.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
