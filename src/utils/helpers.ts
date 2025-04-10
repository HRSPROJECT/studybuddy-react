import { jsPDF } from 'jspdf';

/**
 * Process text output to handle formatting (math equations, code blocks, scientific notations, etc.)
 */
export const processOutputText = (text: string): string => {
  if (!text) return '';
  
  // Bold
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic
  text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Math equations - Enhanced processing
  // Block equations (centered, larger)
  text = text.replace(/\$\$(.*?)\$\$/g, '<div class="math-equation">$1</div>');
  
  // Inline equations
  text = text.replace(/\$(.*?)\$/g, '<span class="math-equation">$1</span>');
  
  // Special math symbols that commonly appear in student questions
  text = text.replace(/\\sqrt\{([^}]+)\}/g, '<span class="math-equation">√($1)</span>');
  text = text.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-equation">$1/$2</span>');
  text = text.replace(/([0-9]+)\^([0-9]+)/g, '<span class="math-equation">$1<sup>$2</sup></span>');
  text = text.replace(/\\sum/g, '<span class="math-equation">∑</span>');
  text = text.replace(/\\int/g, '<span class="math-equation">∫</span>');
  text = text.replace(/\\infty/g, '<span class="math-equation">∞</span>');
  text = text.replace(/\\pi/g, '<span class="math-equation">π</span>');
  text = text.replace(/\\theta/g, '<span class="math-equation">θ</span>');
  text = text.replace(/\\pm/g, '<span class="math-equation">±</span>');
  text = text.replace(/\\times/g, '<span class="math-equation">×</span>');
  text = text.replace(/\\div/g, '<span class="math-equation">÷</span>');
  
  // Square and cube roots with proper formatting
  text = text.replace(/(\d+) square root/gi, '<span class="math-equation">√$1</span>');
  text = text.replace(/square root of (\d+)/gi, '<span class="math-equation">√$1</span>');
  text = text.replace(/cubic root of (\d+)/gi, '<span class="math-equation">∛$1</span>');
  
  // Handle "x squared", "x cubed" patterns that students often use
  text = text.replace(/(\w+) squared/gi, '<span class="math-equation">$1<sup>2</sup></span>');
  text = text.replace(/(\w+) cubed/gi, '<span class="math-equation">$1<sup>3</sup></span>');
  
  // Process modulus/absolute value
  text = text.replace(/\|([^|]+)\|/g, '<span class="math-equation">|$1|</span>');
  
  // Chemical formulas with subscripts and superscripts
  // Handle common chemical elements with their subscripts (e.g., H₂O, CO₂)
  text = text.replace(/([A-Z][a-z]*)(\d+)/g, (match, element, subscript) => {
    return `<span class="chemical-formula">${element}<sub>${subscript}</sub></span>`;
  });
  
  // Handle isotopes with superscripts (e.g., ¹⁴C, ²³⁵U)
  text = text.replace(/(\^|\^{)(\d+)([A-Z][a-z]*)/g, (match, prefix, superscript, element) => {
    return `<span class="chemical-formula"><sup>${superscript}</sup>${element}</span>`;
  });
  
  // Code blocks with syntax highlighting hints
  text = text.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
    return `<pre class="code-block${language ? ' language-'+language : ''}"><code>${code.trim()}</code></pre>`;
  });
  
  // Inline code for variables, functions, etc.
  text = text.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  
  // Make mathematical expressions more readable by formatting special characters
  // Examples: replacing <= with ≤, >= with ≥, != with ≠
  text = text.replace(/(\s|^)&lt;=(\s|$)/g, ' ≤ ');
  text = text.replace(/(\s|^)&gt;=(\s|$)/g, ' ≥ ');
  text = text.replace(/(\s|^)!=(\s|$)/g, ' ≠ ');
  
  // Properly format matrices and vectors
  text = text.replace(/\[\s*\[(.*?)\]\s*\]/g, (match, content) => {
    const rows = content.split(/\],\s*\[/);
    if (rows.length === 1) {
      // It's a vector
      return `<div class="math-equation">[${content}]</div>`;
    } else {
      // It's a matrix
      let formattedMatrix = '<div class="math-matrix">';
      rows.forEach((row: string) => {
        formattedMatrix += `<div class="matrix-row">[${row}]</div>`;
      });
      formattedMatrix += '</div>';
      return formattedMatrix;
    }
  });
  
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
 * Process text content for PDF rendering, preserving mathematical notations and formatting
 */
export const processPdfText = (content: string): string => {
  let text = content;
  
  // Remove HTML tags but preserve their content
  // Keep subscripts and superscripts for math and chemistry
  text = text.replace(/<sub>(.*?)<\/sub>/g, '_{$1}');
  text = text.replace(/<sup>(.*?)<\/sup>/g, '^{$1}');
  
  // Replace math equation divs and spans
  text = text.replace(/<div class="math-equation">(.*?)<\/div>/g, '$1');
  text = text.replace(/<span class="math-equation">(.*?)<\/span>/g, '$1');
  text = text.replace(/<span class="chemical-formula">(.*?)<\/span>/g, '$1');
  
  // Replace special symbols with Unicode equivalents for better PDF display
  text = text.replace(/√/g, '√');
  text = text.replace(/π/g, 'π');
  text = text.replace(/θ/g, 'θ');
  text = text.replace(/∑/g, '∑');
  text = text.replace(/∫/g, '∫');
  text = text.replace(/∞/g, '∞');
  text = text.replace(/±/g, '±');
  text = text.replace(/×/g, '×');
  text = text.replace(/÷/g, '÷');
  text = text.replace(/≤/g, '≤');
  text = text.replace(/≥/g, '≥');
  text = text.replace(/≠/g, '≠');
  
  // Remove remaining HTML tags
  text = text.replace(/<[^>]+>/g, '');
  
  return text;
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
    
    // Process content to maintain mathematical formatting for PDF
    const processedContent = processPdfText(content);
    
    // Split text into lines that fit within the page width
    const contentLines = doc.splitTextToSize(processedContent, textWidth);
    
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