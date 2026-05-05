<template>
  <div class="auth-layout">
    <div class="auth-container register-container">
      <!-- Brand -->
      <div class="auth-brand">
        <h1 class="brand-name">PERISAI</h1>
        <p class="brand-sub">Platform Manajemen Risiko Daring</p>
      </div>

      <!-- Step Indicator -->
      <div class="step-indicator">
        <div
          v-for="(s, i) in steps"
          :key="i"
          class="step-item"
          :class="{
            'is-active': currentStep === i + 1,
            'is-done': currentStep > i + 1,
          }"
        >
          <div class="step-circle">
            <i v-if="currentStep > i + 1" class="pi pi-check" />
            <span v-else>{{ i + 1 }}</span>
          </div>
          <div class="step-label">{{ s }}</div>
          <div v-if="i < steps.length - 1" class="step-line" />
        </div>
      </div>

      <!-- Card -->
      <Card class="auth-card">
        <template #content>
          <!-- ─── Step 1: Informasi Akun ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="currentStep === 1" key="step1">
              <h2 class="auth-card-title">Informasi Akun</h2>
              <p class="step-desc">Buat kredensial untuk mengakses sistem.</p>

              <Message
                v-if="stepError"
                severity="error"
                :closable="false"
                style="margin-bottom: 1rem"
              >
                {{ stepError }}
              </Message>

              <div class="form-group">
                <label class="form-label"
                  >Username <span class="required">*</span></label
                >
                <InputText
                  v-model="form.username"
                  placeholder="contoh: budi_santoso"
                  class="w-full"
                  autocomplete="username"
                  :class="{ 'p-invalid': fieldErrors.username }"
                />
                <small v-if="fieldErrors.username" class="field-error">{{
                  fieldErrors.username
                }}</small>
                <small v-else class="field-hint"
                  >Huruf, angka, dan underscore. Minimal 3 karakter.</small
                >
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Email <span class="required">*</span></label
                >
                <InputText
                  v-model="form.email"
                  type="email"
                  placeholder="contoh: budi@instansi.go.id"
                  class="w-full"
                  autocomplete="email"
                  :class="{ 'p-invalid': fieldErrors.email }"
                />
                <small v-if="fieldErrors.email" class="field-error">{{
                  fieldErrors.email
                }}</small>
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Kata Sandi <span class="required">*</span></label
                >
                <Password
                  v-model="form.password"
                  placeholder="Masukkan kata sandi"
                  class="w-full"
                  :feedback="true"
                  toggleMask
                  input-class="w-full"
                  :class="{ 'p-invalid': fieldErrors.password }"
                  promptLabel="Masukkan kata sandi"
                  weakLabel="Lemah"
                  mediumLabel="Sedang"
                  strongLabel="Kuat"
                />
                <small v-if="fieldErrors.password" class="field-error">{{
                  fieldErrors.password
                }}</small>
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Konfirmasi Kata Sandi <span class="required">*</span></label
                >
                <Password
                  v-model="form.confirmPassword"
                  placeholder="Ulangi kata sandi"
                  class="w-full"
                  :feedback="false"
                  toggleMask
                  input-class="w-full"
                  :class="{ 'p-invalid': fieldErrors.confirmPassword }"
                />
                <small v-if="fieldErrors.confirmPassword" class="field-error">{{
                  fieldErrors.confirmPassword
                }}</small>
              </div>

              <div class="form-actions">
                <Button
                  label="Lanjut"
                  class="w-full"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  @click="goToStep2"
                />
              </div>

              <div class="text-center mt-sm">
                <span class="text-dim text-sm">Sudah punya akun? </span>
                <Button
                  label="Masuk"
                  text
                  size="small"
                  @click="router.push({ name: 'login' })"
                />
              </div>
            </div>
          </Transition>

          <!-- ─── Step 2: Informasi Profil ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="currentStep === 2" key="step2">
              <h2 class="auth-card-title">Informasi Profil</h2>
              <p class="step-desc">
                Lengkapi data diri Anda di dalam organisasi.
              </p>

              <Message
                v-if="stepError"
                severity="error"
                :closable="false"
                style="margin-bottom: 1rem"
              >
                {{ stepError }}
              </Message>

              <div class="form-group">
                <label class="form-label"
                  >Nama Lengkap <span class="required">*</span></label
                >
                <InputText
                  v-model="form.name"
                  placeholder="Nama sesuai identitas resmi"
                  class="w-full"
                  :class="{ 'p-invalid': fieldErrors.name }"
                />
                <small v-if="fieldErrors.name" class="field-error">{{
                  fieldErrors.name
                }}</small>
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Jabatan <span class="required">*</span></label
                >
                <InputText
                  v-model="form.jabatan"
                  placeholder="contoh: Analis Risiko"
                  class="w-full"
                  :class="{ 'p-invalid': fieldErrors.jabatan }"
                />
                <small v-if="fieldErrors.jabatan" class="field-error">{{
                  fieldErrors.jabatan
                }}</small>
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Unit Kerja <span class="required">*</span></label
                >
                <div class="unit-kerja-search">
                  <span class="p-input-icon-left w-full">
                    <InputText
                      v-model="unitKerjaSearch"
                      placeholder="Cari unit kerja..."
                      class="w-full"
                      :class="{ 'p-invalid': fieldErrors.unitKerjaId }"
                      @input="onUnitKerjaSearch"
                      @focus="showDropdown = true"
                      @blur="showDropdown = false"
                      autocomplete="off"
                    />
                  </span>

                  <Transition name="fade">
                    <div v-if="showDropdown" class="uk-dropdown">
                      <div v-if="unitKerjaLoading" class="uk-dropdown-loading">
                        <ProgressSpinner style="width: 20px; height: 20px" />
                        <span>Mencari...</span>
                      </div>
                      <template v-else-if="unitKerjaList.length > 0">
                        <div
                          v-for="uk in unitKerjaList"
                          :key="uk.id"
                          class="uk-dropdown-item"
                          :class="{ 'is-selected': form.unitKerjaId === uk.id }"
                          @mousedown.prevent="selectUnitKerja(uk)"
                        >
                          <span class="uk-name">{{ uk.name }}</span>
                          <span class="uk-code">{{ uk.code }}</span>
                        </div>
                      </template>
                      <div v-else class="uk-dropdown-empty">
                        <i
                          class="pi pi-inbox"
                          style="font-size: 1.2rem; opacity: 0.4"
                        />
                        <span>Unit Kerja Tidak Ditemukan</span>
                      </div>
                    </div>
                  </Transition>
                </div>

                <small v-if="fieldErrors.unitKerjaId" class="field-error">{{
                  fieldErrors.unitKerjaId
                }}</small>
                <small
                  v-else-if="form.unitKerjaId"
                  class="field-hint field-hint--selected"
                >
                  <i class="pi pi-check-circle" /> Terpilih:
                  {{ unitKerjaSearch }}
                </small>
              </div>

              <div class="form-group">
                <label class="form-label"
                  >Nomor HP <span class="optional">(Opsional)</span></label
                >
                <InputText
                  v-model="form.nomorHP"
                  placeholder="contoh: 08123456789"
                  class="w-full"
                  :class="{ 'p-invalid': fieldErrors.nomorHP }"
                />
                <small v-if="fieldErrors.nomorHP" class="field-error">{{
                  fieldErrors.nomorHP
                }}</small>
                <small v-else class="field-hint"
                  >Format: 08xxx, +62xxx, atau 62xxx</small
                >
              </div>

              <div class="form-actions step-nav">
                <Button
                  label="Kembali"
                  severity="secondary"
                  icon="pi pi-arrow-left"
                  @click="
                    currentStep = 1;
                    stepError = '';
                  "
                />
                <Button
                  label="Lanjut"
                  icon="pi pi-arrow-right"
                  iconPos="right"
                  @click="goToStep3"
                />
              </div>
            </div>
          </Transition>

          <!-- ─── Step 3: Konfirmasi ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="currentStep === 3" key="step3">
              <h2 class="auth-card-title">Konfirmasi Data</h2>
              <p class="step-desc">Periksa kembali data sebelum mendaftar.</p>

              <Message
                v-if="stepError"
                severity="error"
                :closable="false"
                style="margin-bottom: 1rem"
              >
                {{ stepError }}
              </Message>

              <!-- Summary: Akun -->
              <div class="summary-section">
                <div class="summary-section-header">
                  <span>Informasi Akun</span>
                  <Button
                    label="Ubah"
                    text
                    size="small"
                    @click="
                      currentStep = 1;
                      stepError = '';
                    "
                  />
                </div>
                <div class="summary-grid">
                  <div class="summary-row">
                    <span class="summary-label">Username</span>
                    <span class="summary-value mono">{{ form.username }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Email</span>
                    <span class="summary-value">{{ form.email }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Kata Sandi</span>
                    <span class="summary-value">••••••••</span>
                  </div>
                </div>
              </div>

              <!-- Summary: Profil -->
              <div class="summary-section">
                <div class="summary-section-header">
                  <span>Informasi Profil</span>
                  <Button
                    label="Ubah"
                    text
                    size="small"
                    @click="
                      currentStep = 2;
                      stepError = '';
                    "
                  />
                </div>
                <div class="summary-grid">
                  <div class="summary-row">
                    <span class="summary-label">Nama Lengkap</span>
                    <span class="summary-value">{{ form.name }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Jabatan</span>
                    <span class="summary-value">{{ form.jabatan }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Unit Kerja</span>
                    <span class="summary-value">{{ unitKerjaSearch }}</span>
                  </div>
                  <div class="summary-row">
                    <span class="summary-label">Nomor HP</span>
                    <span class="summary-value">{{ form.nomorHP || "—" }}</span>
                  </div>
                </div>
              </div>

              <div class="notice-box">
                <i class="pi pi-info-circle" />
                <span
                  >Akun Anda akan diverifikasi oleh administrator sebelum dapat
                  digunakan.</span
                >
              </div>

              <div class="form-actions step-nav">
                <Button
                  label="Kembali"
                  severity="secondary"
                  icon="pi pi-arrow-left"
                  :disabled="submitLoading"
                  @click="
                    currentStep = 2;
                    stepError = '';
                  "
                />
                <Button
                  label="Daftar Sekarang"
                  icon="pi pi-send"
                  iconPos="right"
                  :loading="submitLoading"
                  @click="handleSubmit"
                />
              </div>
            </div>
          </Transition>

          <!-- ─── Step 4: Sukses ─── -->
          <Transition name="slide-step" mode="out-in">
            <div v-if="currentStep === 4" key="step4" class="success-state">
              <div class="success-icon">
                <i class="pi pi-check" />
              </div>
              <h2 class="auth-card-title" style="text-align: center">
                Pendaftaran Berhasil!
              </h2>
              <p class="text-dim text-sm text-center">
                Akun
                <strong class="mono" style="color: var(--color-accent)">{{
                  form.username
                }}</strong>
                berhasil didaftarkan. Silakan tunggu verifikasi dari
                administrator sebelum dapat masuk ke sistem.
              </p>
              <div class="form-actions" style="margin-top: 2rem">
                <Button
                  label="Kembali ke Halaman Masuk"
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
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import Card from "primevue/card";
import InputText from "primevue/inputtext";
import Password from "primevue/password";
import Button from "primevue/button";
import Message from "primevue/message";
import ProgressSpinner from "primevue/progressspinner";
import { authApi } from "@/api/auth";
import { unitKerjaApi, type UnitKerja } from "@/api/unitKerja";
import { extractApiError } from '@/utils/apiError'

const router = useRouter();

const steps = ["Informasi Akun", "Informasi Profil", "Konfirmasi"];
const currentStep = ref(1);
const stepError = ref("");
const submitLoading = ref(false);

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: "",
  name: "",
  jabatan: "",
  unitKerjaId: "",
  nomorHP: "",
});

const fieldErrors = reactive<Record<string, string>>({});

// ─── Unit Kerja Search ────────────────────────────────────────────────────────

const unitKerjaSearch = ref("");
const unitKerjaList = ref<UnitKerja[]>([]);
const unitKerjaLoading = ref(false);
const showDropdown = ref(false);
let searchTimeout: ReturnType<typeof setTimeout>;

onMounted(async () => {
  // Pre-load list so dropdown is ready on focus
  await fetchUnitKerja("");
});

async function fetchUnitKerja(name: string) {
  unitKerjaLoading.value = true;
  try {
    const res = await unitKerjaApi.search({ name, limit: 100 });
    unitKerjaList.value = res.data.data;
  } catch {
    unitKerjaList.value = [];
  } finally {
    unitKerjaLoading.value = false;
  }
}

function onUnitKerjaSearch() {
  // Clear selection when user types again
  form.unitKerjaId = "";
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => fetchUnitKerja(unitKerjaSearch.value), 300);
}

function selectUnitKerja(uk: UnitKerja) {
  form.unitKerjaId = uk.id;
  unitKerjaSearch.value = uk.name;
  showDropdown.value = false;
  delete fieldErrors.unitKerjaId;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function clearErrors() {
  Object.keys(fieldErrors).forEach((k) => delete fieldErrors[k]);
  stepError.value = "";
}

function validateStep1(): boolean {
  clearErrors();
  let valid = true;

  if (!form.username.trim()) {
    fieldErrors.username = "Username wajib diisi.";
    valid = false;
  } else if (form.username.length < 3) {
    fieldErrors.username = "Username minimal 3 karakter.";
    valid = false;
  } else if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
    fieldErrors.username = "Hanya huruf, angka, dan underscore.";
    valid = false;
  }

  if (!form.email.trim()) {
    fieldErrors.email = "Email wajib diisi.";
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    fieldErrors.email = "Format email tidak valid.";
    valid = false;
  }

  if (!form.password) {
    fieldErrors.password = "Kata sandi wajib diisi.";
    valid = false;
  }

  if (!form.confirmPassword) {
    fieldErrors.confirmPassword = "Konfirmasi kata sandi wajib diisi.";
    valid = false;
  } else if (form.password !== form.confirmPassword) {
    fieldErrors.confirmPassword = "Kata sandi tidak cocok.";
    valid = false;
  }

  return valid;
}

function validateStep2(): boolean {
  clearErrors();
  let valid = true;

  if (!form.name.trim()) {
    fieldErrors.name = "Nama lengkap wajib diisi.";
    valid = false;
  } else if (form.name.trim().length < 2) {
    fieldErrors.name = "Nama minimal 2 karakter.";
    valid = false;
  }

  if (!form.jabatan.trim()) {
    fieldErrors.jabatan = "Jabatan wajib diisi.";
    valid = false;
  } else if (form.jabatan.trim().length < 2) {
    fieldErrors.jabatan = "Jabatan minimal 2 karakter.";
    valid = false;
  }

  if (!form.unitKerjaId) {
    fieldErrors.unitKerjaId = "Unit kerja wajib dipilih dari daftar.";
    valid = false;
  }

  if (form.nomorHP && !/^(\+62|62|0)[0-9]{8,12}$/.test(form.nomorHP)) {
    fieldErrors.nomorHP =
      "Format tidak valid. Contoh: 08123456789 atau +6281234567890";
    valid = false;
  }

  return valid;
}

function goToStep2() {
  if (validateStep1()) currentStep.value = 2;
}

function goToStep3() {
  if (validateStep2()) currentStep.value = 3;
}

// ─── Submit ───────────────────────────────────────────────────────────────────

async function handleSubmit() {
  stepError.value = "";
  submitLoading.value = true;
  try {
    const payload: Record<string, string> = {
      username: form.username,
      name: form.name,
      email: form.email,
      password: form.password,
      jabatan: form.jabatan,
      unitKerjaId: form.unitKerjaId,
    };
    if (form.nomorHP) payload.nomorHP = form.nomorHP;

    await authApi.register(payload as any);
    currentStep.value = 4;
  } catch (err: any) {
    stepError.value =
      extractApiError(err, "Pendaftaran gagal. Coba lagi.");
  } finally {
    submitLoading.value = false;
  }
}
</script>

<style scoped>
/* ─── Container ── */
.register-container {
  max-width: 500px;
}

/* ─── Step Indicator ── */
.step-indicator {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 0;
  margin-bottom: 1.5rem;
  position: relative;
}

.step-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  position: relative;
}

