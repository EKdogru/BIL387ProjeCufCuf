import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// --- TİP TANIMLAMALARI ---

interface Trip {
  id: number;
  tripNumber: string;
  departureStationName?: string;
  arrivalStationName?: string;
  departureTime?: string;
  basePrice: number;
}

interface Wagon {
  id: number;
  wagonNumber: number;
  wagonType: string;
}

interface Seat {
  id: number;
  seatNumber: number;
  isAvailable: boolean;
}

interface SelectedSeat {
  seatId: number;
  wagonNumber: number;
  seatNumber: number;
}

interface TicketToChange {
  id: number;
  pnrCode: string;
  passengerName: string;
  passengerSurname: string;
}

// Location State için Tip
interface LocationState {
  trip?: Trip;
}

const SeatPage: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  const state = location.state as LocationState;
  const tripFromState = state?.trip;

  // --- STATE ---
  const [trip, setTrip] = useState<Trip | null>(tripFromState || null);
  const [selectedSeat, setSelectedSeat] = useState<SelectedSeat | null>(null);
  const [passengerName, setPassengerName] = useState<string>('');
  const [passengerSurname, setPassengerSurname] = useState<string>('');
  
  const [wagons, setWagons] = useState<Wagon[]>([]);
  // Koltukları dinamik obje olarak tutuyoruz (key: string -> value: Seat[])
  const [seats, setSeats] = useState<{ [key: string]: Seat[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWagon, setSelectedWagon] = useState<number>(1);

  // DEĞİŞTİRME MODU KONTROLÜ
  const [changeModeTicket, setChangeModeTicket] = useState<TicketToChange | null>(null);

  useEffect(() => {
    // 1. Değiştirilecek bilet var mı kontrol et
    const ticketToChange = localStorage.getItem('ticketToChange');
    if (ticketToChange) {
      const ticket = JSON.parse(ticketToChange);
      setChangeModeTicket(ticket);
      // Bilgileri otomatik doldur
      setPassengerName(ticket.passengerName);
      setPassengerSurname(ticket.passengerSurname);
    }

    // 2. Sefer bilgilerini yükle
    if (tripFromState) {
      setTrip(tripFromState);
      fetchSeats(tripFromState.id);
    } else if (tripId) {
      fetchTripInfo(tripId);
      fetchSeats(Number(tripId));
    }
  }, [tripFromState, tripId]);

  const fetchTripInfo = async (id: string | number) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/trips/${id}`);
      setTrip(response.data);
    } catch (error) {
      console.error('Trip bilgisi alınamadı:', error);
    }
  };

  const fetchSeats = async (id: number) => {
    try {
      const response = await axios.get(`http://localhost:8081/api/seats/trip/${id}`);
      setWagons(response.data.wagons || []);
      setSeats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Koltuk verisi yüklenemedi:', error);
      setLoading(false);
    }
  };

  const handleSeatClick = (seat: Seat, wagonNum: number) => {
    if (!seat.isAvailable) return;
    
    // Eğer zaten seçiliyse seçimi kaldır
    if (selectedSeat?.seatId === seat.id) {
        setSelectedSeat(null);
    } else {
        setSelectedSeat({ 
          seatId: seat.id,
          wagonNumber: wagonNum, 
          seatNumber: seat.seatNumber 
        });
    }
  };

  // NORMAL ÖDEME İŞLEMİ
  const handlePayment = () => {
    if (!selectedSeat || !passengerName || !passengerSurname) {
      alert("Lütfen koltuk seçin ve yolcu bilgilerini girin!");
      return;
    }

    navigate('/payment', {
      state: {
        tripId: trip ? trip.id : Number(tripId),
        selectedSeat: selectedSeat,
        passengerName: passengerName,
        passengerSurname: passengerSurname
      }
    });
  };

  // DEĞİŞİKLİK İŞLEMİ
  const handleConfirmChange = async () => {
    if (!selectedSeat || !changeModeTicket) {
      alert("Lütfen yeni koltuğunuzu seçin!");
      return;
    }

    if (!window.confirm('Bilet değişikliğini onaylıyor musunuz?')) return;

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      
      const response = await axios.put(`http://localhost:8081/api/bookings/${changeModeTicket.id}/change`, {
        newTripId: trip ? trip.id : Number(tripId),
        newSeatId: selectedSeat.seatId
      }, {
        headers: {
          'Session-Token': sessionToken
        }
      });

      alert('✅ Bilet değişikliği başarıyla tamamlandı!');
      
      localStorage.removeItem('ticketToChange');
      navigate('/profile');

    } catch (error: any) {
      console.error('Değişiklik hatası:', error);
      alert('❌ Değişiklik yapılırken hata oluştu: ' + (error.response?.data || error.message));
    }
  };

  const cancelChangeMode = () => {
    localStorage.removeItem('ticketToChange');
    navigate('/profile');
  };

  // --- KORİDOR DÜZENİ OLUŞTURUCU ---
  // Koltukları 2+2 düzeninde (Sol 2 - Koridor - Sağ 2) render eder
  const renderCorridorLayout = () => {
    const currentSeats = seats[`wagon_${selectedWagon}`] || [];
    
    // Koltukları numarasına göre sırala
    const sortedSeats = [...currentSeats].sort((a, b) => a.seatNumber - b.seatNumber);
    
    // Koltukları 4'erli gruplara (sıralara) böl
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
                    
                    {/* SOL TARAFTAKİ 2 KOLTUK */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {row.slice(0, 2).map(seat => renderSingleSeat(seat))}
                    </div>

                    {/* ORTA KORİDOR (Boşluk veya numara) */}
                    <div style={{ 
                        color: '#ccc', 
                        fontSize: '12px', 
                        width: '20px', 
                        textAlign: 'center' 
                    }}>
                        {rowIndex + 1}
                    </div>

                    {/* SAĞ TARAFTAKİ 2 KOLTUK */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {row.slice(2, 4).map(seat => renderSingleSeat(seat))}
                    </div>
                </div>
            ))}
        </div>
    );
  };

  const renderSingleSeat = (seat: Seat) => {
    const isSelected = selectedSeat?.seatId === seat.id;
    const isOccupied = !seat.isAvailable;

    return (
        <button
            key={seat.id}
            onClick={() => handleSeatClick(seat, selectedWagon)}
            disabled={isOccupied}
            style={{
                width: '45px',
                height: '45px',
                borderRadius: '12px 12px 4px 4px', // Üstü yuvarlak, altı küt (Koltuk şekli)
                border: isSelected ? '2px solid #ff9800' : '1px solid #ddd',
                backgroundColor: isOccupied ? '#e57373' : (isSelected ? '#fff3e0' : 'white'),
                color: isOccupied ? 'white' : (isSelected ? '#ef6c00' : '#333'),
                cursor: isOccupied ? 'not-allowed' : 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                boxShadow: isSelected ? '0 0 10px rgba(255, 152, 0, 0.4)' : '0 2px 4px rgba(0,0,0,0.1)',
                transition: 'all 0.2s',
                position: 'relative'
            }}
        >
            {seat.seatNumber}
            {/* Kol başlığı detayı */}
            <div style={{
                position: 'absolute',
                bottom: '-4px',
                left: '2px',
                right: '2px',
                height: '4px',
                backgroundColor: isOccupied ? '#c62828' : (isSelected ? '#ff9800' : '#ccc'),
                borderRadius: '2px'
            }}></div>
        </button>
    );
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{textAlign: 'center', padding: '50px'}}>
          <h2>Koltuklar yükleniyor...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div>
      </nav>

      {/* CHANGE MODE UYARI BANDI */}
      {changeModeTicket && (
        <div style={{background: '#fff3cd', padding: '15px', textAlign: 'center', borderBottom: '1px solid #ffeeba'}}>
          ⚠️ <strong>Bilet Değişikliği Modu:</strong> Şu an <strong>PNR: {changeModeTicket.pnrCode}</strong> nolu biletinizi değiştiriyorsunuz.
          <button onClick={cancelChangeMode} style={{marginLeft: '15px', padding: '5px 10px', cursor: 'pointer'}}>İptal Et</button>
        </div>
      )}

      <div className="seat-page-layout" style={{ display: 'flex', gap: '40px', padding: '40px', flexWrap: 'wrap', justifyContent: 'center' }}>
        
        {/* SOL TARA: VAGON VE KOLTUKLAR */}
        <div className="wagon-section" style={{ flex: '1', minWidth: '350px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h2 style={{ borderBottom: '2px solid #f0f0f0', paddingBottom: '15px', marginBottom: '20px' }}>Koltuk Seçimi</h2>
          
          {/* VAGON TABLARI */}
          <div className="wagon-tabs" style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '15px', marginBottom: '20px' }}>
            {wagons.map(wagon => (
              <button 
                key={wagon.id} 
                onClick={() => setSelectedWagon(wagon.wagonNumber)}
                style={{
                    padding: '10px 20px',
                    borderRadius: '20px',
                    border: 'none',
                    background: selectedWagon === wagon.wagonNumber ? '#005f99' : '#f0f2f5',
                    color: selectedWagon === wagon.wagonNumber ? 'white' : '#666',
                    cursor: 'pointer',
                    fontWeight: '600',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.3s'
                }}
              >
                Vagon {wagon.wagonNumber}
              </button>
            ))}
          </div>

          {/* KOLTUK HARİTASI (KORİDOR SİSTEMİ) */}
          <div className="seat-map" style={{ background: '#fafafa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' }}>
            {renderCorridorLayout()}
          </div>
          
          <div className="seat-legend" style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '20px', fontSize: '14px', color: '#666' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '15px', height: '15px', background: 'white', border: '1px solid #ccc', borderRadius: '4px' }}></span> Boş</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '15px', height: '15px', background: '#e57373', borderRadius: '4px' }}></span> Dolu</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><span style={{ width: '15px', height: '15px', background: '#fff3e0', border: '2px solid #ff9800', borderRadius: '4px' }}></span> Seçili</div>
          </div>
        </div>

        {/* SAĞ TARAF: ÖZET VE FORM */}
        <div className="summary-section" style={{ width: '350px', background: 'white', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0 }}>Yolcu Bilgileri</h3>
          
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Ad</label>
            <input 
              type="text" 
              placeholder="Adınız"
              value={passengerName}
              onChange={e => setPassengerName(e.target.value)}
              disabled={!!changeModeTicket}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>Soyad</label>
            <input 
              type="text" 
              placeholder="Soyadınız"
              value={passengerSurname}
              onChange={e => setPassengerSurname(e.target.value)}
              disabled={!!changeModeTicket}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
            />
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '20px 0' }} />

          <h3>Sefer Özeti</h3>
          <div className="summary-details" style={{ fontSize: '14px', color: '#444' }}>
            <p style={{ margin: '8px 0' }}><strong>Sefer:</strong> {trip ? trip.tripNumber : `Trip #${tripId}`}</p>
            <p style={{ margin: '8px 0' }}><strong>Koltuk:</strong> {selectedSeat ? `Vagon ${selectedSeat.wagonNumber} - No ${selectedSeat.seatNumber}` : 'Seçilmedi'}</p>
            
            {/* Fiyat Gösterimi */}
            {!changeModeTicket && <h2 className="total-price" style={{ color: '#005f99', fontSize: '28px', margin: '20px 0' }}>450.00 TL</h2>}
            
            {changeModeTicket && (
              <div style={{background:'#e8f5e9', padding:'10px', borderRadius:'6px', marginTop:'10px'}}>
                <p style={{margin:0, color:'#2e7d32', fontWeight:'bold'}}>🔄 Değişiklik İşlemi</p>
                <p style={{margin:0, fontSize:'12px'}}>Ek ücret alınmayacaktır.</p>
              </div>
            )}
          </div>

          {/* BUTON */}
          {changeModeTicket ? (
            <button 
              className="pay-btn" 
              onClick={handleConfirmChange}
              style={{ width: '100%', padding: '15px', background: '#f0ad4e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
            >
              🔄 Değişikliği Onayla
            </button>
          ) : (
            <button 
              className="pay-btn" 
              onClick={handlePayment}
              style={{ width: '100%', padding: '15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
            >
              Ödeme Yap ve Bitir ➔
            </button>
          )}
        </div>

      </div>
    </div>
  );
};

export default SeatPage;