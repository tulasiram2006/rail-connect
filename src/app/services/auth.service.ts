import { Injectable, signal } from '@angular/core';
export interface User { name: string; email: string; password: string; }
export interface Session { name: string; email: string; token: string; }
@Injectable({ providedIn: 'root' })
export class AuthService {
  private read<T>(k: string, d: T): T { try { return JSON.parse(localStorage.getItem(k) || '') as T; } catch { return d; } }
  session = signal<Session | null>(this.read<Session | null>('session', null));
  isLoggedIn() { return !!this.session(); }
  register(name: string, email: string, password: string): boolean {
    const users = this.read<User[]>('users', []);
    if (users.some(u => u.email === email.toLowerCase())) return false;
    // Demo only: use a real backend + hashing in production.
    users.push({ name, email: email.toLowerCase(), password: btoa(password) });
    localStorage.setItem('users', JSON.stringify(users));
    return true;
  }
  login(email: string, password: string): boolean {
    const u = this.read<User[]>('users', []).find(x => x.email === email.toLowerCase() && x.password === btoa(password));
    if (!u) return false;
    const s: Session = { name: u.name, email: u.email, token: crypto.randomUUID() };
    localStorage.setItem('session', JSON.stringify(s));
    this.session.set(s);
    return true;
  }
  logout() { localStorage.removeItem('session'); this.session.set(null); }
}
