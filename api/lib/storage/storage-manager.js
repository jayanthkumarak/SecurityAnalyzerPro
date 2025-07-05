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
exports.StorageManager = void 0;
var Database = require("better-sqlite3");
var crypto = require("crypto");
var fs = require("fs");
var path = require("path");
var StorageManager = /** @class */ (function () {
    function StorageManager(config) {
        this.config = config;
        this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
        // Ensure directories exist
        this.ensureDirectories();
        // Initialize database
        this.db = new Database(config.dbPath);
        this.initializeDatabase();
    }
    StorageManager.prototype.ensureDirectories = function () {
        var dirs = [
            path.dirname(this.config.dbPath),
            this.config.artifactsDir
        ];
        for (var _i = 0, dirs_1 = dirs; _i < dirs_1.length; _i++) {
            var dir = dirs_1[_i];
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        }
    };
    StorageManager.prototype.initializeDatabase = function () {
        // Create artifacts table
        this.db.exec("\n      CREATE TABLE IF NOT EXISTS artifacts (\n        id TEXT PRIMARY KEY,\n        filename TEXT NOT NULL,\n        original_name TEXT NOT NULL,\n        size INTEGER NOT NULL,\n        mime_type TEXT NOT NULL,\n        hash TEXT NOT NULL,\n        encrypted_data BLOB NOT NULL,\n        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,\n        case_id TEXT,\n        UNIQUE(filename)\n      )\n    ");
        // Create index for faster lookups
        this.db.exec("\n      CREATE INDEX IF NOT EXISTS idx_artifacts_case_id ON artifacts(case_id)\n    ");
    };
    StorageManager.prototype.storeArtifact = function (fileBuffer, originalName, mimeType, caseId) {
        return __awaiter(this, void 0, void 0, function () {
            var id, filename, hash, encryptedData, stmt;
            return __generator(this, function (_a) {
                id = this.generateId();
                filename = "".concat(id, "_").concat(originalName);
                hash = this.calculateHash(fileBuffer);
                encryptedData = this.encrypt(fileBuffer);
                stmt = this.db.prepare("\n      INSERT INTO artifacts (id, filename, original_name, size, mime_type, hash, encrypted_data, case_id)\n      VALUES (?, ?, ?, ?, ?, ?, ?, ?)\n    ");
                stmt.run(id, filename, originalName, fileBuffer.length, mimeType, hash, encryptedData, caseId);
                return [2 /*return*/, {
                        id: id,
                        filename: filename,
                        originalName: originalName,
                        size: fileBuffer.length,
                        mimeType: mimeType,
                        hash: hash,
                        encryptedData: encryptedData,
                        createdAt: new Date(),
                        caseId: caseId
                    }];
            });
        });
    };
    StorageManager.prototype.getArtifact = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, row;
            return __generator(this, function (_a) {
                stmt = this.db.prepare('SELECT * FROM artifacts WHERE id = ?');
                row = stmt.get(id);
                if (!row)
                    return [2 /*return*/, null];
                return [2 /*return*/, {
                        id: row.id,
                        filename: row.filename,
                        originalName: row.original_name,
                        size: row.size,
                        mimeType: row.mime_type,
                        hash: row.hash,
                        encryptedData: row.encrypted_data,
                        createdAt: new Date(row.created_at),
                        caseId: row.case_id
                    }];
            });
        });
    };
    StorageManager.prototype.getArtifactData = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var artifact;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getArtifact(id)];
                    case 1:
                        artifact = _a.sent();
                        if (!artifact)
                            return [2 /*return*/, null];
                        return [2 /*return*/, this.decrypt(artifact.encryptedData)];
                }
            });
        });
    };
    StorageManager.prototype.listArtifacts = function (caseId) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, rows;
            return __generator(this, function (_a) {
                if (caseId) {
                    stmt = this.db.prepare('SELECT * FROM artifacts WHERE case_id = ? ORDER BY created_at DESC');
                    rows = stmt.all(caseId);
                }
                else {
                    stmt = this.db.prepare('SELECT * FROM artifacts ORDER BY created_at DESC');
                    rows = stmt.all();
                }
                return [2 /*return*/, rows.map(function (row) { return ({
                        id: row.id,
                        filename: row.filename,
                        originalName: row.original_name,
                        size: row.size,
                        mimeType: row.mime_type,
                        hash: row.hash,
                        encryptedData: row.encrypted_data,
                        createdAt: new Date(row.created_at),
                        caseId: row.case_id
                    }); })];
            });
        });
    };
    StorageManager.prototype.deleteArtifact = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            var stmt, result;
            return __generator(this, function (_a) {
                stmt = this.db.prepare('DELETE FROM artifacts WHERE id = ?');
                result = stmt.run(id);
                return [2 /*return*/, result.changes > 0];
            });
        });
    };
    StorageManager.prototype.encrypt = function (data) {
        var iv = crypto.randomBytes(16);
        var cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
        var encrypted = Buffer.concat([
            cipher.update(data),
            cipher.final()
        ]);
        var authTag = cipher.getAuthTag();
        // Combine IV + encrypted data + auth tag
        return Buffer.concat([iv, encrypted, authTag]);
    };
    StorageManager.prototype.decrypt = function (encryptedData) {
        var iv = encryptedData.slice(0, 16);
        var authTag = encryptedData.slice(-16);
        var encrypted = encryptedData.slice(16, -16);
        var decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);
        return Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
    };
    StorageManager.prototype.calculateHash = function (data) {
        return crypto.createHash('sha256').update(data).digest('hex');
    };
    StorageManager.prototype.generateId = function () {
        return crypto.randomBytes(16).toString('hex');
    };
    StorageManager.prototype.close = function () {
        this.db.close();
    };
    return StorageManager;
}());
exports.StorageManager = StorageManager;
