import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// --- TİP TANIMLAMALARI ---

interface Station {
  id: number;
  name: string;
}

interface User {
  fullName: string;
  email: string;
}

interface PnrResult {
  pnrCode: string;
  bookingStatus: string;
  passengerName: string;
  passengerSurname: string;
  wagonNo: number; 
  seatNo: number;
  travelDate: string;
  totalPrice: number;
  createdAt: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  
  // --- STATE TANIMLAMALARI ---
  
  const [stations, setStations] = useState<Station[]>([]);
  const [fromStation, setFromStation] = useState<string>(''); 
  const [toStation, setToStation] = useState<string>('');     
  const [date, setDate] = useState<string>('');

  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const [pnrCode, setPnrCode] = useState<string>('');
  const [pnrResult, setPnrResult] = useState<PnrResult | null>(null);
  const [showPnrModal, setShowPnrModal] = useState<boolean>(false);

  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetchStations();

    const sessionToken = localStorage.getItem('sessionToken');
    if (sessionToken) {
      fetchUserInfo(sessionToken);
    }
  }, []);

  // --- API İSTEKLERİ ---

  const fetchStations = async () => {
    try {
      const response = await axios.get<Station[]>('http://localhost:8081/api/stations/all');
      setStations(response.data);
      
      if (response.data.length > 0) {
        setFromStation(String(response.data[0].id));
        if (response.data.length > 1) {
          setToStation(String(response.data[1].id));
        } else {
          setToStation(String(response.data[0].id));
        }
      }
    } catch (err) {
      console.error('İstasyonlar yüklenemedi:', err);
    }
  };

  const fetchUserInfo = async (sessionToken: string) => {
    try {
      const response = await axios.get('http://localhost:8081/api/users/me', {
        headers: {
          'Session-Token': sessionToken
        }
      });
      setUser(response.data);
    } catch (err) {
      console.error('User bilgisi alınamadı:', err);
      localStorage.removeItem('sessionToken');
      setUser(null);
    }
  };

  // --- HANDLER FONKSİYONLARI ---

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      alert('Lütfen bir tarih seçin!');
      return;
    }
    navigate(`/search?fromId=${fromStation}&toId=${toStation}&date=${date}`);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8081/api/users/register', {
        fullName,
        email,
        passwordHash: password
      });
      
      alert('✅ ' + response.data);
      setAuthTab('login');
      setFullName('');
      setEmail('');
      setPassword('');
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || 'Kayıt başarısız!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8081/api/users/login', {
        email,
        passwordHash: password
      });
      
      const { sessionToken, fullName, email: userEmail, message } = response.data;
      
      localStorage.setItem('sessionToken', sessionToken);
      
      const userInfo: User = {
        fullName: fullName,
        email: userEmail
      };
      localStorage.setItem('userInfo', JSON.stringify(userInfo));
      setUser(userInfo);
      
      alert('✅ ' + message);
      setShowAuthModal(false);
      setEmail('');
      setPassword('');
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || 'Giriş başarısız!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem('sessionToken');
    
    try {
      await axios.post('http://localhost:8081/api/users/logout', {}, {
        headers: {
          'Session-Token': sessionToken
        }
      });
    } catch (err) {
      console.error('Logout hatası:', err);
    }
    
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userInfo');
    setUser(null);
    alert('Çıkış yapıldı!');
  };

  const handlePnrSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pnrCode.trim()) {
      alert('Lütfen PNR kodunuzu girin!');
      return;
    }

    try {
      const response = await axios.get<PnrResult>(`http://localhost:8081/api/bookings/${pnrCode}`);
      setPnrResult(response.data);
      setShowPnrModal(true);
      setPnrCode('');
    } catch (err) {
      alert('PNR kodu ile bilet bulunamadı! Lütfen kontrol edip tekrar deneyin.');
      setPnrResult(null);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <div>
      <nav className="navbar">
        <div className="logo">🚆 ÇufÇuf</div>
        <div className="menu">
          {user ? (
            <>
              <span style={{color: '#fff', marginRight: '15px'}}>
                Hoşgeldin, {user.fullName || user.email}
              </span>
              <button 
                onClick={() => navigate('/profile')}
                style={{
                  background: 'none',
                  border: '1px solid white',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  marginRight: '10px'
                }}
              >
                Profilim
              </button>
              <button 
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: '1px solid white',
                  color: 'white',
                  padding: '5px 15px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Çıkış Yap
              </button>
            </>
          ) : (
            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
              <button 
                onClick={() => setShowAuthModal(true)}
                style={{
                  background: 'white',
                  border: 'none',
                  color: '#005f99',
                  padding: '8px 20px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Giriş Yap / Kayıt Ol
              </button>
              <button 
                onClick={() => navigate('/admin/login')}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid white',
                  color: 'white',
                  padding: '8px 20px',
                  borderRadius: '5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'white';
                  e.currentTarget.style.color = '#005f99';
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.color = 'white';
                }}
              >
                🔐 Admin Girişi
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="hero-section">
        <h1>Yolculuk Başlasın</h1>
        <p>Hızlı, Güvenli ve Konforlu Tren Yolculuğu</p>
      </div>

      <div className="search-box">
        <h3>Bilet Ara</h3>
        <form onSubmit={handleSearch} className="search-form">
          <div className="form-group">
            <label>Nereden</label>
            <select value={fromStation} onChange={(e) => setFromStation(e.target.value)}>
              {stations.map(station => (
                <option key={station.id} value={String(station.id)}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Nereye</label>
            <select value={toStation} onChange={(e) => setToStation(e.target.value)}>
              {stations.map(station => (
                <option key={station.id} value={String(station.id)}>{station.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Tarih</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="search-btn">Sefer Ara ➔</button>
        </form>
      </div>

      <div className="pnr-search-section">
        <h3>🎫 Biletimi Sorgula</h3>
        <p>PNR kodunuz ile bilet bilgilerinize ulaşabilirsiniz</p>
        <form onSubmit={handlePnrSearch} className="pnr-form">
          <input 
            type="text" 
            placeholder="PNR Kodunuz (örn: A1B2C3)"
            value={pnrCode}
            onChange={(e) => setPnrCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="pnr-input"
          />
          <button type="submit" className="pnr-btn">Sorgula 🔍</button>
        </form>
      </div>

      {showAuthModal && (
        <div className="modal-overlay" onClick={() => setShowAuthModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn" 
              onClick={() => setShowAuthModal(false)}
            >
              ✕
            </button>

            <div className="auth-tabs">
              <button 
                className={authTab === 'login' ? 'active' : ''}
                onClick={() => {
                  setAuthTab('login');
                  setError('');
                }}
              >
                Giriş Yap
              </button>
              <button 
                className={authTab === 'register' ? 'active' : ''}
                onClick={() => {
                  setAuthTab('register');
                  setError('');
                }}
              >
                Kayıt Ol
              </button>
            </div>

            {error && <div className="error-message">{error}</div>}

            {authTab === 'login' && (
              <form onSubmit={handleLogin} className="auth-form">
                <div className="form-group">
                  <label>E-posta</label>
                  <input 
                    type="email" 
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Şifre</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                </button>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegister} className="auth-form">
                <div className="form-group">
                  <label>Ad Soyad</label>
                  <input 
                    type="text" 
                    placeholder="Ahmet Yılmaz"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>E-posta</label>
                  <input 
                    type="email" 
                    placeholder="ornek@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Şifre</label>
                  <input 
                    type="password" 
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="auth-submit-btn" disabled={loading}>
                  {loading ? 'Kayıt yapılıyor...' : 'Kayıt Ol'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {showPnrModal && pnrResult && (
        <div className="modal-overlay" onClick={() => setShowPnrModal(false)}>
          <div className="modal-content pnr-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="close-btn" 
              onClick={() => setShowPnrModal(false)}
            >
              ✕
            </button>

            <h2>🎫 Bilet Bilgileriniz</h2>

            <div className="pnr-result-card">
              <div className="pnr-result-header">
                <span className="pnr-code">PNR: {pnrResult.pnrCode}</span>
                <span className={`status-badge ${pnrResult.bookingStatus.toLowerCase()}`}>
                  {pnrResult.bookingStatus}
                </span>
              </div>

              <div className="pnr-result-body">
                <div className="info-row">
                  <span className="info-label">👤 Yolcu:</span>
                  <span className="info-value">{pnrResult.passengerName} {pnrResult.passengerSurname}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">💺 Koltuk:</span>
                  <span className="info-value">Vagon {pnrResult.wagonNo} - Koltuk {pnrResult.seatNo}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">📅 Seyahat Tarihi:</span>
                  <span className="info-value">{formatDate(pnrResult.travelDate)}</span>
                </div>

                <div className="info-row">
                  <span className="info-label">💰 Fiyat:</span>
                  <span className="info-value price">{pnrResult.totalPrice} TL</span>
                </div>

                <div className="info-row">
                  <span className="info-label">🕐 Rezervasyon Tarihi:</span>
                  <span className="info-value">{formatDate(pnrResult.createdAt)}</span>
                </div>
              </div>

              <div className="pnr-actions">
                <button className="action-btn" onClick={() => window.print()}>
                  🖨️ Yazdır
                </button>
                <button className="action-btn secondary" onClick={() => setShowPnrModal(false)}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;