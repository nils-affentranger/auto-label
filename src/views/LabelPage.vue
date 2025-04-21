<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SwMeTranslation from '../components/SwMeTranslation.vue';
import { generateLabelPNG } from '../utils/labelGenerator';

const router = useRouter();
const { t } = useI18n();
const selectedProduct = ref(null);
const printMode = ref(false);
const isScanning = ref(false);
const showEanInput = ref(false);
const scanEan = ref('');
const searchError = ref('');
const lastKeyTime = ref(0);
const keyBuffer = ref('');
const scanTimeout = ref(null);
const scanDetectionDelay = 50; // milliseconds between keystrokes to detect scanning
const scanResetDelay = 500; // milliseconds to reset scan if no input
const inputRef = ref(null);

// Get label size from localStorage
const labelWidth = computed(() => localStorage.getItem('labelWidth') || '59');
const labelHeight = computed(() => localStorage.getItem('labelHeight') || '40');

// Watch for changes in label dimensions and auto-size when they change
watch(labelWidth, () => {
  if (selectedProduct.value) {
    autoSizeFontsAndMargins();
  }
});

watch(labelHeight, () => {
  if (selectedProduct.value) {
    autoSizeFontsAndMargins();
  }
});

// Watch for changes in selected product and auto-size when it changes
watch(selectedProduct, (newProduct) => {
  if (newProduct) {
    autoSizeFontsAndMargins();
  }
});

// Watch for changes in showEanInput and focus the input field when it becomes true
watch(showEanInput, (newValue) => {
  if (newValue) {
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    });
  }
});

