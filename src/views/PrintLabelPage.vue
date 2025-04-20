<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import SwMeTranslation from '../components/SwMeTranslation.vue';

const router = useRouter();
const { t } = useI18n();

// Get the selected product from localStorage
const selectedProduct = ref(null);

// Get label size from localStorage
const labelWidth = computed(() => localStorage.getItem('labelWidth') || '59');
const labelHeight = computed(() => localStorage.getItem('labelHeight') || '40');

// Font sizes from localStorage
const articleNameFontSize = ref(localStorage.getItem('articleNameFontSize') || '12');
const pharmacodeFontSize = ref(localStorage.getItem('pharmacodeFontSize') || '8');
const barcodeFontSize = ref(localStorage.getItem('barcodeFontSize') || '24');
const swmeFontSize = ref(localStorage.getItem('swmeFontSize') || '10');
const zusatzFontSize = ref(localStorage.getItem('zusatzFontSize') || '8');
const migelFontSize = ref(localStorage.getItem('migelFontSize') || '8');

// Margins from localStorage
const articleNameMargin = ref(localStorage.getItem('articleNameMargin') || '1');
const pharmacodeMargin = ref(localStorage.getItem('pharmacodeMargin') || '2');
const barcodeMargin = ref(localStorage.getItem('barcodeMargin') || '1');
const swmeMargin = ref(localStorage.getItem('swmeMargin') || '2');
const zusatzMargin = ref(localStorage.getItem('zusatzMargin') || '2');
const migelMargin = ref(localStorage.getItem('migelMargin') || '0');

// Improve the font size multiplier calculation
const fontSizeMultiplier = computed(() => {
  // Calculate a more accurate scaling factor based on label width and height
  const baseWidth = 59; // Base width used in preview (mm)
  const baseHeight = 40; // Base height used in preview (mm)
  const scaleFactor = 5; // Preview uses width*5 for display
  
  const currentWidth = parseFloat(labelWidth.value);
  const currentHeight = parseFloat(labelHeight.value);
  
  // We use a similar approach to the preview but account for the 5x multiplier
  return (currentWidth / baseWidth) / scaleFactor;
});

// Debug flag (set to true to show dimensions on print)
const showDebug = ref(false);

// Load the product data on component mount and trigger print
onMounted(() => {
  const storedProduct = localStorage.getItem('selectedProduct');
  if (storedProduct) {
    selectedProduct.value = JSON.parse(storedProduct);

    // Set up print-specific page settings
    document.title = `${selectedProduct.value['Artikelname DE'] || 'Label'} - Print`;

    // Use exactly the same multiplier as in the preview (5x)
    const previewMultiplier = 5;
    const pageWidthPx = parseFloat(labelWidth.value) * previewMultiplier;
    const pageHeightPx = parseFloat(labelHeight.value) * previewMultiplier;

    // Create a style element to set the page size
    const style = document.createElement('style');
    style.textContent = `
      @page {
        size: ${pageWidthPx}px ${pageHeightPx}px;
        margin: 0;
      }
      @media print {
        html, body {
          width: ${pageWidthPx}px;
          height: ${pageHeightPx}px;
          padding: 0;
          margin: 0;
        }
        .print-page {
          width: ${pageWidthPx}px;
          height: ${pageHeightPx}px;
          padding: 0;
        }
      }
    `;
    document.head.appendChild(style);

    // Use setTimeout to allow the UI to render before printing
    setTimeout(() => {
      window.print();
      // Navigate back to the label page after printing
      setTimeout(() => {
        // Clean up the style element
        document.head.removeChild(style);
        router.push('/label');
      }, 500);
    }, 300);
  } else {
    // If no product is selected, go back to the label page
    router.push('/label');
  }
});

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
</script>

