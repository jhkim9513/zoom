import http from "http";
import SocketIO from "socket.io";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// ws://localhost:3000  3000은 ws도 가능

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection", socket => {
    socket.on("enter_room", (roomName, done) => {
        console.log(roomName) 
        setTimeout(() => {
            done('yahoo');
        }, 3000)
    })
});

// const wss = new WebSocket.Server({server}); // http서버위에 ws서버를 만들 수 있음
//new WebSocket.Server(); 서버를 꼭 포함하지 않아도 됨

/* const sockets = [];

// 파라미터로 넘기는 socket은 연결된 클라이언트이다.
wss.on("connection", socket => {
    sockets.push(socket);
    socket["nickname"] = "Anony"
    console.log("Connected to Browser ✓");
    socket.on("close", () => console.log("Disconnected to Browser ❌"));
    socket.on("message", msg => {
        const message = JSON.parse(msg);
        switch(message.type) {
            case "new_message":
                sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`));
                break;
            case "nickname":
                socket["nickname"] = message.payload;
                break;
        }
    })
}); */

// 2개의 프로토콜(http, ws)이 하나의 포트 3000을 공유함
httpServer.listen(3000, handleListen);