// Function to automatically determine optimal font sizes and margins based on label dimensions and content
// This algorithm:
// 1. Calculates scaling factors based on the label dimensions compared to a standard size
// 2. Adjusts font sizes based on the length of text in each element
// 3. Applies constraints to ensure readability and proper layout
// 4. Saves the calculated values to localStorage for persistence
const autoSizeFontsAndMargins = () => {
  // Reference sizes for the standard label size (59x40mm)
  const standardWidth = 59;
  const standardHeight = 40;

  // Get current label dimensions
  const currentWidth = parseFloat(labelWidth.value);
  const currentHeight = parseFloat(labelHeight.value);

  // Calculate scaling factors based on label dimensions
  // We use both width and height but give more weight to width for font sizing
  const widthRatio = currentWidth / standardWidth;
  const heightRatio = currentHeight / standardHeight;
  const areaRatio = (currentWidth * currentHeight) / (standardWidth * standardHeight);

  // Font size scaling - more influenced by width than height
  const fontSizeScaleFactor = Math.sqrt(areaRatio) * 0.8 + widthRatio * 0.2;

  // Margin scaling - more influenced by height
  const marginScaleFactor = Math.sqrt(areaRatio) * 0.6 + heightRatio * 0.4;

  // Get content lengths for each element to adjust font sizes
  let contentAdjustments = {
    articleName: 1,
    pharmacode: 1,
    barcode: 1,
    swme: 1,
    zusatz: 1,
    migel: 1
  };

  if (selectedProduct.value) {
    // Article name length adjustment
    const articleNameLength = (selectedProduct.value['Artikelname DE'] || '').length;
    if (articleNameLength > 30) {
      contentAdjustments.articleName = 0.85; // Reduce font size for very long names
    } else if (articleNameLength > 20) {
      contentAdjustments.articleName = 0.9; // Slightly reduce font size for long names
    }

    // Pharmacode length adjustment (usually fixed length, so no adjustment needed)

    // SwMe length adjustment
    const swmeLength = (selectedProduct.value.SwMe || '').length;
    if (swmeLength > 25) {
      contentAdjustments.swme = 0.85;
    } else if (swmeLength > 15) {
      contentAdjustments.swme = 0.9;
    }

    // Zusatz length adjustment (combination of ATC.1/Marke DE, Konzentration, and Inhalt)
    const zusatzBase = selectedProduct.value['ATC.1'] || selectedProduct.value['Marke DE'] || '';
    const konz = selectedProduct.value['Konzentration'] || '';
    const einheit1 = selectedProduct.value['Einheit.1'] || '';
    const inhalt = selectedProduct.value['Inhalt'] || '';
    const einheit = selectedProduct.value['Einheit'] || '';

    const zusatzLength = (zusatzBase + konz + einheit1 + inhalt + einheit).length;
    if (zusatzLength > 40) {
      contentAdjustments.zusatz = 0.8;
    } else if (zusatzLength > 25) {
      contentAdjustments.zusatz = 0.9;
    }

    // MiGeL length adjustment
    if (selectedProduct.value['MiGeL Code']) {
      const migelLength = selectedProduct.value['MiGeL Code'].length;
      if (migelLength > 15) {
        contentAdjustments.migel = 0.9;
      }
    }
  }

  // Base sizes that work well for the standard label size (59x40mm)
  const baseArticleNameFontSize = 15;
  const basePharmcodeFontSize = 12;
  const baseBarcodeFontSize = 40;
  const baseSwmeFontSize = 12;
  const baseZusatzFontSize = 10;
  const baseMigelFontSize = 8;

  const baseArticleNameMargin = 1;
  const basePharmacodeMagin = 6;
  const baseBarcodeMargin = -1;
  const baseSwmeMargin = 2;
  const baseZusatzMargin = 2;
  const baseMigelMargin = 0;

  // Helper function to constrain a value between min and max
  const constrain = (value, min, max) => Math.max(min, Math.min(max, value));

  // Calculate optimal font sizes based on label dimensions with constraints
  // We apply different min/max constraints for each element based on its importance
  // and adjust for content length
  const optimalArticleNameFontSize = constrain(
    Math.round(baseArticleNameFontSize * fontSizeScaleFactor * contentAdjustments.articleName * 10) / 10,
    6, // min font size
    1000 // max font size
  );

  const optimalPharmcodeFontSize = constrain(
    Math.round(basePharmcodeFontSize * fontSizeScaleFactor * contentAdjustments.pharmacode * 10) / 10,
    6, // min font size
    1000 // max font size
  );

  const optimalBarcodeFontSize = constrain(
    Math.round(baseBarcodeFontSize * fontSizeScaleFactor * contentAdjustments.barcode * 10) / 10,
    12, // min font size (barcodes need to be readable)
    1000 // max font size
  );

  const optimalSwmeFontSize = constrain(
    Math.round(baseSwmeFontSize * fontSizeScaleFactor * contentAdjustments.swme * 10) / 10,
    6, // min font size
    1000 // max font size
  );

  const optimalZusatzFontSize = constrain(
    Math.round(baseZusatzFontSize * fontSizeScaleFactor * contentAdjustments.zusatz * 10) / 10,
    6, // min font size
    1000 // max font size
  );

  const optimalMigelFontSize = constrain(
    Math.round(baseMigelFontSize * fontSizeScaleFactor * contentAdjustments.migel * 10) / 10,
    6, // min font size
    1000 // max font size
  );

  // Calculate optimal margins based on label dimensions with constraints
  const optimalArticleNameMargin = constrain(
    Math.round(baseArticleNameMargin * marginScaleFactor * 10) / 10,
    0.5, // min margin
    1000 // max margin
  );

  const optimalPharmacodeMagin = constrain(
    Math.round(basePharmacodeMagin * marginScaleFactor * 10) / 10,
    0.5, // min margin
    1000 // max margin
  );

  const optimalBarcodeMargin = constrain(
    Math.round(baseBarcodeMargin * marginScaleFactor * 10) / 10,
    -10, // min margin
    1000 // max margin
  );

  const optimalSwmeMargin = constrain(
    Math.round(baseSwmeMargin * marginScaleFactor * 10) / 10,
    0.5, // min margin
    1000 // max margin
  );

  const optimalZusatzMargin = constrain(
    Math.round(baseZusatzMargin * marginScaleFactor * 10) / 10,
    0.5, // min margin
    1000 // max margin
  );

  const optimalMigelMargin = constrain(
    Math.round(baseMigelMargin * marginScaleFactor * 10) / 10,
    0, // min margin (can be 0 as it's the last element)
    1000 // max margin
  );

  // Set values
  articleNameFontSize.value = optimalArticleNameFontSize.toString();
  pharmacodeFontSize.value = optimalPharmcodeFontSize.toString();
  barcodeFontSize.value = optimalBarcodeFontSize.toString();
  swmeFontSize.value = optimalSwmeFontSize.toString();
  zusatzFontSize.value = optimalZusatzFontSize.toString();
  migelFontSize.value = optimalMigelFontSize.toString();

  articleNameMargin.value = optimalArticleNameMargin.toString();
  pharmacodeMargin.value = optimalPharmacodeMagin.toString();
  barcodeMargin.value = optimalBarcodeMargin.toString();
  swmeMargin.value = optimalSwmeMargin.toString();
  zusatzMargin.value = optimalZusatzMargin.toString();
  migelMargin.value = optimalMigelMargin.toString();

  // Save all values to localStorage
  saveFontSizeAndMargin('articleName', articleNameFontSize.value, 'FontSize');
  saveFontSizeAndMargin('pharmacode', pharmacodeFontSize.value, 'FontSize');
  saveFontSizeAndMargin('barcode', barcodeFontSize.value, 'FontSize');
  saveFontSizeAndMargin('swme', swmeFontSize.value, 'FontSize');
  saveFontSizeAndMargin('zusatz', zusatzFontSize.value, 'FontSize');
  saveFontSizeAndMargin('migel', migelFontSize.value, 'FontSize');

  saveFontSizeAndMargin('articleName', articleNameMargin.value, 'Margin');
  saveFontSizeAndMargin('pharmacode', pharmacodeMargin.value, 'Margin');
  saveFontSizeAndMargin('barcode', barcodeMargin.value, 'Margin');
  saveFontSizeAndMargin('swme', swmeMargin.value, 'Margin');
  saveFontSizeAndMargin('zusatz', zusatzMargin.value, 'Margin');
  saveFontSizeAndMargin('migel', migelMargin.value, 'Margin');
};

