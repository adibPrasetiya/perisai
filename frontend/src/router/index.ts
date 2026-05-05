import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

declare module "vue-router" {
  interface RouteMeta {
    requiresAuth?: boolean;
    requiresTotpToken?: boolean;
    requiresAdmin?: boolean;
    allowedRoles?: string[];
    breadcrumb?: string;
    showBack?: boolean;
    backTo?: string;
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      component: () => import("@/layouts/DashboardLayout.vue"),
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/HomeView.vue"),
        },
        {
          path: "profile",
          name: "profile",
          component: () => import("@/views/ProfileView.vue"),
          meta: { breadcrumb: "Profil Saya", showBack: true, backTo: "home" },
        },
        {
          path: "admin/users",
          name: "admin-users",
          component: () => import("@/views/admin/UsersView.vue"),
          meta: {
            requiresAdmin: true,
            breadcrumb: "Manajemen Pengguna",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "assets",
          name: "assets",
          component: () => import("@/views/AssetsView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "PENGELOLA_RISIKO_UKER"],
            breadcrumb: "Manajemen Aset",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "kegiatan",
          name: "kegiatan",
          component: () => import("@/views/KegiatanView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "PENGELOLA_RISIKO_UKER"],
            breadcrumb: "Manajemen Kegiatan",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "frameworks",
          name: "frameworks",
          component: () => import("@/views/FrameworksView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Framework Risiko",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "frameworks/:frameworkId/contexts",
          name: "framework-contexts",
          component: () => import("@/views/FrameworkContextsView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Konteks Framework",
            showBack: true,
            backTo: "frameworks",
          },
        },
        {
          path: "frameworks/:frameworkId/contexts/create",
          name: "framework-context-create",
          component: () => import("@/views/RiskContextCreateView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Tambah Konteks Template",
            showBack: true,
            backTo: "framework-contexts",
          },
        },
        {
          path: "risk-programs",
          name: "risk-programs",
          component: () => import("@/views/RiskProgramView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Program Risiko",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "risk-programs/:id",
          name: "risk-program-detail",
          component: () => import("@/views/RiskProgramDetailView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Detail Program Risiko",
            showBack: true,
            backTo: "risk-programs",
          },
        },
        {
          path: "risk-programs/:id/frameworks/:frameworkId",
          name: "risk-context-list",
          component: () => import("@/views/RiskContextListView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Konteks Risiko",
            showBack: true,
            backTo: "risk-program-detail",
          },
        },
        {
          path: "contexts/:contextId",
          name: "risk-context-detail",
          component: () => import("@/views/RiskContextDetailView.vue"),
          meta: {
            allowedRoles: [
              "ADMINISTRATOR",
              "KOMITE_PUSAT",
              "PENGELOLA_RISIKO_UKER",
            ],
            breadcrumb: "Detail Konteks Risiko",
            showBack: true,
          },
        },
        {
          path: "working-papers",
          name: "working-papers",
          component: () => import("@/views/WorkingPaperView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "PENGELOLA_RISIKO_UKER"],
            breadcrumb: "Kertas Kerja",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "working-papers/:id",
          name: "working-paper-detail",
          component: () => import("@/views/WorkingPaperDetailView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "PENGELOLA_RISIKO_UKER"],
            breadcrumb: "Detail Kertas Kerja",
            showBack: true,
            backTo: "working-papers",
            fullWidth: true,
          },
        },
        {
          path: "working-papers/:id/entries/create",
          name: "risk-entry-create",
          component: () => import("@/views/RiskEntryCreateView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "PENGELOLA_RISIKO_UKER"],
            breadcrumb: "Input Entri Risiko",
            showBack: true,
            backTo: "working-paper-detail",
          },
        },
        {
          path: "dashboard",
          name: "dashboard",
          component: () => import("@/views/DashboardView.vue"),
          meta: {
            allowedRoles: ["ADMINISTRATOR", "KOMITE_PUSAT"],
            breadcrumb: "Dashboard Monitoring Risiko",
            showBack: true,
            backTo: "home",
          },
        },
        {
          path: "admin/settings",
          component: () => import("@/layouts/SettingsLayout.vue"),
          meta: {
            requiresAdmin: true,
            breadcrumb: "Pengaturan",
            showBack: true,
            backTo: "home",
          },
          children: [
            {
              path: "",
              redirect: { name: "settings-unit-kerja" },
            },
            {
              path: "unit-kerja",
              name: "settings-unit-kerja",
              component: () =>
                import("@/views/admin/settings/UnitKerjaView.vue"),
            },
            {
              path: "asset-category",
              name: "settings-asset-category",
              component: () =>
                import("@/views/admin/settings/AssetCategoryView.vue"),
            },
            {
              path: "framework",
              name: "settings-framework",
              component: () =>
                import("@/views/admin/settings/FrameworkView.vue"),
            },
            {
              path: "security/password",
              name: "settings-security-password",
              component: () =>
                import("@/views/admin/settings/SystemConfigView.vue"),
              props: { group: "PASSWORD_POLICY" },
            },
            {
              path: "security/session",
              name: "settings-security-session",
              component: () =>
                import("@/views/admin/settings/SystemConfigView.vue"),
              props: { group: "SESSION" },
            },
            {
              path: "security/login-throttling",
              name: "settings-security-throttling",
              component: () =>
                import("@/views/admin/settings/SystemConfigView.vue"),
              props: { group: "SECURITY" },
            },
          ],
        },
      ],
    },
    {
      path: "/auth/login",
      name: "login",
      component: () => import("@/views/auth/LoginView.vue"),
    },
    {
      path: "/auth/register",
      name: "register",
      component: () => import("@/views/auth/RegisterView.vue"),
    },
    {
      path: "/auth/forgot-password",
      name: "forgot-password",
      component: () => import("@/views/auth/ForgotPasswordView.vue"),
    },
    {
      path: "/auth/totp/setup",
      name: "totp-setup",
      component: () => import("@/views/auth/TotpSetupView.vue"),
      meta: { requiresTotpToken: true },
    },
    {
      path: "/auth/totp/verify",
      name: "totp-verify",
      component: () => import("@/views/auth/TotpVerifyView.vue"),
      meta: { requiresTotpToken: true },
    },
  ],
});

router.beforeEach((to) => {
  const auth = useAuthStore();

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login" };
  }

  if (to.meta.requiresTotpToken && !auth.totpToken) {
    return { name: "login" };
  }

  if (to.meta.requiresAdmin && !auth.isAdmin) {
    return { name: "home" };
  }

  if (to.name === "dashboard" && !auth.canViewDashboard) {
    return { name: "home" };
  }

  if (to.meta.allowedRoles?.length) {
    const roles = auth.user?.roles ?? [];
    const canAccess = to.meta.allowedRoles.some((role) => roles.includes(role));
    if (!canAccess) return { name: "home" };
  }

  // Redirect authenticated user away from login page
  if (to.name === "login" && auth.isAuthenticated) {
    return { name: "home" };
  }
});

export default router;
