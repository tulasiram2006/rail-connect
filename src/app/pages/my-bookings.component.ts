import { Component, inject, signal } from '@angular/core';
import { BookingService, Booking } from '../services/booking.service';
import { I18nService } from '../services/i18n.service';
import { TicketComponent } from './ticket.component';
import { jsPDF } from 'jspdf';

@Component({
  standalone: true,
  imports: [TicketComponent],
  template: `
    <h3 class="mb-3">{{ i.t('bookings') }}</h3>

    @for (b of list(); track b.pnr) {
      <div class="card p-3 mb-3">
        <app-ticket [b]="b" />

        <div class="d-flex gap-2 flex-wrap mt-2">
          <button class="btn btn-success btn-sm" type="button" (click)="downloadTicket(b)">
            <i class="bi bi-file-earmark-pdf"></i>
            Download Ticket PDF
          </button>

          @if (b.status === 'Confirmed') {
            <button class="btn btn-outline-danger btn-sm" type="button" (click)="cancel(b.pnr)">
              <i class="bi bi-x-circle"></i>
              {{ i.t('cancelTicket') }}
            </button>
          }
        </div>
      </div>
    } @empty {
      <div class="alert alert-info">{{ i.t('noBookings') }}</div>
    }
  `,
})
export class MyBookingsComponent {
  i = inject(I18nService);
  private bs = inject(BookingService);

  list = signal(this.bs.forUser());

  downloadTicket(b: Booking) {
    const doc = new jsPDF();

    let y = 20;

    const addLine = (text: string, size = 11, bold = false) => {
      doc.setFontSize(size);
      doc.setFont('helvetica', bold ? 'bold' : 'normal');

      const lines = doc.splitTextToSize(text, 180);

      if (y + lines.length * 7 > 280) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, 15, y);
      y += lines.length * 7;
    };

    addLine('RAIL CONNECT', 22, true);
    addLine('RAILWAY RESERVATION TICKET', 13, true);

    y += 5;

    addLine(`Booking Status: ${b.status}`, 12, true);
    addLine(`PNR Number: ${b.pnr}`, 12, true);
    addLine(`Train: ${b.trainName} (${b.trainNo})`);
    addLine(`From: ${b.from}`);
    addLine(`To: ${b.to}`);
    addLine(`Journey Date: ${b.journeyDate}`);
    addLine(`Departure: ${b.dep}`);
    addLine(`Arrival: ${b.arr}`);
    addLine(`Travel Class: ${b.cls}`);

    y += 5;
    addLine('PASSENGER DETAILS', 14, true);

    b.passengers.forEach((p, index) => {
      y += 3;
      addLine(`Passenger ${index + 1}: ${p.name}`, 12, true);
      addLine(`Age: ${p.age} | Gender: ${p.gender}`);
      addLine(`Requested Berth: ${p.berthPreference || 'No Preference'}`);
      addLine(`Coach: ${p.coachNumber || 'Not Allocated'}`);
      addLine(`Seat Number: ${p.seatNumber ?? 'Not Allocated'}`);
      addLine(`Allotted Berth: ${p.allottedBerth || 'Not Allocated'}`);
    });

    y += 5;
    addLine(`Total Fare: Rs. ${b.totalFare}`, 13, true);
    addLine(`Booked On: ${new Date(b.bookedAt).toLocaleString()}`);

    y += 10;
    addLine('Thank you for choosing Rail Connect!', 11, true);
    addLine('This is a demo reservation ticket.', 9);

    doc.save(`RailConnect_Ticket_${b.pnr}.pdf`);
  }

  cancel(pnr: string) {
    if (confirm(this.i.t('cancelAsk'))) {
      this.bs.cancel(pnr);
      this.list.set(this.bs.forUser());
    }
  }
}