// Font size controls (in pt)
const articleNameFontSize = ref(localStorage.getItem('articleNameFontSize') || '12');
const pharmacodeFontSize = ref(localStorage.getItem('pharmacodeFontSize') || '8');
const barcodeFontSize = ref(localStorage.getItem('barcodeFontSize') || '24');
const swmeFontSize = ref(localStorage.getItem('swmeFontSize') || '10');
const zusatzFontSize = ref(localStorage.getItem('zusatzFontSize') || '8');
const migelFontSize = ref(localStorage.getItem('migelFontSize') || '8');

// Margin controls (in mm)
const articleNameMargin = ref(localStorage.getItem('articleNameMargin') || '1');
const pharmacodeMargin = ref(localStorage.getItem('pharmacodeMargin') || '2');
const barcodeMargin = ref(localStorage.getItem('barcodeMargin') || '1');
const swmeMargin = ref(localStorage.getItem('swmeMargin') || '2');
const zusatzMargin = ref(localStorage.getItem('zusatzMargin') || '2');
const migelMargin = ref(localStorage.getItem('migelMargin') || '0');

// Save font size and margin to localStorage
const saveFontSizeAndMargin = (element, value, type) => {
  localStorage.setItem(`${element}${type}`, value);
};

// Add this function to handle outside clicks
const handleOutsideClick = (event) => {
  // Don't process click events for elements that have their own click handlers
  if (event.target.closest('.scan-indicator-chip') || event.target.closest('.v-btn')) {
    return;
  }

  if (showEanInput.value && inputRef.value && !inputRef.value.$el.contains(event.target)) {
    showEanInput.value = false;
  }
};

// Function to toggle the EAN input
const toggleEanInput = () => {
  showEanInput.value = !showEanInput.value;
  if (showEanInput.value) {
    // Focus the input field after it appears
    nextTick(() => {
      if (inputRef.value) {
        inputRef.value.focus();
      }
    });
  }
};

