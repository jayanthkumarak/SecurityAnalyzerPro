"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
exports.SecurityEventMonitor = void 0;
var crypto = require("crypto");
var events_1 = require("events");
var SecurityEventMonitor = /** @class */ (function (_super) {
    __extends(SecurityEventMonitor, _super);
    function SecurityEventMonitor(securityManager, errorHandler, auditService) {
        var _this = _super.call(this) || this;
        _this.threatSignatures = new Map();
        _this.monitoringRules = new Map();
        _this.activeAlerts = new Map();
        _this.securityMetrics = [];
        _this.monitoringActive = false;
        _this.monitoringInterval = null;
        _this.metricsInterval = null;
        _this.MAX_METRICS_HISTORY = 24 * 60; // 24 hours of minute-by-minute data
        _this.MONITORING_INTERVAL_MS = 30000; // 30 seconds
        _this.METRICS_INTERVAL_MS = 60000; // 1 minute
        _this.securityManager = securityManager;
        _this.errorHandler = errorHandler;
        _this.auditService = auditService;
        _this.initializeThreatSignatures();
        _this.initializeMonitoringRules();
        return _this;
    }
    SecurityEventMonitor.prototype.start = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                if (this.monitoringActive) {
                    console.warn('Security monitoring is already active');
                    return [2 /*return*/];
                }
                try {
                    console.log('Starting security event monitoring...');
                    this.monitoringActive = true;
                    // Start main monitoring loop
                    this.monitoringInterval = setInterval(function () {
                        _this.performSecurityMonitoring().catch(function (error) {
                            console.error('Security monitoring error:', error);
                        });
                    }, this.MONITORING_INTERVAL_MS);
                    // Start metrics collection
                    this.metricsInterval = setInterval(function () {
                        _this.collectSecurityMetrics().catch(function (error) {
                            console.error('Metrics collection error:', error);
                        });
                    }, this.METRICS_INTERVAL_MS);
                    // Emit monitoring started event
                    this.emit('monitoring_started');
                    console.log('Security event monitoring started successfully');
                }
                catch (error) {
                    console.error('Failed to start security monitoring:', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.stop = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.monitoringActive) {
                    return [2 /*return*/];
                }
                console.log('Stopping security event monitoring...');
                this.monitoringActive = false;
                if (this.monitoringInterval) {
                    clearInterval(this.monitoringInterval);
                    this.monitoringInterval = null;
                }
                if (this.metricsInterval) {
                    clearInterval(this.metricsInterval);
                    this.metricsInterval = null;
                }
                this.emit('monitoring_stopped');
                console.log('Security event monitoring stopped');
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.analyzeEvent = function (event, context) {
        return __awaiter(this, void 0, void 0, function () {
            var alerts, _i, _a, signature, alert_1, _b, _c, rule, alert_2, anomalyAlerts, _d, alerts_1, alert_3, error_1;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        alerts = [];
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 17, , 19]);
                        _i = 0, _a = this.threatSignatures.values();
                        _e.label = 2;
                    case 2:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        signature = _a[_i];
                        if (!signature.enabled)
                            return [3 /*break*/, 5];
                        return [4 /*yield*/, this.matchesThreatSignature(event, signature)];
                    case 3:
                        if (!_e.sent()) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.createThreatAlert(event, signature, context)];
                    case 4:
                        alert_1 = _e.sent();
                        alerts.push(alert_1);
                        // Update signature statistics
                        signature.last_triggered = new Date();
                        signature.trigger_count++;
                        _e.label = 5;
                    case 5:
                        _i++;
                        return [3 /*break*/, 2];
                    case 6:
                        _b = 0, _c = this.monitoringRules.values();
                        _e.label = 7;
                    case 7:
                        if (!(_b < _c.length)) return [3 /*break*/, 11];
                        rule = _c[_b];
                        if (!rule.enabled)
                            return [3 /*break*/, 10];
                        return [4 /*yield*/, this.matchesMonitoringRule(event, rule)];
                    case 8:
                        if (!_e.sent()) return [3 /*break*/, 10];
                        return [4 /*yield*/, this.createRuleAlert(event, rule, context)];
                    case 9:
                        alert_2 = _e.sent();
                        alerts.push(alert_2);
                        _e.label = 10;
                    case 10:
                        _b++;
                        return [3 /*break*/, 7];
                    case 11: return [4 /*yield*/, this.detectBehavioralAnomalies(event, context)];
                    case 12:
                        anomalyAlerts = _e.sent();
                        alerts.push.apply(alerts, anomalyAlerts);
                        _d = 0, alerts_1 = alerts;
                        _e.label = 13;
                    case 13:
                        if (!(_d < alerts_1.length)) return [3 /*break*/, 16];
                        alert_3 = alerts_1[_d];
                        return [4 /*yield*/, this.processAlert(alert_3, context)];
                    case 14:
                        _e.sent();
                        _e.label = 15;
                    case 15:
                        _d++;
                        return [3 /*break*/, 13];
                    case 16: return [2 /*return*/, alerts];
                    case 17:
                        error_1 = _e.sent();
                        return [4 /*yield*/, this.errorHandler.handleError(error_1 instanceof Error ? error_1 : new Error(String(error_1)), context, { resource_type: 'security_monitor', operation: 'analyze_event' })];
                    case 18:
                        _e.sent();
                        return [2 /*return*/, []];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    SecurityEventMonitor.prototype.getActiveAlerts = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.activeAlerts.values())];
            });
        });
    };
    SecurityEventMonitor.prototype.getSecurityMetrics = function () {
        return __awaiter(this, arguments, void 0, function (hours) {
            var cutoffTime;
            if (hours === void 0) { hours = 24; }
            return __generator(this, function (_a) {
                cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
                return [2 /*return*/, this.securityMetrics.filter(function (metric) { return metric.timestamp >= cutoffTime; })];
            });
        });
    };
    SecurityEventMonitor.prototype.resolveAlert = function (alertId, resolvedBy, notes) {
        return __awaiter(this, void 0, void 0, function () {
            var alert;
            return __generator(this, function (_a) {
                alert = this.activeAlerts.get(alertId);
                if (!alert) {
                    throw new Error("Alert not found: ".concat(alertId));
                }
                alert.resolved_at = new Date();
                alert.resolved_by = resolvedBy;
                alert.resolution_notes = notes;
                this.activeAlerts.delete(alertId);
                this.emit('alert_resolved', alert);
                return [2 /*return*/];
            });
        });
    };
    // Private methods
    SecurityEventMonitor.prototype.performSecurityMonitoring = function () {
        return __awaiter(this, void 0, void 0, function () {
            var errorIncidents, _i, errorIncidents_1, incident, alert_4, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        return [4 /*yield*/, this.errorHandler.detectAnomalousPatterns()];
                    case 1:
                        errorIncidents = _a.sent();
                        for (_i = 0, errorIncidents_1 = errorIncidents; _i < errorIncidents_1.length; _i++) {
                            incident = errorIncidents_1[_i];
                            alert_4 = {
                                id: crypto.randomUUID(),
                                alert_type: 'anomaly_detected',
                                severity: incident.severity,
                                title: "Security Incident: ".concat(incident.incident_type),
                                description: "".concat(incident.incident_type, " detected with ").concat(incident.severity, " severity"),
                                indicators: incident.threat_indicators,
                                affected_resources: incident.resource_id ? [incident.resource_id] : [],
                                recommended_actions: incident.mitigation_actions,
                                created_at: new Date(),
                                escalated: incident.escalated,
                                auto_mitigated: false,
                            };
                            this.activeAlerts.set(alert_4.id, alert_4);
                            this.emit('alert_created', alert_4);
                            if (alert_4.severity === 'critical') {
                                this.emit('critical_alert', alert_4);
                            }
                        }
                        // Check for session anomalies
                        return [4 /*yield*/, this.monitorSessionAnomalies()];
                    case 2:
                        // Check for session anomalies
                        _a.sent();
                        // Check for data access patterns
                        return [4 /*yield*/, this.monitorDataAccessPatterns()];
                    case 3:
                        // Check for data access patterns
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_2 = _a.sent();
                        console.error('Security monitoring cycle error:', error_2);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SecurityEventMonitor.prototype.collectSecurityMetrics = function () {
        return __awaiter(this, void 0, void 0, function () {
            var now, oneDayAgo_1, errorStats, metrics;
            return __generator(this, function (_a) {
                try {
                    now = new Date();
                    oneDayAgo_1 = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                    errorStats = this.errorHandler.getErrorStatistics();
                    metrics = {
                        timestamp: now,
                        active_sessions: this.securityManager.getActiveSessionCount(),
                        failed_authentications_last_hour: this.securityManager.getSecurityIncidentsByType('authentication_failure').length,
                        security_incidents_last_24h: this.securityManager.getSecurityIncidents().filter(function (i) { return i.created_at >= oneDayAgo_1; }).length,
                        data_access_events_last_hour: errorStats.recent_errors,
                        threat_detection_rate: this.calculateThreatDetectionRate(),
                        system_health_score: this.calculateSystemHealthScore(),
                        compliance_score: this.calculateComplianceScore(),
                    };
                    this.securityMetrics.push(metrics);
                    // Maintain metrics history size
                    if (this.securityMetrics.length > this.MAX_METRICS_HISTORY) {
                        this.securityMetrics = this.securityMetrics.slice(-this.MAX_METRICS_HISTORY);
                    }
                    this.emit('metrics_collected', metrics);
                }
                catch (error) {
                    console.error('Metrics collection error:', error);
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.matchesThreatSignature = function (event, signature) {
        return __awaiter(this, void 0, void 0, function () {
            var eventText;
            return __generator(this, function (_a) {
                eventText = JSON.stringify(event).toLowerCase();
                if (signature.pattern instanceof RegExp) {
                    return [2 /*return*/, signature.pattern.test(eventText)];
                }
                else {
                    return [2 /*return*/, eventText.includes(signature.pattern.toLowerCase())];
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.matchesMonitoringRule = function (event, rule) {
        return __awaiter(this, void 0, void 0, function () {
            var eventText;
            return __generator(this, function (_a) {
                eventText = JSON.stringify(event).toLowerCase();
                return [2 /*return*/, eventText.includes(rule.condition.toLowerCase())];
            });
        });
    };
    SecurityEventMonitor.prototype.createThreatAlert = function (event, signature, _context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        id: crypto.randomUUID(),
                        alert_type: 'threat_detected',
                        severity: signature.threat_level,
                        title: "Threat Detected: ".concat(signature.name),
                        description: signature.description,
                        source_event: event,
                        threat_signature: signature,
                        indicators: signature.indicators,
                        affected_resources: event.resource_id ? [event.resource_id] : [],
                        recommended_actions: signature.mitigation_actions,
                        created_at: new Date(),
                        escalated: signature.threat_level === 'critical',
                        auto_mitigated: false,
                    }];
            });
        });
    };
    SecurityEventMonitor.prototype.createRuleAlert = function (event, rule, _context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        id: crypto.randomUUID(),
                        alert_type: 'policy_violation',
                        severity: rule.alert_severity,
                        title: "Rule Triggered: ".concat(rule.name),
                        description: rule.description,
                        source_event: event,
                        indicators: ['rule_violation'],
                        affected_resources: event.resource_id ? [event.resource_id] : [],
                        recommended_actions: rule.mitigation_actions,
                        created_at: new Date(),
                        escalated: rule.alert_severity === 'critical',
                        auto_mitigated: rule.auto_mitigation,
                    }];
            });
        });
    };
    SecurityEventMonitor.prototype.detectBehavioralAnomalies = function (event, _context) {
        return __awaiter(this, void 0, void 0, function () {
            var alerts, recentAccess, avgAccess, lastAccess;
            return __generator(this, function (_a) {
                alerts = [];
                // Check for unusual access patterns
                if (event.event_type === 'data_access') {
                    recentAccess = this.securityMetrics.slice(-60);
                    if (recentAccess.length > 0) {
                        avgAccess = recentAccess.reduce(function (sum, m) { return sum + m.data_access_events_last_hour; }, 0) /
                            recentAccess.length;
                        lastAccess = recentAccess[recentAccess.length - 1];
                        if (lastAccess && lastAccess.data_access_events_last_hour > avgAccess * 3) {
                            alerts.push({
                                id: crypto.randomUUID(),
                                alert_type: 'anomaly_detected',
                                severity: 'medium',
                                title: 'Unusual Data Access Pattern',
                                description: 'Data access rate significantly higher than normal',
                                source_event: event,
                                indicators: ['data_access_anomaly'],
                                affected_resources: [event.resource_id || 'unknown'],
                                recommended_actions: ['investigate_user_activity', 'review_access_logs'],
                                created_at: new Date(),
                                escalated: false,
                                auto_mitigated: false,
                            });
                        }
                    }
                }
                return [2 /*return*/, alerts];
            });
        });
    };
    SecurityEventMonitor.prototype.processAlert = function (alert, context) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        // Store alert
                        this.activeAlerts.set(alert.id, alert);
                        // Emit events
                        this.emit('alert_created', alert);
                        if (alert.severity === 'critical') {
                            this.emit('critical_alert', alert);
                        }
                        if (!alert.auto_mitigated) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.applyAutoMitigation(alert)];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: 
                    // Log to audit trail
                    return [4 /*yield*/, this.auditService.logSecurityEvent({
                            event_type: 'security_alert',
                            action: 'alert_created',
                            resource_type: 'security_alert',
                            resource_id: alert.id,
                            event_details: {
                                alert_type: alert.alert_type,
                                severity: alert.severity,
                                title: alert.title,
                                indicators: alert.indicators,
                            },
                        }, context)];
                    case 3:
                        // Log to audit trail
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    SecurityEventMonitor.prototype.applyAutoMitigation = function (alert) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, action, error_3;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _i = 0, _a = alert.recommended_actions;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 6];
                        action = _a[_i];
                        _b.label = 2;
                    case 2:
                        _b.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.executeMitigationAction(action, alert)];
                    case 3:
                        _b.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_3 = _b.sent();
                        console.error("Failed to execute mitigation action ".concat(action, ":"), error_3);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SecurityEventMonitor.prototype.executeMitigationAction = function (action, alert) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (action) {
                    case 'rate_limit_enforcement':
                        console.log("Applying rate limiting due to alert: ".concat(alert.id));
                        break;
                    case 'account_lockout':
                        console.log("Locking account due to alert: ".concat(alert.id));
                        break;
                    case 'immediate_investigation':
                        console.log("Triggering investigation for alert: ".concat(alert.id));
                        break;
                    default:
                        console.log("Mitigation action ".concat(action, " logged for manual execution"));
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.monitorSessionAnomalies = function () {
        return __awaiter(this, void 0, void 0, function () {
            var activeSessions, alert_5;
            return __generator(this, function (_a) {
                activeSessions = this.securityManager.getActiveSessionCount();
                // This is a simplified check - real implementation would be more sophisticated
                if (activeSessions > 100) { // Arbitrary threshold
                    alert_5 = {
                        id: crypto.randomUUID(),
                        alert_type: 'anomaly_detected',
                        severity: 'medium',
                        title: 'High Session Count',
                        description: "Unusually high number of active sessions: ".concat(activeSessions),
                        indicators: ['session_anomaly'],
                        affected_resources: ['session_manager'],
                        recommended_actions: ['investigate_sessions', 'check_for_ddos'],
                        created_at: new Date(),
                        escalated: false,
                        auto_mitigated: false,
                    };
                    this.activeAlerts.set(alert_5.id, alert_5);
                    this.emit('alert_created', alert_5);
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.monitorDataAccessPatterns = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Monitor for unusual data access patterns
                // This would analyze recent audit events for anomalies
                console.log('Monitoring data access patterns...');
                return [2 /*return*/];
            });
        });
    };
    SecurityEventMonitor.prototype.calculateThreatDetectionRate = function () {
        var recentMetrics = this.securityMetrics.slice(-60); // Last hour
        if (recentMetrics.length === 0)
            return 1.0;
        var threatsDetected = Array.from(this.activeAlerts.values()).filter(function (alert) { return alert.created_at >= new Date(Date.now() - 60 * 60 * 1000); }).length;
        return Math.min(1.0, threatsDetected / Math.max(1, recentMetrics.length));
    };
    SecurityEventMonitor.prototype.calculateSystemHealthScore = function () {
        var recentErrors = this.errorHandler.getErrorStatistics().recent_errors;
        var activeSessions = this.securityManager.getActiveSessionCount();
        // Simple health score calculation
        var score = 1.0;
        if (recentErrors > 10)
            score -= 0.2;
        if (recentErrors > 50)
            score -= 0.3;
        if (activeSessions > 100)
            score -= 0.1;
        return Math.max(0.0, score);
    };
    SecurityEventMonitor.prototype.calculateComplianceScore = function () {
        var incidents = this.securityManager.getSecurityIncidents();
        var criticalIncidents = incidents.filter(function (i) { return i.severity === 'critical'; }).length;
        var score = 1.0;
        if (criticalIncidents > 0)
            score -= 0.5;
        if (incidents.length > 10)
            score -= 0.2;
        return Math.max(0.0, score);
    };
    SecurityEventMonitor.prototype.initializeThreatSignatures = function () {
        // SQL Injection
        this.threatSignatures.set('sql_injection', {
            id: 'sql_injection',
            name: 'SQL Injection Attempt',
            pattern: /(union|select|insert|update|delete|drop|exec|script)/i,
            threat_level: 'high',
            description: 'Potential SQL injection attack detected',
            indicators: ['sql_injection', 'code_injection'],
            mitigation_actions: ['input_sanitization', 'query_parameterization'],
            enabled: true,
            created_at: new Date(),
            trigger_count: 0,
        });
        // Path Traversal
        this.threatSignatures.set('path_traversal', {
            id: 'path_traversal',
            name: 'Path Traversal Attempt',
            pattern: /(\.\.\/|\.\.\\|%2e%2e)/i,
            threat_level: 'medium',
            description: 'Potential path traversal attack detected',
            indicators: ['path_traversal', 'directory_traversal'],
            mitigation_actions: ['path_validation', 'input_sanitization'],
            enabled: true,
            created_at: new Date(),
            trigger_count: 0,
        });
        // Authentication Bypass
        this.threatSignatures.set('auth_bypass', {
            id: 'auth_bypass',
            name: 'Authentication Bypass Attempt',
            pattern: /(admin|root|sa|administrator).*password/i,
            threat_level: 'critical',
            description: 'Potential authentication bypass attempt',
            indicators: ['authentication_bypass', 'credential_stuffing'],
            mitigation_actions: ['account_lockout', 'enhanced_monitoring'],
            enabled: true,
            created_at: new Date(),
            trigger_count: 0,
        });
    };
    SecurityEventMonitor.prototype.initializeMonitoringRules = function () {
        this.monitoringRules.set('multiple_failed_logins', {
            id: 'multiple_failed_logins',
            name: 'Multiple Failed Login Attempts',
            description: 'More than 5 failed login attempts in 10 minutes',
            condition: 'failed_login_count > 5',
            threshold: 5,
            time_window_minutes: 10,
            enabled: true,
            alert_severity: 'medium',
            auto_mitigation: true,
            mitigation_actions: ['rate_limiting', 'account_monitoring'],
        });
        this.monitoringRules.set('admin_action_outside_hours', {
            id: 'admin_action_outside_hours',
            name: 'Administrative Action Outside Business Hours',
            description: 'Administrative action performed outside of 9-5 business hours',
            condition: 'admin_action AND (hour < 9 OR hour > 17)',
            enabled: true,
            alert_severity: 'medium',
            auto_mitigation: false,
            mitigation_actions: ['verify_authorization', 'enhanced_logging'],
        });
        this.monitoringRules.set('bulk_data_access', {
            id: 'bulk_data_access',
            name: 'Bulk Data Access',
            description: 'Large amount of data accessed in short period',
            condition: 'data_volume > 1GB AND time_window < 5_minutes',
            threshold: 1000000000, // 1GB
            time_window_minutes: 5,
            enabled: true,
            alert_severity: 'high',
            auto_mitigation: false,
            mitigation_actions: ['investigate_access', 'verify_authorization'],
        });
    };
    return SecurityEventMonitor;
}(events_1.EventEmitter));
exports.SecurityEventMonitor = SecurityEventMonitor;
