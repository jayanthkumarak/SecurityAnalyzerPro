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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
var electron_1 = require("electron");
var crypto = require("crypto");
var fs = require("fs/promises");
var path = require("path");
var SecurityManager = /** @class */ (function () {
    function SecurityManager() {
        this.encryptionKey = null;
        this.activeSessions = new Map();
        this.securityPolicies = new Map();
        this.securityIncidents = [];
        this.sessionCleanupTimer = null;
        this.keyFilePath = path.join(electron_1.app.getPath('userData'), 'security', 'master.key');
        this.initializeSecurityPolicies();
        this.startSessionCleanup();
    }
    SecurityManager.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var securityDir, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        securityDir = path.dirname(this.keyFilePath);
                        return [4 /*yield*/, fs.mkdir(securityDir, { recursive: true })];
                    case 1:
                        _a.sent();
                        // Load or generate encryption key
                        return [4 /*yield*/, this.loadOrGenerateEncryptionKey()];
                    case 2:
                        // Load or generate encryption key
                        _a.sent();
                        console.log('Security manager initialized successfully');
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        console.error('Failed to initialize security manager:', error_1);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SecurityManager.prototype.loadOrGenerateEncryptionKey = function () {
        return __awaiter(this, void 0, void 0, function () {
            var keyData, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 4]);
                        return [4 /*yield*/, fs.readFile(this.keyFilePath)];
                    case 1:
                        keyData = _a.sent();
                        this.encryptionKey = Buffer.from(keyData.toString(), 'hex');
                        return [3 /*break*/, 4];
                    case 2:
                        error_2 = _a.sent();
                        // Generate new key if file doesn't exist
                        console.log('Generating new encryption key...');
                        this.encryptionKey = crypto.randomBytes(SecurityManager.KEY_LENGTH);
                        // Save the key securely
                        return [4 /*yield*/, fs.writeFile(this.keyFilePath, this.encryptionKey.toString('hex'), { mode: 384 } // Owner read/write only
                            )];
                    case 3:
                        // Save the key securely
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SecurityManager.prototype.encrypt = function (data) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }
        var iv = crypto.randomBytes(16);
        var cipher = crypto.createCipheriv(SecurityManager.ALGORITHM, this.encryptionKey, iv);
        cipher.setAAD(Buffer.from('SecurityAnalyzer'));
        var encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        var authTag = cipher.getAuthTag();
        return {
            encrypted: encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex'),
            algorithm: SecurityManager.ALGORITHM,
        };
    };
    SecurityManager.prototype.decrypt = function (encryptedData) {
        if (!this.encryptionKey) {
            throw new Error('Encryption key not initialized');
        }
        var iv = Buffer.from(encryptedData.iv, 'hex');
        var decipher = crypto.createDecipheriv(encryptedData.algorithm, this.encryptionKey, iv);
        decipher.setAAD(Buffer.from('SecurityAnalyzer'));
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
        var decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
    };
    SecurityManager.prototype.sanitizeForAnalysis = function (data) {
        // Remove or hash sensitive information before sending to AI
        var sanitized = JSON.parse(JSON.stringify(data));
        // Recursively sanitize object properties
        return this.sanitizeObject(sanitized);
    };
    SecurityManager.prototype.sanitizeObject = function (obj) {
        var _this = this;
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        if (Array.isArray(obj)) {
            return obj.map(function (item) { return _this.sanitizeObject(item); });
        }
        var sanitized = {};
        for (var _i = 0, _a = Object.entries(obj); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], value = _b[1];
            // Sanitize file paths
            if (key.toLowerCase().includes('path') && typeof value === 'string') {
                sanitized[key] = this.sanitizeFilePath(value);
            }
            // Sanitize user names
            else if (key.toLowerCase().includes('user') && typeof value === 'string') {
                sanitized[key] = this.hashSensitiveData(value);
            }
            // Sanitize IP addresses
            else if (key.toLowerCase().includes('ip') && typeof value === 'string') {
                sanitized[key] = this.sanitizeIPAddress(value);
            }
            // Recursively sanitize nested objects
            else if (typeof value === 'object') {
                sanitized[key] = this.sanitizeObject(value);
            }
            // Keep other values as-is
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    };
    SecurityManager.prototype.sanitizeFilePath = function (filePath) {
        // Replace user-specific paths with generic placeholders
        return filePath
            .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\<USER>')
            .replace(/\/Users\/[^/]+/g, '/Users/<USER>')
            .replace(/\\AppData\\Local\\[^\\]+/g, '\\AppData\\Local\\<APP>')
            .replace(/\/Library\/Application Support\/[^/]+/g, '/Library/Application Support/<APP>');
    };
    SecurityManager.prototype.sanitizeIPAddress = function (ip) {
        // Replace last octet with XXX for IPv4 addresses
        var ipv4Regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}$/;
        var match = ip.match(ipv4Regex);
        if (match) {
            return "".concat(match[1], "XXX");
        }
        // For IPv6 or other formats, just indicate it's an IP
        return '<IP_ADDRESS>';
    };
    SecurityManager.prototype.hashSensitiveData = function (data) {
        // Create a deterministic but non-reversible hash
        var hash = crypto.createHash('sha256');
        hash.update(data + 'SecurityAnalyzer');
        return "<HASH_".concat(hash.digest('hex').substring(0, 8), ">");
    };
    SecurityManager.prototype.generateSecureRandomId = function () {
        return crypto.randomBytes(16).toString('hex');
    };
    SecurityManager.prototype.validateFileIntegrity = function (filePath) {
        return __awaiter(this, void 0, void 0, function () {
            var fileBuffer, hash, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fs.readFile(filePath)];
                    case 1:
                        fileBuffer = _a.sent();
                        hash = crypto.createHash('sha256');
                        hash.update(fileBuffer);
                        return [2 /*return*/, hash.digest('hex')];
                    case 2:
                        error_3 = _a.sent();
                        throw new Error("Failed to validate file integrity: ".concat(error_3));
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    SecurityManager.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Clear session cleanup timer
                if (this.sessionCleanupTimer) {
                    clearInterval(this.sessionCleanupTimer);
                    this.sessionCleanupTimer = null;
                }
                // Clear active sessions
                this.activeSessions.clear();
                // Clear sensitive data from memory
                if (this.encryptionKey) {
                    this.encryptionKey.fill(0);
                    this.encryptionKey = null;
                }
                return [2 /*return*/];
            });
        });
    };
    // Session Management
    SecurityManager.prototype.createSession = function (userId, username, roles, authMethod) {
        return __awaiter(this, void 0, void 0, function () {
            var sessionId, now, expiresAt, permissions, securityLevel, securityContext, sessionData;
            return __generator(this, function (_a) {
                sessionId = crypto.randomUUID();
                now = new Date();
                expiresAt = new Date(now.getTime() + SecurityManager.SESSION_TIMEOUT);
                permissions = this.calculatePermissions(roles);
                securityLevel = this.calculateSecurityLevel(roles);
                securityContext = {
                    user_id: userId,
                    username: username,
                    roles: roles,
                    permissions: permissions,
                    security_level: securityLevel,
                    authentication_method: authMethod,
                    session_id: sessionId,
                    session_expires: expiresAt,
                    last_activity: now,
                    mfa_verified: false,
                    account_locked: false,
                    failed_login_attempts: 0,
                };
                sessionData = {
                    session_id: sessionId,
                    user_id: userId,
                    created_at: now,
                    last_activity: now,
                    expires_at: expiresAt,
                    security_context: securityContext,
                    active: true,
                };
                this.activeSessions.set(sessionId, sessionData);
                return [2 /*return*/, securityContext];
            });
        });
    };
    SecurityManager.prototype.validateSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, now;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        session = this.activeSessions.get(sessionId);
                        if (!session || !session.active) {
                            return [2 /*return*/, null];
                        }
                        now = new Date();
                        if (!(now > session.expires_at)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.terminateSession(sessionId, 'expired')];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, null];
                    case 2:
                        // Update last activity
                        session.last_activity = now;
                        session.security_context.last_activity = now;
                        return [2 /*return*/, session.security_context];
                }
            });
        });
    };
    SecurityManager.prototype.terminateSession = function (sessionId, reason) {
        return __awaiter(this, void 0, void 0, function () {
            var session;
            return __generator(this, function (_a) {
                session = this.activeSessions.get(sessionId);
                if (session) {
                    session.active = false;
                    session.terminated_reason = reason;
                    session.terminated_at = new Date();
                    this.activeSessions.delete(sessionId);
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityManager.prototype.refreshSession = function (sessionId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, now;
            return __generator(this, function (_a) {
                session = this.activeSessions.get(sessionId);
                if (!session || !session.active) {
                    return [2 /*return*/, null];
                }
                now = new Date();
                session.expires_at = new Date(now.getTime() + SecurityManager.SESSION_TIMEOUT);
                session.last_activity = now;
                session.security_context.session_expires = session.expires_at;
                session.security_context.last_activity = now;
                return [2 /*return*/, session.security_context];
            });
        });
    };
    // Role-Based Access Control
    SecurityManager.prototype.checkPermission = function (context, resource, operation) {
        return __awaiter(this, void 0, void 0, function () {
            var policyKey, policy, hasPermission, hasRole;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        policyKey = "".concat(resource, ":").concat(operation);
                        policy = this.securityPolicies.get(policyKey);
                        if (!!policy) return [3 /*break*/, 2];
                        // Default deny if no policy exists
                        return [4 /*yield*/, this.createSecurityIncident({
                                incident_type: 'policy_violation',
                                severity: 'medium',
                                user_id: context.user_id,
                                session_id: context.session_id,
                                resource_type: resource,
                                details: { operation: operation, reason: 'No policy defined' },
                                threat_indicators: ['missing_policy'],
                                mitigation_actions: ['policy_review'],
                            })];
                    case 1:
                        // Default deny if no policy exists
                        _a.sent();
                        return [2 /*return*/, false];
                    case 2:
                        if (!(this.compareSecurityLevel(context.security_level, policy.minimum_security_level) < 0)) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.createSecurityIncident({
                                incident_type: 'authorization_violation',
                                severity: 'high',
                                user_id: context.user_id,
                                session_id: context.session_id,
                                resource_type: resource,
                                details: { operation: operation, required_level: policy.minimum_security_level, user_level: context.security_level },
                                threat_indicators: ['insufficient_security_level'],
                                mitigation_actions: ['escalate_to_admin'],
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/, false];
                    case 4:
                        hasPermission = policy.required_permissions.every(function (perm) { return context.permissions.includes(perm); });
                        if (!!hasPermission) return [3 /*break*/, 6];
                        return [4 /*yield*/, this.createSecurityIncident({
                                incident_type: 'authorization_violation',
                                severity: 'medium',
                                user_id: context.user_id,
                                session_id: context.session_id,
                                resource_type: resource,
                                details: { operation: operation, required_permissions: policy.required_permissions, user_permissions: context.permissions },
                                threat_indicators: ['insufficient_permissions'],
                                mitigation_actions: ['access_review'],
                            })];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, false];
                    case 6:
                        hasRole = policy.required_roles.some(function (role) { return context.roles.includes(role); });
                        if (!!hasRole) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.createSecurityIncident({
                                incident_type: 'authorization_violation',
                                severity: 'medium',
                                user_id: context.user_id,
                                session_id: context.session_id,
                                resource_type: resource,
                                details: { operation: operation, required_roles: policy.required_roles, user_roles: context.roles },
                                threat_indicators: ['insufficient_roles'],
                                mitigation_actions: ['role_assignment_review'],
                            })];
                    case 7:
                        _a.sent();
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/, true];
                }
            });
        });
    };
    // Security Incident Management
    SecurityManager.prototype.createSecurityIncident = function (incident) {
        return __awaiter(this, void 0, void 0, function () {
            var securityIncident;
            return __generator(this, function (_a) {
                securityIncident = __assign(__assign({ id: crypto.randomUUID() }, incident), { status: 'open', created_at: new Date(), updated_at: new Date(), escalated: incident.severity === 'critical' });
                this.securityIncidents.push(securityIncident);
                // Auto-escalate critical incidents
                if (securityIncident.severity === 'critical') {
                    console.warn('CRITICAL SECURITY INCIDENT:', securityIncident);
                }
                return [2 /*return*/, securityIncident];
            });
        });
    };
    // Private helper methods
    SecurityManager.prototype.initializeSecurityPolicies = function () {
        // Case management policies
        this.securityPolicies.set('case:create', {
            resource_type: 'case',
            operation: 'create',
            required_permissions: ['case:create'],
            minimum_security_level: 'medium',
            required_roles: ['investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        this.securityPolicies.set('case:read', {
            resource_type: 'case',
            operation: 'read',
            required_permissions: ['case:read'],
            minimum_security_level: 'low',
            required_roles: ['viewer', 'analyst', 'investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        this.securityPolicies.set('case:update', {
            resource_type: 'case',
            operation: 'update',
            required_permissions: ['case:update'],
            minimum_security_level: 'medium',
            required_roles: ['investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        this.securityPolicies.set('case:delete', {
            resource_type: 'case',
            operation: 'delete',
            required_permissions: ['case:delete'],
            minimum_security_level: 'high',
            required_roles: ['admin'],
            audit_required: true,
            approval_required: true,
        });
        // Evidence management policies
        this.securityPolicies.set('evidence:create', {
            resource_type: 'evidence',
            operation: 'create',
            required_permissions: ['evidence:create'],
            minimum_security_level: 'medium',
            required_roles: ['investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        this.securityPolicies.set('evidence:read', {
            resource_type: 'evidence',
            operation: 'read',
            required_permissions: ['evidence:read'],
            minimum_security_level: 'low',
            required_roles: ['viewer', 'analyst', 'investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        // Analysis policies
        this.securityPolicies.set('analysis:create', {
            resource_type: 'analysis',
            operation: 'create',
            required_permissions: ['analysis:create'],
            minimum_security_level: 'medium',
            required_roles: ['analyst', 'investigator', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        // Audit policies
        this.securityPolicies.set('audit:read', {
            resource_type: 'audit',
            operation: 'read',
            required_permissions: ['audit:read'],
            minimum_security_level: 'high',
            required_roles: ['auditor', 'admin'],
            audit_required: true,
            approval_required: false,
        });
        this.securityPolicies.set('audit:create', {
            resource_type: 'audit',
            operation: 'create',
            required_permissions: [], // System-level action, no specific permission needed
            minimum_security_level: 'low',
            required_roles: ['admin', 'investigator', 'analyst', 'viewer', 'auditor'],
            audit_required: false, // Prevents recursive audit loops
            approval_required: false,
        });
        this.securityPolicies.set('audit:export', {
            resource_type: 'audit',
            operation: 'export',
            required_permissions: ['audit:export'],
            minimum_security_level: 'high',
            required_roles: ['auditor', 'admin'],
            audit_required: true,
            approval_required: true,
        });
    };
    SecurityManager.prototype.calculatePermissions = function (roles) {
        var permissions = [];
        roles.forEach(function (role) {
            switch (role) {
                case 'admin':
                    permissions.push.apply(permissions, [
                        'case:create', 'case:read', 'case:update', 'case:delete',
                        'evidence:create', 'evidence:read', 'evidence:update', 'evidence:delete',
                        'analysis:create', 'analysis:read', 'analysis:update', 'analysis:delete',
                        'audit:read', 'audit:export', 'system:configure', 'user:manage'
                    ]);
                    break;
                case 'investigator':
                    permissions.push.apply(permissions, [
                        'case:create', 'case:read', 'case:update',
                        'evidence:create', 'evidence:read', 'evidence:update',
                        'analysis:create', 'analysis:read', 'analysis:update'
                    ]);
                    break;
                case 'analyst':
                    permissions.push.apply(permissions, [
                        'case:read', 'evidence:read',
                        'analysis:create', 'analysis:read', 'analysis:update'
                    ]);
                    break;
                case 'auditor':
                    permissions.push.apply(permissions, [
                        'case:read', 'evidence:read', 'analysis:read',
                        'audit:read', 'audit:export'
                    ]);
                    break;
                case 'viewer':
                    permissions.push.apply(permissions, ['case:read', 'evidence:read', 'analysis:read']);
                    break;
            }
        });
        return __spreadArray([], new Set(permissions), true); // Remove duplicates
    };
    SecurityManager.prototype.calculateSecurityLevel = function (roles) {
        if (roles.includes('admin'))
            return 'critical';
        if (roles.includes('investigator') || roles.includes('auditor'))
            return 'high';
        if (roles.includes('analyst'))
            return 'medium';
        return 'low';
    };
    SecurityManager.prototype.compareSecurityLevel = function (level1, level2) {
        var levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
        return levels[level1] - levels[level2];
    };
    SecurityManager.prototype.startSessionCleanup = function () {
        var _this = this;
        // Clean up expired sessions every 5 minutes
        this.sessionCleanupTimer = setInterval(function () {
            var now = new Date();
            for (var _i = 0, _a = _this.activeSessions; _i < _a.length; _i++) {
                var _b = _a[_i], sessionId = _b[0], session = _b[1];
                if (now > session.expires_at) {
                    _this.terminateSession(sessionId, 'expired');
                }
            }
        }, 5 * 60 * 1000);
    };
    // Getters for monitoring
    SecurityManager.prototype.getActiveSessionCount = function () {
        return this.activeSessions.size;
    };
    SecurityManager.prototype.getSecurityIncidents = function () {
        return __spreadArray([], this.securityIncidents, true);
    };
    SecurityManager.prototype.getSecurityIncidentsByType = function (type) {
        return this.securityIncidents.filter(function (incident) { return incident.incident_type === type; });
    };
    SecurityManager.ALGORITHM = 'aes-256-gcm';
    SecurityManager.KEY_LENGTH = 32;
    SecurityManager.SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
    return SecurityManager;
}());
exports.SecurityManager = SecurityManager;
