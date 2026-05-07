import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { fmt, fmtDate, getDaysUntil } from '../utils/helpers';
import { Card, MetricCard, Badge, Spinner, Empty } from '../components/UI';

export default function DashboardPage({ setPage, setSelectedEventId }) {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [cashflow, setCashflow] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [{ data: ev }, { data: vd }, { data: cf }] = await Promise.all([
      supabase.from('events').select('*').eq('user_id', user.id).order('date'),
      supabase.from('vendors').select('*').eq('user_id', user.id),
      supabase.from('cashflow').select('*').eq('user_id', user.id),
    ]);
    setEvents(ev || []);
    setVendors(vd || []);
    setCashflow(cf || []);
    setLoading(false);
  }

  const activeEvents = events.filter(e => e.status !== 'done');
  const totalBudget = events.reduce((s, e) => s + (e.budget || 0), 0);
  const totalVendorCost = vendors.reduce((s, v) => s + (v.contract_amount || 0), 0);
  const totalIn = cashflow.filter(c => c.type === 'in').reduce((s, c) => s + (c.amount || 0), 0);
  const totalOut = cashflow.filter(c => c.type === 'out').reduce((s, c) => s + (c.amount || 0), 0);
  const cashBalance = totalIn - totalOut;

  // Urgent notifications
  const urgentVendors = vendors.filter(v => {
    if (!v.due_date || v.status === 'lunas') return false;
    const d = getDaysUntil(v.due_date);
    return d !== null && d <= 7;
  });

  const openEvent = (id) => {
    setSelectedEventId(id);
    setPage('event-detail');
  };

  if (loading) return <Spinner />;

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500">Overview semua event dan keuangan</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <MetricCard label="Total Event" value={events.length} />
        <MetricCard label="Event Aktif" value={activeEvents.length} color="text-[#BA7517]" />
        <MetricCard label="Total Budget" value={fmt(totalBudget)} color="text-gray-900" />
        <MetricCard
          label="Saldo Kas"
          value={fmt(cashBalance)}
          color={cashBalance >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Event Aktif */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Event Aktif</h3>
          {activeEvents.length === 0 ? (
            <Empty text="Tidak ada event aktif." icon="📅" />
          ) : (
            <div>
              {activeEvents.slice(0, 5).map(ev => {
                const evVendors = vendors.filter(v => v.event_id === ev.id);
                const evCost = evVendors.reduce((s, v) => s + (v.contract_amount || 0), 0);
                const profit = ev.budget - evCost;
                const days = getDaysUntil(ev.date);
                return (
                  <div
                    key={ev.id}
                    onClick={() => openEvent(ev.id)}
                    className="flex items-center justify-between py-3 border-b border-[#E5E0D8] last:border-0 cursor-pointer hover:bg-[#FAF9F7] -mx-1 px-1 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{ev.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {fmtDate(ev.date)}{days !== null && days >= 0 ? ` · ${days}h lagi` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      <span className={`text-xs font-bold ${profit >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                        {fmt(profit)}
                      </span>
                      <Badge status={ev.status} />
                    </div>
                  </div>
                );
              })}
              {activeEvents.length > 5 && (
                <button onClick={() => setPage('events')} className="text-xs text-[#D4537E] font-semibold mt-2">
                  Lihat semua →
                </button>
              )}
            </div>
          )}
        </Card>

        {/* Jatuh Tempo */}
        <Card className="p-4">
          <h3 className="text-sm font-bold text-gray-900 mb-3">
            Jatuh Tempo
            {urgentVendors.length > 0 && (
              <span className="ml-2 bg-[#E24B4A] text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                {urgentVendors.length}
              </span>
            )}
          </h3>
          {urgentVendors.length === 0 ? (
            <Empty text="Tidak ada jatuh tempo dalam 7 hari." icon="✅" />
          ) : (
            urgentVendors.map(v => {
              const days = getDaysUntil(v.due_date);
              const ev = events.find(e => e.id === v.event_id);
              const isOverdue = days < 0;
              const isToday = days === 0;
              return (
                <div
                  key={v.id}
                  onClick={() => ev && openEvent(ev.id)}
                  className="flex items-center justify-between py-3 border-b border-[#E5E0D8] last:border-0 cursor-pointer hover:bg-[#FAF9F7] -mx-1 px-1 rounded-lg transition-colors"
                >
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{v.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{ev?.name}</div>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ml-2
                    ${isOverdue || isToday ? 'bg-[#FCEBEB] text-[#E24B4A]' : 'bg-[#FAEEDA] text-[#BA7517]'}`}>
                    {isOverdue ? `${Math.abs(days)}h terlambat` : isToday ? 'Hari ini' : `${days}h lagi`}
                  </span>
                </div>
              );
            })
          )}
        </Card>

        {/* Ringkasan Keuangan */}
        <Card className="p-4 md:col-span-2">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Ringkasan Keuangan</h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[#E1F5EE] rounded-xl p-3">
              <div className="text-xs text-[#085041] mb-1">Total Pemasukan</div>
              <div className="text-base font-bold text-[#1D9E75]">{fmt(totalIn)}</div>
            </div>
            <div className="bg-[#FCEBEB] rounded-xl p-3">
              <div className="text-xs text-[#A32D2D] mb-1">Total Pengeluaran</div>
              <div className="text-base font-bold text-[#E24B4A]">{fmt(totalOut)}</div>
            </div>
            <div className={`rounded-xl p-3 ${cashBalance >= 0 ? 'bg-[#E1F5EE]' : 'bg-[#FCEBEB]'}`}>
              <div className={`text-xs mb-1 ${cashBalance >= 0 ? 'text-[#085041]' : 'text-[#A32D2D]'}`}>Saldo Kas</div>
              <div className={`text-base font-bold ${cashBalance >= 0 ? 'text-[#1D9E75]' : 'text-[#E24B4A]'}`}>
                {fmt(cashBalance)}
              </div>
            </div>
          </div>
          <button
            onClick={() => setPage('cashflow')}
            className="text-xs text-[#D4537E] font-semibold mt-3 block"
          >
            Lihat detail keuangan →
          </button>
        </Card>
      </div>
    </div>
  );
}