// Update mounted to add click event listener
onMounted(() => {
  const storedProduct = localStorage.getItem('selectedProduct');
  if (storedProduct) {
    selectedProduct.value = JSON.parse(storedProduct);
    // Auto-size fonts and margins when product is loaded
    autoSizeFontsAndMargins();
  }

  // Add keyboard event listener for barcode scanning
  window.addEventListener('keydown', handleKeyDown);
  // Add click event listener for detecting clicks outside the input
  document.addEventListener('click', handleOutsideClick);
});

// Update unmounted to remove click event listener
onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
  document.removeEventListener('click', handleOutsideClick);
  if (scanTimeout.value) {
    clearTimeout(scanTimeout.value);
  }
});

// Create a map of products by EAN for quick lookup
const products = computed(() => {
  const storedProducts = localStorage.getItem('products');
  return storedProducts ? JSON.parse(storedProducts) : [];
});

const productsByEAN = computed(() => {
  const map = new Map();
  products.value.forEach(product => {
    if (product.EAN) {
      map.set(product.EAN, product);
    }
  });
  return map;
});

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
          scanEan.value = keyBuffer.value;
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
      scanEan.value = keyBuffer.value;
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
        scanEan.value = keyBuffer.value;
        searchProduct();
        keyBuffer.value = '';
      }
      isScanning.value = false;
    }, scanResetDelay);
  }
};

// Search for a product by EAN
const searchProduct = () => {
  if (!scanEan.value) {
    searchError.value = t('scan.pleaseEnterEAN');
    return;
  }

  // Format the EAN input (ensure it's a string with leading zeros if needed)
  let formattedEAN = String(scanEan.value).trim();
  if (formattedEAN.length < 13) {
    formattedEAN = formattedEAN.padStart(13, '0');
  }

  const product = productsByEAN.value.get(formattedEAN);
  if (product) {
    // Store the selected product in localStorage and update the current view
    localStorage.setItem('selectedProduct', JSON.stringify(product));
    selectedProduct.value = product;
    scanEan.value = '';
    searchError.value = '';
    showEanInput.value = false;
    // Auto-size fonts and margins when product is loaded
    autoSizeFontsAndMargins();
  } else {
    searchError.value = t('scan.noProductFound', { ean: formattedEAN });
  }
};

// Navigate back to scan page
const backToScan = () => {
  router.push('/scan');
};

// Update the printLabel function
const printLabel = async () => {
  if (!selectedProduct.value) return;

  try {
    // Get the label preview element by ID
    const labelElement = document.getElementById('label-preview');
    if (!labelElement) {
      console.error('Label preview element not found');
      return;
    }

    await generateLabelPNG(labelElement);
  } catch (error) {
    console.error('Error generating label:', error);
  }
};

// Generate label content based on the selected product
const generateLabelContent = computed(() => {
  if (!selectedProduct.value) return '';

  const product = selectedProduct.value;

  // Generate barcode content (Code 39 format with asterisks)
  const barcode = product.Pharmacode ? `*${product.Pharmacode}*` : '';

  // Determine substance (ATC.1 or Marke DE)
  let substanz = '';
  if (product['ATC.1']) {
    substanz = product['ATC.1'];
  } else {
    substanz = product['Marke DE'] || '';
  }

  // Format additional information
  const konz = product['Konzentration'] || '';
  const einheit1 = product['Einheit.1'] || '';
  const inhalt = product['Inhalt'] || '';
  const einheit = product['Einheit'] || '';

  let zusatz = '';
  if (konz || inhalt) {
    zusatz = ` / ${konz} ${einheit1} / ${inhalt} ${einheit}`.trim();
  }

  // Add MiGeL code if available
  const migel = product['MiGeL Code'] ? `\nMiGeL-Nr: ${product['MiGeL Code']}` : '';

  // Construct the complete label content
  const labelContent = `${product['Artikelname DE'] || ''}
${product.Pharmacode || ''}
${barcode}
${product.SwMe || ''}
${substanz}${zusatz}${migel}`;

  return labelContent.trim();
});

//Handle click on scan indicator
const openEanInput = () => {
  showEanInput.value = true;
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus();
    }
  });
};
</script>

