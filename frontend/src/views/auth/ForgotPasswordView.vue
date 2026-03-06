<template>
  <div class="auth-layout">
    <div class="auth-container">
      <!-- Brand -->
      <div class="auth-brand">
        <h1 class="brand-name">PERISAI</h1>
        <p class="brand-sub">Platform Manajemen Risiko Daring</p>
      </div>

      <!-- Card -->
      <Card class="auth-card">
        <template #content>
          <!-- ─── Step 1: Identifikasi Akun ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="step === 1" key="step1">
              <div class="back-link">
                <Button
                  icon="pi pi-arrow-left"
                  text
                  size="small"
                  label="Kembali ke Login"
                  @click="router.push({ name: 'login' })"
                />
              </div>

              <h2 class="auth-card-title">Lupa Kata Sandi</h2>
              <p class="step-desc">
                Masukkan username atau email akun Anda. Kami akan memverifikasi
                identitas Anda menggunakan kode TOTP.
              </p>

              <Message
                v-if="step1Error"
                severity="error"
                :closable="false"
                style="margin-bottom: 1rem"
              >
                {{ step1Error }}
              </Message>

              <form @submit.prevent="handleStep1">
                <div class="form-group">
                  <label class="form-label">Username / Email</label>
                  <InputText
                    v-model="identifier"
                    placeholder="Masukkan username atau email"
                    class="w-full"
                    autocomplete="username"
                    :disabled="step1Loading"
                  />
                </div>

                <div class="form-actions">
                  <Button
                    type="submit"
                    label="Lanjutkan"
                    class="w-full"
                    icon="pi pi-arrow-right"
                    iconPos="right"
                    :loading="step1Loading"
                    :disabled="!identifier.trim()"
                  />
                </div>
              </form>
            </div>
          </Transition>

          <!-- ─── Step 2: Verifikasi TOTP + Password Baru ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="step === 2" key="step2">
              <div class="back-link">
                <Button
                  icon="pi pi-arrow-left"
                  text
                  size="small"
                  label="Ganti Akun"
                  @click="
                    step = 1;
                    step2Error = '';
                    otpCode = '';
                  "
                />
              </div>

              <h2 class="auth-card-title">Reset Kata Sandi</h2>

              <!-- User info badge -->
              <div class="user-badge">
                <i class="pi pi-user" />
                <span>{{ targetUsername }}</span>
              </div>

              <p class="step-desc">
                Masukkan kode TOTP dari aplikasi autentikator Anda, lalu buat
                kata sandi baru.
              </p>

              <Message
                v-if="step2Error"
                severity="error"
                :closable="false"
                style="margin-bottom: 1rem"
              >
                {{ step2Error }}
              </Message>

              <form @submit.prevent="handleStep2">
                <Divider align="left">
                  <small class="form-label">Kode TOTP</small>
                </Divider>

                <div class="otp-container">
                  <InputOtp v-model="otpCode" :length="6" integerOnly />
                </div>

                <Divider align="left">
                  <small class="form-label">Kata Sandi Baru</small>
                </Divider>

                <div class="form-group">
                  <label class="form-label">Kata Sandi Baru</label>
                  <Password
                    v-model="newPassword"
                    placeholder="Masukkan kata sandi baru"
                    class="w-full"
                    :feedback="true"
                    toggleMask
                    input-class="w-full"
                    :class="{ 'p-invalid': passwordError }"
                    promptLabel="Masukkan kata sandi"
                    weakLabel="Lemah"
                    mediumLabel="Sedang"
                    strongLabel="Kuat"
                  />
                  <small v-if="passwordError" class="field-error">{{
                    passwordError
                  }}</small>
                </div>

                <div class="form-group">
                  <label class="form-label">Konfirmasi Kata Sandi</label>
                  <Password
                    v-model="confirmPassword"
                    placeholder="Ulangi kata sandi baru"
                    class="w-full"
                    :feedback="false"
                    toggleMask
                    input-class="w-full"
                    :class="{ 'p-invalid': confirmError }"
                  />
                  <small v-if="confirmError" class="field-error">{{
                    confirmError
                  }}</small>
                </div>

                <div class="form-actions">
                  <Button
                    type="submit"
                    label="Reset Kata Sandi"
                    class="w-full"
                    icon="pi pi-lock"
                    :loading="step2Loading"
                    :disabled="
                      otpCode.length < 6 || !newPassword || !confirmPassword
                    "
                  />
                </div>
              </form>
            </div>
          </Transition>

          <!-- ─── Step 3: Sukses ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="step === 3" key="step3" class="success-state">
              <div class="success-icon">
                <i class="pi pi-check" />
              </div>
              <h2 class="auth-card-title text-center">
                Kata Sandi Berhasil Direset!
              </h2>
              <p class="text-dim text-sm text-center">
                Kata sandi akun
                <strong class="mono accent">{{ targetUsername }}</strong>
                berhasil diubah. Semua sesi sebelumnya telah dihapus.
              </p>
              <div class="form-actions" style="margin-top: 2rem">
                <Button
                  label="Masuk Sekarang"
                  class="w-full"
                  icon="pi pi-sign-in"
                  @click="router.push({ name: 'login' })"
                />
              </div>
            </div>
          </Transition>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import InputOtp from "primevue/inputotp";
