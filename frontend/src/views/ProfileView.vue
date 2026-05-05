<template>
  <!-- ─── Loading ─── -->
  <div v-if="loading" class="state-center">
    <ProgressSpinner style="width:32px;height:32px;" />
    <span class="state-text">Memuat profil...</span>
  </div>

  <!-- ─── Error ─── -->
  <div v-else-if="!profileData" class="state-center">
    <i class="pi pi-exclamation-triangle state-icon state-icon--warn" />
    <span class="state-text">Gagal memuat data profil.</span>
    <button class="btn-ghost" @click="loadProfile">
      <i class="pi pi-refresh" /> Coba Lagi
    </button>
  </div>

  <!-- ─── Content ─── -->
  <template v-else>

    <!-- ── Hero ── -->
    <div class="hero">
      <div class="hero-avatar">{{ userInitial }}</div>
      <div class="hero-body">
        <div class="hero-name">{{ profileData.name }}</div>
        <div class="hero-sub">
          <span class="mono accent">@{{ profileData.username }}</span>
          <span class="hero-dot">·</span>
          <span class="mono muted">{{ profileData.email }}</span>
        </div>
        <div class="hero-chips">
          <span
            v-for="role in profileData.roles"
            :key="role"
            class="role-badge"
            :class="roleBadgeClass(role)"
          >{{ roleLabel(role) }}</span>
          <span class="status-chip" :class="profileData.isActive ? 'chip-green' : 'chip-red'">
            <span class="chip-dot" />{{ profileData.isActive ? 'Aktif' : 'Nonaktif' }}
          </span>
          <span class="status-chip" :class="profileData.isVerified ? 'chip-teal' : 'chip-orange'">
            <i :class="profileData.isVerified ? 'pi pi-verified' : 'pi pi-clock'" style="font-size:9px;" />
            {{ profileData.isVerified ? 'Terverifikasi' : 'Belum Diverifikasi' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Cards row ── -->
    <div class="cards-row">

      <!-- Data Akun -->
      <div class="card">
        <div class="card-head">
          <div class="card-head-left">
            <i class="pi pi-id-card card-icon" />
            <span class="card-title">Data Akun</span>
          </div>
          <template v-if="!editingAccount">
            <button class="btn-ghost btn-sm" @click="startEditAccount">
              <i class="pi pi-pencil" /> Edit
            </button>
          </template>
          <div v-else class="row-gap">
            <button class="btn-ghost btn-sm" :disabled="savingAccount" @click="cancelEditAccount">Batal</button>
            <button class="btn-accent btn-sm" :disabled="savingAccount" @click="saveAccount">
              <i v-if="savingAccount" class="pi pi-spin pi-spinner" />
              <i v-else class="pi pi-check" />
              Simpan
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="field">
            <label class="flabel">Nama</label>
            <input v-if="editingAccount" v-model="accountForm.name" class="finput" type="text" placeholder="Nama lengkap" />
            <span v-else class="fval">{{ profileData.name }}</span>
          </div>
          <div class="field">
            <label class="flabel">Email</label>
            <input v-if="editingAccount" v-model="accountForm.email" class="finput" type="email" placeholder="Alamat email" />
            <span v-else class="fval mono">{{ profileData.email }}</span>
          </div>
          <div class="field">
            <label class="flabel">Username</label>
            <span class="fval mono accent">@{{ profileData.username }}</span>
          </div>
          <div class="field">
            <label class="flabel">2FA</label>
            <span class="status-chip" :class="profileData.totpEnabled ? 'chip-teal' : 'chip-dim'">
              <i class="pi pi-shield" style="font-size:9px;" />
              {{ profileData.totpEnabled ? 'TOTP Aktif' : 'Tidak Aktif' }}
            </span>
          </div>
          <div class="field last">
            <label class="flabel">Terdaftar</label>
            <span class="fval mono muted">{{ formatDate(profileData.createdAt) }}</span>
          </div>
        </div>
      </div>

      <!-- Data Profil -->
      <div class="card">
        <div class="card-head">
          <div class="card-head-left">
            <i class="pi pi-user card-icon" />
            <span class="card-title">Data Profil</span>
          </div>
          <template v-if="!editingProfile">
            <button class="btn-ghost btn-sm" @click="startEditProfile">
              <i class="pi pi-pencil" /> Edit
            </button>
          </template>
          <div v-else class="row-gap">
            <button class="btn-ghost btn-sm" :disabled="savingProfile" @click="cancelEditProfile">Batal</button>
            <button class="btn-accent btn-sm" :disabled="savingProfile" @click="saveProfile">
              <i v-if="savingProfile" class="pi pi-spin pi-spinner" />
              <i v-else class="pi pi-check" />
              Simpan
            </button>
          </div>
        </div>
        <div class="card-body">
          <div class="field">
            <label class="flabel">Jabatan</label>
            <input v-if="editingProfile" v-model="profileForm.jabatan" class="finput" type="text" placeholder="Jabatan" />
            <span v-else class="fval">{{ profileData.profile?.jabatan ?? '—' }}</span>
          </div>
          <div class="field">
            <label class="flabel">Nomor HP</label>
            <input v-if="editingProfile" v-model="profileForm.nomorHP" class="finput" type="tel" placeholder="Nomor HP" />
            <span v-else class="fval mono">{{ profileData.profile?.nomorHP ?? '—' }}</span>
          </div>
          <div class="field">
            <label class="flabel">Unit Kerja</label>
            <div v-if="profileData.profile?.unitKerja" class="fval">
              <div>{{ profileData.profile.unitKerja.name }}</div>
              <div class="mono muted" style="font-size:11px; margin-top:2px;">{{ profileData.profile.unitKerja.code }}</div>
            </div>
            <span v-else class="fval muted">—</span>
          </div>
          <div class="field" :class="!profileData.profile?.verifiedAt && 'last'">
            <label class="flabel">Status Profil</label>
            <span class="status-chip" :class="profileData.profile?.isVerified ? 'chip-green' : 'chip-orange'">
              <i :class="profileData.profile?.isVerified ? 'pi pi-verified' : 'pi pi-clock'" style="font-size:9px;" />
              {{ profileData.profile?.isVerified ? 'Terverifikasi' : 'Belum Diverifikasi' }}
            </span>
          </div>
          <div v-if="profileData.profile?.verifiedAt" class="field last">
            <label class="flabel">Diverifikasi</label>
            <span class="fval mono muted">{{ formatDate(profileData.profile.verifiedAt) }}</span>
          </div>
        </div>
      </div>

    </div>

    <!-- ── Keamanan Akun ── -->
    <div class="security-strip">
      <div class="security-strip-left">
        <i class="pi pi-lock security-icon" />
        <div class="security-stats">
          <div class="sec-stat">
            <span class="sec-stat-label">Diubah</span>
            <span class="sec-stat-val mono">
              {{ profileData.passwordChangedAt ? formatDate(profileData.passwordChangedAt) : '—' }}
            </span>
          </div>
          <div class="sec-divider" />
          <div class="sec-stat">
            <span class="sec-stat-label">Kedaluwarsa</span>
            <div class="row-gap-sm">
              <template v-if="passwordExpiredAt">
                <span class="sec-stat-val mono">{{ formatDate(passwordExpiredAt.toISOString()) }}</span>
                <span v-if="expiryChip.label" class="status-chip" :class="expiryChip.cls">
                  <i :class="expiryChip.icon" style="font-size:9px;" />{{ expiryChip.label }}
                </span>
              </template>
              <template v-else>
                <span class="status-chip chip-dim">
                  <i class="pi pi-infinity" style="font-size:9px;" />Tidak Ada Batas
                </span>
              </template>
            </div>
          </div>
          <div class="sec-divider" />
          <div class="sec-stat">
            <span class="sec-stat-label">Status</span>
            <span class="status-chip" :class="profileData.mustChangePassword ? 'chip-red' : 'chip-green'">
              <i :class="profileData.mustChangePassword ? 'pi pi-exclamation-triangle' : 'pi pi-check-circle'" style="font-size:9px;" />
              {{ profileData.mustChangePassword ? 'Wajib Ganti' : 'Aman' }}
            </span>
          </div>
        </div>
      </div>
      <button class="btn-accent btn-sm" @click="openPwDialog">
        <i class="pi pi-key" /> Ubah Password
      </button>
    </div>

  </template>

  <!-- ─── Dialog: Konfirmasi Password — Data Akun ─── -->
  <Dialog
    v-model:visible="accountPwDialogVisible"
    modal
    :closable="!savingAccount"
    :draggable="false"
    :style="{ width: '400px' }"
    pt:root:class="pw-dialog"
    pt:header:class="pw-dialog-header"
    pt:content:class="pw-dialog-content"
  >
    <template #header>
      <div class="dlg-header">
        <div class="dlg-header-icon"><i class="pi pi-id-card" /></div>
        <div>
          <div class="dlg-title">Simpan Data Akun</div>
          <div class="dlg-sub">Masukkan password untuk mengonfirmasi perubahan</div>
        </div>
      </div>
    </template>
    <div class="dlg-body">
      <div v-if="accountPwError" class="dlg-error">
        <i class="pi pi-exclamation-circle" />{{ accountPwError }}
      </div>
      <div class="dlg-field">
        <label class="dlg-label">Password</label>
        <div class="pw-wrap">
          <input
            v-model="accountPwInput"
            class="finput"
            :type="showAccountPw ? 'text' : 'password'"
            placeholder="Masukkan password Anda"
            autocomplete="current-password"
          />
          <button class="pw-eye" type="button" @click="showAccountPw = !showAccountPw">
            <i :class="showAccountPw ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dlg-footer">
        <button class="btn-ghost btn-sm" :disabled="savingAccount" @click="accountPwDialogVisible = false">Batal</button>
        <button class="btn-accent" :disabled="savingAccount || !accountPwInput" @click="submitSaveAccount">
          <i v-if="savingAccount" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          Simpan
        </button>
      </div>
    </template>
  </Dialog>

  <!-- ─── Dialog: Konfirmasi Password — Data Profil ─── -->
  <Dialog
    v-model:visible="profilePwDialogVisible"
    modal
    :closable="!savingProfile"
    :draggable="false"
    :style="{ width: '400px' }"
    pt:root:class="pw-dialog"
    pt:header:class="pw-dialog-header"
    pt:content:class="pw-dialog-content"
  >
    <template #header>
      <div class="dlg-header">
        <div class="dlg-header-icon"><i class="pi pi-user" /></div>
        <div>
          <div class="dlg-title">Simpan Data Profil</div>
          <div class="dlg-sub">Masukkan password untuk mengonfirmasi perubahan</div>
        </div>
      </div>
    </template>
    <div class="dlg-body">
      <div v-if="profilePwError" class="dlg-error">
        <i class="pi pi-exclamation-circle" />{{ profilePwError }}
      </div>
      <div class="dlg-field">
        <label class="dlg-label">Password</label>
        <div class="pw-wrap">
          <input
            v-model="profilePwInput"
            class="finput"
            :type="showProfilePw ? 'text' : 'password'"
            placeholder="Masukkan password Anda"
            autocomplete="current-password"
          />
          <button class="pw-eye" type="button" @click="showProfilePw = !showProfilePw">
            <i :class="showProfilePw ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
      </div>
    </div>
    <template #footer>
      <div class="dlg-footer">
        <button class="btn-ghost btn-sm" :disabled="savingProfile" @click="profilePwDialogVisible = false">Batal</button>
        <button class="btn-accent" :disabled="savingProfile || !profilePwInput" @click="submitSaveProfile">
          <i v-if="savingProfile" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          Simpan
        </button>
      </div>
    </template>
  </Dialog>

  <!-- ─── Dialog: Ubah Password ─── -->
  <Dialog
    v-model:visible="pwDialogVisible"
    modal
    :closable="!savingPw"
    :draggable="false"
    :style="{ width: '420px' }"
    pt:root:class="pw-dialog"
    pt:header:class="pw-dialog-header"
    pt:content:class="pw-dialog-content"
  >
    <template #header>
      <div class="dlg-header">
        <div class="dlg-header-icon"><i class="pi pi-key" /></div>
        <div>
          <div class="dlg-title">Ubah Password</div>
          <div class="dlg-sub">Verifikasi dengan password lama dan kode TOTP</div>
        </div>
      </div>
    </template>

    <div class="dlg-body">
      <div v-if="pwError" class="dlg-error">
        <i class="pi pi-exclamation-circle" />{{ pwError }}
      </div>

      <!-- Current password -->
      <div class="dlg-field">
        <label class="dlg-label">Password Saat Ini</label>
        <div class="pw-wrap">
          <input
            v-model="pwForm.currentPassword"
            class="finput"
            :type="show.current ? 'text' : 'password'"
            placeholder="Masukkan password saat ini"
            autocomplete="current-password"
          />
          <button class="pw-eye" type="button" @click="show.current = !show.current">
            <i :class="show.current ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
      </div>

      <!-- New password -->
      <div class="dlg-field">
        <label class="dlg-label">Password Baru</label>
        <div class="pw-wrap">
          <input
            v-model="pwForm.newPassword"
            class="finput"
            :type="show.new ? 'text' : 'password'"
            placeholder="Masukkan kata sandi baru"
            autocomplete="new-password"
          />
          <button class="pw-eye" type="button" @click="show.new = !show.new">
            <i :class="show.new ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
        <div class="strength-track">
          <div class="strength-fill" :style="{ width: pwStrengthPct, background: pwStrengthColor }" />
        </div>
        <span class="dlg-hint" :style="{ color: pwStrengthColor }">{{ pwStrengthLabel }}</span>
      </div>

      <!-- Confirm password -->
      <div class="dlg-field">
        <label class="dlg-label">Konfirmasi Password Baru</label>
        <div class="pw-wrap">
          <input
            v-model="pwForm.confirmPassword"
            class="finput"
            :type="show.confirm ? 'text' : 'password'"
            placeholder="Ulangi password baru"
            autocomplete="new-password"
          />
          <button class="pw-eye" type="button" @click="show.confirm = !show.confirm">
            <i :class="show.confirm ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
        <span
          v-if="pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword"
          class="dlg-hint dlg-hint--err"
        >Password tidak cocok</span>
      </div>

      <!-- TOTP -->
      <div class="dlg-field">
        <label class="dlg-label">Kode TOTP</label>
        <input
          v-model="pwForm.totpCode"
          class="finput totp-input"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="• • • • • •"
          autocomplete="one-time-code"
        />
        <span class="dlg-hint">6 digit dari aplikasi autentikator</span>
      </div>
    </div>

    <template #footer>
      <div class="dlg-footer">
        <button class="btn-ghost btn-sm" :disabled="savingPw" @click="pwDialogVisible = false">Batal</button>
        <button class="btn-accent" :disabled="savingPw || !pwFormValid" @click="submitChangePw">
          <i v-if="savingPw" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          Simpan Password
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import { usersApi, type UserItem } from '@/api/users'
import { useAuthStore } from '@/stores/auth'
import { extractApiError } from '@/utils/apiError'

const toast = useToast()
const auth = useAuthStore()
const router = useRouter()

// ─── Profile state ────────────────────────────────────────────────────────────

const profileData = ref<UserItem | null>(null)
const loading = ref(false)

const editingAccount = ref(false)
const savingAccount = ref(false)
const accountForm = ref({ name: '', email: '' })

const editingProfile = ref(false)
const savingProfile = ref(false)
const profileForm = ref({ jabatan: '', nomorHP: '' })

// ─── Password confirmation dialogs ────────────────────────────────────────────

const accountPwDialogVisible = ref(false)
const accountPwInput = ref('')
const accountPwError = ref('')
const showAccountPw = ref(false)

const profilePwDialogVisible = ref(false)
const profilePwInput = ref('')
const profilePwError = ref('')
const showProfilePw = ref(false)

const userInitial = computed(() =>
  (profileData.value?.name ?? auth.user?.name ?? '?').charAt(0).toUpperCase()
)

async function loadProfile() {
  loading.value = true
  try {
    const res = await usersApi.getMyProfile()
    profileData.value = res.data.data
  } catch {
    profileData.value = null
  } finally {
    loading.value = false
  }
}

function startEditAccount() {
  accountForm.value = { name: profileData.value?.name ?? '', email: profileData.value?.email ?? '' }
  editingAccount.value = true
}
function cancelEditAccount() { editingAccount.value = false }
function saveAccount() {
  accountPwInput.value = ''
  accountPwError.value = ''
  showAccountPw.value = false
  accountPwDialogVisible.value = true
}
async function submitSaveAccount() {
  accountPwError.value = ''
  savingAccount.value = true
  try {
    const payload: { name?: string; email?: string; password: string } = { password: accountPwInput.value }
    if (accountForm.value.name !== profileData.value?.name) payload.name = accountForm.value.name
    if (accountForm.value.email !== profileData.value?.email) payload.email = accountForm.value.email

    if (!payload.name && !payload.email) {
      accountPwError.value = 'Tidak ada perubahan data untuk disimpan.'
      return
    }

    const res = await usersApi.updateMyAccount(payload)
    accountPwDialogVisible.value = false
    editingAccount.value = false
    if (profileData.value) {
      if (res.data.data.name) profileData.value.name = res.data.data.name
      if (res.data.data.email) profileData.value.email = res.data.data.email
    }
    toast.add({ severity: 'success', summary: 'Berhasil', detail: res.data.message, life: 3000 })
  } catch (err: any) {
    accountPwError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    savingAccount.value = false
  }
}

function startEditProfile() {
  profileForm.value = { jabatan: profileData.value?.profile?.jabatan ?? '', nomorHP: profileData.value?.profile?.nomorHP ?? '' }
  editingProfile.value = true
}
function cancelEditProfile() { editingProfile.value = false }
function saveProfile() {
  profilePwInput.value = ''
  profilePwError.value = ''
  showProfilePw.value = false
  profilePwDialogVisible.value = true
}
async function submitSaveProfile() {
  profilePwError.value = ''
  savingProfile.value = true
  try {
    const payload: { jabatan?: string; nomorHP?: string; password: string } = { password: profilePwInput.value }
    if (profileForm.value.jabatan !== profileData.value?.profile?.jabatan) payload.jabatan = profileForm.value.jabatan
    if (profileForm.value.nomorHP !== (profileData.value?.profile?.nomorHP ?? '')) payload.nomorHP = profileForm.value.nomorHP

    if (!payload.jabatan && payload.nomorHP === undefined) {
      profilePwError.value = 'Tidak ada perubahan data untuk disimpan.'
      return
    }

    const res = await usersApi.updateMyProfile(payload)
    profilePwDialogVisible.value = false
    editingProfile.value = false
    if (profileData.value?.profile) {
      profileData.value.profile.jabatan = res.data.data.jabatan
      profileData.value.profile.nomorHP = res.data.data.nomorHP
    }
    toast.add({ severity: 'success', summary: 'Berhasil', detail: res.data.message, life: 3000 })
  } catch (err: any) {
    profilePwError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    savingProfile.value = false
  }
}

// ─── Password expiry ──────────────────────────────────────────────────────────

const passwordExpiredAt = computed<Date | null>(() => {
  const exp = profileData.value?.passwordExpiresAt
  if (!exp) return null
  return new Date(exp)
})

const daysUntilExpiry = computed<number | null>(() => {
  if (!passwordExpiredAt.value) return null
  return Math.ceil((passwordExpiredAt.value.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
})

const expiryChip = computed(() => {
  const d = daysUntilExpiry.value
  if (d === null || d > 14) return { label: '', cls: '', icon: '' }
  if (d <= 0) return { label: 'Kedaluwarsa', cls: 'chip-red', icon: 'pi pi-times-circle' }
  if (d <= 7) return { label: `${d}h lagi`, cls: 'chip-red', icon: 'pi pi-exclamation-triangle' }
  return { label: `${d}h lagi`, cls: 'chip-orange', icon: 'pi pi-clock' }
})

// ─── Change password dialog ───────────────────────────────────────────────────

const pwDialogVisible = ref(false)
const savingPw = ref(false)
const pwError = ref('')
const show = reactive({ current: false, new: false, confirm: false })
const pwForm = ref({ currentPassword: '', newPassword: '', confirmPassword: '', totpCode: '' })

function openPwDialog() {
  pwForm.value = { currentPassword: '', newPassword: '', confirmPassword: '', totpCode: '' }
  pwError.value = ''
  show.current = false
  show.new = false
  show.confirm = false
  pwDialogVisible.value = true
}

const pwStrength = computed(() => {
  const pw = pwForm.value.newPassword
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return s
})

const pwStrengthPct = computed(() => `${(pwStrength.value / 5) * 100}%`)
const pwStrengthColor = computed(() => {
  const s = pwStrength.value
  if (!pwForm.value.newPassword) return 'var(--color-border)'
  if (s <= 1) return '#ff4d6d'
  if (s <= 2) return '#ff9f45'
  if (s <= 3) return '#ffd166'
  return 'var(--color-accent)'
})
const pwStrengthLabel = computed(() => {
  if (!pwForm.value.newPassword) return ''
  const labels = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Kuat', 'Sangat Kuat']
  return labels[pwStrength.value] ?? ''
})

const pwFormValid = computed(() => {
  const f = pwForm.value
  return (
    f.currentPassword.length > 0 &&
    f.newPassword.length > 0 &&
    f.newPassword === f.confirmPassword &&
    /^\d{6}$/.test(f.totpCode)
  )
})

async function submitChangePw() {
  pwError.value = ''
  savingPw.value = true
  try {
    await usersApi.updateMyPassword({
      currentPassword: pwForm.value.currentPassword,
      newPassword: pwForm.value.newPassword,
      confirmPassword: pwForm.value.confirmPassword,
      totpCode: pwForm.value.totpCode,
    })
    pwDialogVisible.value = false
    toast.add({ severity: 'success', summary: 'Password Diubah', detail: 'Silakan login kembali.', life: 3000 })
    auth.logout()
    router.push({ name: 'login' })
  } catch (err: any) {
    pwError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    savingPw.value = false
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMINISTRATOR: 'Admin', KOMITE_PUSAT: 'Komite Pusat',
    PENGELOLA_RISIKO_UKER: 'Pengelola Risiko', USER: 'User',
  }
  return map[role] ?? role
}

function roleBadgeClass(role: string) {
  return {
    'role-admin': role === 'ADMINISTRATOR',
    'role-komite': role === 'KOMITE_PUSAT',
    'role-pengelola': role === 'PENGELOLA_RISIKO_UKER',
    'role-user': role === 'USER',
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
}

onMounted(() => loadProfile())
</script>

<style scoped>
/* ─── State ─── */
.state-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 4rem 2rem;
  min-height: 280px;
}
.state-text { font-size: 13px; color: var(--color-text-muted); }
.state-icon { font-size: 1.5rem; }
.state-icon--warn { color: #ff9f45; }

/* ─── Hero ─── */
.hero {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding-bottom: 1.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.hero-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--color-accent-glow);
  border: 2px solid rgba(0, 229, 184, 0.25);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 1.6rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.hero-body {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.hero-name {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text);
  line-height: 1.2;
}

.hero-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  font-size: 12px;
}

.hero-dot { color: var(--color-border-hover); }

.hero-chips {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* ─── Cards row ─── */
.cards-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
  align-items: start;
}

/* ─── Card ─── */
.card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border);
  background: rgba(0, 229, 184, 0.015);
}

.card-head-left {
  display: flex;
  align-items: center;
  gap: 7px;
}

.card-icon {
  font-size: 12px;
  color: var(--color-accent);
}

.card-title {
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text);
}

.card-body {
  padding: 0 14px;
}

/* ─── Fields ─── */
.field {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 9px 0;
  border-bottom: 1px solid var(--color-border);
}
.field.last { border-bottom: none; }

.flabel {
  width: 90px;
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  padding-top: 2px;
}

.fval {
  flex: 1;
  font-size: 12px;
  color: var(--color-text);
  min-width: 0;
}

.finput {
  flex: 1;
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 12px;
  padding: 5px 9px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}
.finput:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}
.finput::placeholder { color: var(--color-text-muted); }

