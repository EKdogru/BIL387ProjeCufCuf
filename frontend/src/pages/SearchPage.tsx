import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../App.css';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const fromId = searchParams.get('fromId');
  const toId = searchParams.get('toId');
  const date = searchParams.get('date');

  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);


  const stationNames = {
    1: 'İstanbul',
    2: 'Ankara',
    3: 'İzmir',
    4: 'Eskişehir',
    5: 'Konya'
  };

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const response = await api.get(`/trips/search?fromId=${fromId}&toId=${toId}&date=${date}`);
        setTrips(response.data);
      } catch (error) {
        console.error("Hata:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [fromId, toId, date]);


  const getDuration = (start, end) => {
   
    return "4s 15dk";
  };

  return (
    <div className="search-page-wrapper">
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo" onClick={() => navigate('/')}>🚆 ÇufÇuf</div>
        <div className="menu">
             <span>Biletlerim</span>
             <span>Üye Girişi</span>
        </div>
      </nav>

      <div className="main-content">
        
        {/* Üst Bilgi Kartı (Header Card) */}
        <div className="route-header-card">
            <div className="route-info">
                <h1>{stationNames[fromId]} <span className="arrow">›</span> {stationNames[toId]}</h1>
                <div className="route-date">🕒 {date}</div>
            </div>
            <div className="change-search">
                <button onClick={() => navigate('/')}>Aramayı Değiştir</button>
            </div>
        </div>

        {/* Sefer Listesi */}
        <div className="trip-list-container">
            {loading ? (
            <p>Seferler yükleniyor...</p>
            ) : trips.length === 0 ? (
            <div className="no-trip-card">
                <h3>😔 Sefer Bulunamadı</h3>
            </div>
            ) : (
            trips.map((trip) => (
                <div key={trip.id} className="trip-card-row">
                    
                    {/* SOL: Tren Tipi ve No */}
                    <div className="trip-left">
                        <span className="train-tag">YHT</span>
                        <span className="train-number">{trip.tripNumber} YHT</span>
                    </div>

                    {/* ORTA: Saatler ve Çizgi */}
                    <div className="trip-middle">
                        <div className="time-group">
                            <div className="time">{trip.departureTime.substring(0, 5)}</div>
                            <div className="city">{stationNames[fromId]}</div>
                        </div>
                        
                        <div className="duration-line">
                            <span className="duration-text">{getDuration(trip.departureTime, trip.arrivalTime)}</span>
                            <div className="line"></div>
                        </div>

                        <div className="time-group">
                            <div className="time">{trip.arrivalTime.substring(0, 5)}</div>
                            <div className="city">{stationNames[toId]}</div>
                        </div>
                    </div>

                    {/* SAĞ: Fiyat ve Buton */}
                    <div className="trip-right">
                        <div className="price">{trip.basePrice} TL</div>
                        <button className="select-btn" onClick={() => navigate(`/seats/${trip.id}`)}>
                            Seç
                        </button>
                    </div>

                </div>
            ))
            )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;