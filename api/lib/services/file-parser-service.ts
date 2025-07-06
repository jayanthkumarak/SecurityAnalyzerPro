import * as fs from 'fs';
import * as path from 'path';

export interface ParsedFile {
  filename: string;
  content: string;
  metadata: {
    size: number;
    type: string;
    encoding?: string;
  };
}

export class FileParserService {
  /**
   * Parse a file buffer and extract text content based on file type
   */
  async parseFile(buffer: Buffer, filename: string, mimeType: string): Promise<ParsedFile> {
    const fileExtension = path.extname(filename).toLowerCase();
    let content = '';
    let encoding = 'utf-8';

    try {
      switch (fileExtension) {
        case '.json':
          content = this.parseJSON(buffer);
          break;
        
        case '.xml':
          content = this.parseXML(buffer);
          break;
        
        case '.csv':
          content = this.parseCSV(buffer);
          break;
        
        case '.log':
        case '.txt':
          content = buffer.toString('utf-8');
          break;
        
        case '.evtx':
          content = this.parseEVTX(buffer);
          break;
        
        default:
          // Try to parse as text
          content = this.tryParseAsText(buffer);
      }
    } catch (error) {
      console.error(`Error parsing file ${filename}:`, error);
      // Fallback to hex dump for binary files
      content = this.createHexDump(buffer);
    }

    return {
      filename,
      content,
      metadata: {
        size: buffer.length,
        type: mimeType || 'application/octet-stream',
        encoding
      }
    };
  }

  private parseJSON(buffer: Buffer): string {
    try {
      const jsonData = JSON.parse(buffer.toString('utf-8'));
      return JSON.stringify(jsonData, null, 2);
    } catch (error) {
      // If not valid JSON, return raw content
      return buffer.toString('utf-8');
    }
  }

  private parseXML(buffer: Buffer): string {
    // For now, just return the raw XML
    // In production, you might want to use an XML parser
    return buffer.toString('utf-8');
  }

  private parseCSV(buffer: Buffer): string {
    // Return raw CSV content
    // In production, you might want to parse and format it
    return buffer.toString('utf-8');
  }

  private parseEVTX(buffer: Buffer): string {
    // Windows Event Log files are binary
    // For now, we'll create a summary
    const header = buffer.slice(0, 8).toString('utf-8');
    
    if (header.startsWith('ElfFile')) {
      return `Windows Event Log File (.evtx)
Size: ${buffer.length} bytes
Header: ${header}

Note: This is a binary Windows Event Log file. 
For full analysis, specialized EVTX parsing tools are recommended.

First 1KB of hex dump:
${this.createHexDump(buffer.slice(0, 1024))}`;
    }
    
    return this.createHexDump(buffer);
  }

  private tryParseAsText(buffer: Buffer): string {
    // Check if the buffer contains mostly printable characters
    const sample = buffer.slice(0, Math.min(1000, buffer.length));
    let printableCount = 0;
    
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];
      // Check if it's a printable ASCII character or common whitespace
      if ((byte >= 32 && byte <= 126) || [9, 10, 13].includes(byte)) {
        printableCount++;
      }
    }
    
    // If more than 80% of the sample is printable, treat as text
    if (printableCount / sample.length > 0.8) {
      return buffer.toString('utf-8');
    }
    
    // Otherwise, create a hex dump
    return this.createHexDump(buffer);
  }

  private createHexDump(buffer: Buffer): string {
    const lines: string[] = [];
    const bytesPerLine = 16;
    const maxLines = 100; // Limit hex dump to first 100 lines
    
    lines.push('Hex dump of binary file:');
    lines.push('');
    
    for (let i = 0; i < Math.min(buffer.length, maxLines * bytesPerLine); i += bytesPerLine) {
      const offset = i.toString(16).padStart(8, '0');
      const bytes = buffer.slice(i, i + bytesPerLine);
      
      // Hex values
      const hex = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join(' ');
      
      // ASCII representation
      const ascii = Array.from(bytes)
        .map(b => (b >= 32 && b <= 126) ? String.fromCharCode(b) : '.')
        .join('');
      
      lines.push(`${offset}  ${hex.padEnd(48, ' ')}  |${ascii}|`);
    }
    
    if (buffer.length > maxLines * bytesPerLine) {
      lines.push('');
      lines.push(`... (${buffer.length - maxLines * bytesPerLine} more bytes)`);
    }
    
    return lines.join('\n');
  }

  /**
   * Extract summary information from parsed content
   */
  extractSummary(content: string, maxLength: number = 50000): string {
    if (content.length <= maxLength) {
      return content;
    }
    
    // Take first part and last part to preserve context
    const halfLength = Math.floor(maxLength / 2);
    const firstPart = content.slice(0, halfLength);
    const lastPart = content.slice(-halfLength);
    
    return `${firstPart}\n\n... [Content truncated - ${content.length - maxLength} characters omitted] ...\n\n${lastPart}`;
  }
} 