import net from "net";
import { v4 as uuidv4 } from "uuid";
import EventEmitter from "events";
import { ISocketMessage } from "./Interfaces";

export class P2PSocketHandler {
  //Properties
  private connections: Map<string, net.Socket>;
  protected eventBus: EventEmitter;
  private server: net.Server;

  //Constructor
  constructor() {
    //Init
    this.eventBus = new EventEmitter();
    this.connections = new Map();
  }

  //Methods
  //Handles Sockets
  private handleNewSocket(socket: net.Socket): void {
    //Generate UID
    const connectionId = uuidv4();
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
        this.eventBus.emit("socket_message", {
          connectionId,
          message: JSON.parse(data.toString()),
        });
      } catch (e) {
        console.error(`Cannot Parse Peer Message`, data.toString());
      }
    });
  }

  //Send Message to Socket
  protected socketSend(
    connectionId: string,
    message: ISocketMessage
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      console.log("socketSend invoked");
      const socket: net.Socket = this.connections.get(connectionId);

      if (!socket) {
        return reject(
          new Error(
            `Attempt to send data to connection that does not exist ${connectionId}`
          )
        );
      }

      socket.write(JSON.stringify(message), (err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }

  //Connect to Peer
  protected socketConnect(ip: string, port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const socket: net.Socket = new net.Socket();

        socket.connect(port, ip, () => {
          this.handleNewSocket(socket);
          return resolve();
        });
      } catch (e) {
        return reject(e);
      }
    });
  }

  //Start Server
  protected socketListen(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = net.createServer((socket) => {
          this.handleNewSocket(socket);
        });

        this.server.listen(port, "0.0.0.0", () => {
          console.log(`Listening on Port ${port}`);
          return resolve();
        });
      } catch (e) {
        return reject(e);
      }
    });
  }

  //Close All Connections
  protected closeSockets(): Promise<void> {
    return new Promise((resolve, reject) => {
      for (const [connectionId, socket] of this.connections) {
        socket.destroy();
      }

      this.server.close((err) => {
        if (err) return reject(err);
        return resolve();
      });
    });
  }
}
