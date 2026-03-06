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
          <h2 class="auth-card-title">Verifikasi TOTP</h2>

          <p class="text-sm text-dim" style="margin: 0 0 1.5rem">
            Masukkan 6 digit kode dari aplikasi autentikator Anda.
          </p>

          <Message
            v-if="errorMsg"
            severity="error"
            :closable="false"
            class="w-full"
            style="margin-bottom: 1rem"
          >
            {{ errorMsg }}
          </Message>

          <div class="otp-container">
            <InputOtp
              v-model="otpCode"
              :length="6"
              integerOnly
              @keyup.enter="handleVerify"
            />
          </div>

          <div class="form-actions">
            <Button
              label="Verifikasi"
              class="w-full"
              :loading="loading"
              :disabled="otpCode.length < 6"
              @click="handleVerify"
            />
          </div>

          <div class="text-center mt-sm">
            <Button
              label="Kembali ke Login"
              text
              size="small"
              class="text-dim"
              @click="router.push({ name: 'login' })"
            />
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import Button from "primevue/button";
import Message from "primevue/message";
import InputOtp from "primevue/inputotp";
import { useToast } from "primevue/usetoast";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractApiError } from '@/utils/apiError'

const router = useRouter();
const auth = useAuthStore();
const toast = useToast();

const otpCode = ref("");
const loading = ref(false);
const errorMsg = ref("");

async function handleVerify() {
  errorMsg.value = "";
  const code = otpCode.value;

  if (code.length !== 6 || !auth.totpToken) return;

  loading.value = true;
  try {
    const res = await authApi.totpVerify({ totpToken: auth.totpToken, code });
    auth.setUser(res.data.data.user);
    auth.clearTotpToken();

    toast.add({
      severity: "success",
      summary: "Selamat datang",
      detail: "Login berhasil.",
      life: 2000,
    });

    router.push({ name: "home" });
  } catch (err: any) {
    errorMsg.value = extractApiError(err, "Kode TOTP tidak valid.");
    otpCode.value = "";
  } finally {
    loading.value = false;
  }
}
</script>
