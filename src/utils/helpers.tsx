import React from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import ReactDOMServer from 'react-dom/server';
import SummaryTable from '../components/SummaryTable';

const processNonTableText = (text: string): React.ReactNode => {
  if (!text) return null;

  let processedText = text;
  
  // All the existing regex replacements from the original function
  processedText = processedText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  processedText = processedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
  processedText = processedText.replace(/\$\$(.*?)\$\$/g, '<div class="math-equation block">$1</div>');
  processedText = processedText.replace(/\$(.*?)\$/g, '<span class="math-equation">$1</span>');
  
  const latexReplacements: [RegExp, string][] = [
    [/\\sqrt\{([^}]+)\}/g, '<span class="math-equation">√($1)</span>'],
    [/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="math-equation"><span style="display: inline-block; text-align: center;"><span style="display: block; border-bottom: 1px solid currentColor;">$1</span><span style="display: block;">$2</span></span></span>'],
    [/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '<span class="math-equation">∑<span style="display: inline-block; vertical-align: -0.5em; line-height: 1.0; font-size: 0.8em; text-align: center;"><sup>$2</sup><sub>$1</sub></span></span>'],
    [/\\prod_\{([^}]+)\}\^\{([^}]+)\}/g, '<span class="math-equation">∏<span style="display: inline-block; vertical-align: -0.5em; line-height: 1.0; font-size: 0.8em; text-align: center;"><sup>$2</sup><sub>$1</sub></span></span>'],
    [/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '<span class="math-equation">∫<span style="display: inline-block; vertical-align: -0.5em; line-height: 1.0; font-size: 0.8em; text-align: center;"><sup>$2</sup><sub>$1</sub></span></span>'],
    [/\\sum/g, '<span class="math-equation">∑</span>'],
    [/\\prod/g, '<span class="math-equation">∏</span>'],
    [/\\int/g, '<span class="math-equation">∫</span>'],
    [/\\infty/g, '<span class="math-equation">∞</span>'],
    [/\\pi/g, '<span class="math-equation">π</span>'],
    [/\\theta/g, '<span class="math-equation">θ</span>'],
    [/\\alpha/g, '<span class="math-equation">α</span>'],
    [/\\beta/g, '<span class="math-equation">β</span>'],
    [/\\gamma/g, '<span class="math-equation">γ</span>'],
    [/\\delta/g, '<span class="math-equation">δ</span>'],
    [/\\epsilon/g, '<span class="math-equation">ε</span>'],
    [/\\lambda/g, '<span class="math-equation">λ</span>'],
    [/\\mu/g, '<span class="math-equation">µ</span>'],
    [/\\sigma/g, '<span class="math-equation">σ</span>'],
    [/\\omega/g, '<span class="math-equation">ω</span>'],
    [/\\pm/g, '<span class="math-equation">±</span>'],
    [/\\times/g, '<span class="math-equation">×</span>'],
    [/\\div/g, '<span class="math-equation">÷</span>'],
    [/\\cdot/g, '<span class="math-equation">·</span>'],
    [/\\approx/g, '<span class="math-equation">≈</span>'],
    [/\\neq/g, '<span class="math-equation">≠</span>'],
    [/\\leq/g, '<span class="math-equation">≤</span>'],
    [/\\geq/g, '<span class="math-equation">≥</span>'],
    [/\\rightarrow/g, '<span class="math-equation">→</span>'],
    [/\\leftrightarrow/g, '<span class="math-equation">↔</span>'],
    [/\\partial/g, '<span class="math-equation">∂</span>'],
    [/\\nabla/g, '<span class="math-equation">∇</span>'],
    [/\\therefore/g, '<span class="math-equation">∴</span>'],
    [/\\because/g, '<span class="math-equation">∵</span>']
  ];

  latexReplacements.forEach(([pattern, replacement]) => {
    processedText = processedText.replace(pattern, replacement);
  });

  processedText = processedText.replace(/([a-zA-Z0-9])\^([a-zA-Z0-9])/g, '<span class="math-equation">$1<sup>$2</sup></span>');
  processedText = processedText.replace(/([a-zA-Z0-9])\^\{([^}]+)\}/g, '<span class="math-equation">$1<sup>$2</sup></span>');
  processedText = processedText.replace(/([a-zA-Z0-9])_([a-zA-Z0-9])/g, '<span class="math-equation">$1<sub>$2</sub></span>');
  processedText = processedText.replace(/([a-zA-Z0-9])_\{([^}]+)\}/g, '<span class="math-equation">$1<sub>$2</sub></span>');
  processedText = processedText.replace(/(\d+) square root/gi, '<span class="math-equation">√$1</span>');
  processedText = processedText.replace(/square root of (\d+)/gi, '<span class="math-equation">√$1</span>');
  processedText = processedText.replace(/cubic root of (\d+)/gi, '<span class="math-equation">∛$1</span>');
  processedText = processedText.replace(/(\w+) squared/gi, '<span class="math-equation">$1<sup>2</sup></span>');
  processedText = processedText.replace(/(\w+) cubed/gi, '<span class="math-equation">$1<sup>3</sup></span>');
  processedText = processedText.replace(/\|([^|]+)\|/g, '<span class="math-equation">|$1|</span>');

  const elementWithSubscript = (match: string, element: string, subscript: string): string => `<span class="chemical-formula">${element}<sub>${subscript}</sub></span>`;
  const isotopeWithSuperscript = (match: string, prefix: string, superscript: string, element: string): string => `<span class="chemical-formula"><sup>${superscript}</sup>${element}</span>`;
  const ionWithCharge = (match: string, element: string, num: string, charge: string): string => {
    const superNum = num ? num : '1';
    const superCharge = charge === '+' ? '⁺' : '⁻';
    return `<span class="chemical-formula">${element}<sup>${superNum}${superCharge}</sup></span>`;
  };
  const stateSymbol = (match: string, state: string): string => `<span class="chemical-formula"><sub>(${state})</sub></span>`;

  processedText = processedText.replace(/([A-Z][a-z]*)(\d+)/g, elementWithSubscript);
  processedText = processedText.replace(/(\^|\^{)(\d+)([A-Z][a-z]*)/g, isotopeWithSuperscript);
  processedText = processedText.replace(/([A-Z][a-z]*)(\d*)([+\-])/g, ionWithCharge);
  processedText = processedText.replace(/\(([gls]|aq)\)/g, stateSymbol);

  const physicsPatterns: [RegExp, string][] = [
    [/(\d+)\s*(m\/s)/g, '$1 <span class="physics-unit">m/s</span>'],
    [/(\d+)\s*(kg\/m\^?3|kg\/m³)/g, '$1 <span class="physics-unit">kg/m³</span>'],
    [/(\d+)\s*(m\/s\^?2|m\/s²)/g, '$1 <span class="physics-unit">m/s²</span>'],
    [/(\d+)\s*(N|newton)/gi, '$1 <span class="physics-unit">N</span>'],
    [/(\d+)\s*(Pa|pascal)/gi, '$1 <span class="physics-unit">Pa</span>'],
    [/(\d+)\s*(J|joule)/gi, '$1 <span class="physics-unit">J</span>'],
    [/(\d+)\s*(W|watt)/gi, '$1 <span class="physics-unit">W</span>'],
    [/(\d+)\s*(K|kelvin)/gi, '$1 <span class="physics-unit">K</span>'],
    [/(\d+)\s*(mol)/gi, '$1 <span class="physics-unit">mol</span>'],
    [/(\d+)\s*(Hz|hertz)/gi, '$1 <span class="physics-unit">Hz</span>'],
    [/(\d+)\s*(Ω|ohm)/gi, '$1 <span class="physics-unit">Ω</span>'],
    [/(\d+)\s*(V|volt)/gi, '$1 <span class="physics-unit">V</span>'],
    [/(\d+)\s*(A|ampere)/gi, '$1 <span class="physics-unit">A</span>'],
    [/(\d+)\s*(C|coulomb)/gi, '$1 <span class="physics-unit">C</span>'],
    [/(\d+)\s*(T|tesla)/gi, '$1 <span class="physics-unit">T</span>'],
    [/E\s*=\s*mc\^?2/g, '<span class="physics-equation">E = mc<sup>2</sup></span>'],
    [/F\s*=\s*ma/g, '<span class="physics-equation">F = ma</span>'],
    [/PV\s*=\s*nRT/g, '<span class="physics-equation">PV = nRT</span>'],
    [/F\s*=\s*G\s*\(\s*m1\s*m2\s*\/\s*r\^?2\s*\)/g, '<span class="physics-equation">F = G(m₁m₂/r²)</span>']
  ];

  physicsPatterns.forEach(([pattern, replacement]) => {
    processedText = processedText.replace(pattern, replacement);
  });

  processedText = processedText.replace(/```(\w*)([\s\S]*?)```/g, (match, language, code) => {
    const langDisplay = language ? `<div class="language-identifier">${language}</div>` : '';
    return `<pre class="code-block${language ? ' language-'+language : ''}">${langDisplay}<code>${code.trim()}</code></pre>`;
  });
  
  processedText = processedText.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');
  processedText = processedText.replace(/(\s|^)&lt;=(\s|$)/g, ' ≤ ');
  processedText = processedText.replace(/(\s|^)&gt;=(\s|$)/g, ' ≥ ');
  processedText = processedText.replace(/(\s|^)!=(\s|$)/g, ' ≠ ');

  processedText = processedText.replace(/\[\s*\[(.*?)\]\s*\]/g, (match, content) => {
    const rows = content.split(/\],\s*\[/);
    if (rows.length === 1) {
      return `<div class="math-equation">[${content}]</div>`;
    } else {
      let formattedMatrix = '<div class="math-matrix">';
      rows.forEach((row: string) => {
        formattedMatrix += `<div class="matrix-row">[${row}]</div>`;
      });
      formattedMatrix += '</div>';
      return formattedMatrix;
    }
  });

  processedText = processedText.replace(/\[!NOTE\]([\s\S]*?)(?=\[!|\n\n|$)/g, '<div class="note">$1</div>');
  processedText = processedText.replace(/\[!TIP\]([\s\S]*?)(?=\[!|\n\n|$)/g, '<div class="annotation">$1</div>');
  processedText = processedText.replace(/\[!DEFINITION\]([\s\S]*?)(?=\[!|\n\n|$)/g, '<div class="definition">$1</div>');
  processedText = processedText.replace(/==([^=]+)==/g, '<span class="highlight">$1</span>');

  processedText = processedText.replace(/\n\n/g, '</p><p>');
  processedText = processedText.replace(/\n/g, '<br>');

  return <div className="fade-in" dangerouslySetInnerHTML={{ __html: `<p>${processedText}</p>` }} />;
};

export const processOutputText = (text: string): React.ReactNode => {
  if (!text) return '';

  const tableRegex = /^\|.+\r?\n\|-+.+\r?\n(\|.+\r?\n?)*$/gm;
  const parts = text.split(tableRegex);
  const tables = text.match(tableRegex);
  
  const nodes: React.ReactNode[] = [];
  let tableIndex = 0;

  parts.forEach((part, index) => {
    if (part) {
      nodes.push(<div key={`text-${index}`}>{processNonTableText(part)}</div>);
    }
    if (tables && tableIndex < tables.length && (index < parts.length - 1 || !part)) {
      const table = tables[tableIndex++];
      const lines = table.trim().split('\n');
      const headers = lines[0].split('|').slice(1, -1).map(h => h.trim());
      const rows = lines.slice(2).map(line =>
        line.split('|').slice(1, -1).map(cell => cell.trim())
      );
      nodes.push(<SummaryTable key={`table-${index}`} headers={headers} rows={rows} />);
    }
  });

  return <>{nodes}</>;
};

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

export const processPdfText = (content: string): string => {
  let text = content;
  text = text.replace(/<sub>(.*?)<\/sub>/g, '_{$1}');
  text = text.replace(/<sup>(.*?)<\/sup>/g, '^{$1}');
  text = text.replace(/<div class="math-equation block">(.*?)<\/div>/g, '\n\n$1\n\n');
  text = text.replace(/<span class="math-equation">(.*?)<\/span>/g, '$1');
  text = text.replace(/<span class="chemical-formula">(.*?)<\/span>/g, '$1');
  text = text.replace(/<span class="physics-unit">(.*?)<\/span>/g, '$1');
  text = text.replace(/<span class="physics-equation">(.*?)<\/span>/g, '$1');
  text = text.replace(/<pre class="code-block.*?">(.*?)<\/pre>/gs, '\n\n$1\n\n');
  text = text.replace(/<div class="language-identifier">(.*?)<\/div>/g, '');
  text = text.replace(/<code>(.*?)<\/code>/gs, '$1');
  text = text.replace(/<code class="inline-code">(.*?)<\/code>/g, '`$1`');
  text = text.replace(/<div class="note">(.*?)<\/div>/gs, '\n\nNOTE: $1\n\n');
  text = text.replace(/<div class="annotation">(.*?)<\/div>/gs, '\n\nTIP: $1\n\n');
  text = text.replace(/<div class="definition">(.*?)<\/div>/gs, '\n\nDEFINITION: $1\n\n');
  text = text.replace(/<span class="highlight">(.*?)<\/span>/g, '*$1*');
  
  const symbolReplacements: Array<[RegExp, string]> = [
    [/√/g, '√'], [/π/g, 'π'], [/θ/g, 'θ'], [/∑/g, 'Σ'], [/∫/g, '∫'], 
    [/∞/g, '∞'], [/±/g, '±'], [/×/g, '×'], [/÷/g, '÷'], [/≤/g, '≤'], 
    [/≥/g, '≥'], [/≠/g, '≠'], [/→/g, '→'], [/↔/g, '↔'], [/∂/g, '∂'], 
    [/∇/g, '∇'], [/∴/g, '∴'], [/∵/g, '∵'], [/α/g, 'α'], [/β/g, 'β'], 
    [/γ/g, 'γ'], [/δ/g, 'δ'], [/ε/g, 'ε'], [/λ/g, 'λ'], [/µ/g, 'µ'], 
    [/σ/g, 'σ'], [/ω/g, 'ω']
  ];
  
  symbolReplacements.forEach(([pattern, replacement]) => {
    text = text.replace(pattern, replacement);
  });
  
  text = text.replace(/<\/p><p>/g, '\n\n');
  text = text.replace(/<br>/g, '\n');
  text = text.replace(/<p>(.*?)<\/p>/gs, '$1');
  text = text.replace(/<[^>]+>/g, '');
  text = text.replace(/\n\n\n+/g, '\n\n');
  
  return text;
};

const htmlToImage = async (htmlContent: string): Promise<string | null> => {
  try {
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.width = '800px';
    tempDiv.style.fontFamily = '"Inter", "Roboto", "Helvetica", sans-serif';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.innerHTML = htmlContent;
    
    document.body.appendChild(tempDiv);
    
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      allowTaint: true,
      useCORS: true
    });
    
    document.body.removeChild(tempDiv);
    
    return canvas.toDataURL('image/png');
    
  } catch (error) {
    console.error('Error converting HTML to image:', error);
    return null;
  }
};

export const downloadAnswerAsPdf = async (type: 'ask' | 'explain', content: string): Promise<void> => {
  try {
    const formattedHTML = ReactDOMServer.renderToString(<>{processOutputText(content)}</>);
    
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const title = type === 'ask' ? 'StudyBuddy Answer' : 'StudyBuddy Explanation';
    doc.setProperties({
      title: title,
      subject: type === 'ask' ? 'AI-Generated Answer' : 'AI-Generated Explanation',
      author: 'StudyBuddy',
      creator: 'StudyBuddy'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const textWidth = pageWidth - (margin * 2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(79, 70, 229);
    doc.text("StudyBuddy", margin, margin);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(75, 85, 99);
    doc.text(type === 'ask' ? 'AI-Generated Answer' : 'AI-Generated Explanation', margin, margin + 8);
    
    const date = new Date();
    const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    doc.setFontSize(10);
    doc.text(`Generated on: ${formattedDate}`, margin, margin + 15);
    
    doc.setLineWidth(0.5);
    doc.setDrawColor(79, 70, 229);
    doc.line(margin, margin + 20, pageWidth - margin, margin + 20);
    
    try {
      const contentImage = await htmlToImage(formattedHTML);
      
      if (contentImage) {
        const imgWidth = textWidth;
        const tempImg = new Image();
        tempImg.src = contentImage;
        
        await new Promise((resolve) => {
          tempImg.onload = () => {
            const aspectRatio = tempImg.height / tempImg.width;
            const imgHeight = imgWidth * aspectRatio;
            
            const maxFirstPageHeight = pageHeight - (margin * 2) - 40;
            
            if (imgHeight <= maxFirstPageHeight) {
              doc.addImage(contentImage, 'PNG', margin, margin + 30, imgWidth, imgHeight);
            } else {
              throw new Error('Content too large for single image, using text rendering');
            }
            resolve(null);
          };
        });
      } else {
        throw new Error('Image conversion failed, falling back to text');
      }
    } catch (error) {
      console.warn('Using text-based PDF rendering:', error);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(31, 41, 55);
      
      const processedContent = processPdfText(content);
      const contentLines = doc.splitTextToSize(processedContent, textWidth);
      doc.text(contentLines, margin, margin + 30, { lineHeightFactor: 1.5 });
    }
    
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(79, 70, 229);
      doc.text('StudyBuddy - Your Smart Learning Assistant', margin, pageHeight - 10);
      doc.text(`Page ${i} of ${totalPages}`, pageWidth - margin - 25, pageHeight - 10);
    }
    
    const filename = `studybuddy_${type === 'ask' ? 'answer' : 'explanation'}_${date.toISOString().replace(/[:.]/g, '-').slice(0, 19)}.pdf`;
    doc.save(filename);
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};
