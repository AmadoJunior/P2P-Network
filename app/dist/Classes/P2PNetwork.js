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
        this.seenMessages = new Set();
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
    sendPacket(packet) {
        for (const _nodeId of this.neighbors.keys()) {
            this.nodeSend(_nodeId, packet);
        }
    }
    broadcast(message, id = (0, uuid_1.v4)(), origin = this.nodeId, ttl = 255) {
        this.sendPacket({ id, ttl, type: Enums_1.PacketType.BROADCAST, message, origin });
    }
    direct(destination, message, id = (0, uuid_1.v4)(), origin = this.nodeId, ttl = 255) {
        this.sendPacket({
            id,
            ttl,
            type: Enums_1.PacketType.DIRECT,
            message,
            destination,
            origin,
        });
    }
    handleNodeEvents() {
        return new Promise((resolve, reject) => {
            this.eventBus.on("node_message", ({ nodeId, data }) => {
                if (this.seenMessages.has(data.id) || data.ttl <= 0)
                    return;
                this.seenMessages.add(data.id);
                if (data.type === Enums_1.PacketType.BROADCAST) {
                    this.eventBus.emit("broadcast", {
                        origin: data.origin,
                        message: data.message,
                    });
                    this.broadcast(data.message, data.id, data.origin, data.ttl - 1);
                }
                if (data.type === Enums_1.PacketType.DIRECT) {
                    if ((data.destination = this.nodeId)) {
                        this.eventBus.emit("direct", {
                            origin: data.origin,
                            message: data.message,
                        });
                    }
                    else {
                        this.direct(data.destination, data.message, data.id, data.origin, data.ttl - 1);
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
