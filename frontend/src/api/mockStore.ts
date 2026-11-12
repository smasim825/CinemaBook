import {
  Movie,
  Showtime,
  Seat,
  HoldResponse,
  Booking,
  DetailedTicket,
  User,
  AuthResponse,
  UserBooking,
  UserTicket,
} from './client';

const DEMO_MOVIES: Movie[] = [
  {
    id: 'movie-spiderman',
    title: 'Spider-Man: Brand New Day',
    description: 'The midnight premiere everyone is fighting for. Concurrency locks push to the limit as Peter Parker faces a multiversal reckoning.',
    poster_url: 'https://images.unsplash.com/photo-1635805737707-575885ab0820?w=600&auto=format&fit=crop&q=80',
    duration_min: 148,
    language: 'English',
    genre: 'Action/Sci-Fi/Marvel',
  },
  {
    id: 'movie-darkknight',
    title: 'The Dark Knight',
    description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests.',
    poster_url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&auto=format&fit=crop&q=80',
    duration_min: 152,
    language: 'English',
    genre: 'Action/Drama/DC',
  },
  {
    id: 'movie-inception',
    title: 'Inception',
    description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.',
    poster_url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    duration_min: 148,
    language: 'English',
    genre: 'Sci-Fi/Action',
  },
  {
    id: 'movie-interstellar',
    title: 'Interstellar',
    description: "When Earth becomes uninhabitable, a team of explorers travels through a wormhole in space in an attempt to ensure humanity's survival.",
    poster_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80',
    duration_min: 169,
    language: 'English',
    genre: 'Sci-Fi/Drama',
  },
  {
    id: 'movie-oppenheimer',
    title: 'Oppenheimer',
    description: 'The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.',
    poster_url: 'https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=600&auto=format&fit=crop&q=80',
    duration_min: 180,
    language: 'English',
    genre: 'Biography/Drama',
  },
  {
    id: 'movie-thebatman',
    title: 'The Batman',
    description: "When a sadistic serial killer begins murdering key political figures, Batman is forced to investigate Gotham's hidden corruption.",
    poster_url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    duration_min: 176,
    language: 'English',
    genre: 'Action/Crime/DC',
  },
  {
    id: 'movie-dune3',
    title: 'Dune: Part Three',
    description: 'The Bene Gesserit conspiracy reaches Arrakis in this monumental continuation of Paul Atreides’ ascendance.',
    poster_url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80',
    duration_min: 165,
    language: 'English',
    genre: 'Sci-Fi/Adventure',
  },
];

const THEATRES = [
  { id: 'th-1', name: 'Star Cineplex (Bashundhara City)', city: 'Dhaka' },
  { id: 'th-2', name: 'Star Cineplex (Shimanto Square)', city: 'Dhaka' },
  { id: 'th-3', name: 'Silver Screen Cineplex', city: 'Chattogram' },
];

function generateShowtimes(): Showtime[] {
  const showtimes: Showtime[] = [];
  const times = ['14:00', '17:30', '20:45', '23:30'];
  const screens = ['IMAX Laser Screen 1', 'Dolby Atmos Screen 2', 'VIP Lounge Screen 3'];

  for (const movie of DEMO_MOVIES) {
    let index = 0;
    for (const theatre of THEATRES) {
      for (let s = 0; s < 2; s++) {
        const time = times[(index + s) % times.length];
        const screen = screens[s % screens.length];
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        now.setHours(hours, minutes, 0, 0);

        showtimes.push({
          id: `st-${movie.id}-${theatre.id}-${s}`,
          movie_id: movie.id,
          theatre_id: theatre.id,
          screen_name: screen,
          start_time: now.toISOString(),
          base_price: `${350 + s * 100}`,
          theatre_name: theatre.name,
          theatre_city: theatre.city,
        });
      }
      index++;
    }
  }
  return showtimes;
}

const DEMO_SHOWTIMES: Showtime[] = generateShowtimes();

const SEAT_ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const SEATS_PER_ROW = 12;

function seatType(row: string): { type: string; multiplier: number } {
  if (row === 'A' || row === 'B') return { type: 'RECLINER', multiplier: 1.8 };
  if (row === 'G' || row === 'H') return { type: 'PREMIUM', multiplier: 1.3 };
  return { type: 'STANDARD', multiplier: 1 };
}

// In-memory / local storage state store
interface StorageState {
  bookings: Record<string, Booking>;
  seatOverrides: Record<string, { status: 'AVAILABLE' | 'HELD' | 'BOOKED'; hold_expires_at: string | null }>;
  currentUser: User | null;
}

const STORAGE_KEY = 'cinemaseat_demo_state';

function loadState(): StorageState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    bookings: {},
    seatOverrides: {},
    currentUser: {
      id: 'demo-user-1',
      name: 'Demo Moviegoer',
      email: 'demo@cinemabook.com',
      phone: '+8801712345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
}

