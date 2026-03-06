<template>
  <!-- ─── Header ─── -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Manajemen Pengguna</h1>
          <p class="page-sub text-dim">
            Total
            <strong style="color:var(--color-accent)">{{ pagination.totalItems }}</strong>
            pengguna terdaftar
          </p>
        </div>
      </div>

      <!-- ─── Search & Filter ─── -->
      <div class="filter-bar">
        <div class="search-wrap">
          <i class="pi pi-search search-icon" />
          <input
            v-model="filters.q"
            type="text"
            class="search-input"
            placeholder="Cari nama atau username..."
            @input="onSearch"
          />
          <button v-if="filters.q" class="search-clear" @click="filters.q = ''; loadUsers()">
            <i class="pi pi-times" />
          </button>
        </div>

        <select v-model="filters.role" class="filter-select" @change="loadUsers()">
          <option value="">Semua Peran</option>
          <option value="USER">User</option>
          <option value="ADMINISTRATOR">Administrator</option>
          <option value="KOMITE_PUSAT">Komite Pusat</option>
          <option value="PENGELOLA_RISIKO_UKER">Pengelola Risiko</option>
        </select>

        <select v-model="filters.isActive" class="filter-select" @change="loadUsers()">
          <option value="">Semua Status</option>
          <option value="true">Aktif</option>
          <option value="false">Tidak Aktif</option>
        </select>

        <select v-model="filters.isVerified" class="filter-select" @change="loadUsers()">
          <option value="">Semua Verifikasi</option>
          <option value="true">Terverifikasi</option>
          <option value="false">Belum Diverifikasi</option>
        </select>

        <button class="filter-reset" @click="resetFilters" title="Reset filter">
          <i class="pi pi-filter-slash" />
        </button>
      </div>

      <!-- ─── Table ─── -->
      <div class="table-wrap">
        <!-- Loading overlay -->
        <div v-if="loading" class="table-loading">
          <ProgressSpinner style="width:32px;height:32px;" />
          <span>Memuat data...</span>
        </div>

        <!-- Error -->
        <div v-else-if="errorMsg" class="table-empty">
          <i class="pi pi-exclamation-triangle" style="color:var(--color-danger); font-size:1.5rem;" />
          <span>{{ errorMsg }}</span>
          <button class="btn-retry" @click="loadUsers()">Coba Lagi</button>
        </div>

        <!-- Empty -->
        <div v-else-if="users.length === 0" class="table-empty">
          <i class="pi pi-inbox" style="font-size:1.5rem; opacity:0.4;" />
          <span>Tidak ada pengguna ditemukan</span>
        </div>

        <!-- Table -->
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Pengguna</th>
              <th>Unit Kerja</th>
              <th>Peran</th>
              <th>Status</th>
              <th>Sesi</th>
              <th>Terdaftar</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">

              <!-- Pengguna -->
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ user.name.charAt(0).toUpperCase() }}</div>
                  <div>
                    <div class="user-name">{{ user.name }}</div>
                    <div class="user-username">@{{ user.username }}</div>
                    <div class="user-email">{{ user.email }}</div>
                  </div>
                </div>
              </td>

              <!-- Unit Kerja -->
              <td>
                <template v-if="user.profile?.unitKerja">
                  <div class="cell-main">{{ user.profile.unitKerja.name }}</div>
                  <div class="cell-sub">{{ user.profile.unitKerja.code }}</div>
                </template>
                <span v-else class="no-data">—</span>
              </td>

              <!-- Peran -->
              <td>
                <div style="display:flex; flex-wrap:wrap; gap:4px;">
                  <span
                    v-for="role in user.roles"
                    :key="role"
                    class="role-badge"
                    :class="roleBadgeClass(role)"
                  >{{ roleLabel(role) }}</span>
                </div>
              </td>

              <!-- Status -->
              <td>
                <div style="display:flex; flex-direction:column; gap:4px;">
                  <span class="status-chip" :class="user.isActive ? 'chip-green' : 'chip-red'">
                    <span class="chip-dot" />
                    {{ user.isActive ? 'Aktif' : 'Nonaktif' }}
                  </span>
                  <span class="status-chip" :class="user.isVerified ? 'chip-green' : 'chip-orange'">
                    <i :class="user.isVerified ? 'pi pi-verified' : 'pi pi-clock'" style="font-size:10px;" />
                    {{ user.isVerified ? 'Terverifikasi' : 'Menunggu' }}
                  </span>
                  <span class="status-chip" :class="user.totpEnabled ? 'chip-teal' : 'chip-dim'">
                    <i class="pi pi-shield" style="font-size:10px;" />
                    {{ user.totpEnabled ? 'TOTP Aktif' : 'Tanpa TOTP' }}
                  </span>
                </div>
              </td>

              <!-- Sesi -->
              <td>
                <template v-if="user.session">
                  <div style="display:flex; flex-direction:column; gap:3px;">
                    <span class="status-chip" :class="user.session.isActive ? 'chip-green' : 'chip-dim'">
                      <span class="chip-dot" />
                      {{ user.session.isActive ? 'Online' : 'Offline' }}
                    </span>
                    <div v-if="user.session.deviceName" class="cell-sub">
                      <i class="pi pi-desktop" style="font-size:10px;" />
                      {{ user.session.deviceName }}
                    </div>
                    <div v-if="user.session.ipAddress" class="cell-sub text-mono">
                      {{ user.session.ipAddress }}
                    </div>
                  </div>
                </template>
                <span v-else class="no-data">Belum login</span>
              </td>

              <!-- Terdaftar -->
              <td>
                <div class="cell-main">{{ formatDate(user.createdAt) }}</div>
                <div v-if="user.passwordChangedAt" class="cell-sub">
                  Sandi diubah {{ formatDate(user.passwordChangedAt) }}
                </div>
              </td>

              <!-- Aksi -->
              <td class="action-cell">
                <div class="action-buttons">
                  <button
                    v-if="!user.isVerified"
                    class="action-btn btn-verify"
                    title="Verifikasi akun"
                    :disabled="actionLoadingId === user.id"
                    @click="openAction('verify', user)"
                  >
                    <i class="pi pi-verified" />
                    <span>Verifikasi</span>
                  </button>

                  <button
                    v-if="!user.isActive"
                    class="action-btn btn-activate"
                    title="Aktifkan akun"
                    :disabled="actionLoadingId === user.id"
                    @click="openAction('activate', user)"
                  >
                    <i class="pi pi-check-circle" />
                    <span>Aktifkan</span>
                  </button>

                  <button
                    v-if="user.isActive && user.username !== auth.user?.username"
                    class="action-btn btn-deactivate"
                    title="Nonaktifkan akun"
                    :disabled="actionLoadingId === user.id"
                    @click="openAction('deactivate', user)"
                  >
                    <i class="pi pi-ban" />
                    <span>Nonaktifkan</span>
                  </button>

                  <button
                    v-if="user.totpEnabled && user.username !== auth.user?.username"
                    class="action-btn btn-reset-totp"
                    title="Reset TOTP"
                    :disabled="actionLoadingId === user.id"
                    @click="openResetTotp(user)"
                  >
                    <i class="pi pi-shield" />
                    <span>Reset TOTP</span>
                  </button>

                  <button
                    v-if="user.username !== auth.user?.username"
                    class="action-btn btn-edit"
                    title="Edit unit kerja & peran"
                    :disabled="actionLoadingId === user.id"
                    @click="openEditDialog(user)"
                  >
                    <i class="pi pi-pencil" />
                    <span>Edit</span>
                  </button>

                  <span
                    v-if="user.isVerified && user.isActive && user.username === auth.user?.username"
                    class="no-data"
                  >Akun Anda</span>
                </div>
              </td>

            </tr>
          </tbody>
        </table>
      </div>

      <!-- ─── Pagination ─── -->
      <div class="pagination-bar">
        <div class="pagination-info">
          <template v-if="pagination.totalItems > 0">
            Menampilkan
            <strong>{{ paginationRange }}</strong>
            dari <strong>{{ pagination.totalItems }}</strong> pengguna
          </template>
          <span v-else class="text-dim">Tidak ada data</span>
        </div>

        <div class="pagination-controls">
          <div class="limit-wrap">
            <span class="limit-label">Tampilkan</span>
            <select v-model.number="pagination.limit" class="limit-select" @change="loadUsers(1)">
              <option :value="10">10</option>
              <option :value="25">25</option>
              <option :value="50">50</option>
            </select>
            <span class="limit-label">/ hal.</span>
          </div>

          <div v-if="pagination.totalPages > 1" class="page-buttons">
            <button
              class="page-btn"
              :disabled="!pagination.hasPrevPage"
              @click="goToPage(pagination.page - 1)"
            >
              <i class="pi pi-chevron-left" />
            </button>

            <button
              v-for="p in pageNumbers"
              :key="p"
              class="page-btn"
              :class="{ 'is-active': p === pagination.page }"
              @click="goToPage(p)"
            >{{ p }}</button>

            <button
              class="page-btn"
              :disabled="!pagination.hasNextPage"
              @click="goToPage(pagination.page + 1)"
            >
              <i class="pi pi-chevron-right" />
            </button>

            <span class="page-pos">{{ pagination.page }} / {{ pagination.totalPages }}</span>
          </div>
        </div>
      </div>

  <!-- ─── Dialog: Reset TOTP ─── -->
  <Dialog
    v-model:visible="showResetTotpDialog"
    modal
    :closable="!savingResetTotp"
    :draggable="false"
    :style="{ width: '440px' }"
    pt:root:class="reset-totp-dialog"
  >
    <template #header>
      <div class="rtd-header">
        <div class="rtd-icon"><i class="pi pi-shield" /></div>
        <div>
          <div class="rtd-title">Reset TOTP Pengguna</div>
          <div class="rtd-sub" v-if="resetTotpTarget">
            <span class="rtd-target-name">{{ resetTotpTarget.name }}</span>
            <span class="rtd-target-username">@{{ resetTotpTarget.username }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="rtd-body">
      <div class="rtd-warning">
        <i class="pi pi-exclamation-triangle rtd-warn-icon" />
        <p class="rtd-warn-text">
          TOTP pengguna ini akan dinonaktifkan dan sesinya akan dihapus.
          Pengguna perlu mengaktifkan ulang TOTP saat login berikutnya.
        </p>
      </div>

      <div v-if="resetTotpError" class="rtd-error">
        <i class="pi pi-exclamation-circle" />{{ resetTotpError }}
      </div>

      <div class="rtd-field">
        <label class="rtd-label">Password Anda</label>
        <div class="rtd-pw-wrap">
          <input
            v-model="resetTotpForm.password"
            class="rtd-input"
            :type="showResetTotpPw ? 'text' : 'password'"
            placeholder="Masukkan password Anda"
            autocomplete="current-password"
          />
          <button class="rtd-eye" type="button" @click="showResetTotpPw = !showResetTotpPw">
            <i :class="showResetTotpPw ? 'pi pi-eye-slash' : 'pi pi-eye'" />
          </button>
        </div>
      </div>

      <div class="rtd-field">
        <label class="rtd-label">Kode TOTP Anda</label>
        <input
          v-model="resetTotpForm.totpCode"
          class="rtd-input rtd-totp-input"
          type="text"
          inputmode="numeric"
          maxlength="6"
          placeholder="• • • • • •"
          autocomplete="one-time-code"
        />
        <span class="rtd-hint">6 digit dari aplikasi autentikator Anda</span>
      </div>
    </div>

    <template #footer>
      <div class="rtd-footer">
        <button class="rtd-btn-cancel" :disabled="savingResetTotp" @click="showResetTotpDialog = false">
          Batal
        </button>
        <button
          class="rtd-btn-confirm"
          :disabled="savingResetTotp || !resetTotpForm.password || !/^\d{6}$/.test(resetTotpForm.totpCode)"
          @click="submitResetTotp"
        >
          <i v-if="savingResetTotp" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-shield" />
          Reset TOTP
        </button>
      </div>
    </template>
  </Dialog>

  <!-- ─── Dialog Tinjau & Konfirmasi ─── -->
  <Dialog
    v-model:visible="showConfirmDialog"
    :header="confirmConfig.title"
    :modal="true"
    :draggable="false"
    :closable="!actionLoading && !detailLoading"
    :style="{ width: '480px' }"
    class="review-dialog"
    @hide="onDialogHide"
  >
    <!-- Loading saat fetch user detail -->
    <div v-if="detailLoading" class="detail-loading">
      <ProgressSpinner style="width:28px;height:28px;" />
      <span>Memuat data pengguna...</span>
    </div>

    <template v-else>
      <!-- Header pengguna -->
      <div class="review-user-header">
        <div class="review-avatar">
          {{ (userDetail?.name ?? pendingAction?.user.name ?? '?').charAt(0).toUpperCase() }}
        </div>
        <div class="review-identity">
          <div class="review-name">{{ userDetail?.name ?? pendingAction?.user.name }}</div>
          <div class="review-username">@{{ userDetail?.username ?? pendingAction?.user.username }}</div>
          <div class="review-email">{{ userDetail?.email ?? pendingAction?.user.email }}</div>
        </div>
      </div>

      <!-- Data detail -->
      <div v-if="userDetail" class="review-details">
        <div class="review-row">
          <span class="review-label">Jabatan</span>
          <span class="review-val">{{ userDetail.profile?.jabatan ?? '—' }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Unit Kerja</span>
          <div class="review-val">
            <span>{{ userDetail.profile?.unitKerja?.name ?? '—' }}</span>
            <span v-if="userDetail.profile?.unitKerja?.code" class="review-sub">
              {{ userDetail.profile.unitKerja.code }}
            </span>
          </div>
        </div>
        <div v-if="userDetail.profile?.nomorHP" class="review-row">
          <span class="review-label">Nomor HP</span>
          <span class="review-val text-mono">{{ userDetail.profile.nomorHP }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Peran</span>
          <div class="review-val" style="display:flex; gap:4px; flex-wrap:wrap;">
            <span
              v-for="role in userDetail.roles"
              :key="role"
              class="role-badge"
              :class="roleBadgeClass(role)"
            >{{ roleLabel(role) }}</span>
          </div>
        </div>
        <div class="review-row">
          <span class="review-label">Status</span>
          <div class="review-val" style="display:flex; gap:4px; flex-wrap:wrap;">
            <span class="status-chip" :class="userDetail.isActive ? 'chip-green' : 'chip-red'">
              <span class="chip-dot" />{{ userDetail.isActive ? 'Aktif' : 'Nonaktif' }}
            </span>
            <span class="status-chip" :class="userDetail.isVerified ? 'chip-green' : 'chip-orange'">
              <i :class="userDetail.isVerified ? 'pi pi-verified' : 'pi pi-clock'" style="font-size:10px;" />
              {{ userDetail.isVerified ? 'Terverifikasi' : 'Belum Diverifikasi' }}
            </span>
          </div>
        </div>
        <div v-if="userDetail.profile?.verifiedAt" class="review-row">
          <span class="review-label">Diverifikasi</span>
          <span class="review-val">{{ formatDate(userDetail.profile.verifiedAt) }}</span>
        </div>
        <div class="review-row">
          <span class="review-label">Terdaftar</span>
          <span class="review-val">{{ formatDate(userDetail.createdAt) }}</span>
        </div>
      </div>

      <!-- Garis pemisah -->
      <div class="review-divider" />

      <!-- Peringatan / info aksi -->
      <div class="review-notice" :class="confirmConfig.noticeClass">
        <i :class="confirmConfig.icon" class="notice-icon" />
        <p class="notice-text">{{ confirmConfig.message }}</p>
      </div>
    </template>

    <template #footer>
      <Button
        label="Batal"
        severity="secondary"
        text
        :disabled="actionLoading || detailLoading"
        @click="onDialogHide"
      />
      <Button
        :label="confirmConfig.label"
        :severity="confirmConfig.severity"
        :icon="confirmConfig.icon"
        :loading="actionLoading"
        :disabled="detailLoading"
        @click="confirmAction"
      />
    </template>
  </Dialog>

  <!-- ─── Dialog: Edit Unit Kerja & Peran ─── -->
  <Dialog
    v-model:visible="showEditDialog"
    modal
    :closable="!savingEdit"
    :draggable="false"
    :style="{ width: '460px' }"
    pt:root:class="edit-user-dialog"
  >
    <template #header>
      <div class="eud-header">
        <div class="eud-icon"><i class="pi pi-pencil" /></div>
        <div>
          <div class="eud-title">Edit Pengguna</div>
          <div class="eud-sub" v-if="editTarget">
            <span class="eud-target-name">{{ editTarget.name }}</span>
            <span class="eud-target-username">@{{ editTarget.username }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="eud-body">
      <div v-if="editError" class="eud-error">
        <i class="pi pi-exclamation-circle" />{{ editError }}
      </div>

      <!-- Unit Kerja -->
      <div class="eud-field">
        <label class="eud-label">Unit Kerja</label>
        <div v-if="loadingUnitKerja" class="eud-loading-select">
          <i class="pi pi-spin pi-spinner" style="font-size:12px;" />
          <span>Memuat...</span>
        </div>
        <select v-else v-model="editForm.unitKerjaId" class="eud-select">
          <option value="">— Tidak diubah —</option>
          <option v-for="uk in unitKerjaOptions" :key="uk.id" :value="uk.id">
            {{ uk.name }} ({{ uk.code }})
          </option>
        </select>
        <span v-if="editTarget?.profile?.unitKerja" class="eud-current">
          Saat ini: <strong>{{ editTarget.profile.unitKerja.name }}</strong>
        </span>
      </div>

      <!-- Peran -->
      <div class="eud-field">
        <label class="eud-label">Peran</label>
        <div class="eud-roles">
          <label v-for="r in allRoles" :key="r.value" class="eud-role-option">
            <input type="checkbox" :value="r.value" v-model="editForm.roles" class="eud-checkbox" />
            <span class="role-badge" :class="roleBadgeClass(r.value)">{{ r.label }}</span>
          </label>
        </div>
        <span v-if="editForm.roles.length === 0" class="eud-hint eud-hint-warn">
          <i class="pi pi-exclamation-triangle" style="font-size:10px;" /> Pilih minimal satu peran
        </span>
      </div>
    </div>

    <template #footer>
      <div class="eud-footer">
        <button class="eud-btn-cancel" :disabled="savingEdit" @click="showEditDialog = false">
          Batal
        </button>
        <button
          class="eud-btn-confirm"
          :disabled="savingEdit || editForm.roles.length === 0"
          @click="submitEdit"
        >
          <i v-if="savingEdit" class="pi pi-spin pi-spinner" />
          <i v-else class="pi pi-check" />
          Simpan
        </button>
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import { useToast } from 'primevue/usetoast'
import { usersApi, type UserItem, type PaginationMeta } from '@/api/users'
import { unitKerjaApi, type UnitKerja } from '@/api/unitKerja'
import { useAuthStore } from '@/stores/auth'
import { extractApiError } from '@/utils/apiError'

const auth = useAuthStore()
const toast = useToast()

// ─── State ──────────────────────────────────────────────────────────────────

const users = ref<UserItem[]>([])
const loading = ref(false)
const errorMsg = ref('')

// ─── Action state ────────────────────────────────────────────────────────────

// ─── Reset TOTP state ────────────────────────────────────────────────────────

const showResetTotpDialog = ref(false)
const savingResetTotp = ref(false)
const resetTotpTarget = ref<UserItem | null>(null)
const resetTotpError = ref('')
const showResetTotpPw = ref(false)
const resetTotpForm = ref({ password: '', totpCode: '' })

function openResetTotp(user: UserItem) {
  resetTotpTarget.value = user
  resetTotpForm.value = { password: '', totpCode: '' }
  resetTotpError.value = ''
  showResetTotpPw.value = false
  showResetTotpDialog.value = true
}

async function submitResetTotp() {
  if (!resetTotpTarget.value) return
  resetTotpError.value = ''
  savingResetTotp.value = true
  actionLoadingId.value = resetTotpTarget.value.id
  try {
    const res = await usersApi.resetTotp(resetTotpTarget.value.id, {
      password: resetTotpForm.value.password,
      totpCode: resetTotpForm.value.totpCode,
    })
    showResetTotpDialog.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: res.data.message, life: 4000 })
    await loadUsers()
  } catch (err: any) {
    resetTotpError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    savingResetTotp.value = false
    actionLoadingId.value = null
  }
}

// ─── Edit User state ──────────────────────────────────────────────────────────

const allRoles = [
  { value: 'USER', label: 'User' },
  { value: 'PENGELOLA_RISIKO_UKER', label: 'Pengelola Risiko' },
  { value: 'KOMITE_PUSAT', label: 'Komite Pusat' },
  { value: 'ADMINISTRATOR', label: 'Administrator' },
]

const showEditDialog = ref(false)
const savingEdit = ref(false)
const editTarget = ref<UserItem | null>(null)
const editError = ref('')
const unitKerjaOptions = ref<UnitKerja[]>([])
const loadingUnitKerja = ref(false)
const editForm = reactive({ unitKerjaId: '', roles: [] as string[] })

async function openEditDialog(user: UserItem) {
  editTarget.value = user
  editForm.unitKerjaId = ''
  editForm.roles = [...user.roles]
  editError.value = ''
  showEditDialog.value = true

  if (unitKerjaOptions.value.length === 0) {
    loadingUnitKerja.value = true
    try {
      const res = await unitKerjaApi.search({ limit: 100 })
      unitKerjaOptions.value = res.data.data
    } catch {
      // biarkan kosong, user masih bisa ganti roles
    } finally {
      loadingUnitKerja.value = false
    }
  }
}

async function submitEdit() {
  if (!editTarget.value || editForm.roles.length === 0) return
  editError.value = ''

  const payload: { unitKerjaId?: string; roles?: string[] } = {
    roles: editForm.roles,
  }
  if (editForm.unitKerjaId) {
    payload.unitKerjaId = editForm.unitKerjaId
  }

  savingEdit.value = true
  actionLoadingId.value = editTarget.value.id
  try {
    const res = await usersApi.adminUpdateUser(editTarget.value.id, payload)
    showEditDialog.value = false
    toast.add({ severity: 'success', summary: 'Berhasil', detail: res.data.message, life: 4000 })
    await loadUsers()
  } catch (err: any) {
    editError.value = extractApiError(err, 'Terjadi kesalahan. Coba lagi.')
  } finally {
    savingEdit.value = false
    actionLoadingId.value = null
  }
}

// ─── ─────────────────────────────────────────────────────────────────────────

type ActionType = 'verify' | 'activate' | 'deactivate'

const showConfirmDialog = ref(false)
const actionLoading = ref(false)
const actionLoadingId = ref<string | null>(null)
const pendingAction = ref<{ type: ActionType; user: UserItem } | null>(null)
const userDetail = ref<UserItem | null>(null)
const detailLoading = ref(false)

const confirmConfig = computed(() => {
  const type = pendingAction.value?.type
  if (type === 'verify') return {
    title: 'Tinjau & Verifikasi Akun',
    message: 'Tindakan ini akan menandai profil pengguna sebagai telah diverifikasi. Pastikan semua data di atas sudah sesuai sebelum melanjutkan.',
    label: 'Verifikasi',
    severity: 'contrast' as const,
    icon: 'pi pi-verified',
    noticeClass: 'notice-info',
  }
  if (type === 'activate') return {
    title: 'Tinjau & Aktifkan Akun',
    message: 'Pengguna akan dapat masuk ke sistem setelah diaktifkan. Pastikan akun ini memang layak untuk diaktifkan.',
    label: 'Aktifkan',
    severity: 'success' as const,
    icon: 'pi pi-check-circle',
    noticeClass: 'notice-success',
  }
  return {
    title: 'Tinjau & Nonaktifkan Akun',
    message: 'Pengguna akan langsung dikeluarkan dari sesi aktifnya dan tidak dapat masuk kembali hingga diaktifkan ulang.',
    label: 'Nonaktifkan',
    severity: 'danger' as const,
    icon: 'pi pi-ban',
    noticeClass: 'notice-danger',
  }
})

async function openAction(type: ActionType, user: UserItem) {
  pendingAction.value = { type, user }
  userDetail.value = null
  detailLoading.value = true
  showConfirmDialog.value = true
  try {
    const res = await usersApi.getById(user.id)
    userDetail.value = res.data.data
  } catch {
    // Dialog tetap terbuka dengan info dasar dari baris tabel
  } finally {
    detailLoading.value = false
  }
}

function onDialogHide() {
  if (actionLoading.value) return
  showConfirmDialog.value = false
  userDetail.value = null
  pendingAction.value = null
}

async function confirmAction() {
  if (!pendingAction.value) return
  const { type, user } = pendingAction.value

  actionLoading.value = true
  actionLoadingId.value = user.id
  try {
    if (type === 'verify') await usersApi.verify(user.id)
    else if (type === 'activate') await usersApi.activate(user.id)
    else await usersApi.deactivate(user.id)

    showConfirmDialog.value = false
    const actionLabel = type === 'verify' ? 'diverifikasi' : type === 'activate' ? 'diaktifkan' : 'dinonaktifkan'
    toast.add({ severity: 'success', summary: 'Berhasil', detail: `Akun ${user.username} berhasil ${actionLabel}.`, life: 3000 })
    await loadUsers()
  } catch (err: any) {
    toast.add({ severity: 'error', summary: 'Gagal', detail: extractApiError(err, 'Terjadi kesalahan.'), life: 4000 })
  } finally {
    actionLoading.value = false
    actionLoadingId.value = null
    userDetail.value = null
    pendingAction.value = null
  }
}

const pagination = reactive<PaginationMeta>({
  page: 1,
  limit: 10,
  totalItems: 0,
  totalPages: 0,
  hasNextPage: false,
  hasPrevPage: false,
})

const filters = reactive({
  q: '',
  role: '',
  isActive: '',
  isVerified: '',
})

// ─── Computed ────────────────────────────────────────────────────────────────

const pageNumbers = computed(() => {
  const { page, totalPages } = pagination
  const delta = 2
  const range: number[] = []
  for (let i = Math.max(1, page - delta); i <= Math.min(totalPages, page + delta); i++) {
    range.push(i)
  }
  return range
})

const paginationRange = computed(() => {
  const start = (pagination.page - 1) * pagination.limit + 1
  const end = Math.min(pagination.page * pagination.limit, pagination.totalItems)
  return `${start}–${end}`
})

// ─── Data loading ────────────────────────────────────────────────────────────

let searchTimeout: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => loadUsers(1), 350)
}

