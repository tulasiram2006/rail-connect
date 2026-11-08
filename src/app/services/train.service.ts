import { Injectable } from '@angular/core';

export type TrainClass = 'SL' | '3A' | '2A';

export interface Train {
  no: string;
  name: string;
  from: string;
  to: string;
  dep: string;
  arr: string;
  dur: string;
  baseFare: number;
  capacity: Record<TrainClass, number>;
  type?: string;
  distance?: number;
}

export interface Station {
  name: string;
  code: string;
}

export const CLASS_MULTIPLIER: Record<TrainClass, number> = {
  SL: 1,
  '3A': 2.5,
  '2A': 3.5,
};

export const CLASSES: TrainClass[] = ['SL', '3A', '2A'];

export const STATIONS = [
  'Hyderabad',
  'Vijayawada',
  'Visakhapatnam',
  'Chennai',
  'Bengaluru',
  'Mumbai',
  'New Delhi',
  'Kolkata',
];

const EMPTY_CAPACITY: Record<TrainClass, number> = {
  SL: 0,
  '3A': 0,
  '2A': 0,
};

@Injectable({ providedIn: 'root' })
export class TrainService {
  private readonly API = 'http://127.0.0.1:5000';

  stations = STATIONS;

  private liveTrains: Train[] = [];

  async searchStations(query: string): Promise<Station[]> {
    if (!query.trim()) return [];

    const response = await fetch(`${this.API}/stations?q=${encodeURIComponent(query)}`);

    if (!response.ok) {
      throw new Error('Station search failed');
    }

    const result = await response.json();

    return (result.data || []).map((station: any) => ({
      name: station.name,
      code: station.code,
    }));
  }

  async searchLive(from: string, to: string, date: string): Promise<Train[]> {
    const params = new URLSearchParams({
      from,
      to,
      date,
    });

    const response = await fetch(`${this.API}/trains?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Train search failed');
    }

    const result = await response.json();

    const trains: Train[] = (result.data?.trains || []).map((item: any) => ({
      no: item.train.number,
      name: item.train.name,
      from: item.from.name,
      to: item.to.name,
      dep: item.from.departure,
      arr: item.to.arrival,
      dur: this.formatDuration(item.duration),

      // Random base fare between ₹200 and ₹500
      baseFare: Math.floor(200 + Math.random() * 301),

      capacity: { ...EMPTY_CAPACITY },
      type: item.train.type,
      distance: item.distance,
    }));

    this.liveTrains = trains;

    return trains;
  }

  private formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    return `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
  }

  search(from: string, to: string): Train[] {
    return this.liveTrains.filter((train) => train.from === from && train.to === to);
  }

  byNo(no: string): Train | undefined {
    return this.liveTrains.find((train) => train.no === no);
  }

  fare(t: Train, cls: TrainClass, pax = 1): number {
    return Math.round(t.baseFare * CLASS_MULTIPLIER[cls]) * pax;
  }
}
