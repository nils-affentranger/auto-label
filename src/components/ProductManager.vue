<script setup>
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import SwMeTranslation from './SwMeTranslation.vue';

const props = defineProps({
  products: {
    type: Array,
    default: () => []
  }
});

const { t } = useI18n();

const searchEAN = ref('');
const selectedProduct = ref(null);
const searchError = ref('');

// Get label size from localStorage
const labelWidth = computed(() => localStorage.getItem('labelWidth') || '59');
const labelHeight = computed(() => localStorage.getItem('labelHeight') || '40');

// Create a map of products by EAN for quick lookup
const productsByEAN = computed(() => {
  const map = new Map();
  props.products.forEach(product => {
    if (product.EAN) {
      map.set(product.EAN, product);
    }
  });
  return map;
});

/**
 * Search for a product by EAN
 */
const searchProduct = () => {
  if (!searchEAN.value) {
    searchError.value = t('scan.pleaseEnterEAN');
    selectedProduct.value = null;
    return;
  }

  // Format the EAN input (ensure it's a string with leading zeros if needed)
  let formattedEAN = String(searchEAN.value).trim();
  if (formattedEAN.length < 13) {
    formattedEAN = formattedEAN.padStart(13, '0');
  }

  const product = productsByEAN.value.get(formattedEAN);
  if (product) {
    selectedProduct.value = product;
    searchError.value = '';
  } else {
    selectedProduct.value = null;
    searchError.value = t('scan.noProductFound', { ean: formattedEAN });
  }
};

/**
 * Generate label content based on the selected product
 * Implementation based on the provided pseudocode
 */
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

/**
 * Clear the current search and selected product
 */
const clearSearch = () => {
  searchEAN.value = '';
  selectedProduct.value = null;
  searchError.value = '';
};
</script>

<template>
  <v-container>
    <v-alert
      v-if="products.length === 0"
      type="info"
      variant="tonal"
      icon="mdi-information"
      class="text-center"
    >
      {{ t('scan.noProductData') }}
    </v-alert>

    <v-card v-else>
      <v-card-title class="text-h5">{{ t('scan.title') }}</v-card-title>
      <v-card-text>
        <v-row>
          <v-col cols="12">
            <v-text-field
              v-model="searchEAN"
              :label="t('scan.scanOrEnterEAN')"
              variant="outlined"
              prepend-inner-icon="mdi-barcode"
              @keyup.enter="searchProduct"
              hide-details
              class="mb-4"
            ></v-text-field>
          </v-col>
        </v-row>

        <v-row>
          <v-col cols="6">
            <v-btn
              color="success"
              block
              @click="searchProduct"
              prepend-icon="mdi-magnify"
            >
              {{ t('scan.search') }}
            </v-btn>
          </v-col>
          <v-col cols="6">
            <v-btn
              color="error"
              variant="outlined"
              block
              @click="clearSearch"
              prepend-icon="mdi-close"
            >
              {{ t('scan.clear') }}
            </v-btn>
          </v-col>
        </v-row>

        <v-alert
          v-if="searchError"
          type="error"
          variant="tonal"
          class="mt-4"
          density="compact"
        >
          {{ searchError }}
        </v-alert>
      </v-card-text>
    </v-card>

    <v-card v-if="selectedProduct" class="mt-4">
      <v-card-title class="text-h5">{{ t('label.productInfo') }}</v-card-title>
      <v-card-text>
        <v-table density="compact">
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

    <v-card v-if="selectedProduct" class="mt-4">
      <v-card-title class="d-flex align-center">
        {{ t('label.labelPreview') }}
        <span class="text-subtitle-1 ml-2">({{ labelWidth }} × {{ labelHeight }} mm)</span>
      </v-card-title>
      <v-card-text class="d-flex justify-center">
        <div class="label-content" :style="{
          width: `${labelWidth * 5}px`,
          height: `${labelHeight * 5}px`,
          fontSize: `calc(80% * (${labelWidth} / 59))`
        }">
          <div class="article-name">{{ selectedProduct['Artikelname DE'] || '' }}</div>
          <div class="pharmacode">{{ selectedProduct.Pharmacode || '' }}</div>
          <div class="barcode" v-if="selectedProduct.Pharmacode">*{{ selectedProduct.Pharmacode }}*</div>
          <div class="swme">
            <SwMeTranslation v-if="selectedProduct.SwMe" :swme="selectedProduct.SwMe" />
          </div>
          <div class="zusatz">
            {{ selectedProduct['ATC.1'] || selectedProduct['Marke DE'] || '' }}
            {{ (selectedProduct['Konzentration'] || selectedProduct['Inhalt']) ? 
               '/ ' + (selectedProduct['Konzentration'] || '') + ' ' + (selectedProduct['Einheit.1'] || '') + 
               ' / ' + (selectedProduct['Inhalt'] || '') + ' ' + (selectedProduct['Einheit'] || '') : '' }}
          </div>
          <div class="migel" v-if="selectedProduct['MiGeL Code']">
            {{ t('label.migelNr', { code: selectedProduct['MiGeL Code'] }) }}
          </div>
        </div>
      </v-card-text>

      <v-card-text v-if="selectedProduct.Pharmacode" class="text-caption text-center">
        {{ t('label.barcodeNote') }}
      </v-card-text>
    </v-card>
  </v-container>
</template>

<style scoped>
/* Label content styles - these are needed for the actual label */
.label-content {
  font-family: 'Montserrat', Arial, sans-serif;
  margin: 1rem auto;
  padding: 0.5rem;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-sizing: border-box;
  overflow: clip;
  position: relative;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  color: #000;
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
  font-size: 40pt;
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
</style>