async function loadUsers(page = pagination.page) {
  loading.value = true
  errorMsg.value = ''
  try {
    const params: Record<string, unknown> = { page, limit: pagination.limit }
    if (filters.q) params.name = filters.q
    if (filters.role) params.role = filters.role
    if (filters.isActive !== '') params.isActive = filters.isActive === 'true'
    if (filters.isVerified !== '') params.isVerified = filters.isVerified === 'true'

    const res = await usersApi.search(params as any)
    users.value = res.data.data
    Object.assign(pagination, { ...res.data.pagination, page })
  } catch (err: any) {
    errorMsg.value = extractApiError(err, 'Gagal memuat data pengguna.')
  } finally {
    loading.value = false
  }
}

function goToPage(p: number) {
  if (p < 1 || p > pagination.totalPages) return
  loadUsers(p)
}

function resetFilters() {
  filters.q = ''
  filters.role = ''
  filters.isActive = ''
  filters.isVerified = ''
  loadUsers(1)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function roleLabel(role: string) {
  const map: Record<string, string> = {
    ADMINISTRATOR: 'Admin',
    KOMITE_PUSAT: 'Komite Pusat',
    PENGELOLA_RISIKO_UKER: 'Pengelola Risiko',
    USER: 'User',
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
  return new Date(iso).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ─── Init ────────────────────────────────────────────────────────────────────

onMounted(() => loadUsers(1))
</script>

<style scoped>
/* ─── Page header ─── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.page-title {
  font-family: var(--font-display);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  margin: 0 0 0.25rem;
}

.page-sub {
  font-size: 13px;
  margin: 0;
}

/* ─── Filter bar ─── */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.search-wrap {
  position: relative;
  flex: 1;
  min-width: 220px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-muted);
  font-size: 13px;
  pointer-events: none;
}

.search-input {
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 14px;
  padding: 9px 36px 9px 36px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px var(--color-accent-glow);
}

.search-input::placeholder { color: var(--color-text-muted); }

.search-clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  font-size: 11px;
  border-radius: 2px;
}

.search-clear:hover { color: var(--color-text); }

.filter-select {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  padding: 9px 12px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.filter-select:focus { border-color: var(--color-accent); }

.filter-reset {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  width: 38px;
  height: 38px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.filter-reset:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* ─── Table wrapper ─── */
.table-wrap {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  position: relative;
  min-height: 200px;
}

.table-loading,
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 3rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

.btn-retry {
  background: none;
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-retry:hover { border-color: var(--color-accent); color: var(--color-accent); }

/* ─── Table ─── */
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th {
  padding: 10px 16px;
  text-align: left;
  font-family: var(--font-display);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  border-bottom: 1px solid var(--color-border);
  background: rgba(0, 229, 184, 0.02);
  white-space: nowrap;
}

.data-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border);
  vertical-align: top;
  color: var(--color-text);
}

.data-table tr:last-child td { border-bottom: none; }

.data-table tbody tr {
  transition: background 0.15s;
}

.data-table tbody tr:hover {
  background: rgba(0, 229, 184, 0.025);
}

/* ─── User cell ─── */
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.25);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
}

