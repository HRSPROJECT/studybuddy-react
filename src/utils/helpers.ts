import { jsPDF } from 'jspdf';

/**
 * Process text output to handle formatting (math equations, code blocks, etc.)
 */
export const processOutputText = (text: string): string => {
  if (!text) return '';
  
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Math equations
  text = text.replace(/\$\$(.*?)\$\$/g, '<div class="math-equation">$1</div>');
  text = text.replace(/\$(.*?)\$/g, '<span class="math-equation">$1</span>');
  
  // Chemical formulas
  text = text.replace(/([A-Z][a-z]*)(\d*)/g, (match, element, subscript) => {
    if (subscript) {
      return `<span class="chemical-formula">${element}<sub>${subscript}</sub></span>`;
    }
    return `<span class="chemical-formula">${element}</span>`;
  });
  
  // Code blocks
  text = text.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
    return `<pre class="code-block${language ? ' language-'+language : ''}"><code>${code.trim()}</code></pre>`;
  });
  
  // Inline code
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Convert line breaks to HTML
  text = text.replace(/\n/g, '<br>');
  
  return text;
};

/**
 * Convert image file to base64
 */
export const getImageBase64 = (file: File): Promise<string | null> => {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = e => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error("File reading failed"));
    reader.readAsDataURL(file);
  });
};

/**
 * Check if device is mobile
 */
export const isMobileDevice = (): boolean => {
  return (window.innerWidth <= 768) || 
         (navigator.userAgent.match(/Android/i) ||
          navigator.userAgent.match(/webOS/i) ||
          navigator.userAgent.match(/iPhone/i) ||
          navigator.userAgent.match(/iPad/i) ||
          navigator.userAgent.match(/iPod/i) ||
          navigator.userAgent.match(/BlackBerry/i) ||
          navigator.userAgent.match(/Windows Phone/i)) !== null;
};

/**
 * Download answer as PDF
 */
export const downloadAnswerAsPdf = (type: 'ask' | 'explain', content: string): void => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Set document properties
    const title = type === 'ask' ? 'StudyBuddy Answer' : 'StudyBuddy Explanation';
    doc.setProperties({
      title: title,
      subject: type === 'ask' ? 'AI-Generated Answer' : 'AI-Generated Explanation',
      author: 'StudyBuddy',
      creator: 'StudyBuddy'
    });
    
    // PDF formatting settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20; // margin in mm
    const textWidth = pageWidth - (margin * 2);
    
    // Add logo and title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229); // Primary color
    doc.text("StudyBuddy", margin, margin);
    
    // Add subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99); // Secondary text color
    doc.text(type === 'ask' ? 'AI-Generated Answer' : 'AI-Generated Explanation', margin, margin + 8);
    
    // Add date
    doc.setFontSize(10);
    const date = new Date();
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    doc.text(`Generated on: ${formattedDate}`, margin, margin + 15);
    
    // Add horizontal line
    doc.setLineWidth(0.5);
    doc.setDrawColor(229, 231, 235); // Border light color
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
    
    // Add content
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55); // Text primary color
    
    // Clean HTML content to plain text
    const textContent = content.replace(/<[^>]+>/g, '');
    
    // Split text into lines that fit within the page width
    const contentLines = doc.splitTextToSize(textContent, textWidth);
    
    // Add text with line spacing
    doc.text(contentLines, margin, margin + 30);
    
    // Add footer with pagination
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(75, 85, 99);
      doc.text('StudyBuddy - Your Smart Learning Assistant', margin, doc.internal.pageSize.getHeight() - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, doc.internal.pageSize.getHeight() - 10);
    }
    
    // Save the PDF
    const filename = `studybuddy_${type === 'ask' ? 'answer' : 'explanation'}_${date.toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};