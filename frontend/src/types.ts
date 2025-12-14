// src/types.ts

// Backend'deki User.java
export interface User {
  id: number;
  fullName: string;
  email: string;
  role: 'ADMIN' | 'USER';
  sessionToken?: string;
}

// Backend'deki Station.java
export interface Station {
  id: number;
  name: string;
  city: string;
  code: string;
}

// Backend'deki Trip.java
export interface Trip {
  id: number;
  tripNumber: string;
  departureStationId: number;
  arrivalStationId: number;
  departureStationName?: string;
  arrivalStationName?: string;
  tripDate: string; // "YYYY-MM-DD"
  departureTime: string; // "HH:mm"
  arrivalTime: string;   // "HH:mm"
  basePrice: number;
  occupancyRate?: number;
  availableSeats?: number;
}

// Koltuk (Seat)
export interface Seat {
  id: number;
  wagonId: number;
  seatNumber: number;
  isAvailable: boolean;
  wagonNumber?: number; // Bazı endpointlerden bu dönebilir
  wagonType?: string;
}

// Vagon (Wagon)
export interface Wagon {
  id: number;
  wagonNumber: number;
  wagonType: string;
  totalSeats: number;
}

// Bilet (Booking) - Temizlenmiş hali
export interface Booking {
  id: number;
  pnrCode: string;
  passengerName: string;
  passengerSurname: string;
  tripId: number;
  wagonId: number;
  seatId: number;
  travelDate: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  totalPrice: number;
  // Silinen passengerCount vb. buraya eklemedik
}

// Frontend'e özel stil tipleri (PaymentPage hatası için)
import { CSSProperties } from 'react';
export interface StyleMap {
  [key: string]: CSSProperties;
}