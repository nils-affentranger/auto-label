<script setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import * as XLSX from 'xlsx';

const { t } = useI18n();
const emit = defineEmits(['productsImported']);
const fileInput = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');

/**
 * Handles the file selection and processes the Excel file
 */
const handleFileChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  isLoading.value = true;
  errorMessage.value = '';

  try {
    const data = await readExcelFile(file);
    if (data && data.length > 0) {
      // Process the data and emit it to the parent component
      const processedData = processProductData(data);
      emit('productsImported', processedData);
    } else {
      errorMessage.value = t('settings.noDataFound');
    }
  } catch (error) {
    console.error('Error processing file:', error);
    errorMessage.value = t('settings.errorProcessingFile', { error: error.message });
  } finally {
    isLoading.value = false;
    // Reset the file input so the same file can be selected again
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  }
};

/**
 * Reads an Excel file and returns the data as an array of objects
 */
const readExcelFile = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(error);
    };

    reader.readAsArrayBuffer(file);
  });
};

/**
 * Processes the raw product data from Excel
 * Ensures EAN values are properly formatted as strings with leading zeros if needed
 */
const processProductData = (data) => {
  return data.map(item => {
    const processedItem = { ...item };

    // Convert EAN to string and ensure it has the correct format
    if (processedItem.EAN !== undefined) {
      // Convert to string if it's a number
      let ean = String(processedItem.EAN);

      // Add leading zeros if needed (EAN-13 should be 13 digits)
      if (ean.length < 13) {
        ean = ean.padStart(13, '0');
      }

      processedItem.EAN = ean;
    }

    return processedItem;
  });
};
</script>

<template>
  <div class="product-import">
    <div class="d-flex align-center mb-4">
      <v-icon size="small" color="secondary" class="mr-2">mdi-database-import</v-icon>
      <h4 class="text-subtitle-1 font-weight-medium mb-0">{{ t('settings.importProductData') }}</h4>
    </div>

    <v-sheet class="pa-4 rounded bg-surface" elevation="1">
      <v-file-input
        ref="fileInput"
        accept=".xlsx, .xls"
        :label="t('settings.selectExcelFile')"
        prepend-icon="mdi-file-excel"
        @change="handleFileChange"
        :disabled="isLoading"
        :loading="isLoading"
        :hint="t('settings.selectExcelHint')"
        persistent-hint
        variant="outlined"
        density="comfortable"
        class="import-file-input"
      ></v-file-input>

      <v-progress-linear
        v-if="isLoading"
        indeterminate
        color="primary"
        class="mt-4"
      ></v-progress-linear>

      <v-alert
        v-if="errorMessage"
        type="error"
        variant="tonal"
        class="mt-4"
        border="start"
        closable
        density="compact"
      >
        {{ errorMessage }}
      </v-alert>
    </v-sheet>
  </div>
</template>