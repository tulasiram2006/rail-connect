import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./pages/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'search',
    loadComponent: () => import('./pages/search.component').then((m) => m.SearchComponent),
  },
  {
    path: 'pnr',
    loadComponent: () => import('./pages/pnr.component').then((m) => m.PnrComponent),
  },
  {
    path: 'book/:no',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/booking.component').then((m) => m.BookingComponent),
  },
  {
    path: 'payment',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/payment.component').then((m) => m.PaymentComponent),
  },
  {
    path: 'confirmation/:pnr',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/confirmation.component').then((m) => m.ConfirmationComponent),
  },
  {
    path: 'my-bookings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/my-bookings.component').then((m) => m.MyBookingsComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
