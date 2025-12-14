import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

// --- TİP TANIMLAMALARI ---

interface SelectedSeat {
  seatId: number;
  wagonNumber: number;
  seatNumber: number;
}

interface LocationState {
  tripId: number;
  selectedSeat: SelectedSeat;
  passengerName: string;
  passengerSurname: string;
}

// Stil objesi için tip tanımı (CSS hatalarını önler)
interface StyleMap {
  [key: string]: React.CSSProperties;
}

const PaymentPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Location state'i güvenli bir şekilde alıyoruz
  const state = location.state as LocationState;
  const { tripId, selectedSeat, passengerName, passengerSurname } = state || {};

  const [cardNumber, setCardNumber] = useState<string>('');
  const [cardHolder, setCardHolder] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // --- HANDLER FONKSİYONLARI ---

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cardNumber.length !== 16) {
      setError('Kart numarası 16 haneli olmalıdır!');
      return;
    }
    if (cvv.length !== 3) {
      setError('CVV 3 haneli olmalıdır!');
      return;
    }
    if (!expiryDate.match(/^\d{2}\/\d{2}$/)) {
      setError('Son kullanma tarihi AA/YY formatında olmalıdır!');
      return;
    }

    setLoading(true);

    try {
      const sessionToken = localStorage.getItem('sessionToken');
      const response = await axios.post('http://localhost:8081/api/bookings/create', {
        tripId: tripId,
        seatId: selectedSeat.seatId,
        passengerName: passengerName,
        passengerSurname: passengerSurname,
        wagonNumber: selectedSeat.wagonNumber,
        seatNumber: selectedSeat.seatNumber,
        paymentDetails: {
          cardNumber: cardNumber,
          cardHolder: cardHolder,
          cvv: cvv,
          expiryDate: expiryDate
        }
      }, {
        headers: sessionToken ? { 'Session-Token': sessionToken } : {}
      });

      const pnrCode = response.data.pnrCode;
      alert(`🎉 Ödeme Başarılı!\n\nPNR Kodunuz: ${pnrCode}\n\nBu kodu saklayın, biletinizi sorgulamak için kullanabilirsiniz.`);
      navigate('/');
      
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || 'Ödeme işlemi başarısız!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, '').length <= 16) {
      setCardNumber(formatted.replace(/\s/g, ''));
    }
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiryDate(value);
  };

  // Helper functions for focus styles
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#005f99';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e2e8f0';
  };

  if (!tripId || !selectedSeat) {
    return (
      <div className="page-container">
        <nav className="navbar"><div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div></nav>
        <div style={{textAlign: 'center', padding: '50px'}}>
          <h2>Hata! Ödeme bilgileri bulunamadı.</h2>
          <button onClick={() => navigate('/')} className="pay-btn" style={{maxWidth: '300px', margin: '20px auto'}}>Ana Sayfaya Dön</button>
        </div>
      </div>
    );
  }

  // --- STİLLER ---
  const styles: StyleMap = {
    pageBackground: { backgroundColor: '#f0f2f5', minHeight: 'calc(100vh - 64px)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 20px' },
    modalContainer: { backgroundColor: '#fff', borderRadius: '16px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)', width: '100%', maxWidth: '480px', overflow: 'hidden' },
    header: { padding: '20px 25px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: '18px', fontWeight: '600', color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: '8px' },
    closeBtn: { background: 'none', border: 'none', fontSize: '24px', color: '#999', cursor: 'pointer' },
    amountBanner: { backgroundColor: '#f0f7ff', padding: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    amountLabel: { fontSize: '16px', color: '#4a5568', fontWeight: '500' },
    amountValue: { fontSize: '24px', color: '#005f99', fontWeight: '700' },
    formContainer: { padding: '25px' },
    inputGroup: { marginBottom: '20px' },
    label: { display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#4a5568' },
    inputWrapper: { position: 'relative', display: 'flex', alignItems: 'center' },
    input: { width: '100%', padding: '14px 16px', paddingLeft: '45px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', fontSize: '16px', color: '#333', transition: 'all 0.3s' },
    inputIcon: { position: 'absolute', left: '16px', color: '#a0aec0', fontSize: '18px' },
    row: { display: 'flex', gap: '20px' },
    col: { flex: 1 },
    submitBtn: { width: '100%', padding: '16px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '8px', fontSize: '18px', fontWeight: '700', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', transition: 'background-color 0.2s' },
    summaryCompact: { backgroundColor: '#fff', padding: '15px 25px', borderBottom: '1px solid #f0f0f0', fontSize: '14px', color: '#666' }
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div>
      </nav>

      <div style={styles.pageBackground}>
        <div style={styles.modalContainer}>
          
          {/* Header */}
          <div style={styles.header}>
            <div style={styles.headerTitle}>🔒 Güvenli Ödeme</div>
            <button style={styles.closeBtn} onClick={() => navigate('/')}>×</button>
          </div>

          {/* Tutar Bannerı */}
          <div style={styles.amountBanner}>
            <span style={styles.amountLabel}>Ödenecek Tutar</span>
            <span style={styles.amountValue}>450 TL</span>
          </div>

          {/* Kısa Özet */}
          <div style={styles.summaryCompact}>
            <div>👤 <strong>Yolcu:</strong> {passengerName} {passengerSurname}</div>
            <div style={{marginTop: '5px'}}>💺 <strong>Koltuk:</strong> Vagon {selectedSeat.wagonNumber}, No {selectedSeat.seatNumber}</div>
          </div>

          {error && <div className="error-message" style={{margin: '20px 25px 0'}}>{error}</div>}

          {/* Form */}
          <form onSubmit={handlePayment} style={styles.formContainer}>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Kart Numarası</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>💳</span>
                <input 
                  type="text" 
                  placeholder="1234 5678 9012 3456"
                  value={formatCardNumber(cardNumber)}
                  onChange={handleCardNumberChange}
                  required
                  maxLength={19}
                  style={{...styles.input, fontFamily: 'monospace'}}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Kart Üzerindeki İsim</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>👤</span>
                <input 
                  type="text" 
                  placeholder="AD SOYAD"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                  required
                  style={styles.input}
                  onFocus={handleInputFocus}
                  onBlur={handleInputBlur}
                />
              </div>
            </div>

            <div style={styles.row}>
              <div style={styles.col}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Son Kullanma (Ay/Yıl)</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>📅</span>
                    <input 
                      type="text" 
                      placeholder="AA/YY"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      required
                      maxLength={5}
                      style={{...styles.input, textAlign: 'center', paddingLeft: '16px'}}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                </div>
              </div>
              <div style={styles.col}>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>CVV / CVC</label>
                  <div style={styles.inputWrapper}>
                    <span style={styles.inputIcon}>🔒</span>
                    <input 
                      type="password" 
                      placeholder="•••"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      required
                      maxLength={3}
                      style={{...styles.input, textAlign: 'center', paddingLeft: '16px', letterSpacing: '2px'}}
                      onFocus={handleInputFocus}
                      onBlur={handleInputBlur}
                    />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              style={styles.submitBtn}
              disabled={loading}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !loading && (e.currentTarget.style.backgroundColor = '#218838')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => !loading && (e.currentTarget.style.backgroundColor = '#28a745')}
            >
              {loading ? '⏳ İşleniyor...' : <>✓ Öde ve Bileti Al</>}
            </button>

          </form>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;