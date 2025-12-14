import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('info');
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  const user = JSON.parse(localStorage.getItem('userInfo') || '{}');

  useEffect(() => {
    if (!user.email) {
      alert('Profil sayfasını görüntülemek için giriş yapmalısınız!');
      navigate('/');
      return;
    }

    if (activeTab === 'tickets') {
      fetchUserTickets();
    }
  }, [activeTab, navigate, user.email]);

  const fetchUserTickets = async () => {
    setLoading(true);
    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await axios.get('http://localhost:8081/api/bookings/user/my-tickets', {
        headers: {
          'Session-Token': sessionToken
        }
      });
      setTickets(response.data);
    } catch (error) {
      console.error('Biletler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelTicket = async (ticketId) => {
    if (!window.confirm('Bu bileti iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz.')) {
      return;
    }

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      await axios.delete(`http://localhost:8081/api/bookings/${ticketId}/cancel`, {
        headers: {
          'Session-Token': sessionToken
        }
      });
      
      alert('✅ Biletiniz başarıyla iptal edildi.');
      fetchUserTickets();
    } catch (error) {
      console.error('İptal hatası:', error);
      alert('❌ Bilet iptal edilirken bir hata oluştu: ' + (error.response?.data?.message || error.message));
    }
  };

  
  const handleChangeTicket = (ticket) => {
    if(window.confirm(`${ticket.tripNumber} seferili biletinizi değiştirmek istiyor musunuz? Yeni bir sefer seçmeniz için ana sayfaya yönlendirileceksiniz.`)) {
      
      localStorage.setItem('ticketToChange', JSON.stringify(ticket));
      navigate('/'); 
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR');
  };

  const handleLogout = () => {
    if (window.confirm('Çıkış yapmak istediğinize emin misiniz?')) {
      localStorage.removeItem('user');
      localStorage.removeItem('userInfo');
      localStorage.removeItem('sessionToken');
      localStorage.removeItem('ticketToChange');
      navigate('/');
      window.location.reload();
    }
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div>
        <div className="menu">
          <span onClick={() => navigate('/')}>Ana Sayfa</span>
          <span onClick={handleLogout} style={{color: '#ff4444', cursor: 'pointer', fontWeight: 'bold'}}>Çıkış Yap</span>
        </div>
      </nav>

      <div className="profile-container">
        <div className="profile-header">
          <div className="profile-avatar">
            {user.fullName ? user.fullName.charAt(0).toUpperCase() : '?'}
          </div>
          <div className="profile-info-header">
            <h2>{user.fullName || 'Kullanıcı'}</h2>
            <p>{user.email}</p>
          </div>
        </div>

        <div className="profile-tabs">
          <button 
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            👤 Bilgilerim
          </button>
          <button 
            className={`profile-tab ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            🎫 Biletlerim
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'info' && (
            <div className="profile-section">
              <h3>Hesap Bilgilerim</h3>
              <div className="info-card">
                <div className="info-row">
                  <span className="info-label">Ad Soyad:</span>
                  <span className="info-value">{user.fullName || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">E-posta:</span>
                  <span className="info-value">{user.email || '-'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Hesap Durumu:</span>
                  <span className="info-value">
                    <span className="status-badge confirmed">Aktif</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="profile-section">
              <h3>Biletlerim ({tickets.length})</h3>
              
              {loading ? (
                <p style={{textAlign: 'center', padding: '40px'}}>Biletleriniz yükleniyor...</p>
              ) : tickets.length === 0 ? (
                <div className="no-tickets">
                  <p>😔 Henüz bilet satın almadınız.</p>
                  <button onClick={() => navigate('/')} className="search-btn">
                    Sefer Ara
                  </button>
                </div>
              ) : (
                <div className="tickets-grid">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="ticket-card">
                      <div className="ticket-header">
                        <span className="pnr-badge">PNR: {ticket.pnrCode}</span>
                        <span className={`status-badge ${ticket.bookingStatus?.toLowerCase()}`}>
                          {ticket.bookingStatus}
                        </span>
                      </div>
                      <div className="ticket-body">
                        <div className="ticket-row">
                          <span className="label">Sefer:</span>
                          <span className="value">{ticket.tripNumber || '-'}</span>
                        </div>
                        <div className="ticket-row">
                          <span className="label">Yolcu:</span>
                          <span className="value">{ticket.passengerName} {ticket.passengerSurname}</span>
                        </div>
                        <div className="ticket-row">
                          <span className="label">Koltuk:</span>
                          <span className="value">Vagon {ticket.wagonNo} - Koltuk {ticket.seatNo}</span>
                        </div>
                        <div className="ticket-row">
                          <span className="label">Seyahat Tarihi:</span>
                          <span className="value">{formatDate(ticket.tripDate || ticket.travelDate)}</span>
                        </div>
                        <div className="ticket-row">
                          <span className="label">Fiyat:</span>
                          <span className="value price">{ticket.totalPrice} TL</span>
                        </div>
                      </div>

                      {ticket.bookingStatus !== 'CANCELLED' && (
                        <div style={{
                          borderTop: '1px solid #eee',
                          marginTop: '15px',
                          paddingTop: '15px',
                          display: 'flex',
                          gap: '10px'
                        }}>
                          <button 
                            onClick={() => handleChangeTicket(ticket)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: '#f0ad4e',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            🔄 Değiştir
                          </button>
                          <button 
                            onClick={() => handleCancelTicket(ticket.id)}
                            style={{
                              flex: 1,
                              padding: '8px',
                              background: '#d9534f',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontWeight: '600'
                            }}
                          >
                            ❌ İptal Et
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;