const express = require('express');
const WebSocket = require('ws');
const osc = require('osc');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve public folder
app.use(express.static(path.join(__dirname, 'public')));

// Create HTTP server
const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

function broadcast(data) {
  const msg = JSON.stringify(data);
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(msg);
    }
  });
}

// OSC UDP Port (receiving from TouchDesigner)
const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: 8000
});

udpPort.on("message", function (oscMsg) {
  console.log("Received OSC:", oscMsg);
  broadcast(oscMsg); // send to browser via WS
});

udpPort.open();