import { FileAnalysis } from './file-processing-service';
import { marked } from 'marked';

export async function renderReport(analysis: FileAnalysis, format: string = 'md'): Promise<string> {
  const timestamp = new Date().toISOString();
  
  if (format === 'md') {
    return `# Forensic Analysis Report

**Generated:** ${timestamp}
**File Type:** ${analysis.fileType}
**Size:** ${(analysis.size / 1024 / 1024).toFixed(2)} MB
**Hash:** \`${analysis.hash}\`
**Entropy:** ${analysis.entropy.toFixed(2)} (${analysis.entropy > 7.5 ? 'High' : analysis.entropy > 5 ? 'Medium' : 'Low'})

## Analysis Summary

${analysis.summary}

## Security Indicators

${analysis.suspiciousIndicators.length > 0 
  ? analysis.suspiciousIndicators.map(indicator => `- ⚠️ ${indicator}`).join('\n')
  : '- ✅ No suspicious indicators detected'
}

## Technical Details

- **MIME Type:** ${analysis.mimeType}
- **File Type Detection:** ${analysis.fileType}
- **Entropy Analysis:** ${analysis.entropy.toFixed(2)} bits per byte
- **Security Score:** ${calculateSecurityScore(analysis)}/10

## Recommendations

${generateRecommendations(analysis)}
`;
  }
  
  return JSON.stringify(analysis, null, 2);
}

function calculateSecurityScore(analysis: FileAnalysis): number {
  let score = 10;
  
  // Deduct points for suspicious indicators
  score -= analysis.suspiciousIndicators.length * 2;
  
  // Deduct points for high entropy (potentially encrypted/compressed)
  if (analysis.entropy > 7.5) {
    score -= 1;
  }
  
  // Deduct points for certain file types
  if (analysis.fileType === 'unknown') {
    score -= 1;
  }
  
  return Math.max(0, score);
}

function generateRecommendations(analysis: FileAnalysis): string {
  const recommendations: string[] = [];
  
  if (analysis.suspiciousIndicators.length > 0) {
    recommendations.push('🔍 **Conduct deeper analysis** - Suspicious indicators detected');
  }
  
  if (analysis.entropy > 7.5) {
    recommendations.push('🔐 **Check for encryption** - High entropy suggests encrypted content');
  }
  
  if (analysis.fileType === 'unknown') {
    recommendations.push('❓ **Verify file type** - Unknown file type detected');
  }
  
  if (analysis.size > 100 * 1024 * 1024) { // 100MB
    recommendations.push('📁 **Large file** - Consider sampling for analysis');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('✅ **File appears normal** - No immediate concerns detected');
  }
  
  return recommendations.join('\n\n');
}

export interface RichReportOptions {
  includeCharts?: boolean;
  includeTimeline?: boolean;
  includeInteractiveElements?: boolean;
  theme?: 'professional' | 'modern' | 'minimal';
}

export class ReportGenerationService {
  
  /**
   * Converts Claude's markdown output to rich interactive HTML
   */
  async generateRichHTMLReport(markdownContent: string, options: RichReportOptions = {}): Promise<string> {
    const {
      includeCharts = true,
      includeTimeline = true,
      includeInteractiveElements = true,
      theme = 'professional'
    } = options;

    // Parse markdown to HTML
    const rawHTML = await marked(markdownContent);
    
    // Basic HTML sanitization (remove script tags and dangerous attributes)
    const sanitizedHTML = this.sanitizeHTML(rawHTML);
    
    // Enhance with rich formatting
    const enhancedHTML = this.enhanceHTML(sanitizedHTML, {
      includeCharts,
      includeTimeline,
      includeInteractiveElements,
      theme
    });
    
    // Wrap in complete HTML document
    return this.wrapInDocument(enhancedHTML, theme);
  }

  private sanitizeHTML(html: string): string {
    return html
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers
      .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: URLs
      .replace(/javascript:/gi, '')
      // Remove data: URLs
      .replace(/data:/gi, '')
      // Remove vbscript: URLs
      .replace(/vbscript:/gi, '')
      // Remove iframe tags
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      // Remove object tags
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      // Remove embed tags
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      // Remove form tags
      .replace(/<form\b[^<]*(?:(?!<\/form>)<[^<]*)*<\/form>/gi, '')
      // Remove input tags
      .replace(/<input\b[^<]*>/gi, '')
      // Remove button tags
      .replace(/<button\b[^<]*(?:(?!<\/button>)<[^<]*)*<\/button>/gi, '')
      // Remove select tags
      .replace(/<select\b[^<]*(?:(?!<\/select>)<[^<]*)*<\/select>/gi, '')
      // Remove textarea tags
      .replace(/<textarea\b[^<]*(?:(?!<\/textarea>)<[^<]*)*<\/textarea>/gi, '');
  }

