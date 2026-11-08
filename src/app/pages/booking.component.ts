import { Component, inject } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BerthPreference } from '../services/booking.service';
import { I18nService } from '../services/i18n.service';
import { CLASSES, TrainClass, TrainService } from '../services/train.service';

const BERTH_OPTIONS: BerthPreference[] = [
  'No Preference',
  'Lower Berth',
  'Middle Berth',
  'Upper Berth',
  'Side Lower',
  'Side Upper',
];

const newPax = () =>
  new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    age: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(1),
      Validators.max(120),
    ]),
    gender: new FormControl('Male', { nonNullable: true }),
    berthPreference: new FormControl<BerthPreference>('No Preference', {
      nonNullable: true,
    }),
  });

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    @if (train) {
      <div class="card p-4">
        <h4>
          {{ train.name }} <small class="text-muted">#{{ train.no }}</small>
        </h4>

        <p>
          {{ train.from }} → {{ train.to }} · {{ i.date(date) }} · {{ train.dep }} – {{ train.arr }}
        </p>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <div class="mb-3 col-md-3">
            <label class="form-label">Travel Class</label>
            <select class="form-select" formControlName="cls">
              @for (c of classes; track c) {
                <option [value]="c">{{ c }}</option>
              }
            </select>
          </div>

          <h5>Passengers</h5>

          <div formArrayName="passengers">
            @for (p of pax.controls; track $index) {
              <div class="border rounded p-3 mb-3" [formGroupName]="$index">
                <h6>Passenger {{ $index + 1 }}</h6>

                <div class="row g-2">
                  <div class="col-md-4">
                    <label class="form-label">Name</label>
                    <input class="form-control" formControlName="name" placeholder="Enter name" />
                    @if (p.controls.name.invalid && p.controls.name.touched) {
                      <small class="text-danger">Enter a valid name.</small>
                    }
                  </div>

                  <div class="col-md-2">
                    <label class="form-label">Age</label>
                    <input
                      class="form-control"
                      type="number"
                      formControlName="age"
                      placeholder="Age"
                    />
                    @if (p.controls.age.invalid && p.controls.age.touched) {
                      <small class="text-danger">Enter age 1–120.</small>
                    }
                  </div>

                  <div class="col-md-3">
                    <label class="form-label">Gender</label>
                    <select class="form-select" formControlName="gender">
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div class="col-md-3">
                    <label class="form-label">Berth Preference</label>
                    <select class="form-select" formControlName="berthPreference">
                      @for (b of berthOptions; track b) {
                        <option [value]="b">{{ b }}</option>
                      }
                    </select>
                  </div>
                </div>

                @if (pax.length > 1) {
                  <button
                    type="button"
                    class="btn btn-outline-danger btn-sm mt-2"
                    (click)="pax.removeAt($index)"
                  >
                    <i class="bi bi-trash"></i> Remove Passenger
                  </button>
                }
              </div>
            }
          </div>

          <button
            type="button"
            class="btn btn-outline-primary btn-sm mb-3"
            [disabled]="pax.length >= 6"
            (click)="pax.push(newPax())"
          >
            <i class="bi bi-plus"></i> Add Passenger
          </button>

          <div class="border-top pt-3">
            <div class="d-flex justify-content-between mb-2">
              <span>Fare per passenger</span>
              <strong>₹{{ farePerPassenger }}</strong>
            </div>

            <div class="d-flex justify-content-between mb-3">
              <span>Number of passengers</span>
              <strong>{{ pax.length }}</strong>
            </div>

            <hr />

            <div class="d-flex justify-content-between mb-3">
              <h5>Total Ticket Fare</h5>
              <h5 class="text-success">₹{{ totalFare }}</h5>
            </div>

            <button type="submit" class="btn btn-success btn-lg">
              <i class="bi bi-credit-card"></i>
              Proceed to Payment
            </button>
          </div>
        </form>
      </div>
    }
  `,
})
export class BookingComponent {
  i = inject(I18nService);
  ts = inject(TrainService);

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  classes = CLASSES;
  berthOptions = BERTH_OPTIONS;
  newPax = newPax;

  train = this.ts.byNo(this.route.snapshot.paramMap.get('no') || '');

  date = this.route.snapshot.queryParams['date'] || new Date().toISOString().slice(0, 10);

  form = new FormGroup({
    cls: new FormControl<TrainClass>(
      (this.route.snapshot.queryParams['cls'] as TrainClass) || 'SL',
      { nonNullable: true },
    ),
    passengers: new FormArray([newPax()]),
  });

  get pax() {
    return this.form.controls.passengers;
  }

  get farePerPassenger(): number {
    if (!this.train) return 0;
    return this.ts.fare(this.train, this.form.controls.cls.value);
  }

  get totalFare(): number {
    return this.farePerPassenger * this.pax.length;
  }

  constructor() {
    if (!this.train) {
      this.router.navigate(['/search']);
    }
  }

  submit() {
    if (this.form.invalid || !this.train) {
      this.form.markAllAsTouched();
      return;
    }

    const t = this.train;
    const cls = this.form.controls.cls.value;

    const pendingBooking = {
      trainNo: t.no,
      trainName: t.name,
      from: t.from,
      to: t.to,
      dep: t.dep,
      arr: t.arr,
      journeyDate: this.date,
      cls,
      passengers: this.pax.getRawValue().map((p) => ({
        name: p.name,
        age: Number(p.age),
        gender: p.gender,
        berthPreference: p.berthPreference,
      })),
      totalFare: this.totalFare,
    };

    sessionStorage.setItem('pendingBooking', JSON.stringify(pendingBooking));

    this.router.navigate(['/payment']);
  }
}
