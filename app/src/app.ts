import { P2PNetwork } from "./Classes/P2PNetwork";
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;

const randomItem = (c) => c[Math.floor(Math.random() * c.length)];

const network = new P2PNetwork();

let name = `${randomItem([
  "Gorgeous",
  "Elegant",
  "Phantastic",
  "Smart",
])} ${randomItem(["Pine", "Oak", "Spruce"])} from ${randomItem([
  "Paris",
  "Berlin",
  "Belgrade",
  "Ljubljana",
])}`;

// Start Service
network.initService(argv.port).then(() => {
  console.log(`Chat Service UP`);
  console.log(``);
  console.log(`Commands:`);
  console.log(`connect <IP>:<PORT>`);
  console.log(`name <NAME>`);
  console.log(`direct <DEST_NODE_ID>:<MESSAGE>`);
  console.log(`broadcast <MESSAGE>`);
  console.log(``);
  console.log(`Your name is "${name}"`);

  network.on("node_connect", ({ nodeId }) => {
    console.log(`New Peer Connected: ${nodeId}`);
  });
  network.on("node_disconnect", ({ nodeId }) => {
    console.log(`Peer Disconnected: ${nodeId}`);
  });
  network.on("broadcast", ({ origin, message }) => {
    console.log(`Broadcast:${origin}: ${message}`);
  });
  network.on("direct", ({ origin, message }) => {
    console.log(`Direct:${origin}: ${message}`);
  });

  // Start CLI
  process.stdin.on("data", (data) => {
    const text = data.toString().trim();
    const [command, arg] = text.split(" ");
    try {
      switch (command) {
        case "connect":
          const [ip, port] = arg.split(":");
          console.log(`Connecting to ${ip} at ${Number(port)}...`);
          network
            .connect(ip, Number(port))
            .then(() => console.log(`Connected to ${ip} at ${Number(port)}`));
          break;
        case "name":
          name = arg;
          console.log(`Name changed to "${name}"`);
          break;
        case "broadcast":
          network
            .broadcast(`${name}: ${arg}`)
            .then(() => console.log(`Broadcasted "${arg}"`));
          break;
        case "direct":
          const [nodeId, message] = arg.split(":");
          network
            .direct(nodeId, `${name}: ${message}`)
            .then(() => console.log(`Sent "${message}" to ${nodeId}`));
          break;
      }
    } catch (e) {
      console.error(e);
    }
  });
});

// Handle CTRL C
process.on("SIGINT", async () => {
  console.log("\nGracefully Shutting Down Chat...");

  try {
    await network.close();
    console.log("Successfully Closed Chat");
  } catch (e) {
    console.error(e);
  }
});