function saveState(state: StorageState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export const mockStore = {
  isDemoMode: true,

  async listMovies(): Promise<Movie[]> {
    return DEMO_MOVIES;
  },

  async getMovie(id: string): Promise<Movie> {
    const movie = DEMO_MOVIES.find((m) => m.id === id);
    if (!movie) throw new Error('Movie not found');
    return movie;
  },

  async listShowtimes(movieId: string): Promise<Showtime[]> {
    return DEMO_SHOWTIMES.filter((s) => s.movie_id === movieId);
  },

  async getShowtime(id: string): Promise<Showtime & { movie_title: string }> {
    const st = DEMO_SHOWTIMES.find((s) => s.id === id);
    if (!st) throw new Error('Showtime not found');
    const movie = DEMO_MOVIES.find((m) => m.id === st.movie_id);
    return {
      ...st,
      movie_title: movie?.title || 'Unknown Feature',
    };
  },

  async getSeatMap(showtimeId: string): Promise<Seat[]> {
    const state = loadState();
    const st = DEMO_SHOWTIMES.find((s) => s.id === showtimeId);
    const basePrice = parseInt(st?.base_price || '400', 10);

    const seats: Seat[] = [];
    const now = Date.now();

    for (const row of SEAT_ROWS) {
      const { type, multiplier } = seatType(row);
      for (let col = 1; col <= SEATS_PER_ROW; col++) {
        const seatId = `${showtimeId}-${row}${col}`;
        const label = `${row}${col}`;
        const override = state.seatOverrides[seatId];

        let status: 'AVAILABLE' | 'HELD' | 'BOOKED' = 'AVAILABLE';
        let holdExpires: string | null = null;

        if (override) {
          if (override.status === 'HELD' && override.hold_expires_at) {
            if (new Date(override.hold_expires_at).getTime() < now) {
              status = 'AVAILABLE';
            } else {
              status = 'HELD';
              holdExpires = override.hold_expires_at;
            }
          } else {
            status = override.status;
          }
        } else {
          // Pre-populate a few booked seats for realistic realism
          if ((row === 'C' && (col === 5 || col === 6)) || (row === 'E' && col === 8)) {
            status = 'BOOKED';
          }
        }

        seats.push({
          id: seatId,
          showtime_id: showtimeId,
          seat_row: row,
          seat_col: col,
          seat_label: label,
          seat_type: type,
          price: `${Math.round(basePrice * multiplier)}`,
          status,
          hold_expires_at: holdExpires,
        });
      }
    }

    return seats;
  },

  async holdSeat(showtimeId: string, seatId: string): Promise<HoldResponse> {
    const state = loadState();
    const st = DEMO_SHOWTIMES.find((s) => s.id === showtimeId);
    if (!st) throw new Error('Showtime not found');

    const seats = await this.getSeatMap(showtimeId);
    const targetSeat = seats.find((s) => s.id === seatId);
    if (!targetSeat) throw new Error('Seat not found');

    if (targetSeat.status !== 'AVAILABLE') {
      const err = new Error('Seat is no longer available');
      (err as any).status = 409;
      throw err;
    }

    const holdSeconds = 120;
    const holdExpiresAt = new Date(Date.now() + holdSeconds * 1000).toISOString();
    const bookingRef = `BK-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    state.seatOverrides[seatId] = {
      status: 'HELD',
      hold_expires_at: holdExpiresAt,
    };

    const booking: Booking = {
      id: `bk-${Date.now()}`,
      booking_ref: bookingRef,
      showtime_id: showtimeId,
      seat_id: seatId,
      phone: state.currentUser?.phone || '+8801712345678',
      amount: targetSeat.price,
      currency: 'BDT',
      status: 'HOLD',
      otp_ref: `otp-${Date.now()}`,
      otp_verified: false,
      hold_expires_at: holdExpiresAt,
      ticket_generated: false,
      otp_code: '123456',
    };

    state.bookings[bookingRef] = booking;
    saveState(state);

    return {
      booking_ref: bookingRef,
      seat: {
        id: targetSeat.id,
        label: targetSeat.seat_label,
        price: targetSeat.price,
      },
      hold_ttl_seconds: holdSeconds,
      hold_expires_at: holdExpiresAt,
      otp_code: '123456',
    };
  },

  async getBooking(ref: string): Promise<Booking> {
    const state = loadState();
    const booking = state.bookings[ref];
    if (!booking) {
      const err = new Error('Booking not found');
      (err as any).status = 404;
      throw err;
    }
    return booking;
  },

  async sendOtp(ref: string): Promise<{ otpRef: string; code?: string }> {
    const state = loadState();
    const booking = state.bookings[ref];
    if (!booking) throw new Error('Booking not found');
    booking.otp_code = '123456';
    saveState(state);
    return { otpRef: booking.otp_ref || 'otp-demo', code: '123456' };
  },

  async verifyOtp(ref: string, code: string): Promise<{ verified: boolean; message?: string }> {
    const state = loadState();
    const booking = state.bookings[ref];
    if (!booking) throw new Error('Booking not found');
    if (code === '123456' || code === booking.otp_code) {
      booking.otp_verified = true;
      booking.status = 'OTP_VERIFIED';
      saveState(state);
      return { verified: true, message: 'OTP verified successfully' };
    }
    const err = new Error('Invalid OTP code. Please enter 123456.');
    (err as any).status = 400;
    throw err;
  },

  async pay(ref: string): Promise<{ paymentId: string; status: string }> {
    const state = loadState();
    const booking = state.bookings[ref];
    if (!booking) throw new Error('Booking not found');

    booking.status = 'CONFIRMED';
    booking.qr_payload = `CINEMASEAT:${booking.booking_ref}:${booking.seat_id}`;

    // Mark seat as permanently booked
    state.seatOverrides[booking.seat_id] = {
      status: 'BOOKED',
      hold_expires_at: null,
    };

    saveState(state);
    return { paymentId: `pay-${Date.now()}`, status: 'PAID' };
  },

  async generateTicket(ref: string): Promise<DetailedTicket> {
    const state = loadState();
    const booking = state.bookings[ref];
    if (!booking) throw new Error('Booking not found');

    booking.ticket_generated = true;
    saveState(state);

    const st = DEMO_SHOWTIMES.find((s) => s.id === booking.showtime_id) || DEMO_SHOWTIMES[0];
    const movie = DEMO_MOVIES.find((m) => m.id === st.movie_id) || DEMO_MOVIES[0];

    const seatMatch = booking.seat_id.match(/([A-H])(\d+)$/);
    const row = seatMatch ? seatMatch[1] : 'C';
    const col = seatMatch ? parseInt(seatMatch[2], 10) : 6;
    const { type } = seatType(row);

    return {
      booking_ref: booking.booking_ref,
      movie: {
        title: movie.title,
        genre: movie.genre,
        duration_min: movie.duration_min,
        language: movie.language,
        poster_url: movie.poster_url,
      },
      theatre: {
        name: st.theatre_name,
        city: st.theatre_city,
        screen_name: st.screen_name,
      },
      showtime: {
        start_time: st.start_time,
      },
      seat: {
        seat_label: `${row}${col}`,
        seat_row: row,
        seat_col: col,
        seat_type: type,
        price: booking.amount,
      },
      user: {
        phone: booking.phone,
      },
      booking: {
        amount: booking.amount,
        currency: booking.currency,
        status: 'CONFIRMED',
        created_at: new Date().toISOString(),
        ticket_generated: true,
        qr_payload: booking.qr_payload || `CINEMASEAT:${booking.booking_ref}`,
        pdf_url: '',
      },
    };
  },

  async register(payload: { name: string; email: string; phone: string }): Promise<AuthResponse> {
    const state = loadState();
    const user: User = {
      id: `usr-${Date.now()}`,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.currentUser = user;
    saveState(state);
    return { token: 'demo-jwt-token', user };
  },

  async login(payload: { identifier?: string; email?: string }): Promise<AuthResponse> {
    const state = loadState();
    const user: User = {
      id: state.currentUser?.id || 'usr-demo',
      name: state.currentUser?.name || 'Demo Moviegoer',
      email: payload.email || payload.identifier || 'demo@cinemabook.com',
      phone: state.currentUser?.phone || '+8801712345678',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.currentUser = user;
    saveState(state);
    return { token: 'demo-jwt-token', user };
  },

  async me(): Promise<{ user: User }> {
    const state = loadState();
    if (!state.currentUser) {
      throw new Error('Not logged in');
    }
    return { user: state.currentUser };
  },

  async logout(): Promise<{ message: string }> {
    const state = loadState();
    state.currentUser = null;
    saveState(state);
    return { message: 'Logged out successfully' };
  },

  async getMyBookings(): Promise<UserBooking[]> {
    const state = loadState();
    const list: UserBooking[] = [];

    for (const bk of Object.values(state.bookings)) {
      const st = DEMO_SHOWTIMES.find((s) => s.id === bk.showtime_id) || DEMO_SHOWTIMES[0];
      const movie = DEMO_MOVIES.find((m) => m.id === st.movie_id) || DEMO_MOVIES[0];
      const seatMatch = bk.seat_id.match(/([A-H])(\d+)$/);
      const row = seatMatch ? seatMatch[1] : 'C';
      const col = seatMatch ? parseInt(seatMatch[2], 10) : 6;
      const { type } = seatType(row);

      list.push({
        id: bk.id,
        booking_ref: bk.booking_ref,
        status: bk.status,
        amount: bk.amount,
        currency: bk.currency,
        hold_expires_at: bk.hold_expires_at,
        ticket_generated: !!bk.ticket_generated,
        created_at: new Date().toISOString(),
        seat_label: `${row}${col}`,
        seat_type: type,
        seat_row: row,
        seat_col: col,
        start_time: st.start_time,
        screen_name: st.screen_name,
        movie_title: movie.title,
        poster_url: movie.poster_url,
        duration_min: movie.duration_min,
        language: movie.language,
        theatre_name: st.theatre_name,
        theatre_city: st.theatre_city,
      });
    }

    return list.reverse();
  },

  async getMyTickets(): Promise<UserTicket[]> {
    const bookings = await this.getMyBookings();
    return bookings
      .filter((b) => b.status === 'CONFIRMED')
      .map((b) => ({
        ...b,
        qr_payload: `CINEMASEAT:${b.booking_ref}`,
      }));
  },
};
