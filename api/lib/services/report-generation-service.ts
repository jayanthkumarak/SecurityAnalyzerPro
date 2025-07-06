import { FileAnalysis } from './file-processing-service';

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
