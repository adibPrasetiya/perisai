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
          <h2 class="auth-card-title">Masuk</h2>

          <Message
            v-if="errorMsg"
            severity="error"
            :closable="false"
            class="w-full"
            style="margin-bottom: 1rem"
          >
            {{ errorMsg }}
          </Message>

          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">Username / Email</label>
              <InputText
                v-model="form.identifier"
                placeholder="Masukkan username atau email"
                class="w-full"
                autocomplete="username"
                :disabled="loading"
              />
            </div>

            <div class="form-group">
              <label class="form-label">Kata Sandi</label>
              <Password
                v-model="form.password"
                placeholder="Masukkan kata sandi"
                class="w-full"
                :feedback="false"
                toggleMask
                :disabled="loading"
                input-class="w-full"
              />
            </div>

            <div class="form-actions">
              <Button
                type="submit"
                label="Masuk"
                class="w-full"
                :loading="loading"
              />
            </div>

            <div class="text-center mt-sm">
              <Button
                label="Lupa kata sandi?"
                text
                size="small"
                class="text-dim"
                @click="router.push({ name: 'forgot-password' })"
              />
            </div>

            <div class="text-center" style="margin-top: 0.25rem">
              <span class="text-dim text-sm">Belum punya akun? </span>
              <Button
                label="Daftar"
                text
                size="small"
                @click="router.push({ name: 'register' })"
              />
            </div>
          </form>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/stores/auth";
import { extractApiError } from '@/utils/apiError'

const router = useRouter();
const auth = useAuthStore();

const form = reactive({ identifier: "", password: "" });
const loading = ref(false);
const errorMsg = ref("");

async function handleLogin() {
  errorMsg.value = "";

  if (!form.identifier.trim() || !form.password.trim()) {
    errorMsg.value = "Username/email dan kata sandi wajib diisi.";
    return;
  }

  loading.value = true;
  try {
    const res = await authApi.login({
      identifier: form.identifier,
      password: form.password,
    });
    const data = res.data.data;

    auth.setTotpToken(data.totpToken);

    if (data.requireTotpSetup) {
      router.push({ name: "totp-setup" });
    } else if (data.requireTotp) {
      router.push({ name: "totp-verify" });
    }
  } catch (err: any) {
    errorMsg.value =
      extractApiError(err, "Terjadi kesalahan. Coba lagi.");
  } finally {
    loading.value = false;
  }
}
</script>
