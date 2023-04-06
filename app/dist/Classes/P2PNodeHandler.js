"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PNodeHandler = void 0;
const Enums_1 = require("./Enums");
const P2PSocketHandler_1 = require("./P2PSocketHandler");
const uuid_1 = require("uuid");
class P2PNodeHandler extends P2PSocketHandler_1.P2PSocketHandler {
    //Constructor
    constructor() {
        //Init
        super();
        this.nodeId = (0, uuid_1.v4)();
        this.neighbors = new Map();
    }
    //Methods
    findNodeId(connectionId) {
        for (let [nodeId, _connectionId] of this.neighbors) {
            if (connectionId === _connectionId) {
                return nodeId;
            }
        }
    }
    async nodeSend(nodeId, data) {
        const connectionId = this.neighbors.get(nodeId);
        console.log("nodeSend invoked");
        if (!connectionId) {
            throw new Error(`Cannot Find Connection ID for Node ${nodeId}`);
        }
        try {
            await this.socketSend(connectionId, {
                type: Enums_1.MessageType.MESSAGE,
                data: { nodeId, packet: data },
            });
        }
        catch (e) {
            throw e;
        }
    }
    handleSocketEvents() {
        return new Promise((resolve, reject) => {
            this.eventBus.on("socket_connect", (connectionId) => {
                this.socketSend(connectionId, {
                    type: Enums_1.MessageType.HANDSHAKE,
                    data: { nodeId: this.nodeId },
                });
            });
            this.eventBus.on("socket_message", ({ connectionId, message }) => {
                console.log("socket_message event");
                const { type, data } = message;
                if (type === Enums_1.MessageType.HANDSHAKE) {
                    const { nodeId } = data;
                    this.neighbors.set(nodeId, connectionId);
                    this.eventBus.emit("node_connect", { nodeId });
                }
                if (type === Enums_1.MessageType.MESSAGE) {
                    const nodeId = this.findNodeId(connectionId);
                    const { packet } = data;
                    this.eventBus.emit("node_message", { nodeId, packet });
                }
            });
            this.eventBus.on("socket_disconnect", (connectionId) => {
                const nodeId = this.findNodeId(connectionId);
                if (!nodeId) {
                    //TODO
                }
                this.neighbors.delete(nodeId);
                this.eventBus.emit("node_disconnect", { nodeId });
            });
            return resolve();
        });
    }
}
exports.P2PNodeHandler = P2PNodeHandler;
