import { createRouter, createWebHistory } from 'vue-router';
import SettingsPage from '../views/SettingsPage.vue';
import ScanPage from '../views/ScanPage.vue';
import LabelPage from '../views/LabelPage.vue';
import PrintLabelPage from '../views/PrintLabelPage.vue';

const routes = [
  {
    path: '/',
    redirect: '/scan'
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    meta: { title: 'Settings - Smart Label Printer' }
  },
  {
    path: '/scan',
    name: 'Scan',
    component: ScanPage,
    meta: { title: 'Scan - Smart Label Printer' }
  },
  {
    path: '/label',
    name: 'Label',
    component: LabelPage,
    meta: { title: 'Label - Smart Label Printer' }
  },
  {
    path: '/print',
    name: 'PrintLabel',
    component: PrintLabelPage,
    meta: { title: 'Print Label' }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Update page title based on route meta
router.afterEach((to) => {
  document.title = to.meta.title || 'Smart Label Printer';
});

export default router;