/* ─── Security strip ─── */
.security-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 12px 16px;
  background: var(--color-bg-card);
  border: 1px solid rgba(0, 229, 184, 0.15);
  border-radius: var(--radius-lg);
}

.security-strip-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
  min-width: 0;
}

.security-icon {
  font-size: 14px;
  color: var(--color-accent);
  flex-shrink: 0;
}

.security-stats {
  display: flex;
  align-items: center;
  gap: 0;
  flex-wrap: wrap;
}

.sec-stat {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding-right: 16px;
}

.sec-stat-label {
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}

.sec-stat-val {
  font-size: 12px;
  color: var(--color-text);
}

.sec-divider {
  width: 1px;
  height: 30px;
  background: var(--color-border);
  margin-right: 16px;
  flex-shrink: 0;
}

/* ─── Buttons ─── */
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 12px;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-ghost:hover:not(:disabled) { border-color: var(--color-text-dim); color: var(--color-text); }
.btn-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost .pi { font-size: 11px; }

.btn-accent {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.3);
  border-radius: var(--radius-sm);
  color: var(--color-accent);
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-accent:hover:not(:disabled) { background: rgba(0, 229, 184, 0.18); border-color: var(--color-accent); }
.btn-accent:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-accent .pi { font-size: 11px; }

