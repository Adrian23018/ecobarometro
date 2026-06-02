import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';

type Step = 'email' | 'code' | 'password';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {

  step: Step = 'email';
  loading = false;
  errorMsg = '';
  successMsg = '';

  // Step 1
  email = '';

  // Step 2
  codeInput = '';

  // Step 3
  newPassword = '';
  confirmPassword = '';
  showNew = false;
  showConfirm = false;

  private readonly STORAGE_KEY = 'eco_recovery_code';
  private readonly WEBHOOK_URL = 'https://hooks.myfdsas.com/webhook/gmail-eco-recovery';

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private router: Router
  ) {}

  // ── STEP 1: enviar código ──────────────────────────────────────
  async sendCode() {
    this.errorMsg = '';
    if (!this.email) { this.errorMsg = 'Ingresa tu correo electrónico.'; return; }

    this.loading = true;
    try {
      const exists = await this.authService.checkUserEmailExists(this.email);
      if (!exists) {
        this.errorMsg = 'No encontramos una cuenta con ese correo.';
        this.loading = false;
        return;
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiry = Date.now() + 15 * 60 * 1000; // 15 min
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({ code, email: this.email, expiry }));

      const html = this.buildEmailHtml(code);
      await this.http.post(this.WEBHOOK_URL, { email: this.email, code, html }).toPromise();

      this.step = 'code';
    } catch (e) {
      this.errorMsg = 'Error al enviar el código. Intenta de nuevo.';
    } finally {
      this.loading = false;
    }
  }

  // ── STEP 2: verificar código ───────────────────────────────────
  verifyCode() {
    this.errorMsg = '';
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) { this.errorMsg = 'El código expiró. Solicita uno nuevo.'; return; }

    const { code, email, expiry } = JSON.parse(stored);
    if (Date.now() > expiry) {
      localStorage.removeItem(this.STORAGE_KEY);
      this.errorMsg = 'El código expiró. Solicita uno nuevo.';
      return;
    }
    if (email !== this.email) { this.errorMsg = 'Error de validación. Empieza de nuevo.'; return; }
    if (this.codeInput.trim() !== code) { this.errorMsg = 'Código incorrecto.'; return; }

    this.step = 'password';
  }

  resendCode() {
    this.step = 'email';
    this.codeInput = '';
    this.errorMsg = '';
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }

  // ── STEP 3: cambiar contraseña ─────────────────────────────────
  async changePassword() {
    this.errorMsg = '';
    if (this.newPassword.length < 6) { this.errorMsg = 'La contraseña debe tener al menos 6 caracteres.'; return; }
    if (this.newPassword !== this.confirmPassword) { this.errorMsg = 'Las contraseñas no coinciden.'; return; }

    this.loading = true;
    try {
      await this.authService.resetPasswordByEmail(this.email, this.newPassword);
      localStorage.removeItem(this.STORAGE_KEY);
      this.successMsg = '¡Contraseña actualizada! Redirigiendo...';
      setTimeout(() => this.router.navigate(['/auth/login']), 2000);
    } catch (e: any) {
      this.errorMsg = e.message || 'Error al actualizar la contraseña.';
    } finally {
      this.loading = false;
    }
  }

  // ── HTML del email ─────────────────────────────────────────────
  private buildEmailHtml(code: string): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0fdf4;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#10b981,#059669);padding:36px 40px;text-align:center;">
          <div style="font-size:42px;margin-bottom:8px;">🌍</div>
          <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">EcoBarómetro</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:13px;">Aprende jugando sobre el medio ambiente</p>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px 40px 32px;">
          <h2 style="margin:0 0 12px;font-size:20px;color:#111827;font-weight:700;">Recupera tu contraseña</h2>
          <p style="margin:0 0 28px;color:#6b7280;font-size:15px;line-height:1.6;">Recibimos una solicitud para restablecer la contraseña de tu cuenta. Usa el código de verificación a continuación:</p>
          <!-- Code box -->
          <div style="background:#f0fdf4;border:2px solid #10b981;border-radius:16px;padding:28px;text-align:center;margin-bottom:28px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:700;color:#10b981;text-transform:uppercase;letter-spacing:0.1em;">Tu código de verificación</p>
            <div style="font-size:44px;font-weight:900;letter-spacing:12px;color:#059669;font-family:'Courier New',monospace;">${code}</div>
            <p style="margin:10px 0 0;font-size:12px;color:#9ca3af;">Válido por 15 minutos</p>
          </div>
          <p style="margin:0 0 8px;color:#9ca3af;font-size:13px;line-height:1.5;">Si no solicitaste este código, ignora este mensaje. Tu contraseña no será cambiada.</p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">© 2026 EcoBarómetro · Cuidando el planeta 🌱</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  }
}
