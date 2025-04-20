<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  swme: {
    type: String,
    required: true
  }
});

const { t, locale } = useI18n();

// Extract individual SwMe codes (they can be combined like "A,SL")
const swmeCodes = computed(() => {
  if (!props.swme) return [];
  return props.swme.split(',').map(code => code.trim());
});

// Get translations for each code
const translations = computed(() => {
  return swmeCodes.value.map(code => {
    const translation = t(`swmeTranslations.${code}`);
    // If no translation is found, return the code itself
    return translation === `swmeTranslations.${code}` ? code : translation;
  });
});

// Display the original SwMe code without translation
const displayText = computed(() => {
  if (!props.swme) return '';
  return `SwMe: ${props.swme}`;
});
</script>

<template>
  <span class="swme-translation">{{ displayText }}</span>
</template>

<style scoped>
.swme-translation {
  display: inline-block;
}
</style>