.step-circle {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
  background: var(--color-bg-card);
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.step-item.is-active .step-circle {
  border-color: var(--color-accent);
  color: var(--color-accent);
  box-shadow: 0 0 0 4px var(--color-accent-glow);
}

.step-item.is-done .step-circle {
  border-color: var(--color-accent);
  background: var(--color-accent);
  color: #050d1a;
}

.step-label {
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-top: 6px;
  white-space: nowrap;
  transition: color 0.3s;
}

.step-item.is-active .step-label,
.step-item.is-done .step-label {
  color: var(--color-accent);
}

.step-line {
  position: absolute;
  top: 16px;
  left: 50%;
  width: 100%;
  height: 2px;
  background: var(--color-border);
  z-index: 0;
  transition: background 0.3s;
}

.step-item.is-done .step-line {
  background: var(--color-accent);
}

/* ─── Form helpers ── */
.step-desc {
  font-size: 13px;
  color: var(--color-text-dim);
  margin: -0.75rem 0 1.5rem;
}

.field-error {
  color: var(--color-danger);
  font-size: 12px;
}

.field-hint {
  color: var(--color-text-muted);
  font-size: 12px;
}

.field-hint--selected {
  color: var(--color-accent);
}

.required {
  color: var(--color-danger);
}

.optional {
  color: var(--color-text-muted);
  font-size: 10px;
  letter-spacing: 0.08em;
}

/* ─── Step nav ── */
.step-nav {
  display: flex;
  gap: 8px;
}

.step-nav .p-button:first-child {
  flex: 1;
}
.step-nav .p-button:last-child {
  flex: 2;
}

/* ─── Unit Kerja Dropdown ── */
.unit-kerja-search {
  position: relative;
}

.uk-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-md);
  max-height: 220px;
  overflow-y: auto;
  z-index: 200;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.uk-dropdown-loading {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  color: var(--color-text-dim);
  font-size: 13px;
}

