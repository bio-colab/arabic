import * as mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Set worker path for pdfjs
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

export async function readFileText(file: File): Promise<string> {
  const MAX_SIZE = 10 * 1024 * 1024; // Increased to 10 MB for PDFs
  if (file.size > MAX_SIZE) {
    throw new Error(`حجم الملف يتجاوز الحد المسموح به (10 ميجابايت).`);
  }

  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  } else if (extension === 'pdf') {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  } else if (extension === 'txt' || extension === 'md') {
    return await file.text();
  } else {
    throw new Error(`صيغة الملف غير مدعومة: ${extension}. يرجى رفع ملفات .txt, .md, .pdf, أو .docx`);
  }
}
