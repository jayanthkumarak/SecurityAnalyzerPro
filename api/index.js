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
var fastify_1 = require("fastify");
var cors_1 = require("@fastify/cors");
var multipart_1 = require("@fastify/multipart");
var file_processing_service_1 = require("./lib/services/file-processing-service");
var claude_analysis_service_1 = require("./lib/services/claude-analysis-service");
var storage_manager_1 = require("./lib/storage/storage-manager");
var path = require("path");
var crypto = require("crypto");
// Initialize storage manager
var storageManager = new storage_manager_1.StorageManager({
    dbPath: path.join(process.cwd(), 'data', 'artifacts.db'),
    encryptionKey: process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex'),
    artifactsDir: path.join(process.cwd(), 'data', 'artifacts')
});
var app = (0, fastify_1.default)({ logger: true });
await app.register(cors_1.default, { origin: '*' });
await app.register(multipart_1.default);
// Health check endpoint
app.get('/health', function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, { status: 'ok', timestamp: new Date().toISOString() }];
    });
}); });
// Upload and analyze artifact
app.post('/analyze', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var data, buffer, mimeType, artifact, analysis, report, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, req.file()];
            case 1:
                data = _a.sent();
                if (!data) {
                    return [2 /*return*/, reply.code(400).send({ error: 'No file uploaded' })];
                }
                return [4 /*yield*/, data.toBuffer()];
            case 2:
                buffer = _a.sent();
                mimeType = data.mimetype || 'application/octet-stream';
                return [4 /*yield*/, storageManager.storeArtifact(buffer, data.filename || 'unknown', mimeType)];
            case 3:
                artifact = _a.sent();
                return [4 /*yield*/, (0, file_processing_service_1.analyzeArtifact)(buffer)];
            case 4:
                analysis = _a.sent();
                return [4 /*yield*/, (0, claude_analysis_service_1.renderReport)(analysis, 'md')];
            case 5:
                report = _a.sent();
                return [2 /*return*/, {
                        artifactId: artifact.id,
                        filename: artifact.originalName,
                        size: artifact.size,
                        hash: artifact.hash,
                        report: report
                    }];
            case 6:
                error_1 = _a.sent();
                console.error('Error processing file:', error_1);
                return [2 /*return*/, reply.code(500).send({ error: 'Failed to process file' })];
            case 7: return [2 /*return*/];
        }
    });
}); });
// Get artifact by ID
app.get('/artifacts/:id', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var id, artifact, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, storageManager.getArtifact(id)];
            case 1:
                artifact = _a.sent();
                if (!artifact) {
                    return [2 /*return*/, reply.code(404).send({ error: 'Artifact not found' })];
                }
                return [2 /*return*/, {
                        id: artifact.id,
                        filename: artifact.originalName,
                        size: artifact.size,
                        mimeType: artifact.mimeType,
                        hash: artifact.hash,
                        createdAt: artifact.createdAt
                    }];
            case 2:
                error_2 = _a.sent();
                console.error('Error retrieving artifact:', error_2);
                return [2 /*return*/, reply.code(500).send({ error: 'Failed to retrieve artifact' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Download artifact
app.get('/artifacts/:id/download', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var id, artifact, data, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                id = req.params.id;
                return [4 /*yield*/, storageManager.getArtifact(id)];
            case 1:
                artifact = _a.sent();
                if (!artifact) {
                    return [2 /*return*/, reply.code(404).send({ error: 'Artifact not found' })];
                }
                return [4 /*yield*/, storageManager.getArtifactData(id)];
            case 2:
                data = _a.sent();
                if (!data) {
                    return [2 /*return*/, reply.code(404).send({ error: 'Artifact data not found' })];
                }
                reply.header('Content-Type', artifact.mimeType);
                reply.header('Content-Disposition', "attachment; filename=\"".concat(artifact.originalName, "\""));
                return [2 /*return*/, data];
            case 3:
                error_3 = _a.sent();
                console.error('Error downloading artifact:', error_3);
                return [2 /*return*/, reply.code(500).send({ error: 'Failed to download artifact' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// List all artifacts
app.get('/artifacts', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var artifacts, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, storageManager.listArtifacts()];
            case 1:
                artifacts = _a.sent();
                return [2 /*return*/, artifacts.map(function (artifact) { return ({
                        id: artifact.id,
                        filename: artifact.originalName,
                        size: artifact.size,
                        mimeType: artifact.mimeType,
                        hash: artifact.hash,
                        createdAt: artifact.createdAt
                    }); })];
            case 2:
                error_4 = _a.sent();
                console.error('Error listing artifacts:', error_4);
                return [2 /*return*/, reply.code(500).send({ error: 'Failed to list artifacts' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
// Delete artifact
app.delete('/artifacts/:id', function (req, reply) { return __awaiter(void 0, void 0, void 0, function () {
    var id, deleted, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, storageManager.deleteArtifact(id)];
            case 1:
                deleted = _a.sent();
                if (!deleted) {
                    return [2 /*return*/, reply.code(404).send({ error: 'Artifact not found' })];
                }
                return [2 /*return*/, { message: 'Artifact deleted successfully' }];
            case 2:
                error_5 = _a.sent();
                console.error('Error deleting artifact:', error_5);
                return [2 /*return*/, reply.code(500).send({ error: 'Failed to delete artifact' })];
            case 3: return [2 /*return*/];
        }
    });
}); });
app.listen({ port: 4000 }, function () {
    return console.log('🚀 API ready → http://localhost:4000');
});
