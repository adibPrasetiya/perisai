<template>
  <div class="auth-layout">
    <div class="auth-container" style="max-width: 480px">
      <!-- Brand -->
      <div class="auth-brand">
        <h1 class="brand-name">PERISAI</h1>
        <p class="brand-sub">Platform Manajemen Risiko Daring</p>
      </div>

      <!-- Card -->
      <Card class="auth-card">
        <template #content>
          <!-- Step 1: QR Code -->
          <template v-if="step === 1">
            <div class="step-badge">Langkah 1 dari 2</div>
            <h2 class="auth-card-title">Aktifkan Autentikasi Dua Faktor</h2>

            <p class="text-sm text-dim" style="margin: 0 0 1.25rem">
              Pindai kode QR berikut menggunakan aplikasi autentikator (Google
              Authenticator, Authy, dll.).
            </p>

            <Message
              v-if="initError"
              severity="error"
              :closable="false"
              class="w-full"
              style="margin-bottom: 1rem"
            >
              {{ initError }}
            </Message>

            <template v-if="initLoading">
              <div class="text-center" style="padding: 3rem 0">
                <ProgressSpinner style="width: 40px; height: 40px" />
              </div>
            </template>

            <template v-else-if="qrData">
              <div class="qr-container">
                <img
                  :src="qrData.qrCodeDataUrl"
                  alt="QR Code TOTP"
                  width="200"
                  height="200"
                />
                <div style="text-align: center; width: 100%">
                  <p class="form-label" style="margin-bottom: 6px">
                    Atau masukkan kode manual:
                  </p>
                  <div class="secret-code">{{ qrData.secret }}</div>
                </div>
              </div>

              <Button
                label="Lanjut ke Verifikasi"
                class="w-full"
                @click="step = 2"
              />
            </template>
          </template>

          <!-- Step 2: Enter OTP -->
          <template v-else-if="step === 2">
            <div class="step-badge">Langkah 2 dari 2</div>
            <h2 class="auth-card-title">Konfirmasi Kode TOTP</h2>

            <p class="text-sm text-dim" style="margin: 0 0 1.5rem">
              Masukkan 6 digit kode dari aplikasi autentikator Anda untuk
              mengaktifkan TOTP.
            </p>

            <Message
              v-if="verifyError"
              severity="error"
              :closable="false"
              class="w-full"
              style="margin-bottom: 1rem"
            >
              {{ verifyError }}
            </Message>

            <div class="otp-container">
              <InputOtp v-model="otpCode" :length="6" integerOnly />
            </div>

            <div class="form-actions" style="display: flex; gap: 8px">
              <Button
                label="Kembali"
                severity="secondary"
                style="flex: 1"
                :disabled="verifyLoading"
                @click="step = 1"
              />
              <Button
                label="Aktifkan TOTP"
                style="flex: 2"
                :loading="verifyLoading"
                :disabled="otpCode.length < 6"
                @click="handleVerify"
              />
            </div>
          </template>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import Button from "primevue/button";
import Message from "primevue/message";
import InputOtp from "primevue/inputotp";
import ProgressSpinner from "primevue/progressspinner";
import { useToast } from "primevue/usetoast";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractApiError } from '@/utils/apiError'

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const step = ref(1);
const otpCode = ref("");

const initLoading = ref(false);
const initError = ref("");
const qrData = ref<{ qrCodeDataUrl: string; secret: string } | null>(null);

const verifyLoading = ref(false);
const verifyError = ref("");

onMounted(async () => {
  if (!auth.totpToken) {
    router.push({ name: "login" });
    return;
  }
  await fetchQrCode();
});

async function fetchQrCode() {
  initLoading.value = true;
  initError.value = "";
  try {
    const res = await authApi.totpSetupInit({ totpToken: auth.totpToken! });
    qrData.value = res.data.data;
  } catch (err: any) {
    initError.value =
      extractApiError(err, "Gagal memuat QR code. Coba lagi.");
  } finally {
    initLoading.value = false;
  }
}

async function handleVerify() {
  verifyError.value = "";
  const code = otpCode.value;

  if (code.length !== 6) return;

  verifyLoading.value = true;
  try {
    const res = await authApi.totpSetupVerify({
      totpToken: auth.totpToken!,
      code,
    });
    auth.setUser(res.data.data.user);
    auth.clearTotpToken();

    toast.add({
      severity: "success",
      summary: "Berhasil",
      detail: res.data.message ?? "TOTP berhasil diaktifkan.",
      life: 3000,
    });

    router.push({ name: "home" });
  } catch (err: any) {
    verifyError.value = extractApiError(err, "Kode TOTP tidak valid.");
  } finally {
    verifyLoading.value = false;
  }
}
</script>