import Button from "primevue/button";
import Message from "primevue/message";
import Divider from "primevue/divider";
import { authApi } from "@/api/auth";
import { extractApiError } from '@/utils/apiError'

const router = useRouter();

const step = ref(1);

// Step 1
const identifier = ref("");
const step1Loading = ref(false);
const step1Error = ref("");

// Step 2
const resetToken = ref("");
const targetUsername = ref("");
const otpCode = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const step2Loading = ref(false);
const step2Error = ref("");
const passwordError = ref("");
const confirmError = ref("");

// ─── Step 1: Kirim identifier ────────────────────────────────────────────────

async function handleStep1() {
  step1Error.value = "";
  if (!identifier.value.trim()) return;

  step1Loading.value = true;
  try {
    const res = await authApi.forgotPassword({
      identifier: identifier.value.trim(),
    });
    resetToken.value = res.data.data.resetToken;
    targetUsername.value = res.data.data.user.username;
    step.value = 2;
  } catch (err: any) {
    step1Error.value =
      extractApiError(err, "Terjadi kesalahan. Coba lagi.");
  } finally {
    step1Loading.value = false;
  }
}

// ─── Step 2: TOTP + password baru ───────────────────────────────────────────

function validatePasswords(): boolean {
  passwordError.value = "";
  confirmError.value = "";
  let valid = true;

  if (!newPassword.value) {
    passwordError.value = "Kata sandi baru wajib diisi.";
    valid = false;
  }

  if (!confirmPassword.value) {
    confirmError.value = "Konfirmasi kata sandi wajib diisi.";
    valid = false;
  } else if (newPassword.value !== confirmPassword.value) {
    confirmError.value = "Kata sandi tidak cocok.";
    valid = false;
  }

  return valid;
}

async function handleStep2() {
  step2Error.value = "";
  if (!validatePasswords()) return;

  step2Loading.value = true;
  try {
    await authApi.resetPassword({
      resetToken: resetToken.value,
      code: otpCode.value,
      newPassword: newPassword.value,
      confirmPassword: confirmPassword.value,
    });
    step.value = 3;
  } catch (err: any) {
    step2Error.value =
      extractApiError(err, "Gagal reset kata sandi. Coba lagi.");
    otpCode.value = "";
  } finally {
    step2Loading.value = false;
  }
}
</script>

<style scoped>
.back-link {
  margin-bottom: 0.75rem;
  margin-left: -0.5rem;
}

.step-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: -0.5rem 0 1.5rem;
  line-height: 1.7;
}

.user-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--color-accent);
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.2);
  border-radius: 100px;
  padding: 4px 12px;
  margin-bottom: 1rem;
}

.field-error {
  color: var(--color-danger);
  font-size: 12px;
}

.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 1rem 0;
}

.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-accent-glow);
  border: 2px solid var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.success-icon .pi {
  font-size: 1.75rem;
  color: var(--color-accent);
}

@keyframes popIn {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.text-center {
  text-align: center;
}
.mono {
  font-family: var(--font-mono);
}
.accent {
  color: var(--color-accent);
}

.slide-step-enter-active,
.slide-step-leave-active {
  transition: all 0.25s ease;
}
.slide-step-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-step-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

:deep(.p-password-meter) {
  background: var(--color-bg-input);
}
:deep(.p-password-strength-label) {
  font-family: var(--font-body);
  font-size: 12px;
}
</style>