.user-username {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

.user-email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  opacity: 0.7;
  margin-top: 1px;
}

/* ─── Cell helpers ─── */
.cell-main {
  color: var(--color-text);
  white-space: nowrap;
}

.cell-sub {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 3px;
}

.text-mono { font-family: var(--font-mono); }
.text-sm   { font-size: 12px; }
.no-data   { color: var(--color-text-muted); font-size: 12px; }

/* ─── Role badge ─── */
.role-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  border-radius: 3px;
  padding: 2px 7px;
  white-space: nowrap;
}

.role-admin    { background: rgba(255, 100, 100, 0.15); color: #ff8fa3; border: 1px solid rgba(255, 100, 100, 0.25); }
.role-komite   { background: rgba(100, 100, 255, 0.15); color: #9fa8ff; border: 1px solid rgba(100, 100, 255, 0.25); }
.role-pengelola{ background: rgba(255, 200, 50, 0.12); color: #ffd470; border: 1px solid rgba(255, 200, 50, 0.2); }
.role-user     { background: rgba(100, 200, 100, 0.1); color: #7ed8a0; border: 1px solid rgba(100, 200, 100, 0.2); }

/* ─── Status chip ─── */
.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  border-radius: 100px;
  padding: 2px 8px;
  white-space: nowrap;
}

.chip-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  flex-shrink: 0;
}

.chip-green  { background: rgba(0, 229, 100, 0.1); color: #5ae08a; border: 1px solid rgba(0, 229, 100, 0.2); }
.chip-red    { background: rgba(255, 77, 109, 0.1); color: #ff8fa3; border: 1px solid rgba(255, 77, 109, 0.2); }
.chip-orange { background: rgba(255, 165, 0, 0.1);  color: #ffc46b; border: 1px solid rgba(255, 165, 0, 0.2); }
.chip-teal   { background: var(--color-accent-glow); color: var(--color-accent); border: 1px solid rgba(0, 229, 184, 0.25); }
.chip-dim    { background: rgba(90, 122, 154, 0.1); color: var(--color-text-muted); border: 1px solid var(--color-border); }

/* ─── Pagination bar ─── */
.pagination-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1rem;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.pagination-info {
  font-size: 12px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
}

.pagination-info strong {
  color: var(--color-text-dim);
  font-weight: 600;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.limit-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
}

.limit-label {
  font-size: 12px;
  color: var(--color-text-muted);
  white-space: nowrap;
}

.limit-select {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-mono);
  font-size: 12px;
  padding: 4px 8px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s;
}

.limit-select:focus { border-color: var(--color-accent); }

.page-buttons {
  display: flex;
  align-items: center;
  gap: 3px;
}

.page-btn {
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  width: 32px;
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-family: var(--font-mono);
  transition: all 0.15s;
}

.page-btn:hover:not(:disabled) {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

.page-btn.is-active {
  background: var(--color-accent-glow);
  border-color: var(--color-accent);
  color: var(--color-accent);
  font-weight: 600;
}

.page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.page-pos {
  font-size: 11px;
  color: var(--color-text-muted);
  font-family: var(--font-mono);
  margin-left: 4px;
  white-space: nowrap;
}

/* ─── Action column ─── */
.action-cell {
  white-space: nowrap;
  vertical-align: middle !important;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  font-family: var(--font-body);
  border-radius: var(--radius-sm);
  padding: 4px 9px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.action-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.action-btn .pi { font-size: 10px; }

.btn-verify {
  background: var(--color-accent-glow);
  border-color: rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
}
.btn-verify:not(:disabled):hover {
  background: rgba(0, 229, 184, 0.2);
  border-color: var(--color-accent);
}

.btn-activate {
  background: rgba(90, 224, 138, 0.08);
  border-color: rgba(90, 224, 138, 0.25);
  color: #5ae08a;
}
.btn-activate:not(:disabled):hover {
  background: rgba(90, 224, 138, 0.15);
  border-color: #5ae08a;
}

.btn-deactivate {
  background: rgba(255, 77, 109, 0.08);
  border-color: rgba(255, 77, 109, 0.2);
  color: #ff8fa3;
}
.btn-deactivate:not(:disabled):hover {
  background: rgba(255, 77, 109, 0.15);
  border-color: #ff8fa3;
}

/* ─── Dialog: loading ─── */
.detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 2.5rem 1rem;
  color: var(--color-text-muted);
  font-size: 13px;
}

/* ─── Dialog: user header ─── */
.review-user-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 0.25rem 0 1rem;
}

.review-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-accent-glow);
  border: 1px solid rgba(0, 229, 184, 0.3);
  color: var(--color-accent);
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.review-identity {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.review-name {
  font-weight: 600;
  font-size: 15px;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.review-username {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-accent);
}

.review-email {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
}

/* ─── Dialog: detail rows ─── */
.review-details {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  margin-bottom: 1rem;
}

.review-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border);
}

.review-row:last-child {
  border-bottom: none;
}

.review-row:nth-child(even) {
  background: rgba(255, 255, 255, 0.02);
}

.review-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  white-space: nowrap;
  width: 90px;
  flex-shrink: 0;
  padding-top: 2px;
}

.review-val {
  font-size: 13px;
  color: var(--color-text);
  flex: 1;
  min-width: 0;
}

.review-sub {
  display: block;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 1px;
}

/* ─── Dialog: divider ─── */
.review-divider {
  height: 1px;
  background: var(--color-border);
  margin: 0 0 1rem;
}

/* ─── Dialog: action notice ─── */
.review-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  border-radius: var(--radius-sm);
  padding: 10px 14px;
  border: 1px solid;
}

