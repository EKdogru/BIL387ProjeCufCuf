import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';
import { Trip, Station, Wagon, Seat } from '../types';

// --- TİP TANIMLAMALARI ---

interface TripSeatData {
  wagons: Wagon[];
  [key: string]: any; // "wagon_1", "wagon_2" gibi dinamik keylere izin ver
}

interface TripFormState {
  tripNumber: string;
  departureStationId: string;
  arrivalStationId: string;
  tripDate: string;
  departureTime: string;
  arrivalTime: string;
  basePrice: string;
}

interface StationFormState {
  name: string;
  city: string;
  code: string;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // STATE'LER
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentView, setCurrentView] = useState<string>('dashboard');
  
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tripsLoading, setTripsLoading] = useState<boolean>(false);
  
  // İNCELEME MODALI STATE'LERİ
  const [showInspectModal, setShowInspectModal] = useState<boolean>(false);
  const [inspectingTrip, setInspectingTrip] = useState<Trip | null>(null);
  const [tripSeats, setTripSeats] = useState<Partial<TripSeatData>>({}); 
  const [selectedWagon, setSelectedWagon] = useState<number>(1);
  const [seatsLoading, setSeatsLoading] = useState<boolean>(false);

  // FORMLAR
  const [stations, setStations] = useState<Station[]>([]);
  const [newTrip, setNewTrip] = useState<TripFormState>({
    tripNumber: '',
    departureStationId: '',
    arrivalStationId: '',
    tripDate: '',
    departureTime: '',
    arrivalTime: '',
    basePrice: ''
  });
  const [createLoading, setCreateLoading] = useState<boolean>(false);

  const [newStation, setNewStation] = useState<StationFormState>({
    name: '',
    city: '',
    code: ''
  });
  const [stationLoading, setStationLoading] = useState<boolean>(false);

  // SİLME İŞLEMİ
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [tripToDelete, setTripToDelete] = useState<Trip | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<boolean>(false);

  // --- USE EFFECTS ---

  useEffect(() => {
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (!sessionToken) {
      navigate('/admin/login');
      return;
    }
    fetchAdminInfo(sessionToken);
    fetchStations();
  }, [navigate]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      if (!hash) setCurrentView('dashboard');
      else setCurrentView(hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (currentView === 'trips' || currentView === 'deleteTrips') {
      fetchTrips();
    }
  }, [currentView]);

  // --- API FONKSİYONLARI ---

  const fetchAdminInfo = async (sessionToken: string) => {
    try {
      const response = await axios.get('http://localhost:8081/api/admin/me', {
        headers: { 'Session-Token': sessionToken }
      });
      setAdmin(response.data);
    } catch (error) {
      console.error('Admin bilgisi alınamadı:', error);
      handleLogout(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchStations = async () => {
    try {
      const response = await axios.get<Station[]>('http://localhost:8081/api/stations/all');
      setStations(response.data);
    } catch (error) {
      console.error('İstasyonlar yüklenemedi:', error);
    }
  };

  const handleLogout = async (confirm: boolean = true) => {
    if (confirm && !window.confirm('Çıkış yapmak istediğinize emin misiniz?')) return;
    const sessionToken = localStorage.getItem('adminSessionToken');
    if (sessionToken) {
      try {
        await axios.post('http://localhost:8081/api/admin/logout', {}, {
          headers: { 'Session-Token': sessionToken }
        });
      } catch (err) { console.error('Logout hatası:', err); }
    }
    localStorage.removeItem('adminSessionToken');
    localStorage.removeItem('adminInfo');
    navigate('/admin/login', { replace: true });
  };

  const fetchTrips = async () => {
    setTripsLoading(true);
    try {
      const response = await axios.get<Trip[]>('http://localhost:8081/api/trips/all');
      setTrips(response.data);
    } catch (error) {
      console.error('Seferler yüklenemedi:', error);
      alert('Seferler yüklenirken hata oluştu!');
    } finally {
      setTripsLoading(false);
    }
  };

  // --- NAVIGASYON YARDIMCILARI ---
  const goToView = (viewName: string) => { window.location.hash = viewName; };
  const goHome = () => {
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    window.dispatchEvent(new Event('hashchange'));
  };

  // --- AKSİYONLAR ---

  const handleInspectTrip = async (trip: Trip) => {
    setInspectingTrip(trip);
    setShowInspectModal(true);
    setSelectedWagon(1);
    setSeatsLoading(true);
    try {
      const response = await axios.get(`http://localhost:8081/api/seats/trip/${trip.id}`);
      setTripSeats(response.data);
    } catch (error) {
      console.error('Koltuklar yüklenemedi:', error);
      alert('Koltuk bilgileri yüklenirken hata oluştu!');
    } finally {
      setSeatsLoading(false);
    }
  };

  const closeInspectModal = () => {
    setShowInspectModal(false);
    setInspectingTrip(null);
    setTripSeats({});
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrip.tripNumber || !newTrip.departureStationId || !newTrip.arrivalStationId || 
        !newTrip.tripDate || !newTrip.departureTime || !newTrip.arrivalTime || !newTrip.basePrice) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }
    if (newTrip.departureStationId === newTrip.arrivalStationId) {
      alert('Kalkış ve varış istasyonu aynı olamaz!');
      return;
    }
    setCreateLoading(true);
    try {
      await axios.post('http://localhost:8081/api/trips/create', newTrip);
      alert('✅ Sefer başarıyla oluşturuldu!');
      goHome();
      setNewTrip({ tripNumber: '', departureStationId: '', arrivalStationId: '', tripDate: '', departureTime: '', arrivalTime: '', basePrice: '' });
    } catch (error: any) {
      alert('❌ Sefer oluşturulurken hata oluştu: ' + (error.response?.data || error.message));
    } finally {
      setCreateLoading(false);
    }
  };

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStation.name || !newStation.city || !newStation.code) {
      alert('Lütfen tüm alanları doldurun!');
      return;
    }
    setStationLoading(true);
    try {
      await axios.post('http://localhost:8081/api/stations/create', newStation);
      alert('✅ İstasyon başarıyla oluşturuldu!');
      fetchStations();
      goHome();
      setNewStation({ name: '', city: '', code: '' });
    } catch (error: any) {
      alert('❌ İstasyon oluşturulurken hata oluştu: ' + (error.response?.data || error.message));
    } finally {
      setStationLoading(false);
    }
  };

  const handleDeleteClick = (trip: Trip) => {
    setTripToDelete(trip);
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTripToDelete(null);
  };

  const confirmDelete = async () => {
    if (!tripToDelete) return;
    setDeleteLoading(true);
    try {
      await axios.delete(`http://localhost:8081/api/trips/${tripToDelete.id}`);
      alert('✅ Sefer başarıyla silindi!');
      fetchTrips();
      closeDeleteModal();
    } catch (error: any) {
      alert('❌ Sefer silinirken hata oluştu: ' + (error.response?.data || error.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  // --- KORİDOR DÜZENİ RENDER FONKSİYONU ---
  const renderCorridorLayoutForAdmin = () => {
    // Seçili vagonun koltuklarını al
    const currentSeats: Seat[] = tripSeats[`wagon_${selectedWagon}`] || [];
    
    // Numaraya göre sırala
    const sortedSeats = [...currentSeats].sort((a, b) => a.seatNumber - b.seatNumber);
    
    // 4'erli satırlara böl
    const rows = [];
    for (let i = 0; i < sortedSeats.length; i += 4) {
      rows.push(sortedSeats.slice(i, i + 4));
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
        {/* Lokomotif İkonu */}
        <div style={{ 
          width: '100%', 
          background: '#e0e0e0', 
          padding: '10px', 
          borderRadius: '8px 8px 0 0', 
          textAlign: 'center',
          color: '#666',
          fontWeight: 'bold',
          marginBottom: '10px'
        }}>
          ⬇️ Lokomotif Yönü ⬇️
        </div>

        {rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
            {/* SOL 2 KOLTUK */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {row.slice(0, 2).map(seat => renderAdminSeat(seat))}
            </div>

            {/* KORİDOR BOŞLUĞU */}
            <div style={{ color: '#ccc', fontSize: '12px', width: '20px', textAlign: 'center' }}>
              {rowIndex + 1}
            </div>

            {/* SAĞ 2 KOLTUK */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {row.slice(2, 4).map(seat => renderAdminSeat(seat))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAdminSeat = (seat: Seat) => {
    const isAvailable = seat.isAvailable;
    return (
      <div
        key={seat.id}
        style={{
          width: '45px',
          height: '45px',
          borderRadius: '12px 12px 4px 4px', // Tren koltuğu şekli
          border: '1px solid #ddd',
          backgroundColor: isAvailable ? '#4caf50' : '#e57373', // Yeşil: Boş, Kırmızı: Dolu
          color: 'white',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          fontWeight: 'bold',
          fontSize: '14px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
        title={isAvailable ? 'Boş' : 'Dolu'}
      >
        {seat.seatNumber}
        {/* Koltuk alt çizgisi detayı */}
        <div style={{
          position: 'absolute',
          bottom: '-4px',
          left: '2px',
          right: '2px',
          height: '4px',
          backgroundColor: isAvailable ? '#388e3c' : '#c62828',
          borderRadius: '2px'
        }}></div>
      </div>
    );
  };

  if (loading) {
    return <div className="page-container"><h2 style={{textAlign: 'center', marginTop: '50px'}}>Yükleniyor...</h2></div>;
  }

  // Veriler
  const wagons: Wagon[] = tripSeats.wagons || [];

  return (
    <div style={{minHeight: '100vh', background: '#f5f7fa'}}>
      {/* NAVBAR */}
      <nav style={{
        background: '#0a5a7d', padding: '15px 40px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '24px', fontWeight: 'bold'}}>🚆 ÇufÇuf</div>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px'}}>
          <button onClick={goHome} style={{background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px'}}>🏠 Ana Sayfa</button>
          <button style={{background: '#c62828', border: 'none', color: 'white', padding: '8px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', fontSize: '14px'}}>YÖNETİCİ MODU</button>
          <button onClick={() => handleLogout(true)} style={{background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '5px'}}>⎌ Çıkış</button>
        </div>
      </nav>

      <div style={{padding: '60px 40px'}}>
        
        {/* DASHBOARD GRID */}
        {currentView === 'dashboard' && (
          <>
            <div style={{marginBottom: '40px'}}>
              <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#333', margin: 0}}>Yönetim Paneli</h1>
              <p style={{color: '#666', fontSize: '16px', marginTop: '10px'}}>Sistem durumunu kontrol edin ve seferleri yönetin.</p>
            </div>
            <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '25px', maxWidth: '1400px'}}>
              <div onClick={() => goToView('trips')} style={{background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s'}}>
                <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#e3f2fd', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '28px'}}>👁️</div>
                <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333'}}>Seferleri Görüntüle</h3>
                <p style={{color: '#666', fontSize: '14px'}}>Tüm aktif seferleri listeleyin ve doluluk oranlarını kontrol edin.</p>
              </div>
              <div onClick={() => goToView('addTrip')} style={{background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s'}}>
                <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '28px'}}>➕</div>
                <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333'}}>Sefer Ekle</h3>
                <p style={{color: '#666', fontSize: '14px'}}>Yeni bir tren seferi planlayın, saat ve fiyat belirleyin.</p>
              </div>
              <div onClick={() => goToView('addStation')} style={{background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s'}}>
                <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#f3e5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '28px'}}>📍</div>
                <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333'}}>Durak Ekle</h3>
                <p style={{color: '#666', fontSize: '14px'}}>Sisteme yeni istasyon/durak tanımlayın.</p>
              </div>
              <div onClick={() => goToView('deleteTrips')} style={{background: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', cursor: 'pointer', transition: 'transform 0.2s'}}>
                <div style={{width: '60px', height: '60px', borderRadius: '50%', background: '#ffebee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', fontSize: '28px'}}>🗑️</div>
                <h3 style={{fontSize: '20px', fontWeight: '600', color: '#333'}}>Sefer Sil</h3>
                <p style={{color: '#666', fontSize: '14px'}}>İptal edilen veya hatalı girilen seferleri sistemden kaldırın.</p>
              </div>
            </div>
          </>
        )}

        {/* ADD TRIP VIEW */}
        {currentView === 'addTrip' && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px'}}>
              <button onClick={goHome} style={{fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666'}}>⬅️</button>
              <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#333', margin: 0}}>➕ Yeni Sefer Ekle</h1>
            </div>
            <div style={{background: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '700px'}}>
              <form onSubmit={handleCreateTrip}>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Sefer Numarası</label>
                  <input type="text" value={newTrip.tripNumber} onChange={(e) => setNewTrip({...newTrip, tripNumber: e.target.value})} placeholder="Örn: TR001" style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Kalkış İstasyonu</label>
                    <select value={newTrip.departureStationId} onChange={(e) => setNewTrip({...newTrip, departureStationId: e.target.value})} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required>
                      <option value="">Seçiniz</option>
                      {stations.map(station => (<option key={station.id} value={String(station.id)}>{station.name}</option>))}
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Varış İstasyonu</label>
                    <select value={newTrip.arrivalStationId} onChange={(e) => setNewTrip({...newTrip, arrivalStationId: e.target.value})} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required>
                      <option value="">Seçiniz</option>
                      {stations.map(station => (<option key={station.id} value={String(station.id)}>{station.name}</option>))}
                    </select>
                  </div>
                </div>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Sefer Tarihi</label>
                  <input type="date" value={newTrip.tripDate} onChange={(e) => setNewTrip({...newTrip, tripDate: e.target.value})} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                </div>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px'}}>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Kalkış Saati</label>
                    <input type="time" value={newTrip.departureTime} onChange={(e) => setNewTrip({...newTrip, departureTime: e.target.value})} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Varış Saati</label>
                    <input type="time" value={newTrip.arrivalTime} onChange={(e) => setNewTrip({...newTrip, arrivalTime: e.target.value})} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                  </div>
                </div>
                <div style={{marginBottom: '30px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Bilet Fiyatı (TL)</label>
                  <input type="number" step="0.01" value={newTrip.basePrice} onChange={(e) => setNewTrip({...newTrip, basePrice: e.target.value})} placeholder="Örn: 450.00" style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                  <button type="submit" disabled={createLoading} style={{flex: 1, padding: '14px', background: '#0a5a7d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: createLoading ? 'not-allowed' : 'pointer'}}>
                    {createLoading ? 'Oluşturuluyor...' : '✅ Sefer Oluştur'}
                  </button>
                  <button type="button" onClick={goHome} style={{padding: '14px 30px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'}}>İptal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD STATION VIEW */}
        {currentView === 'addStation' && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px'}}>
              <button onClick={goHome} style={{fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666'}}>⬅️</button>
              <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#333', margin: 0}}>📍 Yeni İstasyon Ekle</h1>
            </div>
            <div style={{background: 'white', borderRadius: '12px', padding: '40px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', maxWidth: '700px'}}>
              <form onSubmit={handleCreateStation}>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>İstasyon Adı</label>
                  <input type="text" value={newStation.name} onChange={(e) => setNewStation({...newStation, name: e.target.value})} placeholder="Örn: Ankara Gar" style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                </div>
                <div style={{marginBottom: '20px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>Şehir</label>
                  <input type="text" value={newStation.city} onChange={(e) => setNewStation({...newStation, city: e.target.value})} placeholder="Örn: Ankara" style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px'}} required />
                </div>
                <div style={{marginBottom: '30px'}}>
                  <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>İstasyon Kodu</label>
                  <input type="text" value={newStation.code} onChange={(e) => setNewStation({...newStation, code: e.target.value})} placeholder="Örn: ANK" maxLength={10} style={{width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '6px', textTransform: 'uppercase'}} required />
                </div>
                <div style={{display: 'flex', gap: '15px'}}>
                  <button type="submit" disabled={stationLoading} style={{flex: 1, padding: '14px', background: '#0a5a7d', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: stationLoading ? 'not-allowed' : 'pointer'}}>
                    {stationLoading ? 'Oluşturuluyor...' : '✅ İstasyon Oluştur'}
                  </button>
                  <button type="button" onClick={goHome} style={{padding: '14px 30px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: 'pointer'}}>İptal</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* TRIPS VIEW */}
        {currentView === 'trips' && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px'}}>
              <button onClick={goHome} style={{fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666'}}>⬅️</button>
              <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#333', margin: 0}}>🚆 Tüm Seferler</h1>
            </div>
            {tripsLoading ? <p style={{textAlign: 'center', padding: '40px'}}>Seferler yükleniyor...</p> : (
              <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '900px'}}>
                  <thead>
                    <tr style={{borderBottom: '2px solid #e0e0e0'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Sefer No</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Tarih</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Güzergah</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Doluluk</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr key={trip.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                        <td style={{padding: '12px', color: '#666'}}>{trip.tripNumber}</td>
                        <td style={{padding: '12px', color: '#666'}}>{new Date(trip.tripDate).toLocaleDateString('tr-TR')}</td>
                        <td style={{padding: '12px', color: '#666'}}>{trip.departureStationName} → {trip.arrivalStationName}</td>
                        <td style={{padding: '12px'}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={{width: '100px', height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden'}}>
                              <div style={{width: `${trip.occupancyRate}%`, height: '100%', background: (trip.occupancyRate || 0) > 80 ? '#f44336' : (trip.occupancyRate || 0) > 50 ? '#ff9800' : '#4caf50', transition: 'width 0.3s'}}></div>
                            </div>
                            <span style={{fontSize: '14px', color: '#666', fontWeight: '600'}}>{trip.occupancyRate}%</span>
                          </div>
                        </td>
                        <td style={{padding: '12px'}}>
                          <button onClick={() => handleInspectTrip(trip)} style={{background: '#0a5a7d', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'}}>🔍 İncele</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* DELETE TRIPS VIEW */}
        {currentView === 'deleteTrips' && (
          <div>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px'}}>
              <button onClick={goHome} style={{fontSize: '24px', background: 'none', border: 'none', cursor: 'pointer', color: '#666'}}>⬅️</button>
              <h1 style={{fontSize: '36px', fontWeight: 'bold', color: '#333', margin: 0}}>🗑️ Sefer Sil</h1>
            </div>
            {tripsLoading ? <p style={{textAlign: 'center', padding: '40px'}}>Seferler yükleniyor...</p> : (
              <div style={{background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', overflowX: 'auto'}}>
                <table style={{width: '100%', borderCollapse: 'collapse', minWidth: '900px'}}>
                  <thead>
                    <tr style={{borderBottom: '2px solid #e0e0e0'}}>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Sefer No</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Tarih</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Güzergah</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>Fiyat</th>
                      <th style={{padding: '12px', textAlign: 'left', fontWeight: '600', color: '#333'}}>İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map(trip => (
                      <tr key={trip.id} style={{borderBottom: '1px solid #f0f0f0'}}>
                        <td style={{padding: '12px', color: '#666'}}>{trip.tripNumber}</td>
                        <td style={{padding: '12px', color: '#666'}}>{new Date(trip.tripDate).toLocaleDateString('tr-TR')}</td>
                        <td style={{padding: '12px', color: '#666'}}>{trip.departureStationName} → {trip.arrivalStationName}</td>
                        <td style={{padding: '12px', color: '#666'}}>{trip.basePrice} TL</td>
                        <td style={{padding: '12px'}}>
                          <button onClick={() => handleDeleteClick(trip)} style={{background: '#f44336', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '600'}}>🗑️ Sil</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* INSPECT MODAL - MODERN KORİDOR DÜZENİ */}
      {showInspectModal && inspectingTrip && (
        <div className="modal-overlay" onClick={closeInspectModal} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'}}>
          <div onClick={(e) => e.stopPropagation()} style={{background: 'white', borderRadius: '12px', width: '90%', maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto', padding: '30px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>
              <h2 style={{margin: 0}}>🔍 Sefer Detayları</h2>
              <button onClick={closeInspectModal} style={{background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666'}}>✕</button>
            </div>
            <div style={{background: '#f5f7fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px'}}>
              <div><strong>Sefer No:</strong> {inspectingTrip.tripNumber}</div>
              <div><strong>Tarih:</strong> {new Date(inspectingTrip.tripDate).toLocaleDateString('tr-TR')}</div>
              <div><strong>Güzergah:</strong> {inspectingTrip.departureStationName} → {inspectingTrip.arrivalStationName}</div>
              <div><strong>Kalkış/Varış:</strong> {inspectingTrip.departureTime} - {inspectingTrip.arrivalTime}</div>
              <div><strong>Doluluk:</strong> {inspectingTrip.occupancyRate}%</div>
            </div>

            {seatsLoading ? <p style={{textAlign: 'center', padding: '40px'}}>Koltuklar yükleniyor...</p> : (
              <>
                <div style={{display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '2px solid #e0e0e0', overflowX: 'auto', paddingBottom: '10px'}}>
                  {wagons.map(wagon => (
                    <button key={wagon.id} onClick={() => setSelectedWagon(wagon.wagonNumber)} style={{padding: '10px 20px', borderRadius: '20px', border: 'none', background: selectedWagon === wagon.wagonNumber ? '#005f99' : '#f0f2f5', color: selectedWagon === wagon.wagonNumber ? 'white' : '#666', cursor: 'pointer', fontWeight: '600', whiteSpace: 'nowrap'}}>
                      Vagon {wagon.wagonNumber}
                    </button>
                  ))}
                </div>

                {/* YENİ KORİDOR DÜZENİ */}
                <div style={{background: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #eee'}}>
                   {renderCorridorLayoutForAdmin()}
                </div>

                <div style={{display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '20px'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div style={{width: '20px', height: '20px', background: '#4caf50', borderRadius: '4px'}}></div><span>Boş</span></div>
                  <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><div style={{width: '20px', height: '20px', background: '#f44336', borderRadius: '4px'}}></div><span>Dolu</span></div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {showDeleteModal && tripToDelete && (
        <div className="modal-overlay" onClick={closeDeleteModal} style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'}}>
          <div onClick={(e) => e.stopPropagation()} style={{background: 'white', borderRadius: '12px', padding: '30px', maxWidth: '500px', width: '100%'}}>
            <h2 style={{margin: '0 0 20px 0', color: '#f44336'}}>⚠️ Seferi Sil</h2>
            <p style={{color: '#666', marginBottom: '20px'}}><strong>{tripToDelete.tripNumber}</strong> numaralı seferi silmek istediğinize emin misiniz?</p>
            <div style={{background: '#fff3cd', padding: '15px', borderRadius: '6px', marginBottom: '20px'}}>
              <p style={{margin: 0, color: '#856404', fontSize: '14px'}}>⚠️ <strong>Uyarı:</strong> Bu işlem geri alınamaz! Sefer silindiğinde tüm biletler, vagonlar ve koltuklar silinecektir.</p>
            </div>
            <div style={{display: 'flex', gap: '15px'}}>
              <button onClick={confirmDelete} disabled={deleteLoading} style={{flex: 1, padding: '12px', background: '#f44336', color: 'white', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: deleteLoading ? 'not-allowed' : 'pointer'}}>
                {deleteLoading ? 'Siliniyor...' : '🗑️ Evet, Sil'}
              </button>
              <button onClick={closeDeleteModal} disabled={deleteLoading} style={{flex: 1, padding: '12px', background: '#f5f5f5', color: '#666', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: '600', cursor: deleteLoading ? 'not-allowed' : 'pointer'}}>İptal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;