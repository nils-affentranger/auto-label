import html2canvas from 'html2canvas';

export const generateLabelPNG = async (labelElement) => {
  try {
    // Store original styles
    const originalStyles = {
      position: labelElement.style.position,
      left: labelElement.style.left,
      top: labelElement.style.top,
      border: labelElement.style.border,
      boxShadow: labelElement.style.boxShadow
    };

    // Position the element for capture and remove decorative styles
    labelElement.style.position = 'fixed';
    labelElement.style.left = '0px';
    labelElement.style.top = '0px';
    labelElement.style.border = 'none';
    labelElement.style.boxShadow = 'none';

    // Wait for fonts to load
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    // Get the actual dimensions of the element
    const rect = labelElement.getBoundingClientRect();

    // Render the canvas with the exact dimensions of the element
    const canvas = await html2canvas(labelElement, {
      scale: 4,
      width: rect.width,
      height: rect.height,
      backgroundColor: null, // Make background transparent
      logging: false,
      useCORS: true,
      allowTaint: true
    });

    // Restore original styles
    Object.assign(labelElement.style, originalStyles);

    // Create a new window with print-specific styling
    const printWindow = window.open('', '_blank');
    const labelWidth = parseFloat(localStorage.getItem('labelWidth') || '59');
    const labelHeight = parseFloat(localStorage.getItem('labelHeight') || '40');

    // Write the HTML content with proper print styling
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Label Print</title>
          <style>
            @page {
              size: ${labelWidth}mm ${labelHeight}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              background: white;
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            img {
              width: ${labelWidth}mm;
              height: ${labelHeight}mm;
              object-fit: contain;
              image-rendering: -webkit-optimize-contrast;
              image-rendering: crisp-edges;
            }
            @media print {
              body {
                background: white;
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
              }
              img {
                width: ${labelWidth}mm;
                height: ${labelHeight}mm;
              }
            }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" />
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 250);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  } catch (error) {
    console.error('Error generating label image:', error);
    throw error;
  }
};