.notice-info {
  background: rgba(0, 229, 184, 0.06);
  border-color: rgba(0, 229, 184, 0.2);
  color: var(--color-accent);
}

.notice-success {
  background: rgba(90, 224, 138, 0.06);
  border-color: rgba(90, 224, 138, 0.2);
  color: #5ae08a;
}

.notice-danger {
  background: rgba(255, 77, 109, 0.06);
  border-color: rgba(255, 77, 109, 0.2);
  color: #ff8fa3;
}

.notice-icon {
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.notice-text {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-dim);
}

/* ─── Button: Reset TOTP ─── */
.btn-reset-totp {
  background: rgba(155, 100, 255, 0.08);
  border-color: rgba(155, 100, 255, 0.25);
  color: #c4a8ff;
}
.btn-reset-totp:not(:disabled):hover {
  background: rgba(155, 100, 255, 0.15);
  border-color: #c4a8ff;
}

/* ─── Dialog: Reset TOTP ─── */
:deep(.reset-totp-dialog) {
  background: var(--color-bg-card) !important;
  border: 1px solid rgba(155, 100, 255, 0.2) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.rtd-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.rtd-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(155, 100, 255, 0.12);
  border: 1px solid rgba(155, 100, 255, 0.3);
  color: #c4a8ff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.rtd-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  line-height: 1.2;
}