  private enhanceHTML(html: string, options: RichReportOptions): string {
    let enhanced = html;
    
    // Add CSS classes for styling
    enhanced = this.addStylingClasses(enhanced);
    
    // Convert headers to interactive sections
    if (options.includeInteractiveElements) {
      enhanced = this.makeHeadersInteractive(enhanced);
    }
    
    // Add collapsible sections
    if (options.includeInteractiveElements) {
      enhanced = this.addCollapsibleSections(enhanced);
    }
    
    // Add severity indicators
    enhanced = this.addSeverityIndicators(enhanced);
    
    // Add progress indicators
    enhanced = this.addProgressIndicators(enhanced);
    
    // Add interactive lists
    enhanced = this.makeListsInteractive(enhanced);
    
    return enhanced;
  }

  private addStylingClasses(html: string): string {
    return html
      // Headers
      .replace(/<h1>/g, '<h1 class="report-header report-h1">')
      .replace(/<h2>/g, '<h2 class="report-header report-h2">')
      .replace(/<h3>/g, '<h3 class="report-header report-h3">')
      .replace(/<h4>/g, '<h4 class="report-header report-h4">')
      
      // Paragraphs
      .replace(/<p>/g, '<p class="report-paragraph">')
      
      // Lists
      .replace(/<ul>/g, '<ul class="report-list">')
      .replace(/<ol>/g, '<ol class="report-list">')
      .replace(/<li>/g, '<li class="report-list-item">')
      
      // Code blocks
      .replace(/<code>/g, '<code class="report-code">')
      .replace(/<pre>/g, '<pre class="report-pre">')
      
      // Blockquotes
      .replace(/<blockquote>/g, '<blockquote class="report-blockquote">')
      
      // Tables
      .replace(/<table>/g, '<table class="report-table">')
      .replace(/<th>/g, '<th class="report-th">')
      .replace(/<td>/g, '<td class="report-td">');
  }

  private makeHeadersInteractive(html: string): string {
    return html.replace(
      /<h([2-4]) class="report-header report-h([2-4])">([^<]+)<\/h([2-4])>/g,
      '<h$1 class="report-header report-h$2 interactive-header" onclick="toggleSection(this)">$3 <span class="toggle-icon">▼</span></h$1>'
    );
  }