<template>
  <div class="print-page">
    <div class="label-container" :style="{
      width: `${parseFloat(labelWidth) * 5}px`,
      height: `${parseFloat(labelHeight) * 5}px`
    }">
      <!-- Debug info, only shown when debugging -->
      <div v-if="showDebug" class="debug-info">
        Label: {{ labelWidth }}x{{ labelHeight }}mm<br>
        Preview size: {{ parseFloat(labelWidth)*5 }}x{{ parseFloat(labelHeight)*5 }}px
      </div>
      
      <div class="label-content" v-if="selectedProduct" :style="{
        fontSize: `calc(80% * (${labelWidth} / 59))`
      }">
        <div class="article-name" :style="{ 
          fontSize: `${parseFloat(articleNameFontSize)}pt`, 
          marginBottom: `${articleNameMargin}mm` 
        }">{{ selectedProduct['Artikelname DE'] || '' }}</div>

        <div class="pharmacode" :style="{ 
          fontSize: `${parseFloat(pharmacodeFontSize)}pt`, 
          marginBottom: `${pharmacodeMargin}mm` 
        }">{{ selectedProduct.Pharmacode || '' }}</div>

        <div class="barcode" v-if="selectedProduct.Pharmacode" :style="{ 
          fontSize: `${parseFloat(barcodeFontSize)}pt`, 
          marginBottom: `${barcodeMargin}mm` 
        }">*{{ selectedProduct.Pharmacode }}*</div>

        <div class="swme" :style="{ 
          fontSize: `${parseFloat(swmeFontSize)}pt`, 
          marginBottom: `${swmeMargin}mm` 
        }">
          <SwMeTranslation v-if="selectedProduct.SwMe" :swme="selectedProduct.SwMe" />
        </div>

        <div class="zusatz" :style="{ 
          fontSize: `${parseFloat(zusatzFontSize)}pt`, 
          marginBottom: `${zusatzMargin}mm` 
        }">
          {{ selectedProduct['ATC.1'] || selectedProduct['Marke DE'] || '' }}
          {{ (selectedProduct['Konzentration'] || selectedProduct['Inhalt']) ? 
             '/ ' + (selectedProduct['Konzentration'] || '') + ' ' + (selectedProduct['Einheit.1'] || '') + 
             ' / ' + (selectedProduct['Inhalt'] || '') + ' ' + (selectedProduct['Einheit'] || '') : '' }}
        </div>

        <div class="migel" v-if="selectedProduct['MiGeL Code']" :style="{ 
          fontSize: `${parseFloat(migelFontSize)}pt`, 
          marginBottom: `${migelMargin}mm` 
        }">
          {{ t('label.migelNr', { code: selectedProduct['MiGeL Code'] }) }}
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Global styles for the print page */
@page {
  margin: 0;
  size: auto;
}

body {
  margin: 0;
  padding: 0;
  background-color: white;
  color: black !important;
}
</style>

<style scoped>
/* Print page specific styles */
.print-page {
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0;
  padding: 0;
  min-height: 100vh;
}

.label-container {
  background-color: white;
  position: relative;
  box-sizing: border-box;
  margin: 1rem auto;
  border: 1px solid #d1e6f0;
  border-radius: var(--border-radius, 4px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Label content styles */
.label-content {
  font-family: 'Open Sans', Arial, sans-serif;
  background-color: white;
  box-sizing: border-box;
  position: relative;
  color: black !important;
  width: 100%;
  height: 100%;
  padding: 0.5rem;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

/* Debug info */
.debug-info {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(255, 255, 255, 0.7);
  padding: 2px 5px;
  font-size: 8pt;
  color: #333;
  z-index: 100;
  border: 1px solid #ccc;
}

.article-name {
  font-weight: bold;
  margin-bottom: 0.1em;
  color: black !important;
  line-height: 1.1;
  overflow-wrap: break-word;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

.pharmacode {
  margin-bottom: 0.2em;
  color: black !important;
  line-height: 1.1;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

.barcode {
  font-family: 'LibreBarcode39', monospace;
  margin-bottom: 0.1em;
  line-height: 1;
  color: black !important;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

.swme {
  margin-bottom: 0.2em;
  color: black !important;
  line-height: 1.1;
  overflow-wrap: break-word;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

.zusatz {
  margin-bottom: 0.2em;
  color: black !important;
  line-height: 1.1;
  overflow-wrap: break-word;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

.migel {
  color: black !important;
  line-height: 1.1;
  overflow-wrap: break-word;
  /* Force content to be visible */
  visibility: visible !important;
  opacity: 1 !important;
}

/* Print-specific styles */
@media print {
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
    color-adjust: exact !important;
    color: black !important;
    /* Force content to be visible */
    visibility: visible !important;
    opacity: 1 !important;
  }
  
  .print-page {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    color: black !important;
  }

  .label-container {
    page-break-inside: avoid;
    border: none;
    box-shadow: none;
    margin: 0;
  }
}
</style>
