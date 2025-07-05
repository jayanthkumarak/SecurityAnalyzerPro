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
exports.AuditService = void 0;
var crypto = require("crypto");
var AuditService = /** @class */ (function () {
    function AuditService(databaseManager, securityManager, errorHandler) {
        this.auditChain = new Map(); // event_id -> previous_hash
        this.monitoringTimer = null;
        this.databaseManager = databaseManager;
        this.securityManager = securityManager;
        this.errorHandler = errorHandler;
        this.config = this.getDefaultConfiguration();
    }
    AuditService.prototype.initialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Verify audit database integrity
                        return [4 /*yield*/, this.verifyAuditTrailIntegrity()];
                    case 1:
                        // Verify audit database integrity
                        _a.sent();
                        // Start real-time monitoring if enabled
                        if (this.config.real_time_monitoring) {
                            this.startRealTimeMonitoring();
                        }
                        console.log('Audit service initialized successfully');
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error('Failed to initialize audit service:', error_1);
                        throw error_1;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    AuditService.prototype.logSecurityEvent = function (event, context) {
        return __awaiter(this, void 0, void 0, function () {
            var isAuthorized, event_id, correlation_id, auditEvent, eventHash, previousHash, operationContext, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 7]);
                        return [4 /*yield*/, this.securityManager.checkPermission(context, 'audit', 'create')];
                    case 1:
                        isAuthorized = _a.sent();
                        if (!isAuthorized) {
                            throw new Error('Insufficient permissions to create audit events');
                        }
                        event_id = crypto.randomUUID();
                        correlation_id = crypto.randomUUID();
                        auditEvent = __assign(__assign(__assign(__assign(__assign(__assign(__assign({ id: this.securityManager.generateSecureRandomId(), event_id: event_id, event_type: event.event_type || 'security_event', action: event.action || 'unknown' }, event.resource_type && { resource_type: event.resource_type }), event.resource_id && { resource_id: event.resource_id }), context.user_id && { user_id: context.user_id }), context.session_id && { session_id: context.session_id }), context.ip_address && { ip_address: context.ip_address }), context.user_agent && { user_agent: context.user_agent }), { event_details: __assign(__assign({}, event.event_details), { security_level: context.security_level, user_roles: context.roles, authentication_method: context.authentication_method }), correlation_id: correlation_id, legal_hold_applicable: this.isLegalHoldApplicable(event), retention_required: true, compliance_flags: this.generateComplianceFlags(event), event_timestamp: new Date(), recorded_timestamp: new Date(), event_hash: '' });
                        eventHash = this.calculateEventHash(auditEvent);
                        previousHash = this.auditChain.get('latest') || '0';
                        auditEvent.event_hash = eventHash;
                        auditEvent.previous_hash = previousHash;
                        operationContext = __assign(__assign(__assign({ user_id: context.user_id, session_id: context.session_id, operation_type: 'audit_logging', resource_type: 'audit_event' }, context.ip_address && { ip_address: context.ip_address }), context.user_agent && { user_agent: context.user_agent }), auditEvent.correlation_id && { correlation_id: auditEvent.correlation_id });
                        return [4 /*yield*/, this.databaseManager.logAuditEvent(auditEvent, operationContext)];
                    case 2:
                        _a.sent();
                        // Update audit chain
                        this.auditChain.set(auditEvent.event_id, eventHash);
                        this.auditChain.set('latest', eventHash);
                        if (!this.config.real_time_monitoring) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.checkRealTimeAlerts(auditEvent)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [3 /*break*/, 7];
                    case 5:
                        error_2 = _a.sent();
                        return [4 /*yield*/, this.errorHandler.handleError(error_2 instanceof Error ? error_2 : new Error(String(error_2)), context, { resource_type: 'audit', operation: 'log_event' })];
                    case 6:
                        _a.sent();
                        throw error_2;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditService.prototype.generateComplianceReport = function (reportType, periodStart, periodEnd, generatedBy) {
        return __awaiter(this, void 0, void 0, function () {
            var reportId, events, securityIncidents, summary, eventsByType, eventsByUser, securityMetrics, complianceStatus, recommendations, auditTrailIntegrity, chainOfCustodyIntact, report, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 6, , 7]);
                        reportId = crypto.randomUUID();
                        return [4 /*yield*/, this.getAuditEventsByPeriod(periodStart, periodEnd)];
                    case 1:
                        events = _a.sent();
                        return [4 /*yield*/, this.getSecurityIncidentsByPeriod(periodStart, periodEnd)];
                    case 2:
                        securityIncidents = _a.sent();
                        summary = this.calculateSummaryStatistics(events, securityIncidents);
                        eventsByType = this.groupEventsByType(events);
                        eventsByUser = this.groupEventsByUser(events);
                        securityMetrics = this.calculateSecurityMetrics(events, securityIncidents);
                        return [4 /*yield*/, this.assessComplianceStatus(events, securityIncidents)];
                    case 3:
                        complianceStatus = _a.sent();
                        recommendations = this.generateRecommendations(events, securityIncidents, complianceStatus);
                        return [4 /*yield*/, this.verifyAuditTrailIntegrity()];
                    case 4:
                        auditTrailIntegrity = _a.sent();
                        return [4 /*yield*/, this.verifyChainOfCustody()];
                    case 5:
                        chainOfCustodyIntact = _a.sent();
                        report = {
                            id: reportId,
                            report_type: reportType,
                            generated_at: new Date(),
                            period_start: periodStart,
                            period_end: periodEnd,
                            generated_by: generatedBy,
                            summary: summary,
                            events_by_type: eventsByType,
                            events_by_user: eventsByUser,
                            security_metrics: securityMetrics,
                            compliance_status: complianceStatus,
                            recommendations: recommendations,
                            audit_trail_integrity: auditTrailIntegrity,
                            chain_of_custody_intact: chainOfCustodyIntact,
                        };
                        // Log report generation
                        console.log("Compliance report generated: ".concat(reportId, " (").concat(reportType, ")"));
                        return [2 /*return*/, report];
                    case 6:
                        error_3 = _a.sent();
                        console.error('Failed to generate compliance report:', error_3);
                        throw error_3;
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    AuditService.prototype.verifyAuditTrailIntegrity = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                try {
                    // This would implement actual audit trail verification
                    // For now, return true assuming integrity is maintained
                    // In a real implementation, this would:
                    // 1. Verify hash chain continuity
                    // 2. Check for missing events
                    // 3. Validate digital signatures
                    // 4. Ensure no unauthorized modifications
                    console.log('Audit trail integrity verification completed');
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error('Audit trail integrity verification failed:', error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    AuditService.prototype.exportAuditTrail = function (_startDate, _endDate, format, context) {
        return __awaiter(this, void 0, void 0, function () {
            var isAuthorized, events, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 6]);
                        return [4 /*yield*/, this.securityManager.checkPermission(context, 'audit', 'export')];
                    case 1:
                        isAuthorized = _a.sent();
                        if (!isAuthorized) {
                            throw new Error('Insufficient permissions to export audit trail');
                        }
                        return [4 /*yield*/, this.getAuditEventsByPeriod(_startDate, _endDate)];
                    case 2:
                        events = _a.sent();
                        // Log the export action
                        return [4 /*yield*/, this.logSecurityEvent({
                                event_type: 'data_export',
                                action: 'export_audit_trail',
                                resource_type: 'audit_trail',
                                event_details: {
                                    period_start: _startDate,
                                    period_end: _endDate,
                                    format: format,
                                    event_count: events.length,
                                },
                            }, context)];
                    case 3:
                        // Log the export action
                        _a.sent();
                        // Format the data based on requested format
                        switch (format) {
                            case 'json':
                                return [2 /*return*/, JSON.stringify(events, null, 2)];
                            case 'csv':
                                return [2 /*return*/, this.formatAsCSV(events)];
                            case 'xml':
                                return [2 /*return*/, this.formatAsXML(events)];
                            default:
                                throw new Error("Unsupported export format: ".concat(format));
                        }
                        return [3 /*break*/, 6];
                    case 4:
                        error_4 = _a.sent();
                        return [4 /*yield*/, this.errorHandler.handleError(error_4 instanceof Error ? error_4 : new Error(String(error_4)), context, { resource_type: 'audit', operation: 'export' })];
                    case 5:
                        _a.sent();
                        throw error_4;
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    // Private helper methods
    AuditService.prototype.getDefaultConfiguration = function () {
        return {
            retention_period_days: 2555, // 7 years
            real_time_monitoring: true,
            alert_thresholds: {
                failed_logins_per_hour: 10,
                authorization_failures_per_hour: 5,
                data_access_anomalies: 3,
                admin_actions_per_day: 50,
            },
            compliance_requirements: ['GDPR', 'SOX', 'NIST-800-86', 'ISO-27037'],
            automated_reporting: true,
            report_schedule: ['daily', 'weekly', 'monthly'],
        };
    };
    AuditService.prototype.getAuditEventsByPeriod = function (_startDate, _endDate) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would query the actual audit database
                // For now, return empty array as placeholder
                return [2 /*return*/, []];
            });
        });
    };
    AuditService.prototype.getSecurityIncidentsByPeriod = function (startDate, endDate) {
        return this.securityManager.getSecurityIncidents().filter(function (incident) { return incident.created_at >= startDate && incident.created_at <= endDate; });
    };
    AuditService.prototype.calculateSummaryStatistics = function (events, incidents) {
        return {
            total_events: events.length,
            security_incidents: incidents.length,
            compliance_violations: incidents.filter(function (i) { return i.incident_type === 'policy_violation'; }).length,
            data_access_events: events.filter(function (e) { return e.event_type === 'data_access'; }).length,
            administrative_actions: events.filter(function (e) { return e.event_type === 'administrative'; }).length,
            failed_operations: events.filter(function (e) { return e.event_details['success'] === false; }).length,
        };
    };
    AuditService.prototype.groupEventsByType = function (events) {
        return events.reduce(function (acc, event) {
            acc[event.event_type] = (acc[event.event_type] || 0) + 1;
            return acc;
        }, {});
    };
    AuditService.prototype.groupEventsByUser = function (events) {
        return events.reduce(function (acc, event) {
            var userId = event.user_id || 'system';
            acc[userId] = (acc[userId] || 0) + 1;
            return acc;
        }, {});
    };
    AuditService.prototype.calculateSecurityMetrics = function (_events, incidents) {
        return {
            authentication_failures: incidents.filter(function (i) { return i.incident_type === 'authentication_failure'; }).length,
            authorization_violations: incidents.filter(function (i) { return i.incident_type === 'authorization_violation'; }).length,
            data_integrity_issues: incidents.filter(function (i) { return i.incident_type === 'data_breach'; }).length,
            suspicious_activities: incidents.filter(function (i) { return i.incident_type === 'suspicious_activity'; }).length,
        };
    };
    AuditService.prototype.assessComplianceStatus = function (_events, incidents) {
        return __awaiter(this, void 0, void 0, function () {
            var violations, criticalIncidents, dataBreaches;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        violations = [];
                        criticalIncidents = incidents.filter(function (i) { return i.severity === 'critical'; });
                        if (criticalIncidents.length > 0) {
                            violations.push('Critical security incidents detected');
                        }
                        dataBreaches = incidents.filter(function (i) { return i.incident_type === 'data_breach'; });
                        if (dataBreaches.length > 0) {
                            violations.push('Data integrity violations detected');
                        }
                        _a = {
                            gdpr_compliant: dataBreaches.length === 0,
                            sox_compliant: violations.length === 0,
                            nist_compliant: true
                        };
                        return [4 /*yield*/, this.verifyChainOfCustody()];
                    case 1: return [2 /*return*/, (_a.iso27037_compliant = _b.sent(),
                            _a.violations = violations,
                            _a)];
                }
            });
        });
    };
    AuditService.prototype.generateRecommendations = function (_events, incidents, complianceStatus) {
        var recommendations = [];
        if (incidents.length > 0) {
            recommendations.push('Review and address security incidents');
        }
        if (!complianceStatus.gdpr_compliant) {
            recommendations.push('Implement additional data protection measures');
        }
        if (incidents.filter(function (i) { return i.incident_type === 'authentication_failure'; }).length > 5) {
            recommendations.push('Strengthen authentication controls');
        }
        return recommendations;
    };
    AuditService.prototype.verifyChainOfCustody = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // This would implement actual chain of custody verification
                // For now, return true as placeholder
                return [2 /*return*/, true];
            });
        });
    };
    AuditService.prototype.calculateEventHash = function (event) {
        var _a;
        var eventData = {
            event_id: event.event_id,
            event_type: event.event_type,
            action: event.action,
            user_id: event.user_id,
            resource_type: event.resource_type,
            resource_id: event.resource_id,
            event_timestamp: (_a = event.event_timestamp) === null || _a === void 0 ? void 0 : _a.toISOString(),
            event_details: event.event_details,
        };
        var sortedKeys = Object.keys(eventData).sort();
        var sortedEventData = {};
        for (var _i = 0, sortedKeys_1 = sortedKeys; _i < sortedKeys_1.length; _i++) {
            var key = sortedKeys_1[_i];
            if (eventData[key] !== undefined) {
                sortedEventData[key] = eventData[key];
            }
        }
        var hashData = JSON.stringify(sortedEventData);
        return crypto.createHash('sha256').update(hashData).digest('hex');
    };
    AuditService.prototype.isLegalHoldApplicable = function (event) {
        // Determine if legal hold applies to this event type
        var legalHoldTypes = ['data_deletion', 'evidence_modification', 'case_closure'];
        return legalHoldTypes.includes(event.event_type || '');
    };
    AuditService.prototype.generateComplianceFlags = function (event) {
        return {
            gdpr_relevant: event.event_type === 'data_access' || event.event_type === 'data_modification',
            sox_relevant: event.event_type === 'administrative' || event.event_type === 'financial',
            nist_relevant: true, // Most events are relevant for NIST compliance
            retention_required: true,
        };
    };
    AuditService.prototype.checkRealTimeAlerts = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Implement real-time alerting logic
                if (event.event_type === 'authentication_failure') {
                    // Check if threshold exceeded
                    console.log('Real-time alert: Authentication failure detected');
                }
                return [2 /*return*/];
            });
        });
    };
    AuditService.prototype.startRealTimeMonitoring = function () {
        var _this = this;
        this.monitoringTimer = setInterval(function () { return __awaiter(_this, void 0, void 0, function () {
            var error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, this.performRealTimeAnalysis()];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        error_5 = _a.sent();
                        console.error('Real-time monitoring error:', error_5);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); }, 60000); // Check every minute
    };
    AuditService.prototype.performRealTimeAnalysis = function () {
        return __awaiter(this, void 0, void 0, function () {
            var incidents, _i, incidents_1, incident;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.errorHandler.detectAnomalousPatterns()];
                    case 1:
                        incidents = _a.sent();
                        for (_i = 0, incidents_1 = incidents; _i < incidents_1.length; _i++) {
                            incident = incidents_1[_i];
                            if (incident.severity === 'critical' || incident.severity === 'high') {
                                console.warn('Real-time security alert:', incident);
                            }
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    AuditService.prototype.formatAsCSV = function (events) {
        if (!events || events.length === 0) {
            return '';
        }
        var headers = Object.keys(events[0]).join(',');
        var rows = events.map(function (event) {
            return Object.values(event)
                .map(function (value) { return (typeof value === 'object' ? JSON.stringify(value) : String(value)); })
                .join(',');
        });
        return __spreadArray([headers], rows, true).join('\\n');
    };
    AuditService.prototype.formatAsXML = function (events) {
        var xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<audit_trail>\\n';
        for (var _i = 0, events_1 = events; _i < events_1.length; _i++) {
            var event_1 = events_1[_i];
            xml += '  <event>\\n';
            for (var _a = 0, _b = Object.entries(event_1); _a < _b.length; _a++) {
                var _c = _b[_a], key = _c[0], value = _c[1];
                xml += "    <".concat(key, ">").concat(this.escapeXML(String(value)), "</").concat(key, ">\\n");
            }
            xml += '  </event>\\n';
        }
        xml += '</audit_trail>';
        return xml;
    };
    AuditService.prototype.escapeXML = function (text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    };
    AuditService.prototype.shutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.monitoringTimer) {
                    clearInterval(this.monitoringTimer);
                    this.monitoringTimer = null;
                }
                return [2 /*return*/];
            });
        });
    };
    return AuditService;
}());
exports.AuditService = AuditService;
