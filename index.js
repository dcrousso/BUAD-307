const Express   = require("express");
const FS        = require("fs");
const HTTPS     = require("https");
const WebSocket = require("websocket");

const app = Express();
const server = HTTPS.createServer({
	// openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
	key: FS.readFileSync("key.pem"),
	cert: FS.readFileSync("cert.pem"),
}, app).listen(8080);

app.use(Express.static("static"));

const wss = new WebSocket.server({
	httpServer: server,
});

let connections = new Set;
wss.on("request", request => {
	let connection = request.accept();
	connection.on("message", message => {
		connections.forEach(item => {
			if (item !== connection)
				item.send(JSON.stringify(message));
		});
	});
	connection.on("close", (reason, description) => {
		connections.delete(connection);
	});

	connections.add(connection);
});
