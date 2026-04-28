<template>
  <div class="dashboard-welcome">
    <div class="status-badge">
      <span class="status-dot"></span>
      Sesi Aktif
    </div>
    <h1>Selamat Datang, {{ displayName }}</h1>
    <p class="text-dim">
      Anda masuk sebagai
      <span style="color: var(--color-accent); font-family: var(--font-mono);">{{ auth.user?.username }}</span>
    </p>
  </div>

  <div class="menu-sections">
    <div v-for="section in menuSections" :key="section.role" class="menu-section">
      <div class="section-label">{{ section.label }}</div>
      <div class="menu-grid">
        <div
          v-for="item in section.items"
          :key="item.label"
          class="menu-card"
          :class="{
            'is-clickable': hasRole(section.role) && !!item.to,
            'is-disabled': !hasRole(section.role) || !item.to,
          }"
          @click="hasRole(section.role) && item.to ? router.push(item.to) : undefined"
        >
          <i :class="item.icon" class="menu-icon" />
          <div class="menu-label">{{ item.label }}</div>
          <div class="menu-desc">{{ item.desc }}</div>
          <div v-if="!hasRole(section.role)" class="menu-lock">
            <i class="pi pi-lock" /> Hanya {{ section.label }}
          </div>
          <div v-else-if="!item.to" class="menu-lock">
            <i class="pi pi-clock" /> Segera hadir
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const displayName = computed(() => auth.user?.name || auth.user?.username || 'Pengguna')

function hasRole(role: string): boolean {
  if (auth.user?.roles?.includes('ADMINISTRATOR')) return true
  return auth.user?.roles?.includes(role) ?? false
}

const menuSections = [
  {
    role: 'KOMITE_PUSAT',
    label: 'Komite Pusat',
    items: [
      {
        icon: 'pi pi-gauge',
        label: 'Dashboard Monitoring',
        desc: 'Pantau dan monitoring daftar risiko keamanan di seluruh unit kerja secara terpusat.',
        to: '/dashboard',
      },
      {
        icon: 'pi pi-list-check',
        label: 'Framework Risiko',
        desc: 'Kelola framework standar analisis risiko yang digunakan dalam program kerja.',
        to: '/frameworks',
      },
      {
        icon: 'pi pi-briefcase',
        label: 'Program Kerja Risiko',
        desc: 'Susun program kerja, tetapkan framework, dan konfigurasikan konteks penilaian risiko.',
        to: '/risk-programs',
      },
      {
        icon: 'pi pi-chart-bar',
        label: 'Laporan',
        desc: 'Laporan dan analitik risiko terkini lintas unit kerja.',
        to: null,
      },
    ],
  },
  {
    role: 'PENGELOLA_RISIKO_UKER',
    label: 'Pengelola Risiko Unit Kerja',
    items: [
      {
        icon: 'pi pi-server',
        label: 'Aset',
        desc: 'Kelola dan pantau aset organisasi per unit kerja.',
        to: '/assets',
      },
      {
        icon: 'pi pi-sitemap',
        label: 'Proses Bisnis',
        desc: 'Kelola dan pantau proses bisnis organisasi per unit kerja.',
        to: '/proses-bisnis',
      },
      {
        icon: 'pi pi-file-edit',
        label: 'Kertas Kerja',
        desc: 'Buat dan kelola kertas kerja manajemen risiko berdasarkan program kerja aktif.',
        to: '/working-papers',
      },
    ],
  },
  {
    role: 'ADMINISTRATOR',
    label: 'Administrator',
    items: [
      {
        icon: 'pi pi-users',
        label: 'Pengguna',
        desc: 'Kelola akun dan hak akses pengguna.',
        to: '/admin/users',
      },
      {
        icon: 'pi pi-cog',
        label: 'Pengaturan',
        desc: 'Konfigurasi sistem dan preferensi.',
        to: '/admin/settings',
      },
    ],
  },
]
</script>

<style scoped>
.menu-sections {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.menu-section {}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
  margin-bottom: 0.75rem;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 1rem;
}

.menu-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  position: relative;
}

.menu-card.is-clickable {
  cursor: pointer;
}

.menu-card.is-clickable:hover {
  border-color: var(--color-accent);
  box-shadow: var(--shadow-accent);
}

.menu-card.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.menu-icon {
  font-size: 1.5rem;
  color: var(--color-accent);
}

.menu-label {
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.menu-desc {
  font-size: 13px;
  color: var(--color-text-dim);
}

.menu-lock {
  font-size: 11px;
  color: var(--color-text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 4px;
}
</style>
