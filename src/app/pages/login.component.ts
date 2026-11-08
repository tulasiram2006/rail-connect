import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';
@Component({
  standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `<div class="row justify-content-center"><div class="col-md-5"><div class="card p-4">
    <h3 class="mb-3">{{ i.t('login') }}</h3>
    @if (error()) { <div class="alert alert-danger">{{ i.t(error()) }}</div> }
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-3"><label class="form-label">{{ i.t('email') }}</label>
        <input class="form-control" formControlName="email" type="email" [class.is-invalid]="bad('email')">
        <div class="invalid-feedback">{{ form.controls.email.errors?.['email'] ? i.t('invalidEmail') : i.t('required') }}</div></div>
      <div class="mb-3"><label class="form-label">{{ i.t('password') }}</label>
        <input class="form-control" formControlName="password" type="password" [class.is-invalid]="bad('password')">
        <div class="invalid-feedback">{{ i.t('required') }}</div></div>
      <button class="btn btn-primary w-100">{{ i.t('login') }}</button>
    </form>
    <a routerLink="/register" class="mt-3 d-block text-center">{{ i.t('register') }}</a>
  </div></div></div>`
})
export class LoginComponent {
  i = inject(I18nService); private auth = inject(AuthService); private router = inject(Router); private route = inject(ActivatedRoute);
  error = signal('');
  form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });
  bad(n: 'email' | 'password') { const c = this.form.controls[n]; return c.invalid && (c.touched || c.dirty); }
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const { email, password } = this.form.getRawValue();
    if (this.auth.login(email, password)) this.router.navigateByUrl(this.route.snapshot.queryParams['returnUrl'] || '/search');
    else this.error.set('invalidCreds');
  }
}
