import http from "http";
// import SocketIO from "socket.io";
import { Server } from "socket.io";
import { instrument } from "@socket.io/admin-ui";
import express from "express";

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"));
app.get("/", (_, res) => res.render("home"));
app.get("/*", (_, res) => res.redirect("/"));

const handleListen = () => console.log(`Listening on http://localhost:3000`);
// ws://localhost:3000  3000은 ws도 가능

const httpServer = http.createServer(app);
// const wsServer = SocketIO(httpServer);
// admin UI를 사용할 때 설정
const wsServer = new Server(httpServer, {
  cors: {
    origin: ["https://admin.socket.io"],
    credentials: true,
  },
});
instrument(wsServer, {
  auth: false,
});

function publicRooms() {
  //wsServer의 adapter안에있는 sids(사용자 id 모음)와 rooms(서버가 가지고있는 방 모음)에 접근
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer;
  // const sids = wsServer.sockets.adapter.sids;
  // const rooms = wsServer.sockets.adapter.rooms;

  // 사용자의 id와 private Rooms는 같기 때문에 rooms에 있는 key가 sids에도있으면 그것은 private Room이다.
  // 이를 이용하여 private Room과 public Room을 구분할 수 있다.
  const publicRooms = [];
  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key);
    }
  });
  return publicRooms;
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on("connection", (socket) => {
  socket["nickname"] = "Anon";
  // onAny의 파라미터 event는 어떤 event가 emit됬는지 확인 하는데 사용가능하다.
  socket.onAny((event) => {
    console.log(wsServer.sockets.adapter);
    console.log(`Socket Event:${event}`);
  });
  // 레퍼런스 : https://socket.io/docs/v4/server-api/#socketid
  socket.on("enter_room", (roomName, done) => {
    // socket에는 id가 존재해서 구분이 가능하다.
    console.log(socket.id);
    // socket.rooms를 통해 socket이 어떤 방에 들어가있는지 알 수 있다.
    console.log(socket.rooms); // Set { <socket.id> }
    // join으로 해당 이름의 room에 입장할 수 있다. 여러방에도 입장 가능 ["room1", "room2"]
    socket.join(roomName);
    console.log(socket.rooms); // Set { <socket.id>, "room1" }
    done();
    // to()를 사용하여 특정 방을 지정하여 emit할 수 있다. 이는 여러개도 가능 socket.to(room1).to(room3).emit("welcome")
    socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));

    //io.sockets.emit을 통해 모든 방에 이벤트를 보낼 수 있다.
    wsServer.sockets.emit("room_change", publicRooms());

    // disconnecting은 연결이 완전히 끊어진것이 아니라 연결이 끊기기 전을 의미한다.
    socket.on("disconnecting", () => {
      socket.rooms.forEach((room) => {
        socket.to(room).emit("bye", socket.nickname, countRoom(roomName) - 1);
      });
    });
    // disconnect는 연결이 끊어진 후 작업이다.
    socket.on("disconnect", () => {
      wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) => {
      socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
      done();
    });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
  });
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
