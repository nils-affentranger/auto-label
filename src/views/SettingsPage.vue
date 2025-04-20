<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import ProductImport from '../components/ProductImport.vue';

const { t } = useI18n();

// Store the imported products in localStorage
const handleProductsImported = (importedProducts) => {
  localStorage.setItem('products', JSON.stringify(importedProducts));
  successMessage.value = t('settings.importSuccess', { count: importedProducts.length });

  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

// Label size settings
const labelWidth = ref(localStorage.getItem('labelWidth') || '59');
const labelHeight = ref(localStorage.getItem('labelHeight') || '40');
const successMessage = ref('');

// Predefined label sizes
const predefinedSizes = computed(() => [
  { name: `Standard (59×40mm)`, width: 59, height: 40 },
  { name: `Large (89×36mm)`, width: 89, height: 36 },
  { name: `Small (38×25mm)`, width: 38, height: 25 },
]);

// Calculate aspect ratio
const aspectRatio = computed(() => {
  const width = parseFloat(labelWidth.value);
  const height = parseFloat(labelHeight.value);
  return width / height;
});

// Save label size settings
const saveLabelSettings = () => {
  localStorage.setItem('labelWidth', labelWidth.value);
  localStorage.setItem('labelHeight', labelHeight.value);
  successMessage.value = t('settings.dimensionsSaved');

  // Clear success message after 3 seconds
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
};

// Set predefined size
const setPredefinedSize = (size) => {
  labelWidth.value = size.width.toString();
  labelHeight.value = size.height.toString();
};

// Get product count from localStorage
const productCount = computed(() => {
  const storedProducts = localStorage.getItem('products');
  if (!storedProducts) return 0;

  try {
    return JSON.parse(storedProducts).length;
  } catch (error) {
    return 0;
  }
});
</script>

<template>
  <div class="settings-page">
    <!-- Header section with title -->
    <v-container fluid class="px-4 py-2">
      <v-card elevation="2" class="header-card">
        <v-card-item>
          <template v-slot:prepend>
            <v-icon size="large" color="primary" class="mr-2">mdi-cog</v-icon>
          </template>
          <v-card-title class="text-h4 primary--text">
            {{ t('settings.title') || 'Settings' }}
          </v-card-title>
        </v-card-item>
      </v-card>
    </v-container>

    <!-- Main content -->
    <v-container fluid class="px-4 py-4">
      <v-row>
        <!-- Label Dimensions Section -->
        <v-col cols="12" md="6">
          <v-card elevation="2" class="settings-card mb-4">
            <v-card-item>
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-2">mdi-ruler</v-icon>
              </template>
              <v-card-title>{{ t('settings.labelDimensions') }}</v-card-title>
            </v-card-item>

            <v-card-text>
              <!-- Predefined Sizes -->
              <div class="mb-6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="secondary" class="mr-2">mdi-format-list-bulleted</v-icon>
                  <h4 class="text-subtitle-1 font-weight-medium mb-0">{{ t('settings.presetSizes') }}</h4>
                </div>

                <v-btn-group variant="outlined" class="size-buttons">
                  <v-btn
                    v-for="size in predefinedSizes" 
                    :key="`${size.width}x${size.height}`"
                    @click="setPredefinedSize(size)"
                    :color="labelWidth == size.width && labelHeight == size.height ? 'primary' : 'secondary'"
                    :variant="labelWidth == size.width && labelHeight == size.height ? 'flat' : 'outlined'"
                    class="size-btn"
                  >
                    {{ size.name }}
                  </v-btn>
                </v-btn-group>
              </div>

              <!-- Custom Size -->
              <div class="mb-6">
                <div class="d-flex align-center mb-2">
                  <v-icon size="small" color="secondary" class="mr-2">mdi-pencil-ruler</v-icon>
                  <h4 class="text-subtitle-1 font-weight-medium mb-0">{{ t('settings.customSize') }}</h4>
                </div>

                <v-row class="mb-4">
                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="labelWidth"
                      :label="t('settings.width')"
                      type="number"
                      min="10"
                      max="200"
                      density="compact"
                      hide-details
                      class="control-field"
                      prepend-inner-icon="mdi-arrow-expand-horizontal"
                      suffix="mm"
                    ></v-text-field>
                  </v-col>

                  <v-col cols="12" sm="6">
                    <v-text-field
                      v-model="labelHeight"
                      :label="t('settings.height')"
                      type="number"
                      min="10"
                      max="200"
                      density="compact"
                      hide-details
                      class="control-field"
                      prepend-inner-icon="mdi-arrow-expand-vertical"
                      suffix="mm"
                    ></v-text-field>
                  </v-col>
                </v-row>

                <!-- Label Preview -->
                <v-sheet class="label-preview d-flex justify-center align-center pa-4 rounded mb-4">
                  <div class="preview-box" :style="{ aspectRatio: aspectRatio }">
                    <div class="preview-content">
                      <span class="dimension-badge">{{ labelWidth }}×{{ labelHeight }}mm</span>
                    </div>
                  </div>
                </v-sheet>

                <v-btn
                  color="primary"
                  prepend-icon="mdi-content-save"
                  @click="saveLabelSettings"
                  class="save-btn"
                >
                  {{ t('settings.saveDimensions') }}
                </v-btn>
              </div>

              <v-alert
                v-if="successMessage"
                type="success"
                variant="tonal"
                class="mt-4"
                border="start"
                closable
                density="compact"
              >
                {{ successMessage }}
              </v-alert>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Product Data Section -->
        <v-col cols="12" md="6">
          <v-card elevation="2" class="settings-card">
            <v-card-item>
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-2">mdi-database</v-icon>
              </template>
              <v-card-title>{{ t('settings.productData') }}</v-card-title>
              <template v-slot:append>
                <div class="product-count d-flex align-center">
                  <v-chip
                    color="primary"
                    size="small"
                    class="font-weight-medium mr-2"
                  >
                    {{ productCount }}
                  </v-chip>
                  <span class="text-caption text-medium-emphasis">{{ t('settings.productsLoaded') }}</span>
                </div>
              </template>
            </v-card-item>

            <v-card-text>
              <ProductImport @productsImported="handleProductsImported" />
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/* Header styling */
.header-card {
  border-bottom: 3px solid var(--color-primary);
}

/* Card styling */
.settings-card {
  height: 100%;
}

/* Size buttons */
.size-buttons {
  display: flex;
  flex-wrap: wrap;
  width: 100%;
}

.size-btn {
  flex: 1;
  min-width: 120px;
}

/* Label preview */
.label-preview {
  background-color: var(--color-bg-tertiary);
}

.preview-box {
  background-color: white;
  border-radius: var(--border-radius);
  min-height: 100px;
  min-width: 120px;
  max-width: 80%;
  max-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-md);
  box-shadow: var(--box-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.preview-content {
  color: var(--color-text-primary);
  font-weight: 500;
  text-align: center;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .size-buttons {
    flex-direction: column;
  }

  .size-btn {
    width: 100%;
    margin-bottom: var(--spacing-xs);
  }
}
</style>
