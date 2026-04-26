import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Car, Bike, Star, Shield, Zap, TrendingUp, Navigation } from 'lucide-react';
import { useJsApiLoader, Autocomplete } from '@react-google-maps/api';
import { getSpaces, smartSearch } from '../../api/index';
import ParkingCard from '../../components/ParkingCard';
import NearbyMapModal from '../../components/NearbyMapModal';
import config from '../../config';
import logo from '../../assets/logoparky.png';
import park1 from '../../assets/park1.jpg';
import park2 from '../../assets/park2.jpg';
import park3 from '../../assets/park3.jpg';
import park4 from '../../assets/park4.png';
import toast from 'react-hot-toast';

const LIBRARIES = ['places'];

const STATS = [
  { label: 'Parking Spaces', value: '2,400+', icon: MapPin, color: 'bg-indigo-50 text-indigo-600 border border-indigo-100' },
  { label: 'Happy Drivers', value: '18K+',   icon: Car,    color: 'bg-emerald-50 text-emerald-600 border border-emerald-100' },
  { label: 'Cities Covered', value: '35+',   icon: Zap,    color: 'bg-amber-50 text-amber-600 border border-amber-100' },
  { label: 'Avg. Rating',    value: '4.8★',  icon: Star,   color: 'bg-amber-50 text-amber-600 border border-amber-100' },
];

const FEATURES = [
  { icon: MapPin, title: 'Find Instantly', desc: 'Discover verified parking near you with real-time availability.', color: 'text-indigo-600' },
  { icon: Shield, title: 'Safe & Secure',  desc: 'Every space is verified and reviewed by our trust & safety team.', color: 'text-emerald-600' },
  { icon: Zap,    title: 'Book in Seconds',desc: 'Reserve your slot in under 30 seconds. Pay on arrival, hassle-free.', color: 'text-amber-600' },
  { icon: TrendingUp, title: 'Earn as a Host', desc: 'List your driveway or garage and earn up to ₹15,000/month.', color: 'text-indigo-600' },
];

const FEATURED_IMAGES = [park1, park2, park3, park4];

