"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileType = void 0;
var FileType;
(function (FileType) {
    // can be used as clipref
    FileType[FileType["video"] = 0] = "video";
    // cannot be used as clipref by itself
    FileType[FileType["interaction_log"] = 1] = "interaction_log";
})(FileType = exports.FileType || (exports.FileType = {}));
