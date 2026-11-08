import { Component, inject, input } from '@angular/core';
import { Booking } from '../services/booking.service';
import { I18nService } from '../services/i18n.service';

@Component({
  selector: 'app-ticket',
  standalone: true,
  template: `
    @if (b(); as booking) {
      <div class="mb-3">
        <div class="d-flex justify-content-between flex-wrap">
          <h5>
            {{ booking.trainName }}
            <small class="text-muted">#{{ booking.trainNo }}</small>
          </h5>

          <span
            class="badge fs-6"
            [class.bg-success]="booking.status === 'Confirmed'"
            [class.bg-danger]="booking.status === 'Cancelled'"
          >
            {{ booking.status === 'Confirmed' ? i.t('confirmed') : i.t('cancelled') }}
          </span>
        </div>

        <p class="mb-1">
          <strong>{{ i.t('pnrNo') }}:</strong> {{ booking.pnr }}
        </p>

        <p class="mb-1">
          {{ booking.from }} → {{ booking.to }} · {{ i.date(booking.journeyDate) }} ·
          {{ booking.dep }} – {{ booking.arr }} ·
          {{ booking.cls }}
        </p>

        <hr />

        <h6>Passenger Details & Seat Allocation</h6>

        @for (p of booking.passengers; track $index) {
          <div class="border rounded p-3 mb-3">
            <strong>Passenger {{ $index + 1 }}</strong>

            <p class="mb-2">
              {{ p.name }} ({{ p.age }},
              {{
                p.gender === 'Male'
                  ? i.t('male')
                  : p.gender === 'Female'
                    ? i.t('female')
                    : i.t('other')
              }})
            </p>

            <div class="row g-2">
              <div class="col-md-6">
                <small class="text-muted">Requested Berth</small>
                <div>
                  <strong>{{ p.berthPreference || 'No Preference' }}</strong>
                </div>
              </div>

              <div class="col-md-6">
                <small class="text-muted">Coach Number</small>
                <div>
                  <strong>{{ p.coachNumber || 'Not allocated' }}</strong>
                </div>
              </div>

              <div class="col-md-6">
                <small class="text-muted">Seat Number</small>
                <div>
                  <strong>{{ p.seatNumber ?? 'Not allocated' }}</strong>
                </div>
              </div>

              <div class="col-md-6">
                <small class="text-muted">Allotted Berth</small>
                <div>
                  <strong>{{ p.allottedBerth || 'Not allocated' }}</strong>
                </div>
              </div>
            </div>
          </div>
        }

        <hr />

        <p class="mb-0">
          <strong>{{ i.t('total') }}:</strong>
          {{ i.money(booking.totalFare) }}

          <span class="text-muted small ms-2">
            {{ i.t('bookedOn') }} {{ i.dateTime(booking.bookedAt) }}
          </span>
        </p>
      </div>
    }
  `,
})
export class TicketComponent {
  b = input.required<Booking>();
  i = inject(I18nService);
}
