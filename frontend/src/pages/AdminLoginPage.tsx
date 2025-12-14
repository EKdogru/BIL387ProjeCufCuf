import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../App.css';

const AdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

 
  useEffect(() => {
    localStorage.removeItem('adminSessionToken');
    localStorage.removeItem('adminInfo');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8081/api/admin/login', {
        username,
        password
      });
      
      const { sessionToken, fullName, role, message } = response.data;
      
   
      localStorage.setItem('adminSessionToken', sessionToken);
      localStorage.setItem('adminInfo', JSON.stringify({ fullName, role }));
      
      alert('✅ ' + message);
 
      navigate('/admin/dashboard', { replace: true });
      
    } catch (err: any) {
      const errorMsg = typeof err.response?.data === 'string' 
        ? err.response.data 
        : err.response?.data?.message || err.message || 'Giriş başarısız!';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

 
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#667eea';
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = '#e0e0e0';
  };

  return (
    <div className="page-container">
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div>
        <div className="menu">
          <span onClick={() => navigate('/')}>Ana Sayfa</span>
        </div>
      </nav>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 'calc(100vh - 80px)',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          width: '100%',
          maxWidth: '450px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
        }}>
          <div style={{textAlign: 'center', marginBottom: '30px'}}>
            <h1 style={{margin: 0, color: '#333', fontSize: '28px'}}>🔐 Admin Girişi</h1>
            <p style={{color: '#666', marginTop: '10px'}}>Yönetim paneline hoş geldiniz</p>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              color: '#c62828',
              padding: '12px',
              borderRadius: '6px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{marginBottom: '20px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>
                Kullanıcı Adı
              </label>
              <input 
                type="text" 
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '2px solid #e0e0e0',
                  fontSize: '16px',
                  transition: 'border 0.3s'
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <div style={{marginBottom: '30px'}}>
              <label style={{display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333'}}>
                Şifre
              </label>
              <input 
                type="password" 
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '2px solid #e0e0e0',
                  fontSize: '16px',
                  transition: 'border 0.3s'
                }}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                fontSize: '18px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLButtonElement>) => !loading && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseLeave={(e: React.MouseEvent<HTMLButtonElement>) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {loading ? '⏳ Giriş yapılıyor...' : '🚀 Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;