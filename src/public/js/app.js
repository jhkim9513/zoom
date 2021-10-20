// 프론트에서 script(src="/socket.io/socket.io.js")  를 가져오면 io()에 접근할 수 있다. 작업관리자에서 확인 가능
const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("input");
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const form = room.querySelector("form");
    form.addEventListener("submit", handleMessageSubmit);
}

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    // emit( 이벤트이름, 오브젝트, callback함수)
    // 이는 서버측에서 socket.on(이벤트이름, (값, callback함수) => {} ) 로 사용 가능
    socket.emit("enter_room", input.value, showRoom );
    roomName = input.value;
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);

socket.on("welcome", () => {
    addMessage("someone joined!");
});

socket.on("bye", () => {
    addMessage("someone left! ㅠㅠ");
});

socket.on("new_message", addMessage);