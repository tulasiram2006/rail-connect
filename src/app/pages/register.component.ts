import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { I18nService } from '../services/i18n.service';
const match = (g: AbstractControl): ValidationErrors | null => g.get('password')?.value === g.get('confirm')?.value ? null : { mismatch: true };
@Component({
  standalone: true, imports: [ReactiveFormsModule, RouterLink],
  template: `<div class="row justify-content-center"><div class="col-md-5"><div class="card p-4">
    <h3 class="mb-3">{{ i.t('register') }}</h3>
    @if (error()) { <div class="alert alert-danger">{{ i.t(error()) }}</div> }
    <form [formGroup]="form" (ngSubmit)="submit()">
      <div class="mb-3"><label class="form-label">{{ i.t('name') }}</label>
        <input class="form-control" formControlName="name" [class.is-invalid]="bad('name')">
        <div class="invalid-feedback">{{ i.t('required') }}</div></div>
      <div class="mb-3"><label class="form-label">{{ i.t('email') }}</label>
        <input class="form-control" formControlName="email" type="email" [class.is-invalid]="bad('email')">
        <div class="invalid-feedback">{{ form.controls.email.errors?.['email'] ? i.t('invalidEmail') : i.t('required') }}</div></div>
      <div class="mb-3"><label class="form-label">{{ i.t('password') }}</label>
        <input class="form-control" formControlName="password" type="password" [class.is-invalid]="bad('password')">
        <div class="invalid-feedback">{{ form.controls.password.errors?.['minlength'] ? i.t('minPwd') : i.t('required') }}</div></div>
      <div class="mb-3"><label class="form-label">{{ i.t('confirmPwd') }}</label>
        <input class="form-control" formControlName="confirm" type="password" [class.is-invalid]="bad('confirm') || (form.errors?.['mismatch'] && form.controls.confirm.touched)">
        <div class="invalid-feedback">{{ form.errors?.['mismatch'] ? i.t('pwdMismatch') : i.t('required') }}</div></div>
      <button class="btn btn-primary w-100">{{ i.t('register') }}</button>
    </form>
    <a routerLink="/login" class="mt-3 d-block text-center">{{ i.t('login') }}</a>
  </div></div></div>`
})
export class RegisterComponent {
  i = inject(I18nService); private auth = inject(AuthService); private router = inject(Router);
  error = signal('');
  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    confirm: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  }, { validators: match });
  bad(n: 'name' | 'email' | 'password' | 'confirm') { const c = this.form.controls[n]; return c.invalid && (c.touched || c.dirty); }
  submit() {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    if (!this.auth.register(v.name, v.email, v.password)) { this.error.set('exists'); return; }
    this.auth.login(v.email, v.password);
    this.router.navigate(['/search']);
  }
}
