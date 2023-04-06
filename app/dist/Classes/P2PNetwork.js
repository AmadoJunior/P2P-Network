"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PNetwork = void 0;
const P2PNodeHandler_1 = require("./P2PNodeHandler");
const Enums_1 = require("./Enums");
const uuid_1 = require("uuid");
class P2PNetwork extends P2PNodeHandler_1.P2PNodeHandler {
    //Constructor
    constructor() {
        //Init
        super();
        this.on = this.eventBus.on.bind(this.eventBus);
        this.off = this.eventBus.off.bind(this.eventBus);
        this.seenMessages = new Set();
        this.on = this.eventBus.on.bind(this.eventBus);
        this.off = this.eventBus.off.bind(this.eventBus);
    }
    //Methods
    async initService(portNum) {
        try {
            await this.socketListen(portNum);
            await this.handleSocketEvents();
            await this.handleNodeEvents();
        }
        catch (e) {
            throw e;
        }
    }
    async sendPacket(packet) {
        try {
            console.log("sendPacket invoked");
            for (const _nodeId of this.neighbors.keys()) {
                this.nodeSend(_nodeId, packet);
            }
        }
        catch (e) {
            throw e;
        }
    }
    async broadcast(message, id = (0, uuid_1.v4)(), origin = this.nodeId, ttl = 255) {
        try {
            console.log("broadcast invoked");
            await this.sendPacket({
                id,
                ttl,
                type: Enums_1.PacketType.BROADCAST,
                message,
                origin,
            });
        }
        catch (e) {
            throw e;
        }
    }
    async direct(destination, message, id = (0, uuid_1.v4)(), origin = this.nodeId, ttl = 255) {
        try {
            this.sendPacket({
                id,
                ttl,
                type: Enums_1.PacketType.DIRECT,
                message,
                destination,
                origin,
            });
        }
        catch (e) {
            throw e;
        }
    }
    handleNodeEvents() {
        return new Promise((resolve, reject) => {
            this.eventBus.on("node_message", ({ nodeId, packet }) => {
                console.log("node_message event", packet);
                if (this.seenMessages.has(packet.id) || packet.ttl <= 0)
                    return;
                this.seenMessages.add(packet.id);
                if (packet.type == Enums_1.PacketType.BROADCAST) {
                    this.eventBus.emit("broadcast", {
                        origin: packet.origin,
                        message: packet.message,
                    });
                    this.broadcast(packet.message, packet.id, packet.origin, packet.ttl - 1);
                }
                if (packet.type == Enums_1.PacketType.DIRECT) {
                    if ((packet.destination = this.nodeId)) {
                        this.eventBus.emit("direct", {
                            origin: packet.origin,
                            message: packet.message,
                        });
                    }
                    else {
                        this.direct(packet.destination, packet.message, packet.id, packet.origin, packet.ttl - 1);
                    }
                }
            });
            return resolve();
        });
    }
    async connect(address, port) {
        try {
            await this.socketConnect(address, port);
        }
        catch (e) {
            throw e;
        }
    }
    async listen(port) {
        try {
            await this.socketListen(port);
        }
        catch (e) {
            throw e;
        }
    }
    async close() {
        try {
            await this.closeSockets();
        }
        catch (e) {
            throw e;
        }
    }
    getNodeId() {
        return this.nodeId;
    }
    getNeighbors() {
        return this.neighbors.keys();
    }
    getEventBus() {
        return this.eventBus;
    }
}
exports.P2PNetwork = P2PNetwork;
