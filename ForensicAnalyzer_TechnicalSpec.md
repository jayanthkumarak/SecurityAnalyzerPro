# ForensicAnalyzer Pro - Technical Specification

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Claude API Integration](#claude-api-integration)
3. [Forensic Analysis Engine](#forensic-analysis-engine)
4. [Security Implementation](#security-implementation)
5. [Data Models](#data-models)
6. [API Specifications](#api-specifications)
7. [Performance Requirements](#performance-requirements)

---

## System Architecture

### High-Level Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    ForensicAnalyzer Pro                     │
├─────────────────────────────────────────────────────────────┤
│                    Presentation Layer                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │   React UI  │ │ Visualizations│ │   Report Generator   │    │
│  │ Components  │ │    (D3.js)    │ │      (HTML/PDF)     │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                    Business Logic Layer                     │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │ Investigation│ │   Analysis  │ │   Case Management   │    │
│  │   Workflow   │ │   Engine    │ │      System         │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │   SQLite    │ │   File      │ │     Artifact        │    │
│  │  Database   │ │  Storage    │ │     Parsers         │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                   Integration Layer                         │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │   Claude    │ │   Security  │ │    External APIs    │    │
│  │  API Client │ │   Services  │ │   (Future: SIEM)    │    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Details

#### Frontend Stack
```typescript
interface FrontendStack {
  framework: 'Electron' | 'Tauri';
  ui: {
    library: 'React 18.x';
    language: 'TypeScript 5.x';
    styling: 'Tailwind CSS 3.x';
    components: 'Radix UI';
    stateManagement: 'Zustand';
    animations: 'Framer Motion';
  };
  visualization: {
    charting: 'Recharts';
    customViz: 'D3.js';
    networkDiagrams: 'Cytoscape.js';
    processTrees: 'React Flow';
  };
  development: {
    bundler: 'Vite';
    testing: 'Jest + React Testing Library';
    e2e: 'Playwright';
    linting: 'ESLint + Prettier';
  };
}
```

#### Backend Stack
```typescript
interface BackendStack {
  runtime: 'Node.js 18.x';
  language: 'TypeScript 5.x';
  database: {
    primary: 'SQLite with better-sqlite3';
    orm: 'Custom lightweight ORM';
    migrations: 'Custom migration system';
  };
  apiIntegration: {
    http: 'Axios with retry logic';
    claude: '@anthropic-ai/sdk';
    validation: 'Zod schemas';
    caching: 'node-cache';
  };
  security: {
    encryption: 'Node.js crypto module';
    hashing: 'bcrypt';
    tokens: 'jsonwebtoken';
    keyManagement: 'keytar (secure storage)';
  };
  fileProcessing: {
    archives: 'node-7z';
    images: 'sharp';
    pdf: 'pdf-parse';
    office: 'mammoth (docx)';
  };
}
```

---

## Claude API Integration

### Enterprise Configuration
```typescript
interface ClaudeApiConfig {
  // Enterprise settings for privacy
  apiKey: string; // Stored securely using keytar
  baseUrl: 'https://api.anthropic.com';
  model: 'claude-3-5-sonnet-20241022';
  maxTokens: 4096;
  temperature: 0.1; // Low temperature for consistent analysis
  anthropicBeta: 'max-tokens-3-5-sonnet-2024-07-15';
  
  // Privacy and compliance settings
  headers: {
    'anthropic-dangerous-direct-browser-access': 'true';
    'x-no-training': 'true'; // Prevent training on user data
    'x-compliance-mode': 'enterprise';
  };
  
  // Rate limiting and retry configuration
  rateLimit: {
    requestsPerMinute: 60;
    requestsPerHour: 1000;
    retryAttempts: 3;
    retryDelay: 1000; // Base delay in ms
    backoffMultiplier: 2;
  };
}
```

### Analysis Prompt Templates

#### Primary Investigation Prompt
```typescript
const INVESTIGATION_PROMPT_TEMPLATE = `
You are an expert digital forensics analyst conducting a comprehensive security investigation. 

INVESTIGATION CONTEXT:
- System: {systemInfo}
- Incident Type: {incidentType}
- Timeline: {timeframe}
- Artifacts Available: {artifactTypes}

ANALYSIS FRAMEWORK:
Please conduct a systematic analysis following these phases:

1. TIMELINE ANALYSIS
   - Establish chronological sequence of events
   - Identify key timestamps and correlations
   - Map process execution patterns

2. PROCESS BEHAVIOR ANALYSIS
   - Examine process trees and parent-child relationships
   - Analyze command-line arguments and execution context
   - Identify unusual or suspicious processes

3. NETWORK COMMUNICATIONS
   - Review network connections and traffic patterns
   - Identify external communications and destinations
   - Assess for command & control indicators

4. PERSISTENCE MECHANISMS
   - Check for malware persistence techniques
   - Examine services, scheduled tasks, and startup locations
   - Validate software legitimacy and digital signatures

5. LSASS ACCESS ANALYSIS (if applicable)
   - Analyze process access rights to LSASS
   - Determine if dangerous permissions were requested
   - Assess credential theft potential

6. THREAT CLASSIFICATION
   - Classify findings as benign, suspicious, or malicious
   - Provide confidence levels for assessments
   - Suggest additional investigation steps if needed

EVIDENCE DATA:
{evidenceData}

RESPONSE FORMAT:
Provide your analysis in structured sections with:
- Clear findings for each analysis phase
- Evidence supporting your conclusions
- Risk assessments with confidence levels
- Actionable recommendations

Focus on accuracy, evidence-based conclusions, and practical recommendations for security teams.
`;
```

#### Specialized Analysis Prompts
```typescript
const LSASS_ANALYSIS_PROMPT = `
Analyze the following LSASS access pattern for potential credential theft:

LSASS ACCESS DETAILS:
- Process: {processName}
- Access Rights: {accessRights}
- Timestamp: {timestamp}
- Process Path: {processPath}
- Digital Signature: {signature}

CRITICAL ANALYSIS POINTS:
1. Does the access pattern include PROCESS_VM_READ or similar dangerous rights?
2. Is this consistent with legitimate software behavior?
3. What is the threat level and confidence assessment?

Provide specific evidence-based conclusions about whether this represents:
- Legitimate software behavior
- Potential credential theft attempt
- Insufficient data for determination

Include specific technical details and recommendations.
`;

const NETWORK_ANALYSIS_PROMPT = `
Analyze network communications for potential threats:

NETWORK DATA:
{networkConnections}

ANALYSIS FOCUS:
1. Identify any suspicious external communications
2. Check for known malicious IPs or domains
3. Assess communication patterns for C2 indicators
4. Validate legitimate business communications

Provide threat assessment with specific indicators and recommendations.
`;
```

### API Client Implementation
```typescript
class ClaudeAnalysisClient {
  private config: ClaudeApiConfig;
  private rateLimiter: RateLimiter;
  private cache: Map<string, CachedResponse>;

  constructor(config: ClaudeApiConfig) {
    this.config = config;
    this.rateLimiter = new RateLimiter(config.rateLimit);
    this.cache = new Map();
  }

  async analyzeEvidence(
    evidence: ForensicEvidence,
    analysisType: AnalysisType
  ): Promise<AnalysisResult> {
    // Generate cache key for identical requests
    const cacheKey = this.generateCacheKey(evidence, analysisType);
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.result;
    }

    // Rate limiting
    await this.rateLimiter.waitForSlot();

    try {
      // Sanitize sensitive data before sending
      const sanitizedEvidence = this.sanitizeEvidence(evidence);
      
      // Select appropriate prompt template
      const prompt = this.buildPrompt(sanitizedEvidence, analysisType);
      
      // Make API request with retry logic
      const response = await this.makeRequestWithRetry({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        messages: [{
          role: 'user',
          content: prompt
        }],
        extra_headers: {
          'x-no-training': 'true'
        }
      });

      // Parse and validate response
      const result = this.parseAnalysisResponse(response);
      
      // Cache successful responses
      this.cache.set(cacheKey, {
        result,
        timestamp: Date.now(),
        ttl: 3600000 // 1 hour
      });

      return result;
    } catch (error) {
      this.handleApiError(error);
      throw error;
    }
  }

  private sanitizeEvidence(evidence: ForensicEvidence): SanitizedEvidence {
    // Remove or mask sensitive information
    return {
      ...evidence,
      usernames: evidence.usernames?.map(() => '[USERNAME]'),
      ipAddresses: evidence.ipAddresses?.map(ip => 
        this.isPrivateIP(ip) ? ip : '[EXTERNAL_IP]'
      ),
      passwords: undefined,
      apiKeys: undefined,
      personalData: undefined
    };
  }

  private async makeRequestWithRetry(request: any): Promise<any> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.config.rateLimit.retryAttempts; attempt++) {
      try {
        return await this.anthropic.messages.create(request);
      } catch (error) {
        lastError = error;
        
        if (attempt < this.config.rateLimit.retryAttempts) {
          const delay = this.config.rateLimit.retryDelay * 
                       Math.pow(this.config.rateLimit.backoffMultiplier, attempt - 1);
          await this.sleep(delay);
        }
      }
    }
    
    throw lastError;
  }
}
```

---

## Forensic Analysis Engine

### Evidence Processing Pipeline
```typescript
interface ForensicEvidence {
  metadata: {
    caseId: string;
    timestamp: number;
    collectingSystem: string;
    integrityHash: string;
  };
  
  systemInfo: {
    hostname: string;
    osVersion: string;
    architecture: string;
    timeZone: string;
    bootTime: number;
  };
  
  processes: ProcessInfo[];
  networkConnections: NetworkConnection[];
  registryEntries: RegistryEntry[];
  fileSystemArtifacts: FileArtifact[];
  eventLogs: EventLogEntry[];
  prefetchFiles: PrefetchFile[];
  scheduledTasks: ScheduledTask[];
  services: ServiceInfo[];
}

interface ProcessInfo {
  pid: number;
  name: string;
  path: string;
  commandLine: string;
  parentPid: number;
  startTime: number;
  endTime?: number;
  user: string;
  workingDirectory: string;
  memoryUsage: number;
  cpuUsage: number;
  networkConnections: number[];
  fileAccesses: FileAccess[];
  registryAccesses: RegistryAccess[];
}

interface NetworkConnection {
  id: string;
  protocol: 'TCP' | 'UDP';
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  state: 'LISTENING' | 'ESTABLISHED' | 'TIME_WAIT' | 'CLOSED';
  pid: number;
  processName: string;
  timestamp: number;
  bytesTransferred: number;
}
```

### Analysis Algorithms

#### Timeline Correlation Engine
```typescript
class TimelineAnalyzer {
  analyzeEventSequence(evidence: ForensicEvidence): TimelineAnalysis {
    const events = this.extractEvents(evidence);
    const correlatedEvents = this.correlateEvents(events);
    const suspiciousPatterns = this.detectSuspiciousPatterns(correlatedEvents);
    
    return {
      timeline: correlatedEvents,
      suspiciousPatterns,
      keyEvents: this.identifyKeyEvents(correlatedEvents),
      recommendations: this.generateRecommendations(suspiciousPatterns)
    };
  }

  private correlateEvents(events: TimelineEvent[]): CorrelatedEvent[] {
    return events
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((event, index) => {
        const relatedEvents = this.findRelatedEvents(event, events, index);
        return {
          ...event,
          relatedEvents,
          correlationScore: this.calculateCorrelationScore(event, relatedEvents)
        };
      });
  }

  private detectSuspiciousPatterns(events: CorrelatedEvent[]): SuspiciousPattern[] {
    const patterns: SuspiciousPattern[] = [];
    
    // Detect rapid process creation
    patterns.push(...this.detectRapidProcessCreation(events));
    
    // Detect unusual network patterns
    patterns.push(...this.detectUnusualNetworkActivity(events));
    
    // Detect LSASS access patterns
    patterns.push(...this.detectLSASSAccess(events));
    
    // Detect persistence mechanisms
    patterns.push(...this.detectPersistenceMechanisms(events));
    
    return patterns;
  }
}
```

#### LSASS Access Analyzer
```typescript
class LSASSAccessAnalyzer {
  analyzeLSASSAccess(
    processAccess: ProcessAccess[],
    processInfo: ProcessInfo
  ): LSASSAnalysisResult {
    const lsassAccesses = processAccess.filter(access => 
      access.targetProcess.toLowerCase().includes('lsass')
    );

    if (lsassAccesses.length === 0) {
      return { threatLevel: 'NONE', confidence: 1.0 };
    }

    const analysis = lsassAccesses.map(access => {
      const dangerousRights = this.checkDangerousAccessRights(access.accessRights);
      const legitimacyCheck = this.checkProcessLegitimacy(processInfo);
      const contextAnalysis = this.analyzeAccessContext(access, processInfo);
      
      return {
        access,
        dangerousRights,
        legitimacyCheck,
        contextAnalysis,
        threatScore: this.calculateThreatScore(dangerousRights, legitimacyCheck, contextAnalysis)
      };
    });

    return this.generateLSASSAssessment(analysis);
  }

  private checkDangerousAccessRights(accessRights: string[]): DangerousRightsCheck {
    const dangerousRights = [
      'PROCESS_VM_READ',        // Memory reading - credential dumping
      'PROCESS_QUERY_INFORMATION', // Process information - reconnaissance
      'PROCESS_DUP_HANDLE',     // Handle duplication - privilege escalation
      'PROCESS_VM_WRITE',       // Memory writing - code injection
      'PROCESS_CREATE_THREAD'   // Thread creation - code injection
    ];

    const benignRights = [
      'ReadData',               // File metadata only
      'QueryName',              // Object name queries
      'ReadControl',            // Security descriptor reading
      'SYNCHRONIZE'             // Object synchronization
    ];

    const foundDangerous = accessRights.filter(right => 
      dangerousRights.includes(right)
    );
    
    const foundBenign = accessRights.filter(right => 
      benignRights.includes(right)
    );

    return {
      hasDangerousRights: foundDangerous.length > 0,
      dangerousRights: foundDangerous,
      benignRights: foundBenign,
      riskLevel: this.calculateRiskLevel(foundDangerous, foundBenign)
    };
  }

  private checkProcessLegitimacy(processInfo: ProcessInfo): LegitimacyCheck {
    return {
      digitalSignature: this.verifyDigitalSignature(processInfo.path),
      installationPath: this.validateInstallationPath(processInfo.path),
      knownGoodProcess: this.checkKnownGoodDatabase(processInfo),
      reputationScore: this.calculateReputationScore(processInfo)
    };
  }
}
```

#### Network Communication Analyzer
```typescript
class NetworkAnalyzer {
  analyzeNetworkCommunications(
    connections: NetworkConnection[],
    processes: ProcessInfo[]
  ): NetworkAnalysisResult {
    const externalConnections = connections.filter(conn => 
      !this.isPrivateIP(conn.remoteAddress)
    );

    const suspiciousConnections = externalConnections.filter(conn =>
      this.isSuspiciousConnection(conn)
    );

    const c2Indicators = this.detectC2Patterns(externalConnections);
    const dataExfiltration = this.detectDataExfiltration(externalConnections);

    return {
      totalConnections: connections.length,
      externalConnections: externalConnections.length,
      suspiciousConnections,
      c2Indicators,
      dataExfiltration,
      threatLevel: this.calculateNetworkThreatLevel(
        suspiciousConnections,
        c2Indicators,
        dataExfiltration
      )
    };
  }

  private detectC2Patterns(connections: NetworkConnection[]): C2Indicator[] {
    const indicators: C2Indicator[] = [];

    // Detect beaconing patterns
    indicators.push(...this.detectBeaconing(connections));

    // Detect unusual ports
    indicators.push(...this.detectUnusualPorts(connections));

    // Detect suspicious domains
    indicators.push(...this.detectSuspiciousDomains(connections));

    // Detect encrypted communication to unusual destinations
    indicators.push(...this.detectEncryptedC2(connections));

    return indicators;
  }

  private isPrivateIP(ip: string): boolean {
    const privateRanges = [
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^127\./,
      /^169\.254\./
    ];

    return privateRanges.some(range => range.test(ip));
  }
}
```

---

## Security Implementation

### Encryption and Data Protection
```typescript
class SecurityManager {
  private encryptionKey: Buffer;
  private readonly algorithm = 'aes-256-gcm';

  constructor() {
    this.encryptionKey = this.deriveEncryptionKey();
  }

  encryptSensitiveData(data: any): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
    cipher.setAAD(Buffer.from('forensic-analyzer-aad'));

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
      algorithm: this.algorithm
    };
  }

  decryptSensitiveData(encryptedData: EncryptedData): any {
    const decipher = crypto.createDecipher(
      encryptedData.algorithm,
      this.encryptionKey
    );
    
    decipher.setAAD(Buffer.from('forensic-analyzer-aad'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.encrypted, 'base64')),
      decipher.final()
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  private deriveEncryptionKey(): Buffer {
    const userKey = this.getUserMasterKey();
    const salt = this.getOrCreateSalt();
    
    return crypto.pbkdf2Sync(userKey, salt, 100000, 32, 'sha256');
  }

  // Secure credential storage using keytar
  async storeCredentials(service: string, account: string, password: string): Promise<void> {
    await keytar.setPassword(service, account, password);
  }

  async retrieveCredentials(service: string, account: string): Promise<string | null> {
    return await keytar.getPassword(service, account);
  }
}
```

### Access Control and Authentication
```typescript
interface UserRole {
  id: string;
  name: string;
  permissions: Permission[];
}

interface Permission {
  resource: 'cases' | 'reports' | 'settings' | 'admin';
  actions: ('read' | 'write' | 'delete' | 'share')[];
}

class AccessControlManager {
  private userRoles: Map<string, UserRole> = new Map();

  constructor() {
    this.initializeDefaultRoles();
  }

  private initializeDefaultRoles(): void {
    // Analyst role - basic analysis capabilities
    this.userRoles.set('analyst', {
      id: 'analyst',
      name: 'Security Analyst',
      permissions: [
        { resource: 'cases', actions: ['read', 'write'] },
        { resource: 'reports', actions: ['read', 'write'] }
      ]
    });

    // Senior Analyst - advanced capabilities
    this.userRoles.set('senior-analyst', {
      id: 'senior-analyst',
      name: 'Senior Security Analyst',
      permissions: [
        { resource: 'cases', actions: ['read', 'write', 'share'] },
        { resource: 'reports', actions: ['read', 'write', 'share'] },
        { resource: 'settings', actions: ['read'] }
      ]
    });

    // Administrator - full access
    this.userRoles.set('admin', {
      id: 'admin',
      name: 'Administrator',
      permissions: [
        { resource: 'cases', actions: ['read', 'write', 'delete', 'share'] },
        { resource: 'reports', actions: ['read', 'write', 'delete', 'share'] },
        { resource: 'settings', actions: ['read', 'write'] },
        { resource: 'admin', actions: ['read', 'write'] }
      ]
    });
  }

  checkPermission(userRole: string, resource: string, action: string): boolean {
    const role = this.userRoles.get(userRole);
    if (!role) return false;

    const permission = role.permissions.find(p => p.resource === resource);
    return permission?.actions.includes(action as any) || false;
  }
}
```

---

## Data Models

### Database Schema
```sql
-- Cases table for investigation management
CREATE TABLE cases (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT CHECK(status IN ('active', 'closed', 'archived')) DEFAULT 'active',
    priority TEXT CHECK(priority IN ('low', 'medium', 'high', 'critical')) DEFAULT 'medium',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    created_by TEXT NOT NULL,
    assigned_to TEXT,
    metadata TEXT -- JSON blob for flexible metadata
);

-- Evidence table for artifact tracking
CREATE TABLE evidence (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_hash TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT,
    upload_timestamp INTEGER NOT NULL,
    processed_timestamp INTEGER,
    status TEXT CHECK(status IN ('uploaded', 'processing', 'processed', 'failed')) DEFAULT 'uploaded',
    metadata TEXT, -- JSON blob for parsed metadata
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Analysis results table
CREATE TABLE analysis_results (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    evidence_id TEXT,
    analysis_type TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    claude_request TEXT NOT NULL, -- Encrypted request data
    claude_response TEXT NOT NULL, -- Encrypted response data
    confidence_score REAL,
    threat_level TEXT CHECK(threat_level IN ('none', 'low', 'medium', 'high', 'critical')),
    created_at INTEGER NOT NULL,
    analysis_duration INTEGER, -- Duration in milliseconds
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (evidence_id) REFERENCES evidence(id) ON DELETE SET NULL
);

-- Reports table
CREATE TABLE reports (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    title TEXT NOT NULL,
    template_name TEXT NOT NULL,
    content TEXT NOT NULL, -- HTML/JSON content
    format TEXT CHECK(format IN ('html', 'pdf', 'docx')) DEFAULT 'html',
    generated_at INTEGER NOT NULL,
    generated_by TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    is_final BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- Audit log for compliance
CREATE TABLE audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details TEXT, -- JSON details
    timestamp INTEGER NOT NULL,
    ip_address TEXT,
    user_agent TEXT
);

-- Configuration table for application settings
CREATE TABLE configuration (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    encrypted BOOLEAN DEFAULT FALSE,
    updated_at INTEGER NOT NULL,
    updated_by TEXT NOT NULL
);
```

### TypeScript Models
```typescript
interface Case {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'closed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  updatedAt: number;
  createdBy: string;
  assignedTo?: string;
  metadata?: Record<string, any>;
  
  // Related data (populated by joins)
  evidence?: Evidence[];
  analysisResults?: AnalysisResult[];
  reports?: Report[];
}

interface Evidence {
  id: string;
  caseId: string;
  name: string;
  filePath: string;
  fileHash: string;
  fileSize: number;
  mimeType?: string;
  uploadTimestamp: number;
  processedTimestamp?: number;
  status: 'uploaded' | 'processing' | 'processed' | 'failed';
  metadata?: Record<string, any>;
}

interface AnalysisResult {
  id: string;
  caseId: string;
  evidenceId?: string;
  analysisType: string;
  promptTemplate: string;
  claudeRequest: string; // Encrypted
  claudeResponse: string; // Encrypted
  confidenceScore?: number;
  threatLevel?: 'none' | 'low' | 'medium' | 'high' | 'critical';
  createdAt: number;
  analysisDuration?: number;
}

interface Report {
  id: string;
  caseId: string;
  title: string;
  templateName: string;
  content: string; // HTML/JSON
  format: 'html' | 'pdf' | 'docx';
  generatedAt: number;
  generatedBy: string;
  version: number;
  isFinal: boolean;
}
```

---

## API Specifications

### Internal API Endpoints

#### Case Management API
```typescript
// GET /api/cases - List all cases
interface GetCasesResponse {
  cases: Case[];
  total: number;
  page: number;
  pageSize: number;
}

// POST /api/cases - Create new case
interface CreateCaseRequest {
  name: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  metadata?: Record<string, any>;
}

// PUT /api/cases/:id - Update case
interface UpdateCaseRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'closed' | 'archived';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  metadata?: Record<string, any>;
}
```

#### Evidence Management API
```typescript
// POST /api/cases/:caseId/evidence - Upload evidence
interface UploadEvidenceRequest {
  files: File[];
  metadata?: Record<string, any>;
}

// GET /api/evidence/:id/analysis - Get analysis results
interface GetAnalysisResponse {
  results: AnalysisResult[];
  summary: {
    totalAnalyses: number;
    threatLevels: Record<string, number>;
    averageConfidence: number;
  };
}

// POST /api/evidence/:id/analyze - Trigger analysis
interface AnalyzeEvidenceRequest {
  analysisType: 'comprehensive' | 'lsass' | 'network' | 'timeline' | 'custom';
  customPrompt?: string;
  options?: {
    deepAnalysis?: boolean;
    includeRecommendations?: boolean;
    focusAreas?: string[];
  };
}
```

#### Report Generation API
```typescript
// POST /api/cases/:caseId/reports - Generate report
interface GenerateReportRequest {
  title: string;
  templateName: string;
  format: 'html' | 'pdf' | 'docx';
  includeEvidence?: string[]; // Evidence IDs
  includeAnalysis?: string[]; // Analysis result IDs
  customSections?: ReportSection[];
  branding?: {
    logo?: string;
    primaryColor?: string;
    companyName?: string;
  };
}

interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'table' | 'chart' | 'timeline';
  order: number;
}
```

---

## Performance Requirements

### System Performance Targets
```typescript
interface PerformanceTargets {
  applicationStartup: {
    cold: 5000; // 5 seconds maximum
    warm: 2000; // 2 seconds maximum
  };
  
  fileProcessing: {
    small: 10000; // <100MB in 10 seconds
    medium: 30000; // 100MB-1GB in 30 seconds
    large: 120000; // 1GB-10GB in 2 minutes
  };
  
  aiAnalysis: {
    simple: 15000; // Simple analysis in 15 seconds
    comprehensive: 45000; // Comprehensive analysis in 45 seconds
    complex: 90000; // Complex analysis in 90 seconds
  };
  
  reportGeneration: {
    html: 5000; // HTML reports in 5 seconds
    pdf: 15000; // PDF reports in 15 seconds
    docx: 20000; // Word documents in 20 seconds
  };
  
  uiResponsiveness: {
    interaction: 100; // UI interactions within 100ms
    navigation: 300; // Page navigation within 300ms
    search: 1000; // Search results within 1 second
  };
  
  memoryUsage: {
    baseline: 512 * 1024 * 1024; // 512MB baseline
    maximum: 4 * 1024 * 1024 * 1024; // 4GB maximum
    processing: 2 * 1024 * 1024 * 1024; // 2GB during processing
  };
}
```

### Optimization Strategies
```typescript
class PerformanceOptimizer {
  // Implement streaming for large file processing
  async processLargeFile(filePath: string): Promise<ProcessingResult> {
    const stream = fs.createReadStream(filePath, { highWaterMark: 64 * 1024 });
    const processor = new StreamingProcessor();
    
    return new Promise((resolve, reject) => {
      const results: any[] = [];
      
      stream
        .pipe(processor)
        .on('data', (chunk) => {
          results.push(this.processChunk(chunk));
        })
        .on('end', () => {
          resolve(this.combineResults(results));
        })
        .on('error', reject);
    });
  }

  // Implement intelligent caching
  private cache = new Map<string, CacheEntry>();
  
  async getCachedAnalysis(key: string): Promise<AnalysisResult | null> {
    const entry = this.cache.get(key);
    if (!entry || this.isCacheExpired(entry)) {
      return null;
    }
    return entry.data;
  }

  setCachedAnalysis(key: string, data: AnalysisResult): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 3600000 // 1 hour
    });
  }

  // Implement background processing for non-blocking operations
  async processInBackground<T>(
    operation: () => Promise<T>,
    onProgress?: (progress: number) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const worker = new Worker('./background-processor.js');
      
      worker.postMessage({ operation: operation.toString() });
      
      worker.on('message', (event) => {
        if (event.type === 'progress' && onProgress) {
          onProgress(event.progress);
        } else if (event.type === 'complete') {
          resolve(event.result);
          worker.terminate();
        } else if (event.type === 'error') {
          reject(new Error(event.error));
          worker.terminate();
        }
      });
    });
  }
}
```

This technical specification provides the detailed implementation guidance needed for developing ForensicAnalyzer Pro. The next developer who picks up this project will have comprehensive documentation covering architecture, API integration, security, and performance requirements based on our real forensic investigation experience.

---

**Document Status:** Ready for Implementation  
**Version:** 1.0  
**Last Updated:** July 4, 2025