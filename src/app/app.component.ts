import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { I18nService } from './services/i18n.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],

  template: `
    <nav class="navbar navbar-expand-lg navbar-dark rail-navbar">
      <div class="container">
        <a class="navbar-brand brand-logo" routerLink="/">
          <i class="bi bi-train-front-fill"></i>
          {{ i.t('brand') }}
        </a>

        <button
          class="navbar-toggler"
          type="button"
          (click)="open.set(!open())"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" [class.show]="open()">
          <ul class="navbar-nav me-auto" (click)="open.set(false)">
            <li class="nav-item">
              <a
                class="nav-link"
                routerLink="/"
                routerLinkActive="active"
                [routerLinkActiveOptions]="{ exact: true }"
              >
                {{ i.t('home') }}
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" routerLink="/search" routerLinkActive="active">
                {{ i.t('search') }}
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" routerLink="/my-bookings" routerLinkActive="active">
                {{ i.t('bookings') }}
              </a>
            </li>

            <li class="nav-item">
              <a class="nav-link" routerLink="/pnr" routerLinkActive="active">
                {{ i.t('pnr') }}
              </a>
            </li>

            @if (!auth.session()) {
              <li class="nav-item">
                <a class="nav-link" routerLink="/login">
                  {{ i.t('login') }}
                </a>
              </li>

              <li class="nav-item">
                <a class="nav-link" routerLink="/register">
                  {{ i.t('register') }}
                </a>
              </li>
            }
          </ul>

          <div class="navbar-actions">
            <select
              class="form-select form-select-sm w-auto"
              [value]="i.lang()"
              (change)="i.setLang($any($event.target).value)"
              aria-label="Language"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు</option>
              <option value="hi">हिन्दी</option>
              <option value="ta">தமிழ்</option>
              <option value="kn">ಕನ್ನಡ</option>
              <option value="ml">മലയാളം</option>
              <option value="mr">मराठी</option>
              <option value="bn">বাংলা</option>
              <option value="gu">ગુજરાતી</option>
              <option value="pa">ਪੰਜਾਬੀ</option>
              <option value="or">ଓଡ଼ିଆ</option>
            </select>

            @if (auth.session(); as s) {
              <span class="user-greeting"> {{ i.t('hello') }}, {{ s.name }} </span>

              <button class="logout-btn" (click)="logout()">
                <i class="bi bi-box-arrow-right"></i>
                {{ i.t('logout') }}
              </button>
            }
          </div>
        </div>
      </div>
    </nav>

    <main class="container py-4">
      <router-outlet />
    </main>
  `,

  styles: [
    `
      .rail-navbar {
        background: rgba(8, 15, 30, 0.96);
        border-bottom: 1px solid rgba(59, 130, 246, 0.3);
        box-shadow: 0 5px 25px rgba(0, 0, 0, 0.35);
        padding: 14px 0;
        position: sticky;
        top: 0;
        z-index: 1050;
        backdrop-filter: blur(14px);
      }

      .brand-logo {
        color: #f8fafc !important;
        font-size: 1.45rem;
        font-weight: 750;
        letter-spacing: -0.5px;
        margin-right: 35px;
      }

      .brand-logo i {
        color: #3b82f6;
        margin-right: 9px;
      }

      .nav-link {
        color: #aab8cc !important;
        font-weight: 500;
        padding: 10px 14px !important;
        margin: 0 3px;
        border-radius: 8px;
        transition: 0.25s ease;
      }

      .nav-link:hover {
        color: #ffffff !important;
        background: rgba(59, 130, 246, 0.12);
      }

      .nav-link.active {
        color: #60a5fa !important;
        background: rgba(37, 99, 235, 0.16);
        box-shadow: inset 0 -2px #3b82f6;
      }

      .navbar-actions {
        display: flex;
        align-items: center;
        gap: 14px;
      }

      .language-select {
        background-color: #111d32;
        color: #e2e8f0;
        border: 1px solid #334155;
        border-radius: 8px;
        cursor: pointer;
      }

      .language-select option {
        background: #111d32;
        color: white;
      }

      .user-greeting {
        color: #cbd5e1;
        font-size: 0.9rem;
        white-space: nowrap;
      }

      .logout-btn {
        background: #17243a;
        border: 1px solid #334155;
        color: #e2e8f0;
        border-radius: 8px;
        padding: 8px 13px;
        transition: 0.25s ease;
        white-space: nowrap;
      }

      .logout-btn:hover {
        background: #2563eb;
        border-color: #3b82f6;
        color: white;
      }

      .navbar-toggler {
        border-color: #475569;
      }

      .navbar-toggler:focus {
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25);
      }

      @media (max-width: 991px) {
        .navbar-actions {
          flex-wrap: wrap;
          padding: 15px 0 5px;
        }

        .navbar-nav {
          padding-top: 12px;
        }

        .nav-link {
          margin: 3px 0;
        }
      }
    `,
  ],
})
export class AppComponent {
  i = inject(I18nService);
  auth = inject(AuthService);
  private router = inject(Router);

  open = signal(false);

  constructor() {
    document.documentElement.lang = this.i.lang();
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
