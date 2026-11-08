import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { TrainClass } from './train.service';

export type BerthPreference =
  'No Preference' | 'Lower Berth' | 'Middle Berth' | 'Upper Berth' | 'Side Lower' | 'Side Upper';

export type AllottedBerth =
  'Lower Berth' | 'Middle Berth' | 'Upper Berth' | 'Side Lower' | 'Side Upper';

export type ReservationStatus = 'CNF' | 'RAC' | 'WL';

export interface Passenger {
  name: string;
  age: number;
  gender: string;
  berthPreference?: BerthPreference;
  coachNumber?: string;
  seatNumber?: number;
  allottedBerth?: AllottedBerth;
  racNumber?: number;
  waitlistNumber?: number;
}

export interface Booking {
  pnr: string;
  userEmail: string;
  trainNo: string;
  trainName: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  journeyDate: string;
  cls: TrainClass;
  passengers: Passenger[];
  totalFare: number;
  status: 'Confirmed' | 'Cancelled';
  reservationStatus?: ReservationStatus;
  bookedAt: string;
}

export interface Availability {
  totalSeats: number;
  availableSeats: number;
  racCapacity: number;
  racAvailable: number;
  racBooked: number;
  waitingListCount: number;
  waitingListAvailable: number;
}

@Injectable({ providedIn: 'root' })
export class BookingService {
  private auth = inject(AuthService);

  private all(): Booking[] {
    try {
      return JSON.parse(localStorage.getItem('bookings') || '[]');
    } catch {
      return [];
    }
  }

  private save(bookings: Booking[]) {
    localStorage.setItem('bookings', JSON.stringify(bookings));
  }

  private newPnr(): string {
    const used = new Set(this.all().map((b) => b.pnr));
    let p: string;

    do {
      p = String(Math.floor(1e9 + Math.random() * 9e9));
    } while (used.has(p));

    return p;
  }

  private coaches(cls: TrainClass): string[] {
    if (cls === 'SL') {
      return Array.from({ length: 10 }, (_, i) => `S${i + 1}`);
    }

    if (cls === '3A') {
      return Array.from({ length: 6 }, (_, i) => `B${i + 1}`);
    }

    return Array.from({ length: 4 }, (_, i) => `A${i + 1}`);
  }

  private seatsPerCoach(cls: TrainClass): number {
    if (cls === 'SL') return 72;
    if (cls === '3A') return 64;
    return 48;
  }

  private totalCapacity(cls: TrainClass): number {
    return this.coaches(cls).length * this.seatsPerCoach(cls);
  }

  private racCapacity(cls: TrainClass): number {
    return Math.ceil(this.totalCapacity(cls) * 0.1);
  }

  private waitingListCapacity = 100;

  private bookingsFor(trainNo: string, date: string, cls: TrainClass) {
    return this.all().filter(
      (b) =>
        b.trainNo === trainNo &&
        b.journeyDate === date &&
        b.cls === cls &&
        b.status === 'Confirmed',
    );
  }

  private passengerCount(bookings: Booking[], reservationStatus: ReservationStatus): number {
    return bookings
      .filter((b) => (b.reservationStatus || 'CNF') === reservationStatus)
      .reduce((sum, b) => sum + b.passengers.length, 0);
  }

  getAvailability(trainNo: string, date: string, cls: TrainClass): Availability {
    const bookings = this.bookingsFor(trainNo, date, cls);

    const totalSeats = this.totalCapacity(cls);
    const racCapacity = this.racCapacity(cls);

    const confirmedBooked = this.passengerCount(bookings, 'CNF');
    const racBooked = this.passengerCount(bookings, 'RAC');
    const waitingListCount = this.passengerCount(bookings, 'WL');

    return {
      totalSeats,
      availableSeats: Math.max(0, totalSeats - confirmedBooked),
      racCapacity,
      racAvailable: Math.max(0, racCapacity - racBooked),
      racBooked,
      waitingListCount,
      waitingListAvailable: Math.max(0, this.waitingListCapacity - waitingListCount),
    };
  }

  private getBerth(seat: number, cls: TrainClass): AllottedBerth {
    if (cls === '2A') {
      const pattern: AllottedBerth[] = [
        'Lower Berth',
        'Upper Berth',
        'Lower Berth',
        'Upper Berth',
        'Side Lower',
        'Side Upper',
      ];

      return pattern[(seat - 1) % 6];
    }

    const pattern: AllottedBerth[] = [
      'Lower Berth',
      'Middle Berth',
      'Upper Berth',
      'Lower Berth',
      'Middle Berth',
      'Upper Berth',
      'Side Lower',
      'Side Upper',
    ];

    return pattern[(seat - 1) % 8];
  }

