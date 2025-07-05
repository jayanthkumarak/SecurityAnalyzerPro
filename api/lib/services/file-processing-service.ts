import * as crypto from 'crypto';

export interface FileAnalysis {
  fileType: string;
  mimeType: string;
  size: number;
  hash: string;
  entropy: number;
  suspiciousIndicators: string[];
  summary: string;
}

export async function analyzeArtifact(buffer: Buffer): Promise<FileAnalysis> {
  const fileType = detectFileType(buffer);
  const mimeType = getMimeType(fileType);
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');
  const entropy = calculateEntropy(buffer);
  const suspiciousIndicators = findSuspiciousIndicators(buffer);

  return {
    fileType,
    mimeType,
    size: buffer.length,
    hash,
    entropy,
    suspiciousIndicators,
    summary: generateSummary(fileType, buffer.length, entropy, suspiciousIndicators)
  };
}

function detectFileType(buffer: Buffer): string {
  const header = buffer.slice(0, 512).toString('hex').toLowerCase();

  // Windows Prefetch files (.pf)
  if (header.startsWith('11000000') || header.startsWith('17000000') || header.startsWith('1a000000')) {
    return 'prefetch';
  }

  // Windows Event Log files (.evtx)
  if (header.startsWith('456c6656')) {
    return 'evtx';
  }

  // Windows Registry hives
  if (header.startsWith('72656766')) {
    return 'registry';
  }

  // Memory dump indicators
  if (header.includes('50414745') || header.includes('4d444d50')) {
    return 'memory';
  }

  // Network packet capture
  if (header.startsWith('d4c3b2a1') || header.startsWith('a1b2c3d4')) {
    return 'network';
  }

  return 'unknown';
}

function getMimeType(fileType: string): string {
  const mimeTypes: Record<string, string> = {
    prefetch: 'application/octet-stream',
    evtx: 'application/x-ms-evtx',
    registry: 'application/x-ms-registry',
    memory: 'application/x-memory-dump',
    network: 'application/vnd.tcpdump.pcap',
    unknown: 'application/octet-stream',
  };
  return mimeTypes[fileType] || 'application/octet-stream';
}

function calculateEntropy(buffer: Buffer): number {
  const byteCounts = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    byteCounts[buffer[i]]++;
  }

  let entropy = 0;
  const totalBytes = buffer.length;
  
  for (const count of byteCounts) {
    if (count > 0) {
      const probability = count / totalBytes;
      entropy -= probability * Math.log2(probability);
    }
  }
  
  return entropy;
}

function findSuspiciousIndicators(buffer: Buffer): string[] {
  const indicators: string[] = [];
  const data = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));

  // Check for suspicious patterns
  if (data.includes('cmd.exe') || data.includes('powershell')) {
    indicators.push('Command execution indicators');
  }
  
  if (data.includes('http://') || data.includes('https://')) {
    indicators.push('Network activity indicators');
  }
  
  if (data.includes('admin') || data.includes('administrator')) {
    indicators.push('Privilege escalation indicators');
  }

  return indicators;
}

function generateSummary(fileType: string, size: number, entropy: number, indicators: string[]): string {
  const sizeMB = (size / 1024 / 1024).toFixed(2);
  const entropyLevel = entropy > 7.5 ? 'high' : entropy > 5 ? 'medium' : 'low';
  
  return `File type: ${fileType}, Size: ${sizeMB}MB, Entropy: ${entropyLevel} (${entropy.toFixed(2)}), Indicators: ${indicators.length}`;
}