.rtd-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.rtd-target-name {
  font-size: 12px;
  color: var(--color-text-dim);
}

.rtd-target-username {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #c4a8ff;
}

.rtd-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.rtd-warning {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  background: rgba(255, 165, 0, 0.06);
  border: 1px solid rgba(255, 165, 0, 0.2);
  border-radius: var(--radius-sm);
  padding: 10px 14px;
}

.rtd-warn-icon {
  font-size: 13px;
  color: #ffc46b;
  flex-shrink: 0;
  margin-top: 1px;
}

.rtd-warn-text {
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
  color: var(--color-text-dim);
}

.rtd-error {
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

.rtd-field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.rtd-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
}

.rtd-pw-wrap {
  position: relative;
}

.rtd-input {
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.rtd-pw-wrap .rtd-input {
  padding-right: 36px;
}

.rtd-input:focus {
  border-color: rgba(155, 100, 255, 0.6);
  box-shadow: 0 0 0 2px rgba(155, 100, 255, 0.1);
}

.rtd-input::placeholder { color: var(--color-text-muted); }

.rtd-eye {
  position: absolute;
  right: 9px;
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
.rtd-eye:hover { color: var(--color-text); }

.rtd-totp-input {
  font-family: var(--font-mono);
  font-size: 20px;
  letter-spacing: 0.3em;
  text-align: center;
}

.rtd-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.rtd-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-border);
}

