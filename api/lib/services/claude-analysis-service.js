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
exports.renderReport = renderReport;
function renderReport(analysis_1) {
    return __awaiter(this, arguments, void 0, function (analysis, format) {
        var timestamp;
        if (format === void 0) { format = 'md'; }
        return __generator(this, function (_a) {
            timestamp = new Date().toISOString();
            if (format === 'md') {
                return [2 /*return*/, "# Forensic Analysis Report\n\n**Generated:** ".concat(timestamp, "\n**File Type:** ").concat(analysis.fileType, "\n**Size:** ").concat((analysis.size / 1024 / 1024).toFixed(2), " MB\n**Hash:** `").concat(analysis.hash, "`\n**Entropy:** ").concat(analysis.entropy.toFixed(2), " (").concat(analysis.entropy > 7.5 ? 'High' : analysis.entropy > 5 ? 'Medium' : 'Low', ")\n\n## Analysis Summary\n\n").concat(analysis.summary, "\n\n## Security Indicators\n\n").concat(analysis.suspiciousIndicators.length > 0
                        ? analysis.suspiciousIndicators.map(function (indicator) { return "- \u26A0\uFE0F ".concat(indicator); }).join('\n')
                        : '- ✅ No suspicious indicators detected', "\n\n## Technical Details\n\n- **MIME Type:** ").concat(analysis.mimeType, "\n- **File Type Detection:** ").concat(analysis.fileType, "\n- **Entropy Analysis:** ").concat(analysis.entropy.toFixed(2), " bits per byte\n- **Security Score:** ").concat(calculateSecurityScore(analysis), "/10\n\n## Recommendations\n\n").concat(generateRecommendations(analysis), "\n")];
            }
            return [2 /*return*/, JSON.stringify(analysis, null, 2)];
        });
    });
}
function calculateSecurityScore(analysis) {
    var score = 10;
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
function generateRecommendations(analysis) {
    var recommendations = [];
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
