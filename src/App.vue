<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t, locale } = useI18n();
const drawer = ref(true);
const rail = ref(false);
const currentYear = computed(() => new Date().getFullYear());

// Navigation items
const navItems = computed(() => [
  { title: t('navigation.scan'), icon: 'mdi-magnify', path: '/scan' },
  { title: t('navigation.label'), icon: 'mdi-tag', path: '/label' },
  { title: t('navigation.settings'), icon: 'mdi-cog', path: '/settings' }
]);

// Toggle language between English and German
const toggleLanguage = () => {
  locale.value = locale.value === 'en' ? 'de' : 'en';
  localStorage.setItem('language', locale.value);
};
</script>

<template>
  <v-app>
    <v-navigation-drawer
      v-if="$route.path !== '/print'"
      v-model="drawer"
      :rail="rail"
      permanent
      @click="rail = false"
    >
      <v-list-item
        :title="t('app.title')"
        class="py-4 sidenav-title"
        prepend-icon="mdi-label-outline"
      >
        <template v-slot:append>
          <v-btn
            variant="text"
            icon="mdi-chevron-left"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list density="compact" nav>
        <v-list-item
          v-for="item in navItems"
          :key="item.title"
          :value="item.title"
          :to="item.path"
          :prepend-icon="item.icon"
          :title="item.title"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-divider></v-divider>
          <div class="text-center text-caption mt-2">
            {{ t('app.copyright', { year: currentYear }) }}
            <div>{{ t('app.version') }}</div>
          </div>
        </div>
      </template>
    </v-navigation-drawer>

    <v-app-bar v-if="$route.path !== '/print'">
      <v-app-bar-title>
        {{ $route.meta.title?.split(' - ')[0] || t('app.smartLabelPrinter') }}
      </v-app-bar-title>

      <template v-slot:append>
        <v-btn
          icon
          @click="toggleLanguage"
          :title="locale === 'en' ? 'Switch to German' : 'Auf Englisch umschalten'"
        >
          <v-icon>{{ locale === 'en' ? 'mdi-translate' : 'mdi-translate' }}</v-icon>
          <span class="ml-1">{{ locale === 'en' ? 'DE' : 'EN' }}</span>
        </v-btn>
      </template>
    </v-app-bar>

    <v-main>
      <v-container fluid>
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
