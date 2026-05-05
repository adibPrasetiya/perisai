<template>
  <div class="settings-layout">
    <!-- Left Sidebar -->
    <aside class="settings-sidebar">
      <nav class="settings-nav">
        <div
          v-for="group in navGroups"
          :key="group.label"
          class="settings-nav-group"
        >
          <div class="settings-nav-group-label">{{ group.label }}</div>
          <RouterLink
            v-for="item in group.items"
            :key="item.name"
            :to="{ name: item.name }"
            class="settings-nav-item"
            exact-active-class="is-active"
          >
            <i :class="[item.icon, 'settings-nav-item-icon']" />
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>
    </aside>

    <!-- Right Content -->
    <div class="settings-content">
      <RouterView />
    </div>
  </div>
</template>

<script setup lang="ts">
const navGroups = [
  {
    label: "Manajemen Data",
    items: [
      {
        name: "settings-unit-kerja",
        icon: "pi pi-building",
        label: "Unit Kerja",
      },
      {
        name: "settings-asset-category",
        icon: "pi pi-tag",
        label: "Kategori Aset",
      },
      { name: "settings-framework", icon: "pi pi-sitemap", label: "Framework" },
    ],
  },
  {
    label: "Keamanan",
    items: [
      {
        name: "settings-security-password",
        icon: "pi pi-key",
        label: "Kompleksitas Password",
      },
      {
        name: "settings-security-session",
        icon: "pi pi-clock",
        label: "Token Sesi",
      },
      {
        name: "settings-security-throttling",
        icon: "pi pi-shield",
        label: "Login Throttling",
      },
    ],
  },
];
</script>

<style scoped>
.settings-layout {
  display: flex;
  gap: 3rem;
  align-items: flex-start;
}

/* ─── Sidebar ──────────────────────────────────────────────────────────────── */

.settings-sidebar {
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 80px;
}

.settings-nav {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
}

.settings-nav-group {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.settings-nav-group-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  padding: 0 0.75rem;
  margin-bottom: 4px;
}

.settings-nav-item {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  padding: 0.45rem 0.75rem;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--color-text-dim);
  text-decoration: none;
  border: 1px solid transparent;
  transition:
    background 0.15s,
    color 0.15s,
    border-color 0.15s;
}

.settings-nav-item:hover {
  background: var(--color-accent-glow);
  color: var(--color-text);
}

.settings-nav-item.is-active {
  background: var(--color-accent-glow);
  color: var(--color-accent);
  font-weight: 500;
  border-color: rgba(0, 229, 184, 0.2);
}

.settings-nav-item-icon {
  font-size: 13px;
  flex-shrink: 0;
  opacity: 0.6;
}

.settings-nav-item.is-active .settings-nav-item-icon {
  opacity: 1;
}

/* ─── Content ──────────────────────────────────────────────────────────────── */

.settings-content {
  flex: 1;
  min-width: 0;
}
</style>
