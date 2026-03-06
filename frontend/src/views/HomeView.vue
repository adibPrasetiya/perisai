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

  <div class="menu-grid">
    <div
      v-for="item in menuItems"
      :key="item.label"
      class="menu-card"
      :class="{ 'is-clickable': !!item.to, 'is-disabled': item.adminOnly && !auth.isAdmin }"
      @click="item.to && !item.adminOnly || (item.adminOnly && auth.isAdmin) ? router.push(item.to!) : undefined"
    >
      <i :class="item.icon" class="menu-icon" />
      <div class="menu-label">{{ item.label }}</div>
      <div class="menu-desc">{{ item.desc }}</div>
      <div v-if="item.adminOnly && !auth.isAdmin" class="menu-lock">
        <i class="pi pi-lock" /> Hanya Administrator
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

const menuItems = [
  {
    icon: 'pi pi-shield',
    label: 'Manajemen Risiko',
    desc: 'Identifikasi dan pantau risiko organisasi.',
    to: '/risk-programs',
    adminOnly: false,
  },
  {
    icon: 'pi pi-server',
    label: 'Aset',
    desc: 'Kelola dan pantau aset organisasi per unit kerja.',
    to: '/assets',
    adminOnly: false,
  },
  {
    icon: 'pi pi-sitemap',
    label: 'Proses Bisnis',
    desc: 'Kelola dan pantau proses bisnis organisasi per unit kerja.',
    to: '/proses-bisnis',
    adminOnly: false,
  },
  {
    icon: 'pi pi-chart-bar',
    label: 'Laporan',
    desc: 'Laporan dan analitik risiko terkini.',
    to: null,
    adminOnly: false,
  },
  {
    icon: 'pi pi-users',
    label: 'Pengguna',
    desc: 'Kelola akun dan hak akses pengguna.',
    to: '/admin/users',
    adminOnly: true,
  },
  {
    icon: 'pi pi-cog',
    label: 'Pengaturan',
    desc: 'Konfigurasi sistem dan preferensi.',
    to: '/admin/settings',
    adminOnly: true,
  },
]
</script>

<style scoped>
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
