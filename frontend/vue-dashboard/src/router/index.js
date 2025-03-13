import { createRouter, createWebHistory } from 'vue-router';

// Import views directly with relative paths
import DashboardView from '../views/DashboardView.vue';
import LoginView from '../views/LoginView.vue';
import ResetPasswordView from '../views/ResetPasswordView.vue';

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Public routes
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: { requiresAuth: false }
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: ResetPasswordView,
      meta: { requiresAuth: false }
    },
    
    // Protected routes
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    // Redirect /dashboard to root for backwards compatibility
    {
      path: '/dashboard',
      redirect: '/',
      meta: { requiresAuth: true }
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatView.vue'), // Lazy loaded
      meta: { requiresAuth: true }
    },
    {
      path: '/memory',
      name: 'memory',
      component: () => import('../views/MemoryView.vue'), // Lazy loaded
      meta: { requiresAuth: true }
    },
    {
      path: '/files',
      name: 'files',
      component: () => import('../views/FilesView.vue'), // Lazy loaded
      meta: { requiresAuth: true }
    },
    {
      path: '/agents',
      name: 'agents',
      component: () => import('../views/AgentsView.vue'), // Lazy loaded
      meta: { requiresAuth: true }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsView.vue'), // Lazy loaded
      meta: { requiresAuth: true }
    },
    {
      path: '/:catchAll(.*)',
      name: 'not-found',
      component: () => import('../views/NotFoundView.vue'), // Lazy loaded
      meta: { requiresAuth: false }
    }
  ]
});

// Navigation guard for auth
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = !!localStorage.getItem('authToken');
  
  if (requiresAuth && !isAuthenticated) {
    // Redirect to login if not authenticated
    next('/login');
  } else if (to.path === '/login' && isAuthenticated) {
    // Redirect to dashboard if already authenticated
    next('/');
  } else {
    // Continue navigation
    next();
  }
});

export default router;