import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';
import { fmt, fmtDate, getDaysUntil } from '../utils/helpers';
import { Card, Spinner, Empty } from '../components/UI';

const Gem = ({color='#C8952A'}) => (
  <div style={{width:'8px',height:'8px',background:color,transform:'rotate(45deg)',flexShrink:0}}/>
);

const SectionTitle = ({title, sub}) => (
  <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'14px'}}>
    <Gem/>
    <div>
      <div style={{fontSize:'14px',fontWeight:700,color:'#1A2E28'}}>{title}</div>
      {sub && <div style={{fontSize:'11px',color:'#6B8C84'}}>{sub}</div>}
    </div>
  </div>
);

const StatCard = ({label, value, color='#1A2E28', bg='#F4F0EC', accent}) => (
  <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'14px',position:'relative',overflow:'hidden'}}>
    <div style={{position:'absolute',top:0,left:0,right:0,height:'3px',background:accent||'linear-gradient(90deg,#1A6B5A,#E8B84B)'}}/>
    <div style={{fontSize:'11px',color:'#6B8C84',marginBottom:'4px',marginTop:'4px'}}>{label}</div>
    <div style={{fontSize:'20px',fontWeight:700,color,lineHeight:1.2}}>{value}</div>
  </div>
);

export default function DashboardPage({ setPage, setSelectedEventId }) {
  const { user } = useAuth();
  const { workspace, members, isOwner } = useWorkspace();
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [loading, setLoading] = useState(true);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const endOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];

  useEffect(() => { fetchAll(); }, []); // eslint-disable-line

  async function fetchAll() {
    setLoading(true);
    const wsId = workspace?.id;
    const filter = wsId
      ? { column: 'workspace_id', value: wsId }
      : { column: 'user_id', value: user.id };

    const [{ data: ev }, { data: vd }, { data: cf }] = await Promise.all([
      supabase.from('events').select('*').eq(filter.column, filter.value).order('date'),
      supabase.from('vendors').select('*').eq(filter.column, filter.value),
      supabase.from('cashflow').select('*').eq(filter.column, filter.value),
    ]);
    setEvents(ev || []);
    setVendors(vd || []);
    setCashflow(cf || []);
    setLoading(false);
  }

  const openEvent = (id) => { setSelectedEventId(id); setPage('event-detail'); };

  // Kalkulasi
  const activeEvents = events.filter(e => e.status !== 'done');
  const doneThisMonth = events.filter(e => e.status === 'done' && e.date >= startOfMonth && e.date <= endOfMonth);
  const totalBudget = activeEvents.reduce((s,e) => s+(e.budget||0), 0);
  const totalVendorCost = vendors.reduce((s,v) => s+(v.contract_amount||0), 0);
  const totalProfit = events.reduce((s,e) => {
    const evVendors = vendors.filter(v => v.event_id === e.id);
    return s + (e.budget||0) - evVendors.reduce((a,v) => a+(v.contract_amount||0), 0);
  }, 0);
  const monthIn = cashflow.filter(c => c.type==='in' && c.date >= startOfMonth).reduce((s,c) => s+(c.amount||0), 0);
  const monthOut = cashflow.filter(c => c.type==='out' && c.date >= startOfMonth).reduce((s,c) => s+(c.amount||0), 0);
  const totalIn = cashflow.filter(c => c.type==='in').reduce((s,c) => s+(c.amount||0), 0);
  const totalOut = cashflow.filter(c => c.type==='out').reduce((s,c) => s+(c.amount||0), 0);
  const saldo = totalIn - totalOut;

  // Jatuh tempo urgent
  const urgentVendors = vendors.filter(v => {
    if (!v.due_date || v.status === 'lunas') return false;
    const d = getDaysUntil(v.due_date);
    return d !== null && d <= 7;
  }).sort((a,b) => getDaysUntil(a.due_date) - getDaysUntil(b.due_date));

  // Event terdekat
  const upcomingEvents = activeEvents
    .filter(e => e.date && getDaysUntil(e.date) !== null && getDaysUntil(e.date) >= 0)
    .sort((a,b) => getDaysUntil(a.date) - getDaysUntil(b.date))
    .slice(0, 3);

  // Checklist paling rendah progress
  const lowChecklist = activeEvents.map(ev => {
    const evVendors = vendors.filter(v => v.event_id === ev.id);
    const cost = evVendors.reduce((s,v) => s+(v.contract_amount||0), 0);
    const profit = (ev.budget||0) - cost;
    const urgent = evVendors.filter(v => v.due_date && v.status!=='lunas' && getDaysUntil(v.due_date)!==null && getDaysUntil(v.due_date)<=7).length;
    return { ...ev, profit, urgent };
  }).sort((a,b) => getDaysUntil(a.date||'9999') - getDaysUntil(b.date||'9999'));

  if (loading) return <Spinner/>;

  return (
    <div style={{padding:'16px 20px',maxWidth:'900px',margin:'0 auto'}}>
      {/* Header */}
      <div style={{marginBottom:'20px'}}>
        <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'2px'}}>
          <Gem/>
          <h1 style={{fontSize:'20px',fontWeight:700,color:'#1A2E28'}}>
            {isOwner ? `Selamat datang, ${workspace?.name || 'Owner'} 👑` : 'Dashboard'}
          </h1>
        </div>
        <p style={{fontSize:'13px',color:'#6B8C84',marginLeft:'16px'}}>
          {isOwner ? 'Ringkasan operasional bisnis Wedding Organizer kamu' : 'Overview event dan keuangan'}
        </p>
      </div>

      {/* OWNER DASHBOARD */}
      {isOwner ? (
        <>
          {/* Stat utama */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px',marginBottom:'16px'}}>
            <StatCard label="Event Aktif" value={activeEvents.length} accent="#1A6B5A"/>
            <StatCard label="Selesai Bulan Ini" value={doneThisMonth.length} accent="#E8B84B"/>
            <StatCard label="Est. Total Profit" value={fmt(totalProfit)} color={totalProfit>=0?'#1A6B5A':'#C0392B'} accent="#C8952A"/>
            <StatCard label="Saldo Kas" value={fmt(saldo)} color={saldo>=0?'#1A6B5A':'#C0392B'} accent={saldo>=0?'#1A6B5A':'#C0392B'}/>
          </div>

          {/* Keuangan bulan ini */}
          <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <SectionTitle title="Keuangan Bulan Ini" sub={new Date().toLocaleDateString('id-ID',{month:'long',year:'numeric'})}/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
              <div style={{background:'#DCF0EB',borderRadius:'10px',padding:'12px 14px',border:'1px solid #7ECFC3'}}>
                <div style={{fontSize:'11px',color:'#085041',marginBottom:'4px'}}>Pemasukan</div>
                <div style={{fontSize:'18px',fontWeight:700,color:'#1A6B5A'}}>{fmt(monthIn)}</div>
              </div>
              <div style={{background:'#FEF0F0',borderRadius:'10px',padding:'12px 14px',border:'1px solid #F5B7B1'}}>
                <div style={{fontSize:'11px',color:'#A32D2D',marginBottom:'4px'}}>Pengeluaran</div>
                <div style={{fontSize:'18px',fontWeight:700,color:'#C0392B'}}>{fmt(monthOut)}</div>
              </div>
              <div style={{background:monthIn-monthOut>=0?'#DCF0EB':'#FEF0F0',borderRadius:'10px',padding:'12px 14px',border:`1px solid ${monthIn-monthOut>=0?'#7ECFC3':'#F5B7B1'}`}}>
                <div style={{fontSize:'11px',color:monthIn-monthOut>=0?'#085041':'#A32D2D',marginBottom:'4px'}}>Net Bulan Ini</div>
                <div style={{fontSize:'18px',fontWeight:700,color:monthIn-monthOut>=0?'#1A6B5A':'#C0392B'}}>{fmt(monthIn-monthOut)}</div>
              </div>
            </div>
            <button onClick={()=>setPage('cashflow')} style={{fontSize:'12px',color:'#C8952A',fontWeight:600,background:'none',border:'none',cursor:'pointer',marginTop:'10px'}}>
              Lihat detail keuangan →
            </button>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
            {/* Event terdekat */}
            <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <SectionTitle title="Event Terdekat"/>
              {upcomingEvents.length === 0 ? (
                <Empty text="Tidak ada event mendatang." icon="📅"/>
              ) : upcomingEvents.map(ev => {
                const days = getDaysUntil(ev.date);
                return (
                  <div key={ev.id} onClick={() => openEvent(ev.id)}
                    style={{padding:'10px 0',borderBottom:'1px solid #EEE5CC',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#1A2E28'}}>{ev.name}</div>
                      <div style={{fontSize:'11px',color:'#6B8C84',marginTop:'2px'}}>{fmtDate(ev.date)}</div>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'4px'}}>
                      <span style={{fontSize:'11px',fontWeight:700,padding:'2px 8px',borderRadius:'99px',background:days<=7?'#FEF0F0':'#DCF0EB',color:days<=7?'#C0392B':'#1A6B5A'}}>
                        {days===0?'Hari ini!':days+'h lagi'}
                      </span>
                      {ev.urgent > 0 && <span style={{fontSize:'10px',color:'#C0392B'}}>⚠ {ev.urgent} jatuh tempo</span>}
                    </div>
                  </div>
                );
              })}
              <button onClick={()=>setPage('events')} style={{fontSize:'12px',color:'#C8952A',fontWeight:600,background:'none',border:'none',cursor:'pointer',marginTop:'10px'}}>
                Lihat semua event →
              </button>
            </div>

            {/* Jatuh tempo vendor */}
            <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <SectionTitle title="Jatuh Tempo Vendor" sub="7 hari ke depan"/>
              {urgentVendors.length === 0 ? (
                <Empty text="Tidak ada jatuh tempo dalam 7 hari." icon="✅"/>
              ) : urgentVendors.slice(0,5).map(v => {
                const days = getDaysUntil(v.due_date);
                const ev = events.find(e => e.id === v.event_id);
                const isOverdue = days < 0;
                return (
                  <div key={v.id} onClick={() => ev && openEvent(ev.id)}
                    style={{padding:'9px 0',borderBottom:'1px solid #EEE5CC',cursor:'pointer',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#1A2E28'}}>{v.name}</div>
                      <div style={{fontSize:'11px',color:'#6B8C84'}}>{ev?.name} · Sisa {fmt((v.contract_amount||0)-(v.paid_amount||0))}</div>
                    </div>
                    <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'99px',background:isOverdue||days===0?'#FEF0F0':'#FBF3DF',color:isOverdue||days===0?'#C0392B':'#C8952A',flexShrink:0,marginLeft:'8px'}}>
                      {isOverdue?`${Math.abs(days)}h terlambat`:days===0?'Hari ini!':days+'h lagi'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Semua event aktif */}
          <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',marginBottom:'14px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <SectionTitle title="Semua Event Aktif" sub={`${activeEvents.length} event sedang berjalan`}/>
            {lowChecklist.length === 0 ? (
              <Empty text="Belum ada event aktif." icon="🎊"/>
            ) : lowChecklist.map(ev => {
              const evVendors = vendors.filter(v => v.event_id === ev.id);
              const paid = evVendors.filter(v => v.status === 'lunas').length;
              const days = getDaysUntil(ev.date);
              return (
                <div key={ev.id} onClick={() => openEvent(ev.id)}
                  style={{padding:'12px 0',borderBottom:'1px solid #EEE5CC',cursor:'pointer'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'8px'}}>
                    <div>
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <span style={{fontSize:'14px',fontWeight:700,color:'#1A2E28'}}>{ev.name}</span>
                        {ev.urgent > 0 && <span style={{fontSize:'10px',background:'#FEF0F0',color:'#C0392B',padding:'2px 7px',borderRadius:'99px',fontWeight:700}}>{ev.urgent} jatuh tempo</span>}
                      </div>
                      <div style={{fontSize:'12px',color:'#6B8C84',marginTop:'2px'}}>{fmtDate(ev.date)} · {ev.venue||'-'}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,marginLeft:'8px'}}>
                      <div style={{fontSize:'13px',fontWeight:700,color:ev.profit>=0?'#1A6B5A':'#C0392B'}}>{fmt(ev.profit)}</div>
                      <div style={{fontSize:'11px',color:'#6B8C84'}}>est. profit</div>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'16px'}}>
                    <div style={{fontSize:'12px',color:'#6B8C84'}}>Budget: <b style={{color:'#1A2E28'}}>{fmt(ev.budget)}</b></div>
                    <div style={{fontSize:'12px',color:'#6B8C84'}}>Vendor: <b style={{color:'#1A2E28'}}>{paid}/{evVendors.length} lunas</b></div>
                    {days !== null && <div style={{fontSize:'12px',color:days<=14?'#C0392B':'#6B8C84'}}><b>{days>=0?days+'h lagi':'Lewat'}</b></div>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tim */}
          {members.length > 0 && (
            <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <SectionTitle title="Tim Kamu" sub={`${members.length} anggota`}/>
              <div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}>
                {members.map(m => (
                  <div key={m.id} style={{display:'flex',alignItems:'center',gap:'8px',background:'#FDFAF2',border:'1px solid #EEE5CC',borderRadius:'10px',padding:'8px 12px'}}>
                    <div style={{width:'28px',height:'28px',borderRadius:'50%',background:m.role==='owner'?'#E8B84B':'#DCF0EB',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px'}}>
                      {m.role==='owner'?'👑':'👤'}
                    </div>
                    <div>
                      <div style={{fontSize:'12px',fontWeight:600,color:'#1A2E28'}}>{m.profiles?.owner_name||'Anggota'}</div>
                      <div style={{fontSize:'10px',color:'#6B8C84'}}>{m.role==='owner'?'Owner':'Karyawan'}</div>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={()=>setPage('settings')} style={{fontSize:'12px',color:'#C8952A',fontWeight:600,background:'none',border:'none',cursor:'pointer',marginTop:'10px'}}>
                Kelola tim →
              </button>
            </div>
          )}
        </>
      ) : (
        // MEMBER DASHBOARD - operational view
        <>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px',marginBottom:'14px'}}>
            <StatCard label="Event Aktif" value={activeEvents.length} accent="#1A6B5A"/>
            <StatCard label="Jatuh Tempo ≤7 Hari" value={urgentVendors.length} color={urgentVendors.length>0?'#C0392B':'#1A2E28'} accent="#C8952A"/>
            <StatCard label="Vendor Belum Lunas" value={vendors.filter(v=>v.status!=='lunas').length} color="#C8952A" accent="#E8B84B"/>
          </div>

          {/* Jatuh tempo urgent */}
          {urgentVendors.length > 0 && (
            <div style={{background:'#FEF0F0',border:'1px solid #F5B7B1',borderRadius:'12px',padding:'14px',marginBottom:'14px'}}>
              <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'10px'}}>
                <span style={{fontSize:'16px'}}>⚠️</span>
                <span style={{fontSize:'13px',fontWeight:700,color:'#A32D2D'}}>Perlu Diaction Sekarang</span>
              </div>
              {urgentVendors.slice(0,3).map(v => {
                const days = getDaysUntil(v.due_date);
                const ev = events.find(e => e.id === v.event_id);
                return (
                  <div key={v.id} onClick={() => ev && openEvent(ev.id)}
                    style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #F5B7B1',cursor:'pointer'}}>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:600,color:'#1A2E28'}}>{v.name}</div>
                      <div style={{fontSize:'11px',color:'#6B8C84'}}>{ev?.name} · Sisa {fmt((v.contract_amount||0)-(v.paid_amount||0))}</div>
                    </div>
                    <span style={{fontSize:'10px',fontWeight:700,padding:'2px 8px',borderRadius:'99px',background:'#C0392B',color:'white',flexShrink:0,marginLeft:'8px'}}>
                      {days<0?`${Math.abs(days)}h terlambat`:days===0?'Hari ini!':days+'h lagi'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'14px',marginBottom:'14px'}}>
            {/* Event aktif + progress */}
            <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <SectionTitle title="Event Aktif"/>
              {activeEvents.length === 0 ? <Empty text="Belum ada event." icon="🎊"/> :
                activeEvents.slice(0,5).map(ev => {
                  const evVendors = vendors.filter(v => v.event_id === ev.id);
                  const lunasCount = evVendors.filter(v => v.status==='lunas').length;
                  const days = getDaysUntil(ev.date);
                  const urgentCount = evVendors.filter(v => v.due_date && v.status!=='lunas' && getDaysUntil(v.due_date)!==null && getDaysUntil(v.due_date)<=7).length;
                  return (
                    <div key={ev.id} onClick={() => openEvent(ev.id)}
                      style={{padding:'10px 0',borderBottom:'1px solid #EEE5CC',cursor:'pointer'}}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'6px'}}>
                        <div>
                          <div style={{fontSize:'13px',fontWeight:600,color:'#1A2E28'}}>{ev.name}</div>
                          <div style={{fontSize:'11px',color:'#6B8C84'}}>{fmtDate(ev.date)}</div>
                        </div>
                        <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'3px'}}>
                          {days !== null && (
                            <span style={{fontSize:'10px',fontWeight:700,color:days<=7?'#C0392B':'#6B8C84'}}>
                              {days>=0?days+'h lagi':'Lewat'}
                            </span>
                          )}
                          {urgentCount > 0 && (
                            <span style={{fontSize:'10px',color:'#C0392B'}}>⚠ {urgentCount} vendor</span>
                          )}
                        </div>
                      </div>
                      {/* Progress vendor */}
                      <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                        <div style={{flex:1,height:'4px',background:'#EEE5CC',borderRadius:'99px',overflow:'hidden'}}>
                          <div style={{height:'100%',background:'#1A6B5A',borderRadius:'99px',width:evVendors.length>0?`${Math.round(lunasCount/evVendors.length*100)}%`:'0%'}}/>
                        </div>
                        <span style={{fontSize:'10px',color:'#6B8C84',flexShrink:0}}>{lunasCount}/{evVendors.length} vendor lunas</span>
                      </div>
                    </div>
                  );
                })
              }
              <button onClick={()=>setPage('events')} style={{fontSize:'12px',color:'#C8952A',fontWeight:600,background:'none',border:'none',cursor:'pointer',marginTop:'10px'}}>
                Lihat semua →
              </button>
            </div>

            {/* Vendor yang perlu difollow up */}
            <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
              <SectionTitle title="Vendor Belum Lunas"/>
              {vendors.filter(v=>v.status!=='lunas').length === 0 ? (
                <Empty text="Semua vendor sudah lunas! ✅" icon="🎉"/>
              ) : vendors.filter(v=>v.status!=='lunas').slice(0,6).map(v => {
                const ev = events.find(e => e.id === v.event_id);
                const sisa = (v.contract_amount||0) - (v.paid_amount||0);
                const days = getDaysUntil(v.due_date);
                const isUrgent = days !== null && days <= 7;
                return (
                  <div key={v.id} onClick={() => ev && openEvent(ev.id)}
                    style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'8px 0',borderBottom:'1px solid #EEE5CC',cursor:'pointer'}}>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:'12px',fontWeight:600,color:'#1A2E28',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{v.name}</div>
                      <div style={{fontSize:'10px',color:'#6B8C84'}}>{ev?.name} · {v.status==='dp'?'Sudah DP':'Belum Bayar'}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0,marginLeft:'8px'}}>
                      <div style={{fontSize:'12px',fontWeight:700,color:isUrgent?'#C0392B':'#C8952A'}}>{fmt(sisa)}</div>
                      {days !== null && <div style={{fontSize:'10px',color:isUrgent?'#C0392B':'#6B8C84'}}>{days<0?`${Math.abs(days)}h terlambat`:days+'h lagi'}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ringkasan keuangan sederhana */}
          <div style={{background:'white',border:'1px solid #DDD0B3',borderRadius:'12px',padding:'16px',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <SectionTitle title="Ringkasan Keuangan"/>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'10px'}}>
              <div style={{background:'#DCF0EB',borderRadius:'10px',padding:'12px',border:'1px solid #7ECFC3'}}>
                <div style={{fontSize:'11px',color:'#085041',marginBottom:'3px'}}>Total Pemasukan</div>
                <div style={{fontSize:'16px',fontWeight:700,color:'#1A6B5A'}}>{fmt(totalIn)}</div>
              </div>
              <div style={{background:'#FEF0F0',borderRadius:'10px',padding:'12px',border:'1px solid #F5B7B1'}}>
                <div style={{fontSize:'11px',color:'#A32D2D',marginBottom:'3px'}}>Total Pengeluaran</div>
                <div style={{fontSize:'16px',fontWeight:700,color:'#C0392B'}}>{fmt(totalOut)}</div>
              </div>
              <div style={{background:saldo>=0?'#DCF0EB':'#FEF0F0',borderRadius:'10px',padding:'12px',border:`1px solid ${saldo>=0?'#7ECFC3':'#F5B7B1'}`}}>
                <div style={{fontSize:'11px',color:saldo>=0?'#085041':'#A32D2D',marginBottom:'3px'}}>Saldo Kas</div>
                <div style={{fontSize:'16px',fontWeight:700,color:saldo>=0?'#1A6B5A':'#C0392B'}}>{fmt(saldo)}</div>
              </div>
            </div>
            <button onClick={()=>setPage('cashflow')} style={{fontSize:'12px',color:'#C8952A',fontWeight:600,background:'none',border:'none',cursor:'pointer',marginTop:'10px'}}>
              Lihat detail keuangan →
            </button>
          </div>
        </>
      )}
    </div>
  );
}
