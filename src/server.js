import http from "http";
import WebSocket from "ws";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// ws://localhost:3000  3000은 ws도 가능

const server = http.createServer(app);

const wss = new WebSocket.Server({server}); // http서버위에 ws서버를 만들 수 있음
//new WebSocket.Server(); 서버를 꼭 포함하지 않아도 됨

wss.on("connection", socket => {
    console.log("Connected to Browser ✓");
    socket.on("close", () => console.log("Disconnected to Browser ❌"));
    socket.on("message", message => {
        console.log(message.toString());
    })
    socket.send("hello");
});

// 2개의 프로토콜(http, ws)이 하나의 포트 3000을 공유함
server.listen(3000, handleListen);