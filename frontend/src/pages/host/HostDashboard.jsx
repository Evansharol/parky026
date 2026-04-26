/**
 * pages/host/HostDashboard.jsx – Host overview with stats and recent bookings
 */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { DollarSign, MapPin, CalendarCheck, TrendingUp, PlusSquare, Clock } from 'lucide-react';
import { getMySpaces, getHostBookings } from '../../api/index';
import { format } from 'date-fns';
import { useAuth } from '../../context/AuthContext';

const STATUS_BADGE = { pending:'badge-yellow', confirmed:'badge-green', rejected:'badge-red', completed:'badge-blue', cancelled:'badge-gray' };

export default function HostDashboard() {
  const { user } = useAuth();
  const [spaces, setSpaces] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMySpaces(), getHostBookings()])
      .then(([sRes, bRes]) => {
        setSpaces(sRes.data.spaces || []);
        setBookings(bRes.data.bookings || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = bookings.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalAmount, 0);
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const approvedSpaces = spaces.filter(s => s.status === 'approved').length;

  const stats = [
    { label: 'Total Earnings', value: `₹${totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm shadow-emerald-100/50' },
    { label: 'My Listings',    value: spaces.length, icon: MapPin, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100/50' },
    { label: 'Pending Requests', value: pendingCount, icon: Clock, color: 'bg-amber-50 text-amber-600 border border-amber-100 shadow-sm shadow-amber-100/50' },
    { label: 'Active Spaces',  value: approvedSpaces, icon: TrendingUp, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm shadow-indigo-100/50' },
  ];

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto pb-20 md:pb-8">
        <div className="mb-8">
          <h1 className="section-title">Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="section-sub">Here's what's happening with your listings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="stat-card border-slate-100 shadow-sm">
              <div className={`stat-icon ${color} shadow-sm`}><Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-2xl font-black tracking-tighter text-slate-900">{loading ? '–' : value}</p>
                <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link to="/host/add-listing" className="card-hover flex items-center gap-5 group border-slate-100 bg-white shadow-md shadow-slate-100 py-6 px-6">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center group-hover:bg-indigo-600 group-hover:border-indigo-500 transition-all shadow-sm">
              <PlusSquare className="w-6 h-6 text-indigo-600 group-hover:text-white" />
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg tracking-tight">Add New Listing</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">List a new parking space</p>
            </div>
          </Link>
          <Link to="/host/requests" className="card-hover flex items-center gap-5 group border-slate-100 bg-white shadow-md shadow-slate-100 py-6 px-6">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center group-hover:bg-amber-600 group-hover:border-amber-500 transition-all relative shadow-sm">
              <CalendarCheck className="w-6 h-6 text-amber-600 group-hover:text-white" />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-indigo-600 border-2 border-white rounded-full text-white text-[10px] font-black flex items-center justify-center shadow-lg">
                  {pendingCount}
                </span>
              )}
            </div>
            <div>
              <p className="font-black text-slate-900 text-lg tracking-tight">Booking Requests</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mt-0.5">{pendingCount} pending approval</p>
            </div>
          </Link>
        </div>

        {/* Recent bookings */}
        <div>
          <h2 className="font-black text-slate-900 text-xl tracking-tighter mb-6">Recent Bookings</h2>
          {loading ? (
            <div className="flex flex-col gap-3">{[...Array(3)].map((_, i) => <div key={i} className="card h-16 animate-pulse border-slate-100" />)}</div>
          ) : bookings.length === 0 ? (
            <div className="card text-center py-20 bg-slate-50 border border-dashed border-slate-200 rounded-3xl text-slate-400 font-bold uppercase tracking-widest text-xs">No bookings yet. Share your listing!</div>
          ) : (
            <div className="flex flex-col gap-4">
              {bookings.slice(0, 6).map(b => (
                <div key={b._id} className="card flex items-center gap-5 border-slate-100 py-4 px-6 hover:border-indigo-100 transition-all shadow-sm bg-white">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center font-black text-indigo-600 shadow-sm flex-shrink-0">
                    {b.customer?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900 text-base truncate tracking-tight">{b.customer?.name}</p>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.1em] mt-0.5">{b.parkingSpace?.title} • {format(new Date(b.startTime), 'dd MMM, hh:mm a')}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-emerald-600 font-black text-lg tracking-tighter">₹{b.totalAmount}</p>
                    <span className={`${STATUS_BADGE[b.status]} shadow-sm`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
