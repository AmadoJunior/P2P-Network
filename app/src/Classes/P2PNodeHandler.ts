import { MessageType } from "../Utils/Enums";
import { IPacket } from "../Utils/Interfaces";
import { P2PSocketHandler } from "./P2PSocketHandler";
import { v4 as uuidv4 } from "uuid";

export class P2PNodeHandler extends P2PSocketHandler {
  //Properties
  protected nodeId: string;
  protected neighbors: Map<string, string>;

  //Constructor
  constructor() {
    //Init
    super();
    this.nodeId = uuidv4();
    this.neighbors = new Map();
  }

  //Methods
  protected findNodeId(connectionId: string): string {
    for (let [nodeId, _connectionId] of this.neighbors) {
      if (connectionId === _connectionId) {
        return nodeId;
      }
    }
  }

  protected async nodeSend(nodeId: string, data: IPacket): Promise<void> {
    const connectionId = this.neighbors.get(nodeId);
    if (!connectionId) {
      throw new Error(`Cannot Find Connection ID for Node ${nodeId}`);
    }

    try {
      await this.socketSend(connectionId, {
        type: MessageType.MESSAGE,
        data: { nodeId, packet: data },
      });
    } catch (e) {
      throw e;
    }
  }

  protected handleSocketEvents(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventBus.on("socket_connect", (connectionId) => {
        this.socketSend(connectionId, {
          type: MessageType.HANDSHAKE,
          data: { nodeId: this.nodeId },
        });
      });

      this.eventBus.on("socket_message", ({ connectionId, message }) => {
        const { type, data } = message;

        if (type === MessageType.HANDSHAKE) {
          const { nodeId } = data;

          this.neighbors.set(nodeId, connectionId);
          this.eventBus.emit("node_connect", { nodeId });
        }
        if (type === MessageType.MESSAGE) {
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
