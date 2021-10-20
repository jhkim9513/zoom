import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

// ws://localhost:3000  3000은 ws도 가능
const handleListen = () => console.log(`Listening on http://localhost:3000`);
// 2개의 프로토콜(http, ws)이 하나의 포트 3000을 공유함
httpServer.listen(3000, handleListen);