<template>
  <div :class="{ 'print-mode': printMode }">
    <!-- Header section with title and action buttons -->
    <v-container fluid class="px-4 py-2" v-if="!printMode">
      <v-card elevation="2" class="header-card">
        <v-card-item>
          <template v-slot:prepend>
            <v-icon size="large" color="primary" class="mr-2">mdi-label-outline</v-icon>
          </template>
          <v-card-title class="text-h4 primary--text d-flex align-center">
            <div class="d-flex align-center" style="flex: 2;">
              {{ t('label.title') }}
            </div>

            <div class="d-flex justify-end align-center" style="flex: 3; margin-top: -4px; margin-right: 20%; margin-left: 10%;">
              <div v-if="!showEanInput">
                <v-chip
                  :color="isScanning ? 'success' : 'info'"
                  :class="{ 'pulse-animation': isScanning, 'scan-indicator-chip': true }"
                  size="large"
                  label
                  @click.stop="openEanInput"
                  style="cursor: pointer;"
                >
                  <v-icon start :icon="isScanning ? 'mdi-barcode-scan' : 'mdi-information'"></v-icon>
                  {{ isScanning ? t('scan.scanning') : t('scan.readyToScan') }}
                </v-chip>
              </div>
              <div v-else style="position: relative; display: flex; justify-content: center; width: 100%;">
                <v-text-field
                  v-model="scanEan"
                  :label="t('scan.scanOrEnterEAN')"
                  variant="outlined"
                  prepend-inner-icon="mdi-barcode"
                  append-inner-icon="mdi-magnify"
                  @click:append-inner="searchProduct"
                  @keyup.enter="searchProduct"
                  hide-details
                  :placeholder="t('scan.example')"
                  density="compact"
                  style="width: 400px; transform: translateX(175px);"
                  bg-color="surface"
                  autofocus
                  ref="inputRef"
                  @blur="showEanInput = false"
                ></v-text-field>
              </div>
            </div>

            <div style="flex: 0.5;">
              <!-- Empty spacing -->
            </div>
          </v-card-title>

          <!-- Error alert for search errors -->
          <v-alert
            v-if="searchError"
            type="error"
            variant="tonal"
            class="mt-2"
            border="start"
            closable
            :title="t('scan.error')"
            @click:close="searchError = ''"
            density="compact"
          >
            {{ searchError }}
          </v-alert>
          <template v-slot:append>
            <div class="d-flex gap-md">
              <v-btn
                color="secondary"
                variant="tonal"
                prepend-icon="mdi-arrow-left"
                @click="backToScan"
                class="action-btn"
              >
                {{ t('label.backToScan') }}
              </v-btn>
              <v-btn
                color="primary"
                variant="elevated"
                prepend-icon="mdi-printer"
                @click="printLabel"
                :disabled="!selectedProduct"
                class="action-btn"
              >
                {{ t('label.printLabel') }}
              </v-btn>
            </div>
          </template>
        </v-card-item>
      </v-card>
    </v-container>

    <!-- No product selected state -->
    <v-container v-if="!selectedProduct" class="empty-state-container">
      <v-card class="text-center pa-6 empty-state-card" elevation="3">
        <v-icon size="64" color="secondary" class="mb-4">mdi-tag-off-outline</v-icon>
        <v-card-text class="text-h5 mb-4">
          {{ t('label.noProductSelected') }}
        </v-card-text>
        <v-card-actions class="justify-center">
          <v-btn
            color="primary"
            size="large"
            prepend-icon="mdi-magnify"
            @click="router.push('/scan')"
            class="px-6"
          >
            {{ t('label.goToScan') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-container>

    <!-- Main content when product is selected -->
    <v-container fluid v-else class="px-4">
      <v-row>
        <!-- Left column: Product info and controls -->
        <v-col v-if="!printMode" cols="12" md="5" lg="4">
          <!-- Product information card -->
          <v-card elevation="2" class="mb-4 product-info-card">
            <v-card-item>
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-2">mdi-information-outline</v-icon>
              </template>
              <v-card-title>{{ t('label.productInfo') }}</v-card-title>
            </v-card-item>
            <v-card-text>
              <v-table density="compact" class="product-info-table">
                <tbody>
                  <tr>
                    <th>{{ t('label.ean') }}</th>
                    <td>{{ selectedProduct.EAN }}</td>
                  </tr>
                  <tr>
                    <th>{{ t('label.articleName') }}</th>
                    <td>{{ selectedProduct['Artikelname DE'] || '-' }}</td>
                  </tr>
                  <tr>
                    <th>{{ t('label.pharmacode') }}</th>
                    <td>{{ selectedProduct.Pharmacode || '-' }}</td>
                  </tr>
                  <tr>
                    <th>{{ t('label.swme') }}</th>
                    <td>
                      <SwMeTranslation v-if="selectedProduct.SwMe" :swme="selectedProduct.SwMe" />
                      <span v-else>-</span>
                    </td>
                  </tr>
                </tbody>
              </v-table>
            </v-card-text>
          </v-card>

          <!-- Label controls card -->
          <v-card elevation="2" class="controls-card">
            <v-card-item>
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-2">mdi-tune</v-icon>
              </template>
              <v-card-title>{{ t('label.labelControls') }}</v-card-title>
              <template v-slot:append>
                <v-btn
                  color="primary"
                  variant="tonal"
                  prepend-icon="mdi-auto-fix"
                  @click="autoSizeFontsAndMargins"
                  :title="t('label.autoSizeAll')"
                  class="auto-size-btn"
                >
                  {{ t('label.autoSizeAll') }}
                </v-btn>
              </template>
            </v-card-item>

            <v-card-text>
              <v-expansion-panels variant="accordion" class="controls-panels">
                <!-- Article Name Controls -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-format-title</v-icon>
                      {{ t('label.articleName') }}
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="articleNameFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('articleName', articleNameFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="articleNameMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('articleName', articleNameMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Pharmacode Controls -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-numeric</v-icon>
                      {{ t('label.pharmacode') }}
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="pharmacodeFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('pharmacode', pharmacodeFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="pharmacodeMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('pharmacode', pharmacodeMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Barcode Controls -->
                <v-expansion-panel v-if="selectedProduct.Pharmacode">
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-barcode</v-icon>
                      Barcode
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="barcodeFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('barcode', barcodeFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="barcodeMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('barcode', barcodeMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- SwMe Controls -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-medical-bag</v-icon>
                      {{ t('label.swme') }}
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="swmeFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('swme', swmeFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="swmeMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('swme', swmeMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- Zusatz Controls -->
                <v-expansion-panel>
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-text-box</v-icon>
                      {{ t('label.zusatz') }}
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="zusatzFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('zusatz', zusatzFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="zusatzMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('zusatz', zusatzMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>

                <!-- MiGeL Controls -->
                <v-expansion-panel v-if="selectedProduct['MiGeL Code']">
                  <v-expansion-panel-title>
                    <div class="d-flex align-center">
                      <v-icon size="small" color="primary" class="mr-2">mdi-identifier</v-icon>
                      {{ t('label.migel') }}
                    </div>
                  </v-expansion-panel-title>
                  <v-expansion-panel-text>
                    <v-row>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="migelFontSize"
                          :label="t('label.fontSize')"
                          density="compact"
                          hide-details
                          class="control-field"
                          prepend-inner-icon="mdi-format-font-size-increase"
                          @change="saveFontSizeAndMargin('migel', migelFontSize, 'FontSize')"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="6">
                        <v-text-field
                          type="number"
                          v-model="migelMargin"
                          :label="t('label.margin')"
                          density="compact"
                          hide-details
                          step="0.5"
                          class="control-field"
                          prepend-inner-icon="mdi-arrow-expand-vertical"
                          @change="saveFontSizeAndMargin('migel', migelMargin, 'Margin')"
                        ></v-text-field>
                      </v-col>
                    </v-row>
                  </v-expansion-panel-text>
                </v-expansion-panel>
              </v-expansion-panels>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column: Label preview -->
        <v-col cols="12" :md="printMode ? 12 : 7" :lg="printMode ? 12 : 8">
          <v-card elevation="3" class="preview-card">
            <v-card-item v-if="!printMode">
              <template v-slot:prepend>
                <v-icon color="primary" class="mr-2">mdi-eye</v-icon>
              </template>
              <v-card-title>
                {{ t('label.labelPreview') }}
                <span class="text-subtitle-1 ml-2 dimension-badge">{{ labelWidth }} × {{ labelHeight }} mm</span>
              </v-card-title>
            </v-card-item>
            <v-card-text class="d-flex justify-center preview-container">
              <div id="label-preview" class="label-content" :style="{
                width: `${labelWidth * 5}px`,
                height: `${labelHeight * 5}px`,
                fontSize: `${Math.round(16 * (labelWidth / 59))}px`
              }">
                <div class="article-name" :style="{ 
                  fontSize: `${articleNameFontSize}pt`, 
                  marginBottom: `${articleNameMargin}mm` 
                }">{{ selectedProduct['Artikelname DE'] || '' }}</div>

                <div class="pharmacode" :style="{ 
                  fontSize: `${pharmacodeFontSize}pt`, 
                  marginBottom: `${pharmacodeMargin}mm` 
                }">{{ selectedProduct.Pharmacode || '' }}</div>

                <div class="barcode" v-if="selectedProduct.Pharmacode" :style="{ 
                  fontSize: `${barcodeFontSize}pt`, 
                  marginBottom: `${barcodeMargin}mm` 
                }">*{{ selectedProduct.Pharmacode }}*</div>

                <div class="swme" :style="{ 
                  fontSize: `${swmeFontSize}pt`, 
                  marginBottom: `${swmeMargin}mm` 
                }">
                  <SwMeTranslation v-if="selectedProduct.SwMe" :swme="selectedProduct.SwMe" />
                </div>

                <div class="zusatz" :style="{ 
                  fontSize: `${zusatzFontSize}pt`, 
                  marginBottom: `${zusatzMargin}mm` 
                }">
                  {{ selectedProduct['ATC.1'] || selectedProduct['Marke DE'] || '' }}
                  {{ (selectedProduct['Konzentration'] || selectedProduct['Inhalt']) ? 
                     '/ ' + (selectedProduct['Konzentration'] || '') + ' ' + (selectedProduct['Einheit.1'] || '') + 
                     ' / ' + (selectedProduct['Inhalt'] || '') + ' ' + (selectedProduct['Einheit'] || '') : '' }}
                </div>

                <div class="migel" v-if="selectedProduct['MiGeL Code']" :style="{ 
                  fontSize: `${migelFontSize}pt`, 
                  marginBottom: `${migelMargin}mm` 
                }">
                  {{ t('label.migelNr', { code: selectedProduct['MiGeL Code'] }) }}
                </div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
