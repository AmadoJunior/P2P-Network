"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageType = exports.PacketType = void 0;
var PacketType;
(function (PacketType) {
    PacketType[PacketType["DIRECT"] = 0] = "DIRECT";
    PacketType[PacketType["BROADCAST"] = 1] = "BROADCAST";
})(PacketType = exports.PacketType || (exports.PacketType = {}));
var MessageType;
(function (MessageType) {
    MessageType[MessageType["HANDSHAKE"] = 0] = "HANDSHAKE";
    MessageType[MessageType["MESSAGE"] = 1] = "MESSAGE";
})(MessageType = exports.MessageType || (exports.MessageType = {}));
