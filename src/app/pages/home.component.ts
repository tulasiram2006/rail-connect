import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18nService } from '../services/i18n.service';

@Component({
  standalone: true,
  imports: [RouterLink],
  template: `
    <main class="home-page">
      <!-- Cinematic Hero -->
      <section class="hero-section">
        <div class="hero-overlay"></div>

        <div class="container hero-content">
          <div class="hero-badge">
            <i class="bi bi-stars"></i>
            SMART RAILWAY RESERVATION
          </div>

          <h1>
            Your Journey,<br />
            <span>Our Priority.</span>
          </h1>

          <p class="hero-description">
            Discover destinations, explore trains and plan your next journey with a smarter railway
            booking experience.
          </p>

          <div class="hero-actions">
            <a routerLink="/search" class="btn btn-primary btn-lg hero-button">
              <i class="bi bi-search me-2"></i>
              {{ i.t('searchBtn') }}
            </a>

            <a routerLink="/my-bookings" class="btn btn-outline-light btn-lg">
              <i class="bi bi-ticket-perforated me-2"></i>
              My Bookings
            </a>
          </div>

          <div class="hero-stats">
            <div>
              <h3>Easy</h3>
              <p>Train Search</p>
            </div>
            <div>
              <h3>Smart</h3>
              <p>Seat Selection</p>
            </div>
            <div>
              <h3>Digital</h3>
              <p>Ticket Booking</p>
            </div>
          </div>
        </div>

        <div class="hero-bottom-fade"></div>
      </section>

      <!-- Welcome Section -->
      <section class="container welcome-section">
        <div class="section-heading">
          <span class="section-label">EXPLORE RAIL CONNECT</span>
          <h2>Everything you need for a better journey</h2>
          <p>
            Search trains, manage reservations and keep your travel details together in one place.
          </p>
        </div>

        <div class="row g-4">
          <div class="col-md-4">
            <a routerLink="/search" class="feature-card">
              <div class="feature-icon blue-icon">
                <i class="bi bi-train-front"></i>
              </div>
              <h4>Find Your Train</h4>
              <p>Explore trains between stations and check journey schedules.</p>
              <span>Search trains <i class="bi bi-arrow-right"></i></span>
            </a>
          </div>

          <div class="col-md-4">
            <a routerLink="/my-bookings" class="feature-card">
              <div class="feature-icon cyan-icon">
                <i class="bi bi-ticket-perforated"></i>
              </div>
              <h4>Manage Bookings</h4>
              <p>View your reservations, passenger details and digital tickets.</p>
              <span>View bookings <i class="bi bi-arrow-right"></i></span>
            </a>
          </div>

          <div class="col-md-4">
            <a routerLink="/pnr" class="feature-card">
              <div class="feature-icon purple-icon">
                <i class="bi bi-clipboard-check"></i>
              </div>
              <h4>PNR Status</h4>
              <p>Check the booking status of tickets generated in Rail Connect.</p>
              <span>Check PNR <i class="bi bi-arrow-right"></i></span>
            </a>
          </div>
        </div>
      </section>

      <!-- Popular Destinations -->
      <section class="destinations-section">
        <div class="container">
          <div class="section-heading">
            <span class="section-label">TRAVEL INSPIRATION</span>
            <h2>Popular destinations</h2>
            <p>Choose a destination and start planning your next trip.</p>
          </div>

          <div class="row g-4">
            <div class="col-6 col-lg-3">
              <a routerLink="/search" class="destination-card destination-vizag">
                <div class="destination-overlay"></div>
                <div class="destination-info">
                  <span>ANDHRA PRADESH</span>
                  <h4>Visakhapatnam</h4>
                </div>
              </a>
            </div>

            <div class="col-6 col-lg-3">
              <a routerLink="/search" class="destination-card destination-hyd">
                <div class="destination-overlay"></div>
                <div class="destination-info">
                  <span>TELANGANA</span>
                  <h4>Hyderabad</h4>
                </div>
              </a>
            </div>

            <div class="col-6 col-lg-3">
              <a routerLink="/search" class="destination-card destination-chennai">
                <div class="destination-overlay"></div>
                <div class="destination-info">
                  <span>TAMIL NADU</span>
                  <h4>Chennai</h4>
                </div>
              </a>
            </div>

            <div class="col-6 col-lg-3">
              <a routerLink="/search" class="destination-card destination-bengaluru">
                <div class="destination-overlay"></div>
                <div class="destination-info">
                  <span>KARNATAKA</span>
                  <h4>Bengaluru</h4>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>

      <!-- Call to Action -->
      <section class="container cta-section">
        <div class="cta-card">
          <div>
            <span class="section-label">READY TO TRAVEL?</span>
            <h2>Your next journey starts here.</h2>
            <p>Find your train and make your travel plans today.</p>
          </div>

          <a routerLink="/search" class="btn btn-primary btn-lg hero-button">
            Explore Trains <i class="bi bi-arrow-right ms-2"></i>
          </a>
        </div>
      </section>
    </main>
  `,
  styleUrl: './home.component.css',
})
export class HomeComponent {
  i = inject(I18nService);
}
