<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';

const router = useRouter();
const { t } = useI18n();
const searchEAN = ref('');
const searchError = ref('');
const lastKeyTime = ref(0);
const keyBuffer = ref('');
const isScanning = ref(false);
const scanTimeout = ref(null);
// No manual mode toggle needed as we detect based on event target
const scanDetectionDelay = 50; // milliseconds between keystrokes to detect scanning
const scanResetDelay = 500; // milliseconds to reset scan if no input

// Get products from localStorage
const products = computed(() => {
  const storedProducts = localStorage.getItem('products');
  return storedProducts ? JSON.parse(storedProducts) : [];
});

// Create a map of products by EAN for quick lookup
const productsByEAN = computed(() => {
  const map = new Map();
  products.value.forEach(product => {
    if (product.EAN) {
      map.set(product.EAN, product);
    }
  });
  return map;
});

// No toggle function needed as we always use manual mode for the input field

// Handle keyboard input for barcode scanning
const handleKeyDown = (event) => {
  // Only process numeric keys and Enter
  if (!/^\d$/.test(event.key) && event.key !== 'Enter') {
    return;
  }

  const currentTime = Date.now();

  // Check if the event target is the input field
  const isInputField = event.target.tagName === 'INPUT';

  // If the event is from the input field, use manual mode (don't auto-detect)
  // If the event is from elsewhere, use automatic detection
  if (!isInputField) {
    // If this is a fast keystroke (likely from a scanner)
    if (currentTime - lastKeyTime.value < scanDetectionDelay) {
      isScanning.value = true;

      // Clear any existing timeout
      if (scanTimeout.value) {
        clearTimeout(scanTimeout.value);
      }

      // Set a new timeout to reset scanning state
      scanTimeout.value = setTimeout(() => {
        if (keyBuffer.value.length > 0) {
          searchEAN.value = keyBuffer.value;
          searchProduct();
          keyBuffer.value = '';
        }
        isScanning.value = false;
      }, scanResetDelay);
    }
  }

  // If Enter is pressed, process the current buffer
  if (event.key === 'Enter') {
    if (keyBuffer.value.length > 0) {
      searchEAN.value = keyBuffer.value;
      searchProduct();
      keyBuffer.value = '';
      isScanning.value = false;
      if (scanTimeout.value) {
        clearTimeout(scanTimeout.value);
        scanTimeout.value = null;
      }
    }
    return;
  }

  // Add the key to the buffer
  keyBuffer.value += event.key;
  lastKeyTime.value = currentTime;

  // If this is the first keystroke in a while and not from the input field, start a new scan
  if (!isScanning.value && !isInputField) {
    isScanning.value = true;
    keyBuffer.value = event.key;

    // Set a timeout to reset scanning state
    scanTimeout.value = setTimeout(() => {
      if (keyBuffer.value.length > 0) {
        searchEAN.value = keyBuffer.value;
        searchProduct();
        keyBuffer.value = '';
      }
      isScanning.value = false;
    }, scanResetDelay);
  }
};

// Search for a product by EAN
const searchProduct = () => {
  if (!searchEAN.value) {
    searchError.value = t('scan.pleaseEnterEAN');
    return;
  }

  // Format the EAN input (ensure it's a string with leading zeros if needed)
  let formattedEAN = String(searchEAN.value).trim();
  if (formattedEAN.length < 13) {
    formattedEAN = formattedEAN.padStart(13, '0');
  }

  const product = productsByEAN.value.get(formattedEAN);
  if (product) {
    // Store the selected product in localStorage and navigate to the label page
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    router.push('/label');
  } else {
    searchError.value = t('scan.noProductFound', { ean: formattedEAN });
  }
};

// Clear the current search
const clearSearch = () => {
  searchEAN.value = '';
  searchError.value = '';
  keyBuffer.value = '';
};