function GoogleAutocomplete({ query, setFilters, onPlaceChanged, autocompleteRef }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: config.GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  if (!isLoaded) return <input className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base font-bold" placeholder="Loading search..." disabled />;

  return (
    <Autocomplete
      onLoad={ref => autocompleteRef.current = ref}
      onPlaceChanged={onPlaceChanged}
      className="flex-1"
    >
      <input
        type="text"
        className="w-full bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base font-bold"
        placeholder='Try "Bangalore" or "cheap parking"...'
        value={query}
        onChange={(e) => setFilters(e.target.value)}
      />
    </Autocomplete>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);
  const [showMap, setShowMap] = useState(false);
  const [calcSlots, setCalcSlots] = useState(5);
  const [calcHours, setCalcHours] = useState(8);
  const autocompleteRef = useRef(null);

  const hasGoogleKey = config.GOOGLE_MAPS_API_KEY && config.GOOGLE_MAPS_API_KEY !== 'your_key_here' && config.GOOGLE_MAPS_API_KEY.length > 5;

  const earnings = calcSlots * calcHours * 40 * 30; // 40 is avg price, 30 days

  useEffect(() => {
    let isMounted = true;

    const loadFeatured = async (params = {}) => {
      setLoadingFeatured(true);
      try {
        const res = await getSpaces({ limit: 3, ...params });
        const spaces = (res.data.spaces || []).slice(0, 3).map((space, index) => ({
          ...space,
          featuredImage: space.images?.[0] || FEATURED_IMAGES[index % FEATURED_IMAGES.length],
        }));
        if (isMounted) setFeatured(spaces);
      } catch (err) {
        console.error("Error loading featured spaces:", err);
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    };


  const loadNearbyFeatured = async () => {
      try {
        if (!navigator.geolocation) {
          await loadFeatured();
          return;
        }

        await new Promise((resolve) => {
          navigator.geolocation.getCurrentPosition(
            async ({ coords }) => {
              try {
                await loadFeatured({ lat: coords.latitude, lng: coords.longitude, radius: 10 });
              } catch {
                try {
                  await loadFeatured();
                } catch {
                  if (isMounted) setFeatured([]);
                }
              } finally {
                resolve();
              }
            },
            async () => {
              try {
                await loadFeatured();
              } catch {
                if (isMounted) setFeatured([]);
              } finally {
                resolve();
              }
            },
            { enableHighAccuracy: true, timeout: 8000 }
          );
        });
      } catch {
        if (isMounted) setFeatured([]);
      } finally {
        if (isMounted) setLoadingFeatured(false);
      }
    };

    loadNearbyFeatured();

    return () => {
      isMounted = false;
    };
  }, []);

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        navigate(`/search?lat=${lat}&lng=${lng}&q=${encodeURIComponent(place.formatted_address)}`);
      } else {
        setQuery(place.name);
      }
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) { navigate('/search'); return; }
    try {
      const res = await smartSearch(query);
      const filters = res.data.filters || {};
      const params = new URLSearchParams(filters).toString();
      navigate(`/search?${params}&q=${encodeURIComponent(query)}`);
    } catch {
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {showMap && <NearbyMapModal onClose={() => setShowMap(false)} />}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0">
          <div className="absolute top-0 left-0 right-0 h-[600px] bg-gradient-to-b from-indigo-50 to-transparent" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <div className="inline-flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider text-indigo-600 mb-8 uppercase animate-subtle-fade shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Now live in 35+ cities across India
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black leading-tight mb-6 animate-slide-up">
            Park Smarter,{' '}
            <span className="text-gradient">Not Harder</span>
          </h1>
          <p className="text-base sm:text-xl text-slate-500 mb-8 sm:mb-12 max-w-2xl mx-auto leading-relaxed animate-slide-in font-medium px-2" style={{ animationDelay: '0.1s' }}>
            Airbnb for parking spaces. Find, book, and pay for private and public parking in seconds — or earn money by renting yours.
          </p>
          
          <form onSubmit={handleSearch} className="animate-slide-in px-2" style={{ animationDelay: '0.2s' }}>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white border border-slate-200 shadow-xl px-4 sm:px-5 py-3 rounded-2xl max-w-2xl mx-auto focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all">
              <div className="flex items-center gap-2 flex-1">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                {hasGoogleKey ? (
                  <GoogleAutocomplete 
                    query={query} 
                    setFilters={setQuery} 
                    onPlaceChanged={onPlaceChanged} 
                    autocompleteRef={autocompleteRef} 
                  />
                ) : (
                  <input
                    type="text"
                    className="flex-1 bg-transparent text-slate-900 placeholder-slate-400 outline-none text-base font-bold"
                    placeholder='Try "Bangalore" or "cheap parking"...'
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowMap(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-black text-[11px] uppercase tracking-wider py-2 px-3 rounded-lg transition-all whitespace-nowrap"
                  title="Find parking near my current location"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  Near Me
                </button>
                <button type="submit" className="flex-1 sm:flex-none btn-primary py-2 px-6 text-sm shadow-indigo-200">
                  Search
                </button>
              </div>
            </div>
          </form>
          {/* Quick vehicle filters */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 mt-6 sm:mt-8 animate-slide-in px-2" style={{ animationDelay: '0.3s' }}>
            <button
              onClick={() => navigate('/search?vehicleType=car')}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-indigo-500 hover:text-indigo-600 transition-all flex items-center gap-2.5 shadow-sm group"
            >
              <Car className="w-4 h-4 group-hover:scale-110 transition-transform" /> Cars
            </button>
            <button
              onClick={() => navigate('/search?vehicleType=bike')}
              className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-600 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center gap-2.5 shadow-sm group"
            >
              <Bike className="w-4 h-4 group-hover:scale-110 transition-transform" /> Bikes
            </button>
            <button
              onClick={() => navigate('/search?isEVCharging=true')}
              className="px-6 py-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] font-black uppercase tracking-widest text-emerald-700 hover:bg-emerald-100 transition-all flex items-center gap-2.5 shadow-sm group"
            >
              <Zap className="w-4 h-4 group-hover:scale-110 transition-transform text-emerald-500" /> 
              Find EV Charging
            </button>
          </div>
        </div>


        {/* Floating card decorations */}
        <div className="hidden lg:block absolute left-12 top-1/3 animate-float">
          <div className="glass rounded-2xl px-4 py-3 shadow-glass text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-accent-green/20 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-accent-green" />
              </div>
              <div>
                <p className="font-semibold text-xs">Koramangala</p>
                <p className="text-white/40 text-xs">₹40/hr • 3 slots left</p>
              </div>
            </div>
          </div>
        </div>
        <div className="hidden lg:block absolute right-12 top-1/2 animate-float" style={{ animationDelay: '2s' }}>
          <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-xl text-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/10 flex items-center justify-center">
                <Star className="w-4 h-4 text-indigo-600" />
              </div>
              <div>
                <p className="font-bold text-xs text-slate-900">Booking confirmed!</p>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">Indiranagar • 2 hrs</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="card text-center border-slate-100 shadow-sm">
              <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-3xl font-black text-slate-900 tracking-tighter">{value}</p>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured spaces ─────────────────────────────────────────────── */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="section-title">Featured Spaces</h2>
            <p className="section-sub">Top-rated parking near you</p>
          </div>
          <button onClick={() => navigate('/search')} className="btn-secondary btn-sm text-sm">
            View All →
          </button>
        </div>

        {loadingFeatured ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="card h-72 animate-pulse border-slate-100">
                <div className="h-48 bg-slate-100 rounded-xl mb-4" />
                <div className="h-4 bg-slate-100 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featured.slice(0, 3).map(space => (
              <ParkingCard key={space._id} space={space} imageSrc={space.featuredImage} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-slate-50 border border-dashed border-slate-200 rounded-3xl">
            <MapPin className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <h3 className="text-xl font-bold text-slate-800 mb-2">No listings yet</h3>
            <p className="text-slate-500 text-sm font-medium">Be the first to list your space in this area!</p>
          </div>
        )}
      </section>

      <section className="py-16 sm:py-24 px-4 bg-slate-900 overflow-hidden relative">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
        
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-6 leading-tight tracking-tighter">
                Turn your empty space into <span className="text-emerald-400">passive income</span>
              </h2>
              <p className="text-slate-400 text-base sm:text-lg mb-8 max-w-lg font-medium leading-relaxed">
                Whether it's a spare driveway, a garage, or a commercial lot, Parky helps you monetize it with zero effort.
              </p>
              <div className="flex flex-col gap-4">
                {[
                  { title: 'Secure Payments', desc: 'Auto-credited to your bank weekly' },
                  { title: 'Smart Pricing', desc: 'AI adjusts rates to maximize your profit' },
                  { title: 'Full Control', desc: 'Choose when your space is available' }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm">{item.title}</h4>
                      <p className="text-slate-500 text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-2xl">
              <h3 className="text-xl sm:text-2xl font-black text-white mb-6 sm:mb-8 flex items-center gap-3">
                <Zap className="w-6 h-6 text-emerald-400" /> Earnings Calculator
              </h3>
              
              <div className="space-y-8 sm:space-y-10">
                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Number of Slots</label>
                    <span className="text-emerald-400 font-black">{calcSlots} Slots</span>
                  </div>
                  <input type="range" min="1" max="20" value={calcSlots} onChange={e => setCalcSlots(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400" />
                </div>

                <div>
                  <div className="flex justify-between mb-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Hours occupied / day</label>
                    <span className="text-emerald-400 font-black">{calcHours} Hours</span>
                  </div>
                  <input type="range" min="1" max="24" value={calcHours} onChange={e => setCalcHours(Number(e.target.value))} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400" />
                </div>

                <div className="pt-6 border-t border-white/10">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 text-center">Estimated Monthly Earnings</p>
                  <div className="text-center">
                    <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white tracking-tighter">₹{earnings.toLocaleString()}</span>
                    <span className="text-emerald-400 text-lg font-bold ml-2">/mo*</span>
                  </div>
                </div>

                <button onClick={() => navigate('/register')} className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-900 py-4 sm:py-5 rounded-2xl font-black tracking-widest uppercase text-xs transition-all shadow-lg shadow-emerald-500/20">
                  Start Listing Your Space
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative card overflow-hidden text-center border-indigo-100 bg-white shadow-2xl shadow-indigo-100">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-emerald-50/50 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-black mb-6 text-slate-900 tracking-tighter">Have a parking space? <br/><span className="text-gradient">Earn from it today!</span></h2>
              <p className="text-slate-500 mb-10 max-w-xl mx-auto font-medium">List your garage, driveway or spare spot and earn passive income. Hosts on Parky earn an average of ₹15,000/month.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={() => navigate('/register')} className="btn-primary py-4 px-10 rounded-xl shadow-indigo-200 font-black tracking-widest text-xs uppercase">Start Hosting Now</button>
                <button onClick={() => navigate('/search')} className="btn-secondary py-4 px-10 rounded-xl font-black tracking-widest text-xs uppercase">Find Parking</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-16 px-4 text-center mt-20">
        <div className="flex flex-col items-center justify-center gap-4 mb-6">
          <img src={logo} alt="Parky Logo" className="w-12 h-12 object-contain" />
          <span className="text-xl font-black text-slate-900 tracking-tighter">Parky</span>
        </div>
        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.3em] mb-2">© 2026 Parky Platform</p>
        <p className="text-slate-500 text-xs font-medium">Professional Parking Solutions for Modern Cities</p>
      </footer>
    </div>
  );
}
