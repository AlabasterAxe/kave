"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseLog = void 0;
function parseLog(log) {
    let lines = log.split("\n");
    return lines.map((line) => {
        let parts = line.split(" ");
        let timestampMillis = parseInt(parts[0]);
        let type = parts[1];
        return { timestampMillis, type };
    });
}
exports.parseLog = parseLog;
