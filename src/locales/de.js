export default {
  // Navigation
  navigation: {
    scan: 'Scannen',
    label: 'Etikett',
    settings: 'Einstellungen'
  },

  // App
  app: {
    title: 'AutoLabel',
    copyright: '© {year} Nils Affentranger',
    version: 'v1.0.0'
  },

  // Scan Page
  scan: {
    title: 'Produkt scannen',
    scanning: 'Scannen...',
    readyToScan: 'Bereit zum Scannen',
    scanningInProgress: 'Scanvorgang läuft...',
    processingBarcode: 'Barcode wird verarbeitet...',
    aimScanner: 'Scannen sie den Barcode oder geben Sie den EAN manuell ein',
    scanOrEnterEAN: 'EAN-Code scannen oder eingeben',
    example: 'Beispiel: 1234567890123',
    search: 'Suchen',
    clear: 'Eingabe Löschen',
    error: 'Fehler',
    pleaseEnterEAN: 'Bitte geben Sie einen EAN ein',
    noProductFound: 'Kein Produkt mit EAN {ean} gefunden.',
    noProductData: 'Keine Produktdaten verfügbar',
    importProductData: 'Bitte importieren Sie zuerst Produktdaten in den Einstellungen, um das Scannen zu ermöglichen.',
    goToSettings: 'Zu den Einstellungen',
    howToScan: 'Anleitung',
    positionScanner: 'Scanner positionieren',
    holdScanner: 'Halten Sie den Scanner 10-20 cm vom Barcode entfernt',
    scanBarcode: 'Barcode scannen',
    systemDetect: 'Der Barcode wird automatisch erkannt.',
    viewResults: 'Ettikett anzeigen',
    productDetails: 'Das Ettikett wird automatisch generiert und angezeigt.',
    manualEntry: 'Manuelle Eingabe',
    ifDamaged: 'Wenn der Barcode beschädigt ist oder nicht gescannt werden kann:',
    typeEAN: 'Geben Sie den EAN-Code in das Eingabefeld ein',
    pressEnter: 'Drücken Sie Enter oder klicken Sie auf die Schaltfläche Suchen',
    troubleshooting: 'Fehlerbehebung',
    havingTrouble: 'Wenn Sie Probleme beim Scannen haben:',
    ensureClean: 'Stellen Sie sicher, dass der Barcode sauber und unbeschädigt ist',
    tryDifferent: 'Versuchen Sie verschiedene Winkel und Abstände',
    checkScanner: 'Überprüfen Sie, ob Ihr Scanner richtig angeschlossen ist',
    ensureEAN: 'Stellen Sie sicher, dass der Barcode im EAN-Format vorliegt'
  },

  // Label Page
  label: {
    title: 'Liste',
    backToScan: 'Zurück zum Scannen',
    printLabel: 'Etikett drucken',
    noProductSelected: 'Kein Produkt ausgewählt. Bitte scannen Sie zuerst ein Produkt.',
    goToScan: 'Zum Scannen',
    productInfo: 'Produktinformationen',
    ean: 'EAN',
    articleName: 'Artikelname',
    pharmacode: 'Pharmacode',
    swme: 'Liste',
    labelControls: 'Etikettensteuerung',
    autoSizeAll: 'Alle automatisch anpassen',
    fontSize: 'Schriftgröße (pt)',
    margin: 'Rand (mm)',
    zusatz: 'Zusatz',
    migel: 'MiGeL',
    migelNr: 'MiGeL-Nr: {code}',
    labelPreview: 'Etikettenvorschau',
    barcodeNote: 'Hinweis: Der Barcode wird mit der Schriftart "LibreBarcode39" angezeigt, die in dieser Anwendung enthalten ist.',
    preview: 'Etikettenvorschau',
    download: 'Herunterladen'
  },

  // Settings Page
  settings: {
    title: 'Einstellungen',
    labelDimensions: 'Etikettengröße',
    presetSizes: 'Vordefinierte Größen',
    customSize: 'Benutzerdefinierte Größe',
    width: 'Breite',
    height: 'Höhe',
    saveDimensions: 'Größe speichern',
    dimensionsSaved: 'Etikettengröße erfolgreich gespeichert!',
    productData: 'Produktdaten',
    productsLoaded: 'Produkte geladen',
    importProductData: 'Produktdaten importieren',
    selectExcelFile: 'Excel-Datei auswählen',
    selectExcelHint: 'Wählen Sie eine Excel-Datei (.xlsx oder .xls) mit Produktdaten',
    noDataFound: 'Keine Daten in der Datei gefunden',
    errorProcessingFile: 'Fehler beim Verarbeiten der Datei: {error}',
    importSuccess: '{count} Produkte erfolgreich importiert!'
  },

  // SwMe Translations
  swmeTranslations: {
    A: 'rezeptpflichtig, einmalige Abgabe',
    B: 'rezeptpflichtig, Dauerrezept möglich',
    D: 'Abgabe nach Fachberatung',
    E: 'Abgabe ohne Fachberatung',
    SL: 'Selbstmedikation',
    NE: 'Nicht gelistet',
    HM: 'Homöopathisch',
    PM: 'Phytotherapeutisch',
    AP: 'Anthroposophisch',
    OTC: 'Rezeptfrei',
    Rx: 'Verschreibungspflichtig'
  }
}
