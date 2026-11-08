import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { BookingService } from '../services/booking.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="card p-4 mx-auto" style="max-width: 750px">
      <h3 class="mb-3">Payment Gateway</h3>

      @if (booking) {
        <div class="alert alert-info">Complete your payment to confirm your ticket.</div>

        <h5>Fare Summary</h5>

        <div class="border rounded p-3 mb-4">
          <div class="d-flex justify-content-between mb-2">
            <span>Train Fare</span>
            <strong>₹{{ booking.totalFare }}</strong>
          </div>

          <div class="d-flex justify-content-between mb-2">
            <span>Convenience Fee</span>
            <strong>₹20</strong>
          </div>

          <hr />

          <div class="d-flex justify-content-between">
            <h5>Total Amount</h5>
            <h5 class="text-success">₹{{ totalAmount }}</h5>
          </div>
        </div>

        <h5 class="mb-3">Select Payment Method</h5>

        <div class="list-group mb-3">
          @for (method of methods; track method.id) {
            <label class="list-group-item d-flex align-items-center gap-2">
              <input
                type="radio"
                name="payment"
                [value]="method.id"
                [checked]="selectedMethod() === method.id"
                (change)="selectedMethod.set(method.id)"
              />
              <i [class]="method.icon"></i>
              {{ method.name }}
            </label>
          }
        </div>

        @if (selectedMethod() === 'upi') {
          <div class="mb-3">
            <label class="form-label">UPI ID</label>
            <input
              class="form-control"
              placeholder="example@upi"
              [value]="upiId()"
              (input)="upiId.set($any($event.target).value)"
            />
          </div>
        }

        @if (selectedMethod() === 'card') {
          <div class="mb-3">
            <label class="form-label">Card Number</label>
            <input
              class="form-control mb-2"
              placeholder="Enter demo card number"
              maxlength="19"
              [value]="cardNumber()"
              (input)="cardNumber.set($any($event.target).value)"
            />

            <div class="row">
              <div class="col-6">
                <input
                  class="form-control"
                  placeholder="MM/YY"
                  [value]="expiry()"
                  (input)="expiry.set($any($event.target).value)"
                />
              </div>
              <div class="col-6">
                <input
                  class="form-control"
                  placeholder="CVV"
                  maxlength="4"
                  type="password"
                  [value]="cvv()"
                  (input)="cvv.set($any($event.target).value)"
                />
              </div>
            </div>
          </div>
        }

        @if (selectedMethod() === 'netbanking') {
          <div class="mb-3">
            <label class="form-label">Select Bank</label>
            <select
              class="form-select"
              [value]="bank()"
              (change)="bank.set($any($event.target).value)"
            >
              <option value="">Choose Bank</option>
              <option value="SBI">State Bank of India</option>
              <option value="HDFC">HDFC Bank</option>
              <option value="ICICI">ICICI Bank</option>
              <option value="Axis">Axis Bank</option>
            </select>
          </div>
        }

        @if (message()) {
          <div class="alert alert-danger">{{ message() }}</div>
        }

        <button class="btn btn-success btn-lg w-100" [disabled]="processing()" (click)="pay()">
          {{ processing() ? 'Processing...' : 'Pay ₹' + totalAmount }}
        </button>

        <a routerLink="/search" class="btn btn-outline-secondary w-100 mt-2"> Cancel Payment </a>

        <p class="text-muted small mt-3 mb-0">
          Demo payment only. No real money will be charged. Use the simulated payment controls to
          test success or failure.
        </p>
      } @else {
        <div class="alert alert-warning">
          No pending booking found. Please select a train again.
        </div>
        <a routerLink="/search" class="btn btn-primary">Search Trains</a>
      }
    </div>
  `,
})
export class PaymentComponent {
  private router = inject(Router);
  private bs = inject(BookingService);

  booking: any = this.getPendingBooking();

  selectedMethod = signal('upi');
  upiId = signal('');
  cardNumber = signal('');
  expiry = signal('');
  cvv = signal('');
  bank = signal('');

  processing = signal(false);
  message = signal('');

  methods = [
    { id: 'upi', name: 'UPI Payment', icon: 'bi bi-phone' },
    { id: 'card', name: 'Credit / Debit Card', icon: 'bi bi-credit-card' },
    { id: 'netbanking', name: 'Net Banking', icon: 'bi bi-bank' },
    { id: 'wallet', name: 'Wallet', icon: 'bi bi-wallet2' },
  ];

  get totalAmount(): number {
    return Number(this.booking?.totalFare || 0) + 20;
  }

  private getPendingBooking() {
    try {
      return JSON.parse(sessionStorage.getItem('pendingBooking') || 'null');
    } catch {
      return null;
    }
  }

  pay() {
    if (!this.booking) return;

    this.message.set('');

    if (this.selectedMethod() === 'upi' && !this.upiId().includes('@')) {
      this.message.set('Enter a valid demo UPI ID.');
      return;
    }

    if (this.selectedMethod() === 'card') {
      const digits = this.cardNumber().replace(/\s/g, '');

      if (
        !/^\d{12,19}$/.test(digits) ||
        !/^\d{2}\/\d{2}$/.test(this.expiry()) ||
        !/^\d{3,4}$/.test(this.cvv())
      ) {
        this.message.set('Enter valid demo card details.');
        return;
      }
    }

    if (this.selectedMethod() === 'netbanking' && !this.bank()) {
      this.message.set('Please select a bank.');
      return;
    }

    this.processing.set(true);

    // Simulated payment outcome: use a predictable demo result.
    // No real payment is processed.
    try {
      const b = this.bs.create({
        ...this.booking,
        totalFare: this.totalAmount,
      });

      sessionStorage.removeItem('pendingBooking');
      this.router.navigate(['/confirmation', b.pnr]);
    } catch (error) {
      this.message.set(
        error instanceof Error ? error.message : 'Booking failed. Please try again.',
      );
    } finally {
      this.processing.set(false);
    }
  }
}
