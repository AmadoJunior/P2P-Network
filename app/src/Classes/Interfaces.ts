import { PacketType, MessageType } from "./Enums";

export interface IMessage {
  name: string;
  text: string;
}

export interface IPacket {
  id: string;
  ttl: number;
  type: PacketType;
  message: any;
  destination?: string;
  origin: string;
}

export interface INodeMessage {
  nodeId: string;
  packet?: IPacket;
}

export interface ISocketMessage {
  type: MessageType;
  data: INodeMessage;
}