.rtd-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.rtd-btn-cancel:hover:not(:disabled) { border-color: var(--color-text-dim); color: var(--color-text); }
.rtd-btn-cancel:disabled { opacity: 0.45; cursor: not-allowed; }

.rtd-btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(155, 100, 255, 0.12);
  border: 1px solid rgba(155, 100, 255, 0.35);
  border-radius: var(--radius-sm);
  color: #c4a8ff;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.rtd-btn-confirm:hover:not(:disabled) { background: rgba(155, 100, 255, 0.2); border-color: #c4a8ff; }
.rtd-btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
.rtd-btn-confirm .pi { font-size: 11px; }

/* ─── Button: Edit ─── */
.btn-edit {
  background: rgba(255, 165, 0, 0.08);
  border-color: rgba(255, 165, 0, 0.25);
  color: #ffc46b;
}
.btn-edit:not(:disabled):hover {
  background: rgba(255, 165, 0, 0.15);
  border-color: #ffc46b;
}

/* ─── Dialog: Edit User ─── */
:deep(.edit-user-dialog) {
  background: var(--color-bg-card) !important;
  border: 1px solid rgba(255, 165, 0, 0.2) !important;
  border-radius: var(--radius-lg) !important;
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5) !important;
  overflow: hidden;
}

