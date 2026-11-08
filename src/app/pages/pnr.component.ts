import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Booking, BookingService } from '../services/booking.service';
import { I18nService } from '../services/i18n.service';
import { TicketComponent } from './ticket.component';
@Component({
  standalone: true, imports: [ReactiveFormsModule, TicketComponent],
  template: `<div class="card p-4"><h3>{{ i.t('pnr') }}</h3>
    <form [formGroup]="form" (ngSubmit)="check()" class="row g-2 mb-3">
      <div class="col-md-6"><input class="form-control" formControlName="pnr" maxlength="10" inputmode="numeric" [placeholder]="i.t('enterPnr')" [class.is-invalid]="form.invalid && form.touched">
        <div class="invalid-feedback">{{ form.controls.pnr.errors?.['required'] ? i.t('required') : i.t('invalidPnr') }}</div></div>
      <div class="col-auto"><button class="btn btn-primary">{{ i.t('check') }}</button></div></form>
    @if (searched()) { @if (result(); as r) { <app-ticket [b]="r" /> } @else { <div class="alert alert-warning">{{ i.t('pnrNotFound') }}</div> } }</div>`
})
export class PnrComponent {
  i = inject(I18nService); private bs = inject(BookingService);
  result = signal<Booking | undefined>(undefined); searched = signal(false);
  form = new FormGroup({ pnr: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.pattern(/^\d{10}$/)] }) });
  check() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.result.set(this.bs.byPnr(this.form.controls.pnr.value)); this.searched.set(true);
  }
}
