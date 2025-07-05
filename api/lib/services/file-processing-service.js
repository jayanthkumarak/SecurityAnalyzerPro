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
exports.analyzeArtifact = analyzeArtifact;
var crypto = require("crypto");
function analyzeArtifact(buffer) {
    return __awaiter(this, void 0, void 0, function () {
        var fileType, mimeType, hash, entropy, suspiciousIndicators;
        return __generator(this, function (_a) {
            fileType = detectFileType(buffer);
            mimeType = getMimeType(fileType);
            hash = crypto.createHash('sha256').update(buffer).digest('hex');
            entropy = calculateEntropy(buffer);
            suspiciousIndicators = findSuspiciousIndicators(buffer);
            return [2 /*return*/, {
                    fileType: fileType,
                    mimeType: mimeType,
                    size: buffer.length,
                    hash: hash,
                    entropy: entropy,
                    suspiciousIndicators: suspiciousIndicators,
                    summary: generateSummary(fileType, buffer.length, entropy, suspiciousIndicators)
                }];
        });
    });
}
function detectFileType(buffer) {
    var header = buffer.slice(0, 512).toString('hex').toLowerCase();
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
function getMimeType(fileType) {
    var mimeTypes = {
        prefetch: 'application/octet-stream',
        evtx: 'application/x-ms-evtx',
        registry: 'application/x-ms-registry',
        memory: 'application/x-memory-dump',
        network: 'application/vnd.tcpdump.pcap',
        unknown: 'application/octet-stream',
    };
    return mimeTypes[fileType] || 'application/octet-stream';
}
function calculateEntropy(buffer) {
    var byteCounts = new Array(256).fill(0);
    for (var i = 0; i < buffer.length; i++) {
        byteCounts[buffer[i]]++;
    }
    var entropy = 0;
    var totalBytes = buffer.length;
    for (var _i = 0, byteCounts_1 = byteCounts; _i < byteCounts_1.length; _i++) {
        var count = byteCounts_1[_i];
        if (count > 0) {
            var probability = count / totalBytes;
            entropy -= probability * Math.log2(probability);
        }
    }
    return entropy;
}
function findSuspiciousIndicators(buffer) {
    var indicators = [];
    var data = buffer.toString('utf8', 0, Math.min(buffer.length, 10000));
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
function generateSummary(fileType, size, entropy, indicators) {
    var sizeMB = (size / 1024 / 1024).toFixed(2);
    var entropyLevel = entropy > 7.5 ? 'high' : entropy > 5 ? 'medium' : 'low';
    return "File type: ".concat(fileType, ", Size: ").concat(sizeMB, "MB, Entropy: ").concat(entropyLevel, " (").concat(entropy.toFixed(2), "), Indicators: ").concat(indicators.length);
}
