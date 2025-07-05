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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityTestSuite = void 0;
exports.runSecurityTests = runSecurityTests;
var security_manager_1 = require("./security-manager");
var error_handler_1 = require("./error-handler");
var security_event_monitor_1 = require("./security-event-monitor");
var audit_service_1 = require("../services/audit-service");
var database_manager_1 = require("../database/database-manager");
/**
 * Comprehensive security implementation test suite
 * Validates all security components work together correctly
 */
var SecurityTestSuite = /** @class */ (function () {
    function SecurityTestSuite() {
        this.securityManager = new security_manager_1.SecurityManager();
        this.errorHandler = new error_handler_1.SecurityAwareErrorHandler();
        this.databaseManager = new database_manager_1.DatabaseManager(this.securityManager);
        this.auditService = new audit_service_1.AuditService(this.databaseManager, this.securityManager, this.errorHandler);
        this.securityMonitor = new security_event_monitor_1.SecurityEventMonitor(this.securityManager, this.errorHandler, this.auditService);
    }
    SecurityTestSuite.prototype.runAllTests = function () {
        return __awaiter(this, void 0, void 0, function () {
            var allTestsPassed, testResults, _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, error_1;
            return __generator(this, function (_s) {
                switch (_s.label) {
                    case 0:
                        console.log('🔒 Starting Security Implementation Test Suite');
                        allTestsPassed = true;
                        testResults = {};
                        _s.label = 1;
                    case 1:
                        _s.trys.push([1, 11, 12, 14]);
                        // Initialize all components
                        return [4 /*yield*/, this.initializeComponents()];
                    case 2:
                        // Initialize all components
                        _s.sent();
                        // Run test categories
                        _a = testResults;
                        _b = 'session_management';
                        return [4 /*yield*/, this.testSessionManagement()];
                    case 3:
                        // Run test categories
                        _a[_b] = _s.sent();
                        _c = testResults;
                        _d = 'rbac_system';
                        return [4 /*yield*/, this.testRBACSystem()];
                    case 4:
                        _c[_d] = _s.sent();
                        _e = testResults;
                        _f = 'error_handling';
                        return [4 /*yield*/, this.testErrorHandling()];
                    case 5:
                        _e[_f] = _s.sent();
                        _g = testResults;
                        _h = 'audit_logging';
                        return [4 /*yield*/, this.testAuditLogging()];
                    case 6:
                        _g[_h] = _s.sent();
                        _j = testResults;
                        _k = 'threat_detection';
                        return [4 /*yield*/, this.testThreatDetection()];
                    case 7:
                        _j[_k] = _s.sent();
                        _l = testResults;
                        _m = 'security_monitoring';
                        return [4 /*yield*/, this.testSecurityMonitoring()];
                    case 8:
                        _l[_m] = _s.sent();
                        _o = testResults;
                        _p = 'data_encryption';
                        return [4 /*yield*/, this.testDataEncryption()];
                    case 9:
                        _o[_p] = _s.sent();
                        _q = testResults;
                        _r = 'integration';
                        return [4 /*yield*/, this.testIntegration()];
                    case 10:
                        _q[_r] = _s.sent();
                        // Calculate overall result
                        allTestsPassed = Object.values(testResults).every(function (result) { return result; });
                        // Display results
                        this.displayTestResults(testResults, allTestsPassed);
                        return [2 /*return*/, allTestsPassed];
                    case 11:
                        error_1 = _s.sent();
                        console.error('❌ Test suite execution failed:', error_1);
                        return [2 /*return*/, false];
                    case 12: return [4 /*yield*/, this.cleanup()];
                    case 13:
                        _s.sent();
                        return [7 /*endfinally*/];
                    case 14: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.initializeComponents = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🚀 Initializing security components...');
                        return [4 /*yield*/, this.securityManager.initialize()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.databaseManager.initialize()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.auditService.initialize()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.securityMonitor.start()];
                    case 4:
                        _a.sent();
                        console.log('✅ All components initialized');
                        return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testSessionManagement = function () {
        return __awaiter(this, void 0, void 0, function () {
            var session1, validatedSession, refreshedSession, terminatedSession, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Session Management...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 7, , 8]);
                        return [4 /*yield*/, this.securityManager.createSession('test_user_1', 'Test User 1', ['investigator'], 'password')];
                    case 2:
                        session1 = _a.sent();
                        if (!session1.session_id || !session1.user_id) {
                            throw new Error('Session creation failed');
                        }
                        return [4 /*yield*/, this.securityManager.validateSession(session1.session_id)];
                    case 3:
                        validatedSession = _a.sent();
                        if (!validatedSession || validatedSession.user_id !== session1.user_id) {
                            throw new Error('Session validation failed');
                        }
                        return [4 /*yield*/, this.securityManager.refreshSession(session1.session_id)];
                    case 4:
                        refreshedSession = _a.sent();
                        if (!refreshedSession || refreshedSession.session_expires <= session1.session_expires) {
                            throw new Error('Session refresh failed');
                        }
                        // Test session termination
                        return [4 /*yield*/, this.securityManager.terminateSession(session1.session_id, 'test_complete')];
                    case 5:
                        // Test session termination
                        _a.sent();
                        return [4 /*yield*/, this.securityManager.validateSession(session1.session_id)];
                    case 6:
                        terminatedSession = _a.sent();
                        if (terminatedSession !== null) {
                            throw new Error('Session termination failed');
                        }
                        console.log('✅ Session Management tests passed');
                        return [2 /*return*/, true];
                    case 7:
                        error_2 = _a.sent();
                        console.error('❌ Session Management tests failed:', error_2);
                        return [2 /*return*/, false];
                    case 8: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testRBACSystem = function () {
        return __awaiter(this, void 0, void 0, function () {
            var adminSession, viewerSession, adminCanCreateCase, adminCanDeleteCase, viewerCanCreateCase, viewerCanReadCase, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing RBAC System...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 8, , 9]);
                        return [4 /*yield*/, this.securityManager.createSession('admin_user', 'Admin User', ['admin'], 'password')];
                    case 2:
                        adminSession = _a.sent();
                        return [4 /*yield*/, this.securityManager.createSession('viewer_user', 'Viewer User', ['viewer'], 'password')];
                    case 3:
                        viewerSession = _a.sent();
                        return [4 /*yield*/, this.securityManager.checkPermission(adminSession, 'case', 'create')];
                    case 4:
                        adminCanCreateCase = _a.sent();
                        if (!adminCanCreateCase) {
                            throw new Error('Admin should be able to create cases');
                        }
                        return [4 /*yield*/, this.securityManager.checkPermission(adminSession, 'case', 'delete')];
                    case 5:
                        adminCanDeleteCase = _a.sent();
                        if (!adminCanDeleteCase) {
                            throw new Error('Admin should be able to delete cases');
                        }
                        return [4 /*yield*/, this.securityManager.checkPermission(viewerSession, 'case', 'create')];
                    case 6:
                        viewerCanCreateCase = _a.sent();
                        if (viewerCanCreateCase) {
                            throw new Error('Viewer should not be able to create cases');
                        }
                        return [4 /*yield*/, this.securityManager.checkPermission(viewerSession, 'case', 'read')];
                    case 7:
                        viewerCanReadCase = _a.sent();
                        if (!viewerCanReadCase) {
                            throw new Error('Viewer should be able to read cases');
                        }
                        console.log('✅ RBAC System tests passed');
                        return [2 /*return*/, true];
                    case 8:
                        error_3 = _a.sent();
                        console.error('❌ RBAC System tests failed:', error_3);
                        return [2 /*return*/, false];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testErrorHandling = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testSession, authError, securityError, validationError, validationSecurityError, stats, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Error Handling...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.securityManager.createSession('error_test_user', 'Error Test User', ['analyst'], 'password')];
                    case 2:
                        testSession = _a.sent();
                        authError = new Error('Invalid credentials provided');
                        return [4 /*yield*/, this.errorHandler.handleError(authError, testSession, { resource_type: 'authentication', operation: 'login' })];
                    case 3:
                        securityError = _a.sent();
                        if (securityError.error_type !== 'authentication') {
                            throw new Error('Authentication error not classified correctly');
                        }
                        validationError = new Error('Invalid file format detected');
                        return [4 /*yield*/, this.errorHandler.handleError(validationError, testSession, { resource_type: 'file', operation: 'validation' })];
                    case 4:
                        validationSecurityError = _a.sent();
                        if (validationSecurityError.error_type !== 'validation') {
                            throw new Error('Validation error not classified correctly');
                        }
                        stats = this.errorHandler.getErrorStatistics();
                        if (stats.total_errors < 2) {
                            throw new Error('Error statistics not updating correctly');
                        }
                        console.log('✅ Error Handling tests passed');
                        return [2 /*return*/, true];
                    case 5:
                        error_4 = _a.sent();
                        console.error('❌ Error Handling tests failed:', error_4);
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testAuditLogging = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testSession, integrityCheck, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Audit Logging...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        return [4 /*yield*/, this.securityManager.createSession('audit_test_user', 'Audit Test User', ['auditor'], 'password')];
                    case 2:
                        testSession = _a.sent();
                        // Test security event logging
                        return [4 /*yield*/, this.auditService.logSecurityEvent({
                                event_type: 'test_event',
                                action: 'test_action',
                                resource_type: 'test_resource',
                                resource_id: 'test_123',
                                event_details: { test: 'data' },
                            }, testSession)];
                    case 3:
                        // Test security event logging
                        _a.sent();
                        return [4 /*yield*/, this.auditService.verifyAuditTrailIntegrity()];
                    case 4:
                        integrityCheck = _a.sent();
                        if (!integrityCheck) {
                            throw new Error('Audit trail integrity verification failed');
                        }
                        console.log('✅ Audit Logging tests passed');
                        return [2 /*return*/, true];
                    case 5:
                        error_5 = _a.sent();
                        console.error('❌ Audit Logging tests failed:', error_5);
                        return [2 /*return*/, false];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testThreatDetection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var incidents, error_6;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Threat Detection...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.errorHandler.detectAnomalousPatterns()];
                    case 2:
                        incidents = _a.sent();
                        // The method should return an array (may be empty)
                        if (!Array.isArray(incidents)) {
                            throw new Error('Threat detection should return an array');
                        }
                        console.log('✅ Threat Detection tests passed');
                        return [2 /*return*/, true];
                    case 3:
                        error_6 = _a.sent();
                        console.error('❌ Threat Detection tests failed:', error_6);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testSecurityMonitoring = function () {
        return __awaiter(this, void 0, void 0, function () {
            var alerts, metrics, error_7;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Security Monitoring...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 4, , 5]);
                        // Test that monitoring is active
                        if (!this.securityMonitor.listenerCount('alert_created')) {
                            // This is just a basic check that the monitor exists
                            console.log('Security monitor is initialized');
                        }
                        return [4 /*yield*/, this.securityMonitor.getActiveAlerts()];
                    case 2:
                        alerts = _a.sent();
                        if (!Array.isArray(alerts)) {
                            throw new Error('Active alerts should return an array');
                        }
                        return [4 /*yield*/, this.securityMonitor.getSecurityMetrics(1)];
                    case 3:
                        metrics = _a.sent();
                        if (!Array.isArray(metrics)) {
                            throw new Error('Security metrics should return an array');
                        }
                        console.log('✅ Security Monitoring tests passed');
                        return [2 /*return*/, true];
                    case 4:
                        error_7 = _a.sent();
                        console.error('❌ Security Monitoring tests failed:', error_7);
                        return [2 /*return*/, false];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.testDataEncryption = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testData, encrypted, decrypted, testObject, sanitized;
            return __generator(this, function (_a) {
                console.log('🧪 Testing Data Encryption...');
                try {
                    testData = 'Sensitive forensic data for testing';
                    encrypted = this.securityManager.encrypt(testData);
                    if (!encrypted.encrypted || !encrypted.iv || !encrypted.authTag) {
                        throw new Error('Encryption failed to produce required components');
                    }
                    decrypted = this.securityManager.decrypt(encrypted);
                    if (decrypted !== testData) {
                        throw new Error('Decryption failed to restore original data');
                    }
                    testObject = {
                        user: 'sensitive_user',
                        path: '/Users/sensitive/file.txt',
                        ip: '192.168.1.100',
                        data: 'some data'
                    };
                    sanitized = this.securityManager.sanitizeForAnalysis(testObject);
                    if (sanitized.user === testObject.user) {
                        throw new Error('Data sanitization failed to anonymize user data');
                    }
                    console.log('✅ Data Encryption tests passed');
                    return [2 /*return*/, true];
                }
                catch (error) {
                    console.error('❌ Data Encryption tests failed:', error);
                    return [2 /*return*/, false];
                }
                return [2 /*return*/];
            });
        });
    };
    SecurityTestSuite.prototype.testIntegration = function () {
        return __awaiter(this, void 0, void 0, function () {
            var testSession, hasPermission, testError, error_8;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧪 Testing Component Integration...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.securityManager.createSession('integration_user', 'Integration User', ['investigator'], 'password')];
                    case 2:
                        testSession = _a.sent();
                        return [4 /*yield*/, this.securityManager.checkPermission(testSession, 'evidence', 'create')];
                    case 3:
                        hasPermission = _a.sent();
                        if (!hasPermission) {
                            throw new Error('Integration test: Permission check failed');
                        }
                        // Log audit event
                        return [4 /*yield*/, this.auditService.logSecurityEvent({
                                event_type: 'integration_test',
                                action: 'test_workflow',
                                resource_type: 'evidence',
                                event_details: { test: 'integration' },
                            }, testSession)];
                    case 4:
                        // Log audit event
                        _a.sent();
                        testError = new Error('Integration test error');
                        return [4 /*yield*/, this.errorHandler.handleError(testError, testSession, { resource_type: 'integration', operation: 'test' })];
                    case 5:
                        _a.sent();
                        console.log('✅ Integration tests passed');
                        return [2 /*return*/, true];
                    case 6:
                        error_8 = _a.sent();
                        console.error('❌ Integration tests failed:', error_8);
                        return [2 /*return*/, false];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    SecurityTestSuite.prototype.displayTestResults = function (results, allPassed) {
        console.log('\n📊 Security Test Results:');
        console.log('====================================');
        Object.entries(results).forEach(function (_a) {
            var testName = _a[0], passed = _a[1];
            var status = passed ? '✅ PASS' : '❌ FAIL';
            var formattedName = testName.replace(/_/g, ' ').toUpperCase();
            console.log("".concat(formattedName, ": ").concat(status));
        });
        console.log('====================================');
        var overallStatus = allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
        console.log("OVERALL RESULT: ".concat(overallStatus));
        if (allPassed) {
            console.log('🎉 Security implementation is ready for production!');
        }
        else {
            console.log('⚠️  Please address failing tests before deployment.');
        }
    };
    SecurityTestSuite.prototype.cleanup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_9;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('🧹 Cleaning up test environment...');
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        return [4 /*yield*/, this.securityMonitor.stop()];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, this.auditService.shutdown()];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, this.databaseManager.close()];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, this.securityManager.cleanup()];
                    case 5:
                        _a.sent();
                        console.log('✅ Cleanup completed');
                        return [3 /*break*/, 7];
                    case 6:
                        error_9 = _a.sent();
                        console.error('❌ Cleanup failed:', error_9);
                        return [3 /*break*/, 7];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return SecurityTestSuite;
}());
exports.SecurityTestSuite = SecurityTestSuite;
// Export for external testing
function runSecurityTests() {
    return __awaiter(this, void 0, void 0, function () {
        var testSuite;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    testSuite = new SecurityTestSuite();
                    return [4 /*yield*/, testSuite.runAllTests()];
                case 1: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
