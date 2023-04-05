import { P2PNodeHandler } from "./P2PNodeHandler";
import { PacketType } from "./Enums";
import { IPacket } from "./Interfaces";
import { v4 as uuidv4 } from "uuid";

export class P2PNetwork extends P2PNodeHandler {
  //Properties
  private seenMessages: Set<string>;
  public on = this.eventBus.on.bind(this.eventBus);
  public off = this.eventBus.off.bind(this.eventBus);

  //Constructor
  constructor() {
    //Init
    super();
    this.seenMessages = new Set();
    this.on = this.eventBus.on.bind(this.eventBus);
    this.off = this.eventBus.off.bind(this.eventBus);
  }

  //Methods
  public async initService(portNum: number): Promise<void> {
    try {
      await this.socketListen(portNum);
      await this.handleSocketEvents();
      await this.handleNodeEvents();
    } catch (e) {
      throw e;
    }
  }
  private async sendPacket(packet: IPacket): Promise<void> {
    try {
      for (const _nodeId of this.neighbors.keys()) {
        this.nodeSend(_nodeId, packet);
      }
    } catch (e) {
      throw e;
    }
  }

  public async broadcast(
    message: string,
    id: string = uuidv4(),
    origin: string = this.nodeId,
    ttl: number = 255
  ): Promise<void> {
    try {
      await this.sendPacket({
        id,
        ttl,
        type: PacketType.BROADCAST,
        message,
        origin,
      });
    } catch (e) {
      throw e;
    }
  }

  public async direct(
    destination: string,
    message: string,
    id: string = uuidv4(),
    origin: string = this.nodeId,
    ttl: number = 255
  ): Promise<void> {
    try {
      this.sendPacket({
        id,
        ttl,
        type: PacketType.DIRECT,
        message,
        destination,
        origin,
      });
    } catch (e) {
      throw e;
    }
  }

  private handleNodeEvents(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.eventBus.on("node_message", ({ nodeId, data }) => {
        if (this.seenMessages.has(data.id) || data.ttl <= 0) return;
        this.seenMessages.add(data.id);

        if (data.type === PacketType.BROADCAST) {
          this.eventBus.emit("broadcast", {
            origin: data.origin,
            message: data.message,
          });
          this.broadcast(data.message, data.id, data.origin, data.ttl - 1);
        }

        if (data.type === PacketType.DIRECT) {
          if ((data.destination = this.nodeId)) {
            this.eventBus.emit("direct", {
              origin: data.origin,
              message: data.message,
            });
          } else {
            this.direct(
              data.destination,
              data.message,
              data.id,
              data.origin,
              data.ttl - 1
            );
          }
        }
      });
      return resolve();
    });
  }

  public async connect(address: string, port: number): Promise<void> {
    try {
      await this.socketConnect(address, port);
    } catch (e) {
      throw e;
    }
  }

  public async listen(port: number): Promise<void> {
    try {
      await this.socketListen(port);
    } catch (e) {
      throw e;
    }
  }

  public async close(): Promise<void> {
    try {
      await this.closeSockets();
    } catch (e) {
      throw e;
    }
  }

  public getNodeId(): string {
    return this.nodeId;
  }

  public getNeighbors(): IterableIterator<string> {
    return this.neighbors.keys();
  }

  public getEventBus() {
    return this.eventBus;
  }
}