.btn-sm { font-size: 11px; padding: 4px 9px; }

/* ─── Utilities ─── */
.row-gap { display: flex; align-items: center; gap: 6px; }
.row-gap-sm { display: flex; align-items: center; gap: 6px; }
.mono { font-family: var(--font-mono); }
.accent { color: var(--color-accent); }
.muted { color: var(--color-text-muted); }

/* ─── Status chips ─── */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 500;
  border-radius: 100px;
  padding: 2px 7px;
  white-space: nowrap;
}
.chip-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; flex-shrink: 0; }
.chip-green  { background: rgba(0, 229, 100, 0.1); color: #5ae08a; border: 1px solid rgba(0, 229, 100, 0.2); }
.chip-red    { background: rgba(255, 77, 109, 0.1); color: #ff8fa3; border: 1px solid rgba(255, 77, 109, 0.2); }
.chip-orange { background: rgba(255, 165, 0, 0.1);  color: #ffc46b; border: 1px solid rgba(255, 165, 0, 0.2); }
.chip-teal   { background: var(--color-accent-glow); color: var(--color-accent); border: 1px solid rgba(0, 229, 184, 0.25); }
.chip-dim    { background: rgba(90, 122, 154, 0.1); color: var(--color-text-muted); border: 1px solid var(--color-border); }

/* ─── Role badges ─── */
.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  border-radius: 3px;
  padding: 2px 6px;
  white-space: nowrap;
}
.role-admin     { background: rgba(255, 100, 100, 0.15); color: #ff8fa3; border: 1px solid rgba(255, 100, 100, 0.25); }
.role-komite    { background: rgba(100, 100, 255, 0.15); color: #9fa8ff; border: 1px solid rgba(100, 100, 255, 0.25); }
.role-pengelola { background: rgba(255, 200, 50, 0.12); color: #ffd470; border: 1px solid rgba(255, 200, 50, 0.2); }
.role-user      { background: rgba(100, 200, 100, 0.1); color: #7ed8a0; border: 1px solid rgba(100, 200, 100, 0.2); }

/* ─── Dialog ─── */
:deep(.pw-dialog) {
  background: var(--color-bg-card) !important;
  border: 1px solid rgba(0, 229, 184, 0.15) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

:deep(.pw-dialog-header) {
  padding: 16px 20px 12px !important;
  border-bottom: 1px solid var(--color-border) !important;
  background: rgba(0, 229, 184, 0.02) !important;
}

:deep(.pw-dialog-content) {
  padding: 0 !important;
}

.dlg-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dlg-header-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.25);
  color: var(--color-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.dlg-title {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.dlg-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 1px;
}

.dlg-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dlg-error {
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(255, 77, 109, 0.08);
  border: 1px solid rgba(255, 77, 109, 0.2);
  border-radius: var(--radius-sm);
  color: #ff8fa3;
  font-size: 12px;
  padding: 8px 12px;
}

.dlg-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.dlg-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
}

.pw-wrap {
  position: relative;
}

.pw-wrap .finput {
  padding-right: 34px;
  flex: unset;
}

.pw-eye {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
  transition: color 0.2s;
}
.pw-eye:hover { color: var(--color-text); }

.strength-track {
  height: 2px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
  margin-top: 2px;
}
.strength-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s, background 0.3s;
}

.dlg-hint { font-size: 11px; color: var(--color-text-muted); }
.dlg-hint--err { color: #ff8fa3; }

.totp-input {
  font-family: var(--font-mono);
  font-size: 18px;
  letter-spacing: 0.25em;
  text-align: center;
}

.dlg-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-border);
}
</style>