  private allocateSeats(
    passengers: Passenger[],
    trainNo: string,
    date: string,
    cls: TrainClass,
  ): Passenger[] {
    const existing = this.bookingsFor(trainNo, date, cls).filter(
      (b) => (b.reservationStatus || 'CNF') === 'CNF',
    );

    const occupied = new Set<string>();

    existing.forEach((b) => {
      b.passengers.forEach((p) => {
        if (p.coachNumber && p.seatNumber) {
          occupied.add(`${p.coachNumber}-${p.seatNumber}`);
        }
      });
    });

    const coaches = this.coaches(cls);
    const seats = this.seatsPerCoach(cls);

    return passengers.map((passenger) => {
      const available: {
        coach: string;
        seat: number;
        berth: AllottedBerth;
      }[] = [];

      coaches.forEach((coach) => {
        for (let seat = 1; seat <= seats; seat++) {
          if (!occupied.has(`${coach}-${seat}`)) {
            available.push({
              coach,
              seat,
              berth: this.getBerth(seat, cls),
            });
          }
        }
      });

      if (!available.length) {
        throw new Error('No confirmed seats available.');
      }

      const preferred = passenger.berthPreference || 'No Preference';

      const matching =
        preferred === 'No Preference' ? available : available.filter((s) => s.berth === preferred);

      const choices = matching.length ? matching : available;

      const selected = choices[Math.floor(Math.random() * choices.length)];

      occupied.add(`${selected.coach}-${selected.seat}`);

      return {
        ...passenger,
        coachNumber: selected.coach,
        seatNumber: selected.seat,
        allottedBerth: selected.berth,
      };
    });
  }

  private createRacPassengers(
    passengers: Passenger[],
    trainNo: string,
    date: string,
    cls: TrainClass,
  ): Passenger[] {
    const availability = this.getAvailability(trainNo, date, cls);
    let nextNumber = availability.racBooked + 1;

    return passengers.map((p) => ({
      ...p,
      racNumber: nextNumber++,
      coachNumber: undefined,
      seatNumber: undefined,
      allottedBerth: undefined,
      waitlistNumber: undefined,
    }));
  }

  private createWaitingListPassengers(
    passengers: Passenger[],
    trainNo: string,
    date: string,
    cls: TrainClass,
  ): Passenger[] {
    const availability = this.getAvailability(trainNo, date, cls);
    let nextNumber = availability.waitingListCount + 1;

    return passengers.map((p) => ({
      ...p,
      waitlistNumber: nextNumber++,
      coachNumber: undefined,
      seatNumber: undefined,
      allottedBerth: undefined,
      racNumber: undefined,
    }));
  }

  seatsLeft(trainNo: string, date: string, cls: TrainClass, capacity: number): number {
    return this.getAvailability(trainNo, date, cls).availableSeats;
  }

  create(
    data: Omit<Booking, 'pnr' | 'userEmail' | 'status' | 'bookedAt' | 'reservationStatus'>,
  ): Booking {
    const availability = this.getAvailability(data.trainNo, data.journeyDate, data.cls);

    const count = data.passengers.length;
    let reservationStatus: ReservationStatus;
    let passengers: Passenger[];

    if (availability.availableSeats >= count) {
      reservationStatus = 'CNF';
      passengers = this.allocateSeats(data.passengers, data.trainNo, data.journeyDate, data.cls);
    } else if (availability.racAvailable >= count) {
      reservationStatus = 'RAC';
      passengers = this.createRacPassengers(
        data.passengers,
        data.trainNo,
        data.journeyDate,
        data.cls,
      );
    } else if (availability.waitingListAvailable >= count) {
      reservationStatus = 'WL';
      passengers = this.createWaitingListPassengers(
        data.passengers,
        data.trainNo,
        data.journeyDate,
        data.cls,
      );
    } else {
      throw new Error('No tickets available. Waiting list is also full.');
    }

    const b: Booking = {
      ...data,
      passengers,
      reservationStatus,
      pnr: this.newPnr(),
      userEmail: this.auth.session()!.email,
      status: 'Confirmed',
      bookedAt: new Date().toISOString(),
    };

    this.save([...this.all(), b]);

    return b;
  }

  forUser(): Booking[] {
    const email = this.auth.session()?.email;

    return this.all()
      .filter((b) => b.userEmail === email)
      .sort((a, b) => b.bookedAt.localeCompare(a.bookedAt));
  }

  byPnr(pnr: string): Booking | undefined {
    return this.all().find((b) => b.pnr === pnr);
  }

  cancel(pnr: string) {
    this.save(this.all().map((b) => (b.pnr === pnr ? { ...b, status: 'Cancelled' as const } : b)));
  }
}