.uk-dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--color-border);
}

.uk-dropdown-item:last-child {
  border-bottom: none;
}

.uk-dropdown-item:hover,
.uk-dropdown-item.is-selected {
  background: var(--color-accent-glow);
}

.uk-dropdown-item.is-selected .uk-name {
  color: var(--color-accent);
}

.uk-name {
  font-size: 13px;
  color: var(--color-text);
}

.uk-code {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 2px 6px;
}

.uk-dropdown-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 20px 14px;
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
}

/* ─── Summary ── */
.summary-section {
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  margin-bottom: 1rem;
}

.summary-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: rgba(0, 229, 184, 0.04);
  border-bottom: 1px solid var(--color-border);
  font-family: var(--font-display);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-accent);
}

.summary-grid {
  padding: 4px 0;
}

.summary-row {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  padding: 8px 14px;
  gap: 1rem;
}

.summary-row + .summary-row {
  border-top: 1px solid var(--color-border);
}

.summary-label {
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.summary-value {
  font-size: 13px;
  color: var(--color-text);
  text-align: right;
  word-break: break-word;
}

.summary-value.mono {
  font-family: var(--font-mono);
  color: var(--color-accent);
}

.mono {
  font-family: var(--font-mono);
}

/* ─── Notice ── */
.notice-box {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(0, 229, 184, 0.04);
  border: 1px solid rgba(0, 229, 184, 0.15);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--color-text-dim);
  margin-bottom: 1.5rem;
}

.notice-box .pi {
  color: var(--color-accent);
  flex-shrink: 0;
  margin-top: 1px;
}

/* ─── Success State ── */
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

/* ─── Transitions ── */
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* ─── PrimeVue Password feedback override ── */
:deep(.p-password-meter) {
  background: var(--color-bg-input);
}

:deep(.p-password-strength-label) {
  font-family: var(--font-body);
  font-size: 12px;
}

.text-center {
  text-align: center;
}
</style>
