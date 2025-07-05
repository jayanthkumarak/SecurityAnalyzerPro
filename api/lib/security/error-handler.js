"use strict";
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
exports.SecurityAwareErrorHandler = void 0;
var crypto = require("crypto");
var SecurityAwareErrorHandler = /** @class */ (function () {
    function SecurityAwareErrorHandler() {
        this.errorHistory = [];
        this.suspiciousPatterns = new Map();
        this.errorCorrelations = new Map();
        this.maxHistorySize = 10000;
        this.initializeThreatPatterns();
    }
    SecurityAwareErrorHandler.prototype.handleError = function (error, context, operationContext) {
        return __awaiter(this, void 0, void 0, function () {
            var errorId, correlationId, sanitizedMessage, errorType, severity, threatIndicators, mitigationActions, errorContext, securityError;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        errorId = crypto.randomUUID();
                        correlationId = crypto.randomUUID();
                        sanitizedMessage = this.sanitizeErrorMessage(error.message);
                        errorType = this.classifyError(error, operationContext);
                        severity = this.calculateSeverity(error, errorType, context);
                        threatIndicators = this.analyzeThreatIndicators(error, context, operationContext);
                        mitigationActions = this.generateMitigationActions(errorType, severity, threatIndicators);
                        errorContext = {};
                        if (context.user_id)
                            errorContext.user_id = context.user_id;
                        if (context.session_id)
                            errorContext.session_id = context.session_id;
                        if (operationContext === null || operationContext === void 0 ? void 0 : operationContext.resource_type)
                            errorContext.resource_type = operationContext.resource_type;
                        if (operationContext === null || operationContext === void 0 ? void 0 : operationContext.resource_id)
                            errorContext.resource_id = operationContext.resource_id;
                        if (operationContext === null || operationContext === void 0 ? void 0 : operationContext.operation)
                            errorContext.operation = operationContext.operation;
                        if (context.ip_address)
                            errorContext.ip_address = context.ip_address;
                        securityError = {
                            id: errorId,
                            error_type: errorType,
                            severity: severity,
                            message: error.message,
                            sanitized_message: sanitizedMessage,
                            stack_trace: this.sanitizeStackTrace(error.stack),
                            context: errorContext,
                            threat_indicators: threatIndicators,
                            mitigation_actions: mitigationActions,
                            correlation_id: correlationId,
                            timestamp: new Date(),
                            escalated: severity === 'critical',
                        };
                        // Store error for analysis
                        this.storeError(securityError);
                        // Perform correlation analysis
                        return [4 /*yield*/, this.performCorrelationAnalysis(securityError)];
                    case 1:
                        // Perform correlation analysis
                        _a.sent();
                        if (!(severity === 'critical')) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.escalateError(securityError)];
                    case 2:
                        _a.sent();
                        _a.label = 3;
                    case 3: 
                    // Apply automatic mitigations
                    return [4 /*yield*/, this.applyAutoMitigations(securityError)];
                    case 4:
                        // Apply automatic mitigations
                        _a.sent();
                        return [2 /*return*/, securityError];
                }
            });
        });
    };
    SecurityAwareErrorHandler.prototype.detectAnomalousPatterns = function () {
        return __awaiter(this, void 0, void 0, function () {
            var incidents, now, oneHour, recentErrors, authFailures, authzViolations, dataIntegrityErrors;
            return __generator(this, function (_a) {
                incidents = [];
                now = new Date();
                oneHour = 60 * 60 * 1000;
                recentErrors = this.errorHistory.filter(function (error) { return (now.getTime() - error.timestamp.getTime()) < oneHour; });
                authFailures = recentErrors.filter(function (e) { return e.error_type === 'authentication'; });
                if (authFailures.length > 10) {
                    incidents.push({
                        id: crypto.randomUUID(),
                        incident_type: 'authentication_failure',
                        severity: 'high',
                        details: { failure_count: authFailures.length, time_window: '1_hour' },
                        threat_indicators: ['authentication_flood', 'potential_brute_force'],
                        mitigation_actions: ['rate_limit_enforcement', 'account_lockout'],
                        status: 'open',
                        created_at: now,
                        updated_at: now,
                        escalated: true,
                    });
                }
                authzViolations = recentErrors.filter(function (e) { return e.error_type === 'authorization'; });
                if (authzViolations.length > 5) {
                    incidents.push({
                        id: crypto.randomUUID(),
                        incident_type: 'authorization_violation',
                        severity: 'medium',
                        details: { violation_count: authzViolations.length, time_window: '1_hour' },
                        threat_indicators: ['privilege_escalation_attempt', 'unauthorized_access'],
                        mitigation_actions: ['enhanced_monitoring', 'access_review'],
                        status: 'open',
                        created_at: now,
                        updated_at: now,
                        escalated: false,
                    });
                }
                dataIntegrityErrors = recentErrors.filter(function (e) { return e.error_type === 'data_integrity'; });
                if (dataIntegrityErrors.length > 3) {
                    incidents.push({
                        id: crypto.randomUUID(),
                        incident_type: 'data_breach',
                        severity: 'critical',
                        details: { integrity_violations: dataIntegrityErrors.length, time_window: '1_hour' },
                        threat_indicators: ['data_corruption', 'tampering_detected'],
                        mitigation_actions: ['immediate_investigation', 'data_isolation', 'backup_verification'],
                        status: 'open',
                        created_at: now,
                        updated_at: now,
                        escalated: true,
                    });
                }
                return [2 /*return*/, incidents];
            });
        });
    };
    SecurityAwareErrorHandler.prototype.getErrorStatistics = function () {
        var now = new Date();
        var oneHour = 60 * 60 * 1000;
        var recentErrors = this.errorHistory.filter(function (error) { return (now.getTime() - error.timestamp.getTime()) < oneHour; });
        return {
            total_errors: this.errorHistory.length,
            errors_by_type: this.groupBy(this.errorHistory, 'error_type'),
            errors_by_severity: this.groupBy(this.errorHistory, 'severity'),
            recent_errors: recentErrors.length,
            escalated_errors: this.errorHistory.filter(function (e) { return e.escalated; }).length,
        };
    };
    // Private helper methods
    SecurityAwareErrorHandler.prototype.sanitizeErrorMessage = function (message) {
        // Remove sensitive information from error messages
        var sanitized = message;
        // Remove file paths
        sanitized = sanitized.replace(/[C-Z]:\\[^\\s]+/g, '<FILE_PATH>');
        sanitized = sanitized.replace(/\/[^\\s]+/g, '<FILE_PATH>');
        // Remove IP addresses
        sanitized = sanitized.replace(/\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b/g, '<IP_ADDRESS>');
        // Remove user IDs and session IDs
        sanitized = sanitized.replace(/user[_-]?id[\\s:=]+[^\\s]+/gi, 'user_id=<REDACTED>');
        sanitized = sanitized.replace(/session[_-]?id[\\s:=]+[^\\s]+/gi, 'session_id=<REDACTED>');
        // Remove SQL fragments
        sanitized = sanitized.replace(/SELECT\\s+.*?FROM\\s+\\w+/gi, '<SQL_QUERY>');
        sanitized = sanitized.replace(/INSERT\\s+INTO\\s+\\w+/gi, '<SQL_QUERY>');
        sanitized = sanitized.replace(/UPDATE\\s+\\w+\\s+SET/gi, '<SQL_QUERY>');
        sanitized = sanitized.replace(/DELETE\\s+FROM\\s+\\w+/gi, '<SQL_QUERY>');
        return sanitized;
    };
    SecurityAwareErrorHandler.prototype.sanitizeStackTrace = function (stackTrace) {
        if (!stackTrace)
            return '';
        // Remove sensitive file paths from stack trace
        var sanitized = stackTrace;
        sanitized = sanitized.replace(/[C-Z]:\\[^\\s\\)]+/g, '<PATH>');
        sanitized = sanitized.replace(/\/[^\\s\\)]+/g, '<PATH>');
        return sanitized;
    };
    SecurityAwareErrorHandler.prototype.classifyError = function (error, _operationContext) {
        var message = error.message.toLowerCase();
        if (message.includes('authentication') || message.includes('login') || message.includes('credential')) {
            return 'authentication';
        }
        if (message.includes('authorization') || message.includes('permission') || message.includes('access denied')) {
            return 'authorization';
        }
        if (message.includes('validation') || message.includes('invalid') || message.includes('malformed')) {
            return 'validation';
        }
        if (message.includes('integrity') || message.includes('hash') || message.includes('checksum') || message.includes('tamper')) {
            return 'data_integrity';
        }
        if (message.includes('security') || message.includes('threat') || message.includes('suspicious')) {
            return 'security';
        }
        return 'system';
    };
    SecurityAwareErrorHandler.prototype.calculateSeverity = function (error, errorType, context) {
        var message = error.message.toLowerCase();
        // Critical severity conditions
        if (errorType === 'data_integrity' ||
            message.includes('critical') ||
            message.includes('security breach') ||
            message.includes('unauthorized access to admin')) {
            return 'critical';
        }
        // High severity conditions
        if (errorType === 'authorization' ||
            errorType === 'security' ||
            message.includes('failed login attempts') ||
            context.security_level === 'critical') {
            return 'high';
        }
        // Medium severity conditions
        if (errorType === 'authentication' ||
            errorType === 'validation' ||
            context.security_level === 'high') {
            return 'medium';
        }
        return 'low';
    };
    SecurityAwareErrorHandler.prototype.analyzeThreatIndicators = function (error, context, _operationContext) {
        var indicators = [];
        var message = error.message.toLowerCase();
        // Authentication threats
        if (message.includes('invalid credentials'))
            indicators.push('credential_stuffing');
        if (message.includes('account locked'))
            indicators.push('brute_force_attempt');
        if (message.includes('session expired'))
            indicators.push('session_hijacking');
        // Authorization threats
        if (message.includes('access denied'))
            indicators.push('privilege_escalation');
        if (message.includes('insufficient permissions'))
            indicators.push('unauthorized_access');
        // Data integrity threats
        if (message.includes('hash mismatch'))
            indicators.push('data_tampering');
        if (message.includes('integrity check failed'))
            indicators.push('corruption_detected');
        // System threats
        if (message.includes('sql injection'))
            indicators.push('sql_injection');
        if (message.includes('path traversal'))
            indicators.push('path_traversal');
        if (message.includes('buffer overflow'))
            indicators.push('buffer_overflow');
        // Context-based indicators
        if (context.failed_login_attempts && context.failed_login_attempts > 3) {
            indicators.push('repeated_failure');
        }
        if (context.account_locked) {
            indicators.push('locked_account_access');
        }
        return indicators;
    };
    SecurityAwareErrorHandler.prototype.generateMitigationActions = function (errorType, severity, threatIndicators) {
        var actions = [];
        // Type-specific mitigations
        switch (errorType) {
            case 'authentication':
                actions.push('rate_limit_enforcement', 'account_monitoring');
                if (severity === 'high' || severity === 'critical') {
                    actions.push('temporary_account_lock');
                }
                break;
            case 'authorization':
                actions.push('access_review', 'privilege_audit');
                if (severity === 'critical') {
                    actions.push('immediate_access_revocation');
                }
                break;
            case 'data_integrity':
                actions.push('data_verification', 'backup_comparison');
                if (severity === 'critical') {
                    actions.push('immediate_quarantine', 'forensic_analysis');
                }
                break;
            case 'security':
                actions.push('security_scan', 'threat_assessment');
                if (severity === 'critical') {
                    actions.push('incident_response_activation');
                }
                break;
        }
        // Threat-specific mitigations
        if (threatIndicators.includes('brute_force_attempt')) {
            actions.push('ip_blocking', 'rate_limiting');
        }
        if (threatIndicators.includes('sql_injection')) {
            actions.push('input_sanitization', 'query_parameterization');
        }
        if (threatIndicators.includes('data_tampering')) {
            actions.push('integrity_verification', 'audit_trail_review');
        }
        return __spreadArray([], new Set(actions), true); // Remove duplicates
    };
    SecurityAwareErrorHandler.prototype.storeError = function (error) {
        this.errorHistory.push(error);
        // Maintain history size limit
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
        }
    };
    SecurityAwareErrorHandler.prototype.performCorrelationAnalysis = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var correlationKey, correlatedErrors, oneHour, now;
            return __generator(this, function (_a) {
                correlationKey = error.context.user_id || error.context.ip_address || 'unknown';
                if (!this.errorCorrelations.has(correlationKey)) {
                    this.errorCorrelations.set(correlationKey, []);
                }
                correlatedErrors = this.errorCorrelations.get(correlationKey);
                correlatedErrors.push(error);
                oneHour = 60 * 60 * 1000;
                now = new Date();
                this.errorCorrelations.set(correlationKey, correlatedErrors.filter(function (e) { return (now.getTime() - e.timestamp.getTime()) < oneHour; }));
                return [2 /*return*/];
            });
        });
    };
    SecurityAwareErrorHandler.prototype.escalateError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                console.error('CRITICAL SECURITY ERROR ESCALATED:', {
                    id: error.id,
                    type: error.error_type,
                    severity: error.severity,
                    message: error.sanitized_message,
                    context: error.context,
                    threats: error.threat_indicators,
                });
                return [2 /*return*/];
            });
        });
    };
    SecurityAwareErrorHandler.prototype.applyAutoMitigations = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, action, mitigationError_1;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = error.mitigation_actions;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        action = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.executeMitigationAction(action, error)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        mitigationError_1 = _b.sent();
                        console.error("Failed to execute mitigation action ".concat(action, ":"), mitigationError_1);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SecurityAwareErrorHandler.prototype.executeMitigationAction = function (action, error) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (action) {
                    case 'rate_limit_enforcement':
                        // Implement rate limiting logic
                        console.log("Applying rate limiting for ".concat(error.context.ip_address));
                        break;
                    case 'account_monitoring':
                        // Implement enhanced account monitoring
                        console.log("Enhanced monitoring activated for user ".concat(error.context.user_id));
                        break;
                    case 'data_verification':
                        // Trigger data integrity verification
                        console.log("Data integrity verification triggered for ".concat(error.context.resource_id));
                        break;
                    default:
                        console.log("Mitigation action ".concat(action, " logged for manual execution"));
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityAwareErrorHandler.prototype.initializeThreatPatterns = function () {
        this.suspiciousPatterns.set('repeated_auth_failure', {
            pattern: 'Multiple authentication failures from same source',
            threat_level: 'high',
            indicators: ['brute_force_attempt', 'credential_stuffing'],
            auto_mitigate: true,
            mitigation_actions: ['rate_limiting', 'ip_blocking'],
        });
        this.suspiciousPatterns.set('privilege_escalation', {
            pattern: 'Repeated authorization failures for elevated resources',
            threat_level: 'critical',
            indicators: ['privilege_escalation', 'unauthorized_access'],
            auto_mitigate: true,
            mitigation_actions: ['access_revocation', 'security_review'],
        });
        this.suspiciousPatterns.set('data_integrity_violations', {
            pattern: 'Multiple data integrity check failures',
            threat_level: 'critical',
            indicators: ['data_tampering', 'corruption_detected'],
            auto_mitigate: true,
            mitigation_actions: ['immediate_quarantine', 'forensic_analysis'],
        });
    };
    SecurityAwareErrorHandler.prototype.groupBy = function (array, key) {
        return array.reduce(function (result, item) {
            var group = String(item[key]);
            result[group] = (result[group] || 0) + 1;
            return result;
        }, {});
    };
    return SecurityAwareErrorHandler;
}());
exports.SecurityAwareErrorHandler = SecurityAwareErrorHandler;