.eud-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 4px 0;
}

.eud-icon {
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.3);
  color: #ffc46b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
}

.eud-title {
  font-family: var(--font-display);
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
  line-height: 1.2;
}

.eud-sub {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.eud-target-name {
  font-size: 12px;
  color: var(--color-text-dim);
}

.eud-target-username {
  font-family: var(--font-mono);
  font-size: 11px;
  color: #ffc46b;
}

.eud-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.eud-error {
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

.eud-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.eud-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: var(--color-text-muted);
}

.eud-select {
  width: 100%;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.eud-select:focus {
  border-color: rgba(255, 165, 0, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 165, 0, 0.08);
}

.eud-loading-select {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-text-muted);
  padding: 8px 10px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.eud-current {
  font-size: 11px;
  color: var(--color-text-muted);
}

.eud-current strong {
  color: var(--color-text-dim);
}

.eud-roles {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 12px;
  background: var(--color-bg-input);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.eud-role-option {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
}

.eud-checkbox {
  width: 14px;
  height: 14px;
  accent-color: #ffc46b;
  cursor: pointer;
  flex-shrink: 0;
}

.eud-hint {
  font-size: 11px;
  color: var(--color-text-muted);
}

.eud-hint-warn {
  color: #ffc46b;
  display: flex;
  align-items: center;
  gap: 4px;
}

.eud-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px 16px;
  border-top: 1px solid var(--color-border);
}

.eud-btn-cancel {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid var(--color-border-hover);
  border-radius: var(--radius-sm);
  color: var(--color-text-dim);
  font-family: var(--font-body);
  font-size: 12px;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.eud-btn-cancel:hover:not(:disabled) { border-color: var(--color-text-dim); color: var(--color-text); }
.eud-btn-cancel:disabled { opacity: 0.45; cursor: not-allowed; }

.eud-btn-confirm {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 165, 0, 0.1);
  border: 1px solid rgba(255, 165, 0, 0.35);
  border-radius: var(--radius-sm);
  color: #ffc46b;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.eud-btn-confirm:hover:not(:disabled) { background: rgba(255, 165, 0, 0.18); border-color: #ffc46b; }
.eud-btn-confirm:disabled { opacity: 0.45; cursor: not-allowed; }
.eud-btn-confirm .pi { font-size: 11px; }
</style>