  private addCollapsibleSections(html: string): string {
    // Find sections between headers and wrap them
    const sections = html.split(/(<h[2-4] class="report-header[^>]*>.*?<\/h[2-4]>)/);
    let result = '';
    
    for (let i = 0; i < sections.length; i++) {
      if (sections[i].match(/<h[2-4] class="report-header/)) {
        // This is a header, keep as is
        result += sections[i];
      } else if (sections[i].trim()) {
        // This is content, wrap in collapsible div
        result += `<div class="collapsible-section">${sections[i]}</div>`;
      }
    }
    
    return result;
  }

  private addSeverityIndicators(html: string): string {
    return html
      .replace(/\b(CRITICAL|critical)\b/g, '<span class="severity-indicator severity-critical">CRITICAL</span>')
      .replace(/\b(HIGH|high)\b/g, '<span class="severity-indicator severity-high">HIGH</span>')
      .replace(/\b(MEDIUM|medium)\b/g, '<span class="severity-indicator severity-medium">MEDIUM</span>')
      .replace(/\b(LOW|low)\b/g, '<span class="severity-indicator severity-low">LOW</span>');
  }

  private addProgressIndicators(html: string): string {
    // Add progress bars for confidence scores
    return html.replace(
      /(\d+)% confidence/g,
      '<div class="confidence-indicator"><span class="confidence-label">$1% confidence</span><div class="confidence-bar"><div class="confidence-fill" style="width: $1%"></div></div></div>'
    );
  }

  private makeListsInteractive(html: string): string {
    return html.replace(
      /<ul class="report-list">/g,
      '<ul class="report-list interactive-list">'
    ).replace(
      /<ol class="report-list">/g,
      '<ol class="report-list interactive-list">'
    );
  }

  private wrapInDocument(content: string, theme: string): string {
    const css = this.getThemeCSS(theme);
    const js = this.getInteractiveJS();
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Forensic Analysis Report</title>
    <style>
        ${css}
    </style>
</head>
<body>
    <div class="report-container">
        <header class="report-header-main">
            <h1 class="report-title">Forensic Analysis Report</h1>
            <div class="report-meta">
                <span class="report-date">Generated: ${new Date().toLocaleDateString()}</span>
                <span class="report-time">${new Date().toLocaleTimeString()}</span>
            </div>
        </header>
        
        <main class="report-content">
            ${content}
        </main>
        
        <footer class="report-footer">
            <p>Generated by ForensicAnalyzerPro Multi-LLM Analysis Engine</p>
        </footer>
    </div>
    
    <script>
        ${js}
    </script>
</body>
</html>`;
  }

  private getThemeCSS(theme: string): string {
    const baseCSS = `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            line-height: 1.6;
            color: #1F2937;
            background: #F8FAFC;
        }
        
        .report-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
            overflow: hidden;
        }
        
        .report-header-main {
            background: linear-gradient(135deg, #2563EB, #1D4ED8);
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .report-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }
        
        .report-meta {
            display: flex;
            justify-content: center;
            gap: 2rem;
            font-size: 0.9rem;
            opacity: 0.9;
        }
        
        .report-content {
            padding: 2rem;
        }
        
        .report-footer {
            background: #F3F4F6;
            padding: 1rem 2rem;
            text-align: center;
            color: #6B7280;
            font-size: 0.9rem;
        }
        
        .report-header {
            margin: 2rem 0 1rem 0;
            font-weight: 600;
            color: #1F2937;
        }
        
        .report-h1 { font-size: 2rem; }
        .report-h2 { font-size: 1.5rem; }
        .report-h3 { font-size: 1.25rem; }
        .report-h4 { font-size: 1.1rem; }
        
        .report-paragraph {
            margin-bottom: 1rem;
            color: #374151;
        }
        
        .report-list {
            margin: 1rem 0;
            padding-left: 2rem;
        }
        
        .report-list-item {
            margin-bottom: 0.5rem;
            color: #374151;
        }
        
        .report-code {
            background: #F3F4F6;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
        }
        
        .report-pre {
            background: #F3F4F6;
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1rem 0;
        }
        
        .report-blockquote {
            border-left: 4px solid #2563EB;
            padding-left: 1rem;
            margin: 1rem 0;
            font-style: italic;
            color: #6B7280;
        }
        
        .report-table {
            width: 100%;
            border-collapse: collapse;
            margin: 1rem 0;
        }
        
        .report-th, .report-td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #E5E7EB;
        }
        
        .report-th {
            background: #F9FAFB;
            font-weight: 600;
        }
        
        .severity-indicator {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.8rem;
        }
        
        .severity-critical {
            background: #FEE2E2;
            color: #DC2626;
        }
        
        .severity-high {
            background: #FEF3C7;
            color: #D97706;
        }
        
        .severity-medium {
            background: #DBEAFE;
            color: #2563EB;
        }
        
        .severity-low {
            background: #D1FAE5;
            color: #059669;
        }
        
        .confidence-indicator {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            margin: 0.5rem 0;
        }
        
        .confidence-label {
            font-size: 0.9rem;
            color: #6B7280;
        }
        
        .confidence-bar {
            width: 100px;
            height: 8px;
            background: #E5E7EB;
            border-radius: 4px;
            overflow: hidden;
        }
        
        .confidence-fill {
            height: 100%;
            background: linear-gradient(90deg, #10B981, #059669);
            transition: width 0.3s ease;
        }
        
        .interactive-header {
            cursor: pointer;
            user-select: none;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            background: #F9FAFB;
            border-radius: 8px;
            margin: 1rem 0;
            transition: background 0.2s ease;
        }
        
        .interactive-header:hover {
            background: #F3F4F6;
        }
        
        .toggle-icon {
            font-size: 0.8rem;
            transition: transform 0.2s ease;
        }
        
        .collapsible-section {
            padding: 1rem;
            border-left: 3px solid #E5E7EB;
            margin-left: 1rem;
            transition: all 0.3s ease;
        }
        
        .collapsible-section.collapsed {
            display: none;
        }
        
        .interactive-list {
            list-style: none;
            padding-left: 0;
        }
        
        .interactive-list .report-list-item {
            padding: 0.5rem;
            border-radius: 4px;
            transition: background 0.2s ease;
        }
        
        .interactive-list .report-list-item:hover {
            background: #F9FAFB;
        }
    `;
    
    return baseCSS;
  }

  private getInteractiveJS(): string {
    return `
        function toggleSection(header) {
            const section = header.nextElementSibling;
            const icon = header.querySelector('.toggle-icon');
            
            if (section && section.classList.contains('collapsible-section')) {
                section.classList.toggle('collapsed');
                icon.style.transform = section.classList.contains('collapsed') ? 'rotate(-90deg)' : 'rotate(0deg)';
            }
        }
        
        // Add click handlers to all interactive headers
        document.addEventListener('DOMContentLoaded', function() {
            const headers = document.querySelectorAll('.interactive-header');
            headers.forEach(header => {
                header.addEventListener('click', function() {
                    toggleSection(this);
                });
            });
        });
        
        // Add smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    `;
  }
}