// Set up and clean up event listeners
onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  if (scanTimeout.value) {
    clearTimeout(scanTimeout.value);
  }
});
</script>

<template>
  <!-- Header section with title -->
  <v-container fluid class="px-4 py-2">
    <v-card elevation="2" class="header-card">
      <v-card-item>
        <template v-slot:prepend>
          <v-icon size="large" color="primary" class="mr-2">mdi-barcode-scan</v-icon>
        </template>
        <v-card-title class="text-h4 primary--text d-flex align-center">
          <div class="d-flex align-center" style="flex: 2;">
            {{ t('scan.title') }}
          </div>

          <div class="d-flex justify-end align-center" style="flex: 3; margin-top: -4px; margin-right: 20%; margin-left: 10%;">
            <v-chip
              :color="isScanning ? 'success' : 'info'"
              :class="{ 'pulse-animation': isScanning }"
              size="large"
              label
            >
              <v-icon start :icon="isScanning ? 'mdi-barcode-scan' : 'mdi-information'"></v-icon>
              {{ isScanning ? t('scan.scanning') : t('scan.readyToScan') }}
            </v-chip>
          </div>

          <div style="flex: 0.5;">
            <!-- Empty spacing -->
          </div>
        </v-card-title>
      </v-card-item>
    </v-card>
  </v-container>

  <v-container fluid class="fill-height">
    <!-- No products state -->
    <v-row v-if="products.length === 0" class="fill-height align-center justify-center">
      <v-col cols="12" sm="8" md="6" lg="4">
        <v-card class="text-center pa-6" elevation="3">
          <v-card-item>
            <v-icon icon="mdi-clipboard-text-outline" size="x-large" class="mb-4" color="primary"></v-icon>
            <v-card-title class="text-h5">{{ t('scan.noProductData') }}</v-card-title>
            <v-card-text>
              {{ t('scan.importProductData') }}
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn
                color="primary"
                prepend-icon="mdi-cog"
                @click="router.push('/settings')"
                size="large"
              >
                {{ t('scan.goToSettings') }}
              </v-btn>
            </v-card-actions>
          </v-card-item>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main scanning interface -->
    <v-row v-else>

      <v-col cols="12" md="7" lg="8">
        <v-card height="100%" elevation="2">
          <v-card-text class="pa-6">
            <v-sheet class="mb-6 pa-4 rounded-lg" color="primary" variant="tonal">
              <div class="d-flex align-center">
                <v-avatar
                  :color="isScanning ? 'success' : 'primary'"
                  class="me-3"
                  :class="{ 'pulse-animation': isScanning }"
                  size="large"
                >
                  <v-icon :icon="isScanning ? 'mdi-barcode-scan' : 'mdi-qrcode-scan'" size="large"></v-icon>
                </v-avatar>
                <div>
                  <div class="text-h6">{{ isScanning ? t('scan.scanningInProgress') : t('scan.readyToScan') }}</div>
                  <div class="text-body-2">{{ isScanning ? t('scan.processingBarcode') : t('scan.aimScanner') }}</div>
                </div>
              </div>
            </v-sheet>

            <v-text-field
              v-model="searchEAN"
              :label="t('scan.scanOrEnterEAN')"
              variant="outlined"
              prepend-inner-icon="mdi-barcode"
              append-inner-icon="mdi-magnify"
              @click:append-inner="searchProduct"
              @keyup.enter="searchProduct"
              hide-details
              class="mb-6"
              :disabled="isScanning"
              :loading="isScanning"
              bg-color="surface"
              :placeholder="t('scan.example')"
              density="comfortable"
              autofocus
            ></v-text-field>

            <div class="d-flex gap-3">
              <v-btn
                color="primary"
                class="flex-grow-1"
                @click="searchProduct"
                prepend-icon="mdi-magnify"
                size="large"
                :disabled="isScanning"
                :loading="isScanning"
                variant="elevated"
              >
                {{ t('scan.search') }}
              </v-btn>
              <v-btn
                color="secondary"
                variant="outlined"
                class="flex-grow-0 ms-3"
                @click="clearSearch"
                prepend-icon="mdi-close"
                size="large"
                :disabled="isScanning"
              >
                {{ t('scan.clear') }}
              </v-btn>
            </div>

            <v-alert
              v-if="searchError"
              type="error"
              variant="tonal"
              class="mt-6"
              border="start"
              closable
              :title="t('scan.error')"
            >
              {{ searchError }}
            </v-alert>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="5" lg="4">
        <v-card height="100%" elevation="2">
          <v-card-title class="d-flex align-center">
            <v-icon icon="mdi-information-outline" class="me-2" color="info"></v-icon>
            {{ t('scan.howToScan') }}
          </v-card-title>

          <v-card-text>
            <v-timeline align="start" density="comfortable">
              <v-timeline-item
                dot-color="primary"
                size="small"
                fill-dot
              >
                <template v-slot:opposite></template>
                <div class="d-flex align-start">
                  <v-avatar color="primary" class="me-3" size="36">
                    <v-icon icon="mdi-numeric-1-circle-outline"></v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ t('scan.positionScanner') }}</div>
                    <div class="text-body-2">{{ t('scan.holdScanner') }}</div>
                  </div>
                </div>
              </v-timeline-item>

              <v-timeline-item
                dot-color="primary"
                size="small"
                fill-dot
              >
                <template v-slot:opposite></template>
                <div class="d-flex align-start">
                  <v-avatar color="primary" class="me-3" size="36">
                    <v-icon icon="mdi-numeric-2-circle-outline"></v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ t('scan.scanBarcode') }}</div>
                    <div class="text-body-2">{{ t('scan.systemDetect') }}</div>
                  </div>
                </div>
              </v-timeline-item>

              <v-timeline-item
                dot-color="primary"
                size="small"
                fill-dot
              >
                <template v-slot:opposite></template>
                <div class="d-flex align-start">
                  <v-avatar color="primary" class="me-3" size="36">
                    <v-icon icon="mdi-numeric-3-circle-outline"></v-icon>
                  </v-avatar>
                  <div>
                    <div class="text-subtitle-1 font-weight-bold">{{ t('scan.viewResults') }}</div>
                    <div class="text-body-2">{{ t('scan.productDetails') }}</div>
                  </div>
                </div>
              </v-timeline-item>
            </v-timeline>

            <v-divider class="my-4"></v-divider>

            <v-expansion-panels variant="accordion">
              <v-expansion-panel :title="t('scan.manualEntry')" color="secondary">
                <template v-slot:text>
                  <div class="pa-2">
                    <p>{{ t('scan.ifDamaged') }}</p>
                    <ol>
                      <li>{{ t('scan.typeEAN') }}</li>
                      <li>{{ t('scan.pressEnter') }}</li>
                    </ol>
                  </div>
                </template>
              </v-expansion-panel>

              <v-expansion-panel :title="t('scan.troubleshooting')" color="secondary">
                <template v-slot:text>
                  <div class="pa-2">
                    <p>{{ t('scan.havingTrouble') }}</p>
                    <ul>
                      <li>{{ t('scan.ensureClean') }}</li>
                      <li>{{ t('scan.tryDifferent') }}</li>
                      <li>{{ t('scan.checkScanner') }}</li>
                      <li>{{ t('scan.ensureEAN') }}</li>
                    </ul>
                  </div>
                </template>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/* Header styling */
.header-card {
  border-bottom: 3px solid var(--color-primary);
}

/* Animation for the scanning indicator */
@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 1;
  }
  70% {
    transform: scale(1.2);
    opacity: 0;
  }
  100% {
    transform: scale(0.95);
    opacity: 0;
  }
}

.pulse-animation {
  animation: pulse 1.5s infinite;
}
</style>
