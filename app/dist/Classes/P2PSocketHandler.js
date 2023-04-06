"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.P2PSocketHandler = void 0;
const net_1 = __importDefault(require("net"));
const uuid_1 = require("uuid");
const events_1 = __importDefault(require("events"));
class P2PSocketHandler {
    //Constructor
    constructor() {
        //Init
        this.eventBus = new events_1.default();
        this.connections = new Map();
    }
    //Methods
    //Handles Sockets
    handleNewSocket(socket) {
        //Generate UID
        const connectionId = (0, uuid_1.v4)();
        console.log("Socket Opened");
        //Save Connection & Emit Event
        this.connections.set(connectionId, socket);
        this.eventBus.emit("socket_connect", connectionId);
        //Handle Events
        socket.on("close", () => {
            console.log("Socket Closed");
            this.connections.delete(connectionId);
            this.eventBus.emit("socket_disconnect", connectionId);
        });
        socket.on("data", (data) => {
            console.log("data event");
            try {
                const message = JSON.parse(data.toString());
                try {
                    this.eventBus.emit("socket_message", {
                        connectionId,
                        message: message,
                    });
                }
                catch (e) {
                    console.error(`Cannot Emit ${e}`);
                }
            }
            catch (e) {
                console.error(`Cannot Parse Peer Message`, data.toString());
            }
        });
    }
    //Send Message to Socket
    socketSend(connectionId, message) {
        return new Promise((resolve, reject) => {
            console.log("socketSend invoked");
            const socket = this.connections.get(connectionId);
            if (!socket) {
                return reject(new Error(`Attempt to send data to connection that does not exist ${connectionId}`));
            }
            socket.write(JSON.stringify(message), (err) => {
                console.log(String.raw `Sending Message: ${JSON.stringify(message)}`);
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    }
    //Connect to Peer
    socketConnect(ip, port) {
        return new Promise((resolve, reject) => {
            try {
                const socket = new net_1.default.Socket();
                socket.connect(port, ip, () => {
                    this.handleNewSocket(socket);
                    return resolve();
                });
            }
            catch (e) {
                return reject(e);
            }
        });
    }
    //Start Server
    socketListen(port) {
        return new Promise((resolve, reject) => {
            try {
                this.server = net_1.default.createServer((socket) => {
                    this.handleNewSocket(socket);
                });
                this.server.listen(port, "0.0.0.0", () => {
                    console.log(`Listening on Port ${port}`);
                    return resolve();
                });
            }
            catch (e) {
                return reject(e);
            }
        });
    }
    //Close All Connections
    closeSockets() {
        return new Promise((resolve, reject) => {
            for (const [connectionId, socket] of this.connections) {
                socket.destroy();
            }
            this.server.close((err) => {
                if (err)
                    return reject(err);
                return resolve();
            });
        });
    }
}
exports.P2PSocketHandler = P2PSocketHandler;
