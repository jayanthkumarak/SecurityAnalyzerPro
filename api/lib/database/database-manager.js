"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseManager = void 0;
var electron_1 = require("electron");
var better_sqlite3_1 = require("better-sqlite3");
var path = require("path");
var fs = require("fs/promises");
var crypto = require("crypto");
var DatabaseManager = /** @class */ (function () {
    function DatabaseManager(securityManager) {
        this.primaryDB = null;
        this.auditDB = null;
        this.caseDBs = new Map();
        this.tempDB = null;
        this.retentionPolicies = new Map();
        this.securityManager = securityManager;
        var userDataPath = electron_1.app.getPath('userData');
        // Database paths
        this.primaryDBPath = path.join(userDataPath, 'database', 'primary.db');
        this.auditDBPath = path.join(userDataPath, 'audit', 'compliance.db');
        this.caseDBDir = path.join(userDataPath, 'cases');
        // Initialize retention policies
        this.initializeRetentionPolicies();
    }
    DatabaseManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        // Ensure directories exist
                        return [4 /*yield*/, this.ensureDirectories()];
                    case 1:
                        // Ensure directories exist
                        _a.sent();
                        // Initialize all database layers
                        return [4 /*yield*/, this.initializePrimaryDB()];
                    case 2:
                        // Initialize all database layers
                        _a.sent();
                        return [4 /*yield*/, this.initializeAuditDB()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.initializeTempDB()];
                    case 4:
                        _a.sent();
                        console.log('Enterprise database system initialized successfully');
                        return [3 /*break*/, 6];
                    case 5:
                        error_1 = _a.sent();
                        console.error('Failed to initialize database system:', error_1);
                        throw error_1;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.ensureDirectories = function () {
        return __awaiter(this, void 0, void 0, function () {
            var dirs, _i, dirs_1, dir;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        dirs = [path.dirname(this.primaryDBPath), path.dirname(this.auditDBPath), this.caseDBDir];
                        _i = 0, dirs_1 = dirs;
                        _a.label = 1;
                    case 1:
                        if (!(_i < dirs_1.length)) return [3 /*break*/, 4];
                        dir = dirs_1[_i];
                        return [4 /*yield*/, fs.mkdir(dir, { recursive: true })];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseManager.prototype.initializePrimaryDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.primaryDB = new better_sqlite3_1.default(this.primaryDBPath);
                // Configure for performance and safety
                this.primaryDB.pragma('journal_mode = WAL');
                this.primaryDB.pragma('foreign_keys = ON');
                this.primaryDB.pragma('synchronous = NORMAL');
                this.primaryDB.pragma('cache_size = 64000');
                this.primaryDB.pragma('temp_store = MEMORY');
                // Create primary database schema
                this.createPrimarySchema();
                return [2 /*return*/];
            });
        });
    };
    DatabaseManager.prototype.initializeAuditDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.auditDB = new better_sqlite3_1.default(this.auditDBPath);
                // Configure for integrity and compliance
                this.auditDB.pragma('journal_mode = WAL');
                this.auditDB.pragma('synchronous = FULL');
                this.auditDB.pragma('foreign_keys = ON');
                // Create audit schema
                this.createAuditSchema();
                return [2 /*return*/];
            });
        });
    };
    DatabaseManager.prototype.initializeTempDB = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.tempDB = new better_sqlite3_1.default(':memory:');
                this.tempDB.pragma('foreign_keys = ON');
                this.tempDB.pragma('synchronous = OFF'); // Fast for temp data
                return [2 /*return*/];
            });
        });
    };
    DatabaseManager.prototype.createPrimarySchema = function () {
        if (!this.primaryDB)
            throw new Error('Primary database not initialized');
        // Cases table with comprehensive metadata
        this.primaryDB.exec("\n      CREATE TABLE IF NOT EXISTS cases (\n        id TEXT PRIMARY KEY,\n        case_number TEXT UNIQUE NOT NULL,\n        title TEXT NOT NULL,\n        description TEXT,\n        case_type TEXT CHECK (case_type IN ('incident', 'investigation', 'compliance', 'training')),\n        priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),\n        status TEXT CHECK (status IN ('active', 'suspended', 'closed', 'archived')),\n        \n        organization TEXT,\n        investigator_id TEXT,\n        supervisor_id TEXT,\n        department TEXT,\n        \n        legal_hold BOOLEAN DEFAULT FALSE,\n        retention_class TEXT NOT NULL DEFAULT 'standard',\n        classification TEXT CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),\n        \n        incident_date DATETIME,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        closed_at DATETIME,\n        archived_at DATETIME,\n        \n        retention_expires DATETIME,\n        auto_purge_eligible BOOLEAN DEFAULT FALSE,\n        purge_approval_required BOOLEAN DEFAULT TRUE,\n        \n        encrypted_notes TEXT,\n        encrypted_metadata TEXT,\n        custody_chain TEXT,\n        integrity_hash TEXT NOT NULL\n      )\n    ");
        // Evidence table with forensic metadata
        this.primaryDB.exec("\n      CREATE TABLE IF NOT EXISTS evidence (\n        id TEXT PRIMARY KEY,\n        case_id TEXT NOT NULL,\n        evidence_number TEXT NOT NULL,\n        \n        original_filename TEXT NOT NULL,\n        original_path TEXT NOT NULL,\n        file_hash_md5 TEXT NOT NULL,\n        file_hash_sha256 TEXT NOT NULL,\n        file_hash_sha512 TEXT,\n        file_signature TEXT NOT NULL,\n        \n        file_size INTEGER NOT NULL CHECK (file_size >= 0),\n        file_type TEXT NOT NULL CHECK (file_type IN ('prefetch', 'evtx', 'registry', 'memory', 'network', 'unknown')),\n        mime_type TEXT,\n        file_extension TEXT,\n        \n        acquisition_method TEXT NOT NULL,\n        acquisition_tool TEXT,\n        acquisition_hash TEXT NOT NULL,\n        chain_of_custody TEXT,\n        \n        storage_location TEXT NOT NULL,\n        storage_method TEXT DEFAULT 'encrypted_file',\n        compression_method TEXT,\n        encryption_key_id TEXT NOT NULL,\n        \n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        \n        processing_status TEXT DEFAULT 'pending',\n        analysis_status TEXT DEFAULT 'pending',\n        verification_status TEXT DEFAULT 'pending',\n        \n        retention_class TEXT NOT NULL DEFAULT 'evidence',\n        auto_purge_eligible BOOLEAN DEFAULT FALSE,\n        backup_status TEXT DEFAULT 'pending',\n        \n        parent_evidence_id TEXT,\n        related_evidence_ids TEXT,\n        metadata TEXT,\n        \n        FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,\n        FOREIGN KEY (parent_evidence_id) REFERENCES evidence (id),\n        UNIQUE(case_id, evidence_number)\n      )\n    ");
        // Analysis results table
        this.primaryDB.exec("\n      CREATE TABLE IF NOT EXISTS analysis_results (\n        id TEXT PRIMARY KEY,\n        evidence_id TEXT NOT NULL,\n        analysis_type TEXT NOT NULL,\n        analysis_version TEXT NOT NULL,\n        \n        analyzer_name TEXT NOT NULL,\n        analyzer_version TEXT,\n        analysis_parameters TEXT,\n        \n        raw_results TEXT NOT NULL,\n        processed_results TEXT,\n        confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),\n        risk_score REAL CHECK (risk_score >= 0 AND risk_score <= 10),\n        \n        threat_indicators TEXT,\n        mitre_techniques TEXT,\n        analysis_tags TEXT,\n        \n        validated BOOLEAN DEFAULT FALSE,\n        validator_id TEXT,\n        validation_notes TEXT,\n        false_positive BOOLEAN DEFAULT FALSE,\n        \n        analysis_started DATETIME,\n        analysis_completed DATETIME DEFAULT CURRENT_TIMESTAMP,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        \n        retention_class TEXT NOT NULL DEFAULT 'analysis',\n        auto_purge_eligible BOOLEAN DEFAULT FALSE,\n        \n        FOREIGN KEY (evidence_id) REFERENCES evidence (id) ON DELETE CASCADE\n      )\n    ");
        // Create performance indices
        this.createIndices();
    };
    DatabaseManager.prototype.createAuditSchema = function () {
        if (!this.auditDB)
            throw new Error('Audit database not initialized');
        this.auditDB.exec("\n      CREATE TABLE IF NOT EXISTS audit_trail (\n        id TEXT PRIMARY KEY,\n        event_id TEXT UNIQUE NOT NULL,\n        \n        event_type TEXT NOT NULL,\n        action TEXT NOT NULL,\n        resource_type TEXT,\n        resource_id TEXT,\n        \n        user_id TEXT,\n        session_id TEXT,\n        ip_address TEXT,\n        user_agent TEXT,\n        \n        event_details TEXT,\n        before_state TEXT,\n        after_state TEXT,\n        \n        correlation_id TEXT,\n        parent_event_id TEXT,\n        \n        legal_hold_applicable BOOLEAN DEFAULT FALSE,\n        retention_required BOOLEAN DEFAULT TRUE,\n        compliance_flags TEXT,\n        \n        event_hash TEXT NOT NULL,\n        previous_hash TEXT,\n        signature TEXT,\n        \n        event_timestamp DATETIME NOT NULL,\n        recorded_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP\n      )\n    ");
        // Create audit indices
        this.auditDB.exec("\n      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(event_timestamp);\n      CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_trail(resource_type, resource_id);\n      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(user_id);\n      CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_trail(correlation_id);\n    ");
    };
    DatabaseManager.prototype.createIndices = function () {
        if (!this.primaryDB)
            return;
        this.primaryDB.exec("\n      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);\n      CREATE INDEX IF NOT EXISTS idx_cases_investigator ON cases(investigator_id);\n      CREATE INDEX IF NOT EXISTS idx_cases_retention ON cases(retention_expires);\n      \n      CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);\n      CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(file_type);\n      CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence(file_hash_sha256);\n      CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(processing_status);\n      \n      CREATE INDEX IF NOT EXISTS idx_analysis_evidence ON analysis_results(evidence_id);\n      CREATE INDEX IF NOT EXISTS idx_analysis_type ON analysis_results(analysis_type);\n      CREATE INDEX IF NOT EXISTS idx_analysis_confidence ON analysis_results(confidence_score);\n    ");
    };
    DatabaseManager.prototype.initializeRetentionPolicies = function () {
        this.retentionPolicies.set('criminal_case', {
            class_name: 'criminal_case',
            retention_period: '7_years',
            legal_hold_default: true,
            auto_purge_allowed: false,
            approval_required: true,
            compliance_requirements: ['legal_hold', 'chain_of_custody'],
        });
        this.retentionPolicies.set('civil_case', {
            class_name: 'civil_case',
            retention_period: '3_years',
            legal_hold_default: false,
            auto_purge_allowed: false,
            approval_required: true,
            compliance_requirements: ['data_protection'],
        });
        this.retentionPolicies.set('security_incident', {
            class_name: 'security_incident',
            retention_period: '2_years',
            legal_hold_default: false,
            auto_purge_allowed: true,
            approval_required: false,
            compliance_requirements: ['incident_response'],
        });
        this.retentionPolicies.set('training', {
            class_name: 'training',
            retention_period: '1_year',
            legal_hold_default: false,
            auto_purge_allowed: true,
            approval_required: false,
            compliance_requirements: [],
        });
    };
    // Case Management Operations
    DatabaseManager.prototype.createCase = function (request, context) {
        return __awaiter(this, void 0, void 0, function () {
            var id, now, retentionPolicy, retentionExpires, custodyChain, recordToInsert, integrityHash, stmt;
            var _a, _b, _c, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        if (!this.primaryDB)
                            throw new Error('Database not initialized');
                        id = this.generateId('case');
                        now = new Date();
                        retentionPolicy = this.retentionPolicies.get(request.case_type) ||
                            this.retentionPolicies.get('security_incident');
                        retentionExpires = this.calculateRetentionExpiry(retentionPolicy.retention_period);
                        custodyChain = [
                            {
                                from_user: 'system',
                                to_user: context.user_id || 'unknown',
                                timestamp: now,
                                reason: 'case_creation',
                                location: 'system',
                                signature_hash: crypto.randomBytes(32).toString('hex'),
                            },
                        ];
                        recordToInsert = {
                            id: id,
                            case_number: request.case_number,
                            title: request.title,
                            description: (_a = request.description) !== null && _a !== void 0 ? _a : null,
                            case_type: request.case_type,
                            priority: request.priority,
                            classification: request.classification,
                            investigator_id: (_b = request.investigator_id) !== null && _b !== void 0 ? _b : null,
                            incident_date: (_d = (_c = request.incident_date) === null || _c === void 0 ? void 0 : _c.toISOString()) !== null && _d !== void 0 ? _d : null,
                            retention_class: request.case_type,
                            legal_hold: retentionPolicy.legal_hold_default ? 1 : 0,
                            retention_expires: retentionExpires.toISOString(),
                            auto_purge_eligible: retentionPolicy.auto_purge_allowed ? 1 : 0,
                            purge_approval_required: retentionPolicy.approval_required ? 1 : 0,
                            custody_chain: JSON.stringify(custodyChain),
                            created_at: now.toISOString(),
                            updated_at: now.toISOString(),
                            status: 'active',
                        };
                        integrityHash = this.calculateIntegrityHash(recordToInsert);
                        stmt = this.primaryDB.prepare("\n      INSERT INTO cases (\n        id, case_number, title, description, case_type, priority, classification,\n        investigator_id, incident_date, retention_class, legal_hold,\n        retention_expires, auto_purge_eligible, purge_approval_required,\n        custody_chain, integrity_hash, created_at, updated_at, status\n      ) VALUES (\n        @id, @case_number, @title, @description, @case_type, @priority, @classification,\n        @investigator_id, @incident_date, @retention_class, @legal_hold,\n        @retention_expires, @auto_purge_eligible, @purge_approval_required,\n        @custody_chain, @integrity_hash, @created_at, @updated_at, @status\n      )\n    ");
                        stmt.run(__assign(__assign({}, recordToInsert), { integrity_hash: integrityHash }));
                        // Log case creation
                        return [4 /*yield*/, this.logAuditEvent({
                                event_type: 'data_creation',
                                action: 'create_case',
                                resource_type: 'case',
                                resource_id: id,
                                event_details: { case_number: request.case_number, case_type: request.case_type },
                            }, context)];
                    case 1:
                        // Log case creation
                        _e.sent();
                        return [2 /*return*/, this.getCaseById(id)];
                }
            });
        });
    };
    DatabaseManager.prototype.getCaseById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, row;
            return __generator(this, function (_a) {
                if (!this.primaryDB)
                    throw new Error('Database not initialized');
                stmt = this.primaryDB.prepare('SELECT * FROM cases WHERE id = ?');
                row = stmt.get(id);
                if (!row)
                    return [2 /*return*/, null];
                return [2 /*return*/, this.mapRowToCase(row)];
            });
        });
    };
    DatabaseManager.prototype.getCases = function (filters) {
        return __awaiter(this, void 0, void 0, function () {
            var query, params, conditions, stmt, rows;
            var _this = this;
            var _a, _b;
            return __generator(this, function (_c) {
                if (!this.primaryDB)
                    throw new Error('Database not initialized');
                query = 'SELECT * FROM cases';
                params = [];
                conditions = [];
                if (filters) {
                    if ((_a = filters.status) === null || _a === void 0 ? void 0 : _a.length) {
                        conditions.push("status IN (".concat(filters.status.map(function () { return '?'; }).join(','), ")"));
                        params.push.apply(params, filters.status);
                    }
                    if ((_b = filters.case_type) === null || _b === void 0 ? void 0 : _b.length) {
                        conditions.push("case_type IN (".concat(filters.case_type.map(function () { return '?'; }).join(','), ")"));
                        params.push.apply(params, filters.case_type);
                    }
                    if (filters.investigator_id) {
                        conditions.push('investigator_id = ?');
                        params.push(filters.investigator_id);
                    }
                    if (filters.created_after) {
                        conditions.push('created_at >= ?');
                        params.push(filters.created_after.toISOString());
                    }
                }
                if (conditions.length > 0) {
                    query += " WHERE ".concat(conditions.join(' AND '));
                }
                query += ' ORDER BY created_at DESC';
                stmt = this.primaryDB.prepare(query);
                rows = stmt.all.apply(stmt, params);
                return [2 /*return*/, rows.map(function (row) { return _this.mapRowToCase(row); })];
            });
        });
    };
    // Evidence Management
    DatabaseManager.prototype.addEvidence = function (request, context) {
        return __awaiter(this, void 0, void 0, function () {
            var id, evidenceNumber, now, encryptionKeyId, stmt;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.primaryDB)
                            throw new Error('Database not initialized');
                        id = this.generateId('evidence');
                        return [4 /*yield*/, this.getNextEvidenceNumber(request.case_id)];
                    case 1:
                        evidenceNumber = _a.sent();
                        now = new Date();
                        return [4 /*yield*/, this.securityManager.generateSecureRandomId()];
                    case 2:
                        encryptionKeyId = _a.sent();
                        stmt = this.primaryDB.prepare("\n      INSERT INTO evidence (\n        id, case_id, evidence_number, original_filename, original_path,\n        file_type, acquisition_method, acquisition_tool, encryption_key_id,\n        created_at, modified_at, accessed_at, retention_class\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ");
                        stmt.run(id, request.case_id, evidenceNumber, request.original_filename, request.original_path, request.file_type, request.acquisition_method, request.acquisition_tool, encryptionKeyId, now.toISOString(), now.toISOString(), now.toISOString(), 'evidence');
                        return [4 /*yield*/, this.logAuditEvent({
                                event_type: 'data_creation',
                                action: 'add_evidence',
                                resource_type: 'evidence',
                                resource_id: id,
                                event_details: { case_id: request.case_id, filename: request.original_filename },
                            }, context)];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, this.getEvidenceById(id)];
                }
            });
        });
    };
    DatabaseManager.prototype.getEvidenceById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, row;
            return __generator(this, function (_a) {
                if (!this.primaryDB)
                    throw new Error('Database not initialized');
                stmt = this.primaryDB.prepare('SELECT * FROM evidence WHERE id = ?');
                row = stmt.get(id);
                if (!row)
                    return [2 /*return*/, null];
                return [2 /*return*/, this.mapRowToEvidence(row)];
            });
        });
    };
    DatabaseManager.prototype.getEvidenceByCase = function (caseId) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, rows;
            var _this = this;
            return __generator(this, function (_a) {
                if (!this.primaryDB)
                    throw new Error('Database not initialized');
                stmt = this.primaryDB.prepare('SELECT * FROM evidence WHERE case_id = ? ORDER BY evidence_number');
                rows = stmt.all(caseId);
                return [2 /*return*/, rows.map(function (row) { return _this.mapRowToEvidence(row); })];
            });
        });
    };
    // Audit logging
    DatabaseManager.prototype.logAuditEvent = function (event, context) {
        return __awaiter(this, void 0, void 0, function () {
            var eventId, now, eventData, eventHash, stmt;
            return __generator(this, function (_a) {
                if (!this.auditDB)
                    throw new Error('Audit database not initialized');
                eventId = crypto.randomUUID();
                now = new Date();
                eventData = {
                    id: this.generateId('audit'),
                    event_id: eventId,
                    event_type: event.event_type || 'system_action',
                    action: event.action || 'unknown',
                    resource_type: event.resource_type,
                    resource_id: event.resource_id,
                    user_id: context.user_id,
                    session_id: context.session_id,
                    ip_address: context.ip_address,
                    user_agent: context.user_agent,
                    event_details: JSON.stringify(event.event_details || {}),
                    correlation_id: context.correlation_id,
                    event_timestamp: now.toISOString(),
                    recorded_timestamp: now.toISOString(),
                    legal_hold_applicable: false,
                    retention_required: true,
                };
                eventHash = this.calculateEventHash(eventData);
                stmt = this.auditDB.prepare("\n      INSERT INTO audit_trail (\n        id, event_id, event_type, action, resource_type, resource_id,\n        user_id, session_id, ip_address, user_agent, event_details,\n        correlation_id, event_timestamp, recorded_timestamp,\n        legal_hold_applicable, retention_required, event_hash\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)\n    ");
                stmt.run(eventData.id, eventData.event_id, eventData.event_type, eventData.action, eventData.resource_type, eventData.resource_id, eventData.user_id, eventData.session_id, eventData.ip_address, eventData.user_agent, eventData.event_details, eventData.correlation_id, eventData.event_timestamp, eventData.recorded_timestamp, eventData.legal_hold_applicable ? 1 : 0, eventData.retention_required ? 1 : 0, eventHash);
                return [2 /*return*/];
            });
        });
    };
    // Utility methods
    DatabaseManager.prototype.generateId = function (prefix) {
        var timestamp = Date.now();
        var random = Math.random().toString(36).substring(2, 11);
        return "".concat(prefix, "_").concat(timestamp, "_").concat(random);
    };
    DatabaseManager.prototype.getNextEvidenceNumber = function (caseId) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, result, nextNumber;
            return __generator(this, function (_a) {
                if (!this.primaryDB)
                    throw new Error('Database not initialized');
                stmt = this.primaryDB.prepare("\n      SELECT COUNT(*) as count FROM evidence WHERE case_id = ?\n    ");
                result = stmt.get(caseId);
                nextNumber = (result.count + 1).toString().padStart(4, '0');
                return [2 /*return*/, "E".concat(nextNumber)];
            });
        });
    };
    DatabaseManager.prototype.calculateRetentionExpiry = function (period) {
        var now = new Date();
        switch (period) {
            case '1_year':
                return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
            case '2_years':
                return new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
            case '3_years':
                return new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
            case '5_years':
                return new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
            case '7_years':
                return new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
            default:
                return new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
        }
    };
    DatabaseManager.prototype.calculateIntegrityHash = function (data) {
        var content = JSON.stringify(data, Object.keys(data).sort());
        return crypto.createHash('sha256').update(content).digest('hex');
    };
    DatabaseManager.prototype.calculateEventHash = function (event) {
        var content = JSON.stringify(event, Object.keys(event).sort());
        return crypto.createHash('sha256').update(content).digest('hex');
    };
    DatabaseManager.prototype.mapRowToCase = function (row) {
        var _a, _b, _c, _d, _e;
        return {
            id: row['id'],
            case_number: row['case_number'],
            title: row['title'],
            description: (_a = row['description']) !== null && _a !== void 0 ? _a : undefined,
            case_type: row['case_type'],
            priority: row['priority'],
            status: row['status'],
            organization: (_b = row['organization']) !== null && _b !== void 0 ? _b : undefined,
            investigator_id: (_c = row['investigator_id']) !== null && _c !== void 0 ? _c : undefined,
            supervisor_id: (_d = row['supervisor_id']) !== null && _d !== void 0 ? _d : undefined,
            department: (_e = row['department']) !== null && _e !== void 0 ? _e : undefined,
            legal_hold: Boolean(row['legal_hold']),
            retention_class: row['retention_class'],
            classification: row['classification'],
            incident_date: row['incident_date'] ? new Date(row['incident_date']) : undefined,
            created_at: new Date(row['created_at']),
            updated_at: new Date(row['updated_at']),
            closed_at: row['closed_at'] ? new Date(row['closed_at']) : undefined,
            archived_at: row['archived_at'] ? new Date(row['archived_at']) : undefined,
            retention_expires: row['retention_expires'] ? new Date(row['retention_expires']) : undefined,
            auto_purge_eligible: Boolean(row['auto_purge_eligible']),
            purge_approval_required: Boolean(row['purge_approval_required']),
            custody_chain: row['custody_chain'] ? JSON.parse(row['custody_chain']) : [],
            integrity_hash: row['integrity_hash'],
        };
    };
    DatabaseManager.prototype.mapRowToEvidence = function (row) {
        var _a, _b, _c, _d, _e;
        return {
            id: row['id'],
            case_id: row['case_id'],
            evidence_number: row['evidence_number'],
            original_filename: row['original_filename'],
            original_path: row['original_path'],
            file_hash_md5: row['file_hash_md5'] || '',
            file_hash_sha256: row['file_hash_sha256'] || '',
            file_hash_sha512: (_a = row['file_hash_sha512']) !== null && _a !== void 0 ? _a : undefined,
            file_signature: row['file_signature'] || '',
            file_size: row['file_size'] || 0,
            file_type: row['file_type'],
            mime_type: (_b = row['mime_type']) !== null && _b !== void 0 ? _b : undefined,
            file_extension: row['file_extension'] || '',
            acquisition_method: row['acquisition_method'],
            acquisition_tool: (_c = row['acquisition_tool']) !== null && _c !== void 0 ? _c : undefined,
            acquisition_hash: row['acquisition_hash'] || '',
            chain_of_custody: row['chain_of_custody'] ? JSON.parse(row['chain_of_custody']) : [],
            storage_location: row['storage_location'] || '',
            storage_method: row['storage_method'] || 'encrypted_file',
            compression_method: (_d = row['compression_method']) !== null && _d !== void 0 ? _d : undefined,
            encryption_key_id: row['encryption_key_id'] || '',
            created_at: new Date(row['created_at']),
            modified_at: new Date(row['modified_at']),
            accessed_at: new Date(row['accessed_at']),
            processing_status: row['processing_status'] || 'pending',
            analysis_status: row['analysis_status'] || 'pending',
            verification_status: row['verification_status'] || 'pending',
            retention_class: row['retention_class'] || 'evidence',
            auto_purge_eligible: Boolean(row['auto_purge_eligible']),
            backup_status: row['backup_status'] || 'pending',
            parent_evidence_id: (_e = row['parent_evidence_id']) !== null && _e !== void 0 ? _e : undefined,
            related_evidence_ids: row['related_evidence_ids'] ? JSON.parse(row['related_evidence_ids']) : [],
            metadata: row['metadata'] ? JSON.parse(row['metadata']) : {},
        };
    };
    DatabaseManager.prototype.close = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, db;
            return __generator(this, function (_b) {
                if (this.primaryDB) {
                    this.primaryDB.close();
                    this.primaryDB = null;
                }
                if (this.auditDB) {
                    this.auditDB.close();
                    this.auditDB = null;
                }
                if (this.tempDB) {
                    this.tempDB.close();
                    this.tempDB = null;
                }
                // Close all case databases
                for (_i = 0, _a = this.caseDBs.values(); _i < _a.length; _i++) {
                    db = _a[_i];
                    db.close();
                }
                this.caseDBs.clear();
                return [2 /*return*/];
            });
        });
    };
    return DatabaseManager;
}());
exports.DatabaseManager = DatabaseManager;
