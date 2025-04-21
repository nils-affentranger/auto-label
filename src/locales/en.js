export default {
  // Navigation
  navigation: {
    scan: 'Scan',
    label: 'Label',
    settings: 'Settings'
  },

  // App
  app: {
    title: 'AutoLabel',
    smartLabelPrinter: 'Smart Label Printer',
    copyright: '© {year} Nils Affentranger',
    version: 'v1.0.0'
  },

  // Scan Page
  scan: {
    title: 'Scan Product',
    scanning: 'Scanning...',
    readyToScan: 'Ready to scan',
    scanningInProgress: 'Scanning in progress...',
    processingBarcode: 'Processing barcode input...',
    aimScanner: 'Aim your scanner at the barcode or enter the EAN manually',
    scanOrEnterEAN: 'Scan or enter EAN code',
    example: 'Example: 1234567890123',
    search: 'Search',
    clear: 'Clear',
    error: 'Error',
    pleaseEnterEAN: 'Please enter an EAN',
    noProductFound: 'No product found with EAN: {ean}',
    noProductData: 'No Product Data Available',
    importProductData: 'Please import product data in Settings first to enable scanning.',
    goToSettings: 'Go to Settings',
    howToScan: 'How to Scan',
    positionScanner: 'Position the Scanner',
    holdScanner: 'Hold the scanner 4-8 inches from the barcode',
    scanBarcode: 'Scan the Barcode',
    systemDetect: 'The system will automatically detect the scan',
    viewResults: 'View Results',
    productDetails: 'Product details will appear automatically',
    manualEntry: 'Manual Entry',
    ifDamaged: 'If the barcode is damaged or won\'t scan:',
    typeEAN: 'Type the EAN code in the input field',
    pressEnter: 'Press Enter or click the Search button',
    troubleshooting: 'Troubleshooting',
    havingTrouble: 'If you\'re having trouble scanning:',
    ensureClean: 'Ensure the barcode is clean and undamaged',
    tryDifferent: 'Try different angles and distances',
    checkScanner: 'Check that your scanner is properly connected',
    ensureEAN: 'Make sure the barcode is an EAN format'
  },

  // Label Page
  label: {
    title: 'Label Designer',
    backToScan: 'Back to Scan',
    printLabel: 'Print Label',
    noProductSelected: 'No product selected. Please scan a product first.',
    goToScan: 'Go to Scan',
    productInfo: 'Product Information',
    ean: 'EAN',
    articleName: 'Article Name',
    pharmacode: 'Pharmacode',
    swme: 'SwMe',
    labelControls: 'Label Controls',
    autoSizeAll: 'Auto-size All',
    fontSize: 'Font Size (pt)',
    margin: 'Margin (mm)',
    zusatz: 'Zusatz',
    migel: 'MiGeL',
    migelNr: 'MiGeL-Nr: {code}',
    labelPreview: 'Label Preview',
    barcodeNote: 'Note: The barcode is displayed using the "LibreBarcode39" font which is included in this application.',
    preview: 'Label Preview',
    download: 'Download'
  },

  // Settings Page
  settings: {
    labelDimensions: 'Label Dimensions',
    presetSizes: 'Preset Sizes',
    customSize: 'Custom Size',
    width: 'Width',
    height: 'Height',
    saveDimensions: 'Save Dimensions',
    dimensionsSaved: 'Label dimensions saved successfully!',
    productData: 'Product Data',
    productsLoaded: 'Products Loaded',
    importProductData: 'Import Product Data',
    selectExcelFile: 'Select an Excel file',
    selectExcelHint: 'Select an Excel file (.xlsx or .xls) containing product data',
    noDataFound: 'No data found in the file',
    errorProcessingFile: 'Error processing file: {error}',
    importSuccess: 'Successfully imported {count} products!'
  },

  // SwMe Translations
  swmeTranslations: {
    A: 'List A',
    B: 'List B',
    D: 'List D',
    E: 'List E',
    SL: 'Self-medication',
    NE: 'Not listed',
    HM: 'Homeopathic',
    PM: 'Phytotherapeutic',
    AP: 'Anthroposophic',
    OTC: 'Over-the-counter',
    Rx: 'Prescription only'
  }
}
