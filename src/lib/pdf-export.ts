import { toJpeg } from 'html-to-image';
import jsPDF from 'jspdf';

export async function exportElementToPDF(elementId: string, filename: string = 'report.pdf') {
  const element = document.getElementById(elementId);
  if (!element) throw new Error('Element not found');

  // Save original styles that might be affected
  const originalStyle = element.style.cssText;
  
  try {
    const imgData = await toJpeg(element, {
      quality: 1.0,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    
    // Create an image element to get the dimensions
    const img = new Image();
    img.src = imgData;
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    const pdfHeight = (img.height * pdfWidth) / img.width;
    
    let heightLeft = pdfHeight;
    let position = 0;
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
  } finally {
    element.style.cssText = originalStyle;
  }
}