/* Layout and component styling */
.header-card {
  border-bottom: 3px solid var(--color-primary);
}

.empty-state-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
  padding: var(--spacing-xl);
}

.empty-state-card {
  max-width: 500px;
  background-color: var(--color-bg-secondary);
  border: 1px solid #e0eef7;
}

.dimension-badge {
  background-color: rgba(0, 120, 182, 0.1);
  color: var(--color-primary);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 500;
}

/* Label content styles - these are needed for the actual label */
.label-content {
  margin: 1rem auto;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #d1e6f0;
  border-radius: var(--border-radius);
  overflow: visible;
  box-shadow: var(--box-shadow);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.article-name {
  font-weight: bold;
  margin-bottom: 0.1em;
  color: #000;
  line-height: 1.1;
  overflow-wrap: break-word;
}

.pharmacode {
  margin-bottom: 0.2em;
  color: #000;
  line-height: 1.1;
}

.barcode {
  font-family: 'LibreBarcode39', monospace;
  margin-bottom: 0.1em;
  line-height: 1;
  color: #000;
}

.swme {
  margin-bottom: 0.2em;
  color: #000;
  line-height: 1.1;
  overflow-wrap: break-word;
}

.zusatz {
  margin-bottom: 0.2em;
  color: #000;
  line-height: 1.1;
  overflow-wrap: break-word;
}

.migel {
  color: #000;
  line-height: 1.1;
  overflow-wrap: break-word;
}

/* Print mode styles */
.print-mode {
  padding: 0;
  background-color: white;
}

@media print {
  body {
    margin: 0;
    padding: 0;
    background-color: white;
  }
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
