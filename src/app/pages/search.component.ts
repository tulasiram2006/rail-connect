import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { Train, TrainService, TrainClass, CLASSES } from '../services/train.service';
import { BookingService } from '../services/booking.service';
import { I18nService } from '../services/i18n.service';

const today = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const diff = (g: AbstractControl): ValidationErrors | null =>
  g.get('from')?.value && g.get('from')?.value === g.get('to')?.value ? { same: true } : null;

const notPast = (c: AbstractControl): ValidationErrors | null =>
  c.value && c.value < today() ? { past: true } : null;

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <div class="search-panel">
      <div class="panel-heading">
        <div>
          <span class="section-tag">{{ i.t('brand') }}</span>
          <h4>{{ i.t('searchTitle') }}</h4>
          <p>{{ i.t('searchDescription') }}</p>
        </div>
        <i class="bi bi-train-front-fill heading-icon"></i>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" class="row g-3">
        <div class="col-md-4 position-relative">
          <label class="form-label"> <i class="bi bi-geo-alt"></i> {{ i.t('from') }} </label>

          <input
            type="text"
            class="form-control"
            [placeholder]="i.t('enterStation')"
            [value]="fromText()"
            (input)="onStationInput('from', $event)"
            autocomplete="off"
          />

          @if (fromSuggestions().length) {
            <div class="list-group position-absolute w-100 suggestion-list">
              @for (s of fromSuggestions(); track s.code) {
                <button
                  type="button"
                  class="list-group-item list-group-item-action"
                  (click)="selectStation('from', s)"
                >
                  <i class="bi bi-geo-alt me-2"></i>
                  {{ s.name }} ({{ s.code }})
                </button>
              }
            </div>
          }
        </div>

        <div class="col-md-4 position-relative">
          <label class="form-label"> <i class="bi bi-geo-alt-fill"></i> {{ i.t('to') }} </label>

          <input
            type="text"
            class="form-control"
            [placeholder]="i.t('enterStation')"
            [value]="toText()"
            (input)="onStationInput('to', $event)"
            autocomplete="off"
          />

          @if (toSuggestions().length) {
            <div class="list-group position-absolute w-100 suggestion-list">
              @for (s of toSuggestions(); track s.code) {
                <button
                  type="button"
                  class="list-group-item list-group-item-action"
                  (click)="selectStation('to', s)"
                >
                  <i class="bi bi-geo-alt me-2"></i>
                  {{ s.name }} ({{ s.code }})
                </button>
              }
            </div>
          }
        </div>

        <div class="col-md-4">
          <label class="form-label"> <i class="bi bi-calendar3"></i> {{ i.t('date') }} </label>
          <input type="date" class="form-control" formControlName="date" [min]="min" />
        </div>

        <div class="col-12">
          <button type="submit" class="btn btn-search" [disabled]="loading()">
            @if (loading()) {
              <span class="spinner-border spinner-border-sm me-2"></span>
              {{ i.t('searching') }}
            } @else {
              <i class="bi bi-search me-2"></i>
              {{ i.t('searchBtn') }}
            }
          </button>
        </div>

        @if (form.errors?.['same']) {
          <div class="col-12 text-danger">
            {{ i.t('sourceDestinationError') }}
          </div>
        }

        @if (submitted && form.invalid && !form.errors?.['same']) {
          <div class="col-12 text-danger">
            {{ i.t('selectStationsError') }}
          </div>
        }
      </form>
    </div>

    @if (error()) {
      <div class="alert alert-danger mt-4">{{ error() }}</div>
    }

    @if (results(); as trains) {
      <div class="results-heading">
        <div>
          <span class="section-tag">{{ i.t('journey') }}</span>
          <h5>{{ trains.length }} {{ i.t('trainsFound') }}</h5>
        </div>
        <i class="bi bi-train-front results-icon"></i>
      </div>

      @if (!trains.length) {
        <div class="empty-state">
          <i class="bi bi-train-front"></i>
          <h5>{{ i.t('noTrainsTitle') }}</h5>
          <p>{{ i.t('tryAnotherRoute') }}</p>
        </div>
      }

      @for (t of trains; track t.no) {
        <div class="train-card">
          <div class="train-header">
            <div>
              <h5>{{ t.name }}</h5>
              <div class="train-number">{{ i.t('trainNumber') }} {{ t.no }}</div>

              @if (t.type) {
                <span class="train-type">{{ t.type }}</span>
              }
            </div>

            <span class="distance-badge">
              <i class="bi bi-signpost-2"></i>
              {{ t.distance }} km
            </span>
          </div>

          <div class="journey-details">
            <div class="station-time">
              <h4>{{ t.dep }}</h4>
              <span>{{ t.from }}</span>
            </div>

            <div class="journey-line">
              <i class="bi bi-arrow-right"></i>
              <span>{{ t.dur }}</span>
            </div>

            <div class="station-time">
              <h4>{{ t.arr }}</h4>
              <span>{{ t.to }}</span>
            </div>
          </div>

          <div class="availability-heading">
            <h6>
              <i class="bi bi-ticket-perforated"></i>
              {{ i.t('classAvailability') }}
            </h6>
            <span>{{ i.t('chooseClass') }}</span>
          </div>

          <div class="row g-3">
            @for (c of classes; track c) {
              <div class="col-md-4">
                <button type="button" class="class-card w-100 text-start" (click)="book(t, c)">
                  <div class="class-title">
                    <strong>{{ className(c) }}</strong>
                    <i class="bi bi-arrow-up-right"></i>
                  </div>

                  @if (availability(t, c); as a) {
                    @if (a.availableSeats > 0) {
                      <div class="availability available">
                        <i class="bi bi-check-circle-fill"></i>
                        {{ i.t('availableSeats') }} - {{ a.availableSeats }}
                      </div>
                    } @else if (a.racAvailable > 0) {
                      <div class="availability rac">
                        <i class="bi bi-exclamation-circle-fill"></i>
                        {{ i.t('rac') }} - {{ a.racBooked + 1 }}
                      </div>
                    } @else if (a.waitingListAvailable > 0) {
                      <div class="availability waiting">
                        <i class="bi bi-clock-fill"></i>
                        {{ i.t('waitingList') }} - {{ a.waitingListCount + 1 }}
                      </div>
                    } @else {
                      <div class="availability regret">
                        <i class="bi bi-x-circle-fill"></i>
                        {{ i.t('regret') }}
                      </div>
                    }
                  }

                  <div class="class-fare">
                    {{ i.t('fare') }}:
                    {{ i.money(ts.fare(t, c)) }}
                    / {{ i.t('perPassenger') }}
                  </div>

                  <div class="class-action">
                    {{ i.t('selectClass') }}
                    <i class="bi bi-arrow-right"></i>
                  </div>
                </button>
              </div>
            }
          </div>
        </div>
      }
    }
  `,
  styles: [
    `
      :host {
        display: block;
        color: #e5edf9;
      }

      .search-panel {
        background: linear-gradient(145deg, #111e34, #0e192c);
        border: 1px solid #263955;
        border-radius: 16px;
        padding: 28px;
        margin-bottom: 34px;
        box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2);
      }

      .panel-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 25px;
      }

      .section-tag {
        color: #60a5fa;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 2px;
      }

      .panel-heading h4 {
        color: #f8fafc;
        font-size: 25px;
        font-weight: 750;
        margin: 7px 0;
      }

      .panel-heading p {
        color: #91a4c0;
        margin: 0;
      }

      .heading-icon {
        color: #3b82f6;
        font-size: 42px;
      }

      .form-label {
        color: #dbeafe;
        font-weight: 600;
        margin-bottom: 9px;
      }

      .form-control {
        background: #0b1628;
        color: #f1f5f9;
        border: 1px solid #33445f;
        border-radius: 9px;
        min-height: 46px;
        padding: 10px 13px;
      }

      .form-control::placeholder {
        color: #8294ad;
      }

      .form-control:focus {
        background: #111e34;
        color: white;
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.18);
      }

      input[type='date']::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
      }

      .btn-search {
        background: #2563eb;
        border: 1px solid #2563eb;
        color: white;
        border-radius: 9px;
        padding: 11px 23px;
        font-weight: 650;
        margin-top: 5px;
        transition: 0.2s ease;
      }

      .btn-search:hover {
        background: #1d4ed8;
        color: white;
        transform: translateY(-2px);
      }

      .btn-search:disabled {
        opacity: 0.7;
        transform: none;
      }

      .suggestion-list {
        z-index: 1000;
        background: #111c30;
        border: 1px solid #33445f;
        border-radius: 9px;
        overflow: hidden;
        margin-top: 4px;
      }

      .list-group-item {
        background: #111c30;
        color: #e5edf9;
        border-color: #33445f;
        padding: 12px;
      }

      .list-group-item:hover {
        background: #1d3558;
        color: white;
      }

      .results-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin: 30px 0 18px;
      }

      .results-heading h5 {
        color: #f8fafc;
        font-size: 22px;
        font-weight: 700;
        margin-top: 5px;
      }

      .results-icon {
        color: #3b82f6;
        font-size: 30px;
      }

      .train-card {
        background: linear-gradient(145deg, #111e34, #101a2d);
        border: 1px solid #263955;
        border-radius: 14px;
        padding: 22px;
        margin-bottom: 20px;
        transition: 0.25s ease;
      }

      .train-card:hover {
        border-color: #3b82f6;
        box-shadow: 0 10px 28px rgba(37, 99, 235, 0.09);
      }

      .train-header {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
      }

      .train-header h5 {
        color: #f8fafc;
        font-size: 21px;
        font-weight: 700;
        margin-bottom: 7px;
      }

      .train-number,
      .train-type {
        color: #9aacc5;
        font-size: 14px;
      }

      .train-type {
        display: block;
        margin-top: 4px;
      }

      .distance-badge {
        background: #1d4ed8;
        color: white;
        padding: 6px 11px;
        border-radius: 7px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .journey-details {
        display: grid;
        grid-template-columns: 1fr 1fr 1fr;
        align-items: center;
        text-align: center;
        border-top: 1px solid #35445c;
        border-bottom: 1px solid #35445c;
        margin: 20px 0;
        padding: 22px 0;
      }

      .station-time h4 {
        color: #f8fafc;
        font-size: 27px;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .station-time span {
        color: #9aacc5;
        font-size: 14px;
      }

      .journey-line {
        color: #60a5fa;
        font-size: 22px;
      }

      .journey-line span {
        display: block;
        color: #9aacc5;
        font-size: 12px;
        margin-top: 7px;
      }

      .availability-heading {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }

      .availability-heading h6 {
        color: #e5edf9;
        font-weight: 700;
        margin: 0;
      }

      .availability-heading span {
        color: #8294ad;
        font-size: 12px;
      }

      .class-card {
        background: #0d192d;
        border: 1px solid #315c9b;
        color: #e5edf9;
        border-radius: 11px;
        padding: 17px;
        min-height: 160px;
        transition: all 0.25s ease;
      }

      .class-card:hover {
        background: #172d4d;
        border-color: #3b82f6;
        transform: translateY(-4px);
        box-shadow: 0 9px 22px rgba(37, 99, 235, 0.15);
      }

      .class-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        color: #60a5fa;
        font-size: 15px;
      }

      .class-title i {
        font-size: 18px;
      }

      .availability {
        font-weight: 750;
        font-size: 14px;
        margin-top: 17px;
      }

      .available {
        color: #22c55e;
      }

      .rac {
        color: #fbbf24;
      }

      .waiting {
        color: #fb923c;
      }

      .regret {
        color: #f87171;
      }

      .class-fare {
        color: #b4c4da;
        font-size: 14px;
        margin-top: 9px;
      }

      .class-action {
        display: flex;
        justify-content: space-between;
        color: #60a5fa;
        font-size: 12px;
        font-weight: 650;
        margin-top: 13px;
        padding-top: 10px;
        border-top: 1px solid #2b405f;
      }

      .empty-state {
        text-align: center;
        background: #111e34;
        border: 1px solid #263955;
        border-radius: 14px;
        padding: 45px 20px;
      }

      .empty-state i {
        font-size: 42px;
        color: #60a5fa;
      }

      .empty-state h5 {
        color: #f8fafc;
        margin-top: 12px;
      }

      .empty-state p {
        color: #9aacc5;
      }

      @media (max-width: 768px) {
        .search-panel {
          padding: 18px;
        }

        .train-card {
          padding: 16px;
        }

        .train-header h5 {
          font-size: 17px;
        }

        .journey-details {
          grid-template-columns: 1fr 0.6fr 1fr;
        }

        .station-time h4 {
          font-size: 21px;
        }

        .station-time span {
          font-size: 12px;
        }

        .availability-heading {
          align-items: flex-start;
          gap: 8px;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class SearchComponent {
  ts = inject(TrainService);
  i = inject(I18nService);
  private router = inject(Router);
  private bs = inject(BookingService);

  classes = CLASSES;

  min = today();
  submitted = false;

  loading = signal(false);
  error = signal('');
  results = signal<Train[] | null>(null);

  fromText = signal('');
  toText = signal('');

  fromSuggestions = signal<{ name: string; code: string }[]>([]);
  toSuggestions = signal<{ name: string; code: string }[]>([]);

  private searchTimers: {
    from?: ReturnType<typeof setTimeout>;
    to?: ReturnType<typeof setTimeout>;
  } = {};

  form = new FormGroup(
    {
      from: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      to: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      date: new FormControl(today(), {
        nonNullable: true,
        validators: [Validators.required, notPast],
      }),
    },
    { validators: diff },
  );

  className(cls: TrainClass): string {
    const names: Record<TrainClass, string> = {
      SL: this.i.t('sleeperClass'),
      '3A': this.i.t('ac3Class'),
      '2A': this.i.t('ac2Class'),
    };
    return names[cls];
  }

  availability(t: Train, cls: TrainClass) {
    return this.bs.getAvailability(t.no, this.form.controls.date.value, cls);
  }

  onStationInput(field: 'from' | 'to', event: Event) {
    const value = (event.target as HTMLInputElement).value;

    this.form.controls[field].setValue('');
    this.form.controls[field].markAsTouched();
    this.results.set(null);

    if (field === 'from') {
      this.fromText.set(value);
      this.fromSuggestions.set([]);
    } else {
      this.toText.set(value);
      this.toSuggestions.set([]);
    }

    if (this.searchTimers[field]) {
      clearTimeout(this.searchTimers[field]);
    }

    if (value.trim().length < 2) return;

    this.searchTimers[field] = setTimeout(async () => {
      try {
        const stations = await this.ts.searchStations(value);

        if (field === 'from') {
          this.fromSuggestions.set(stations);
        } else {
          this.toSuggestions.set(stations);
        }
      } catch {
        this.error.set(this.i.t('stationSearchError'));
      }
    }, 300);
  }

  selectStation(field: 'from' | 'to', station: { name: string; code: string }) {
    this.form.controls[field].setValue(station.code);
    this.form.controls[field].markAsTouched();

    if (field === 'from') {
      this.fromText.set(`${station.name} (${station.code})`);
      this.fromSuggestions.set([]);
    } else {
      this.toText.set(`${station.name} (${station.code})`);
      this.toSuggestions.set([]);
    }

    this.error.set('');
  }

  async submit() {
    this.submitted = true;
    this.error.set('');
    this.results.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { from, to, date } = this.form.getRawValue();

    this.loading.set(true);

    try {
      const trains = await this.ts.searchLive(from, to, date);
      this.results.set(trains);
    } catch (e) {
      console.error(e);
      this.error.set(this.i.t('trainFetchError'));
    } finally {
      this.loading.set(false);
    }
  }

  book(t: Train, cls: TrainClass) {
    this.router.navigate(['/book', t.no], {
      queryParams: {
        cls,
        date: this.form.controls.date.value,
      },
    });
  }
}
