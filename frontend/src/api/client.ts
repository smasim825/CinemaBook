import { mockStore } from './mockStore';

const getBasename = () => {
  const match = typeof window !== 'undefined' ? window.location.pathname.match(/^\/proxy\/\d+/) : null;
  return match ? match[0] : '';
};
const API_BASE = import.meta.env.VITE_API_BASE_URL || getBasename();
let backendUnavailable = false;

export class ApiRequestError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem('cinemaseat_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('cinemaseat_token', token);
  } else {
    localStorage.removeItem('cinemaseat_token');
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init?.headers as Record<string, string> ?? {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    // no body
  }

  if (!res.ok) {
    throw new ApiRequestError(res.status, body?.message ?? res.statusText, body?.error);
  }
  return body as T;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface UserBooking {
  id: string;
  booking_ref: string;
  status: string;
  amount: string;
  currency: string;
  hold_expires_at: string;
  ticket_generated: boolean;
  created_at: string;
  seat_label: string;
  seat_type: string;
  seat_row: string;
  seat_col: number;
  start_time: string;
  screen_name: string;
  movie_title: string;
  poster_url: string;
  duration_min: number;
  language: string;
  theatre_name: string;
  theatre_city: string;
}

export interface UserTicket extends UserBooking {
  qr_payload?: string;
  pdf_url?: string;
  genre?: string;
}

export interface Movie {
  id: string;
  title: string;
  description: string;
  poster_url: string;
  duration_min: number;
  language: string;
  genre: string;
}

export interface Showtime {
  id: string;
  movie_id: string;
  theatre_id: string;
  screen_name: string;
  start_time: string;
  base_price: string;
  theatre_name: string;
  theatre_city: string;
}

export interface Seat {
  id: string;
  showtime_id: string;
  seat_row: string;
  seat_col: number;
  seat_label: string;
  seat_type: string;
  price: string;
  status: 'AVAILABLE' | 'HELD' | 'BOOKED';
  hold_expires_at: string | null;
}

export interface HoldResponse {
  booking_ref: string;
  seat: { id: string; label: string; price: string };
  hold_ttl_seconds: number;
  hold_expires_at: string;
  otp_code?: string;
}

export interface Booking {
  id: string;
  booking_ref: string;
  showtime_id: string;
  seat_id: string;
  phone: string;
  amount: string;
  currency: string;
  status: string;
  otp_ref: string | null;
  otp_verified: boolean;
  hold_expires_at: string;
  ticket_generated?: boolean;
  qr_payload?: string;
  pdf_url?: string;
  otp_code?: string;
}

export interface DetailedTicket {
  booking_ref: string;
  movie: {
    title: string;
    genre: string;
    duration_min: number;
    language: string;
    poster_url: string;
  };
  theatre: {
    name: string;
    city: string;
    screen_name: string;
  };
  showtime: {
    start_time: string;
  };
  seat: {
    seat_label: string;
    seat_row: string;
    seat_col: number;
    seat_type: string;
    price: string;
  };
  user: {
    phone: string;
  };
  booking: {
    amount: string;
    currency: string;
    status: string;
    created_at: string;
    ticket_generated: boolean;
    qr_payload: string;
    pdf_url: string;
  };
}

async function withFallback<T>(fetcher: () => Promise<T>, fallback: () => Promise<T>): Promise<T> {
  if (backendUnavailable || !API_BASE) {
    backendUnavailable = true;
    return fallback();
  }
  try {
    return await fetcher();
  } catch (err: any) {
    if (
      err?.status === 404 ||
      err?.status === 502 ||
      err?.status === 503 ||
      err?.message?.includes('fetch') ||
      err?.message?.includes('Failed to fetch') ||
      err?.message?.includes('NetworkError') ||
      err?.message?.includes('JSON')
    ) {
      backendUnavailable = true;
      return fallback();
    }
    throw err;
  }
}

export const isDemoModeActive = () => backendUnavailable || !API_BASE;

export const api = {
  // Auth API
  register: (payload: { name: string; email: string; phone: string; password: string; confirmPassword?: string }) =>
    withFallback(
      () =>
        request<AuthResponse>('/auth/register', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => mockStore.register(payload)
    ),

  login: (payload: { identifier?: string; email?: string; phone?: string; password: string }) =>
    withFallback(
      () =>
        request<AuthResponse>('/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        }),
      () => mockStore.login(payload)
    ),

  me: () =>
    withFallback(
      () => request<{ user: User }>('/auth/me'),
      () => mockStore.me()
    ),

  logout: () =>
    withFallback(
      () => request<{ message: string }>('/auth/logout', { method: 'POST' }),
      () => mockStore.logout()
    ),

  getMyBookings: () =>
    withFallback(
      () => request<UserBooking[]>('/auth/my-bookings'),
      () => mockStore.getMyBookings()
    ),

  getMyTickets: () =>
    withFallback(
      () => request<UserTicket[]>('/auth/my-tickets'),
      () => mockStore.getMyTickets()
    ),

  // Movies & Catalog API
  listMovies: () =>
    withFallback(
      () => request<Movie[]>('/api/movies'),
      () => mockStore.listMovies()
    ),

  getMovie: (id: string) =>
    withFallback(
      () => request<Movie>(`/api/movies/${id}`),
      () => mockStore.getMovie(id)
    ),

  listShowtimes: (movieId: string) =>
    withFallback(
      () => request<Showtime[]>(`/api/movies/${movieId}/showtimes`),
      () => mockStore.listShowtimes(movieId)
    ),

  getShowtime: (id: string) =>
    withFallback(
      () => request<Showtime & { movie_title: string }>(`/api/showtimes/${id}`),
      () => mockStore.getShowtime(id)
    ),

  getSeatMap: (showtimeId: string) =>
    withFallback(
      () => request<Seat[]>(`/api/showtimes/${showtimeId}/seats`),
      () => mockStore.getSeatMap(showtimeId)
    ),

  holdSeat: (showtimeId: string, seatId: string) =>
    withFallback(
      () =>
        request<HoldResponse>(`/api/showtimes/${showtimeId}/seats/${seatId}/hold`, {
          method: 'POST',
          body: JSON.stringify({}),
        }),
      () => mockStore.holdSeat(showtimeId, seatId)
    ),

  getBooking: (ref: string) =>
    withFallback(
      () => request<Booking>(`/api/bookings/${ref}`),
      () => mockStore.getBooking(ref)
    ),

  sendOtp: (ref: string) =>
    withFallback(
      () => request<{ otpRef: string; code?: string }>(`/api/bookings/${ref}/otp/send`, { method: 'POST' }),
      () => mockStore.sendOtp(ref)
    ),

  verifyOtp: (ref: string, code: string) =>
    withFallback(
      () =>
        request<{ verified: boolean; message?: string }>(`/api/bookings/${ref}/otp/verify`, {
          method: 'POST',
          body: JSON.stringify({ code }),
        }),
      () => mockStore.verifyOtp(ref, code)
    ),

  pay: (ref: string) =>
    withFallback(
      () => request<{ paymentId: string; status: string }>(`/api/bookings/${ref}/pay`, { method: 'POST' }),
      () => mockStore.pay(ref)
    ),

  generateTicket: (ref: string) =>
    withFallback(
      () => request<DetailedTicket>(`/api/bookings/${ref}/ticket`, { method: 'POST' }),
      () => mockStore.generateTicket(ref)
    ),
};
