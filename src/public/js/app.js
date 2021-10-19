// 프론트에서 script(src="/socket.io/socket.io.js")  를 가져오면 io()에 접근할 수 있다. 작업관리자에서 확인 가능
const socket = io();

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function backendDone(msg) {
    console.log(`backend say ${msg}`);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    // emit( 이벤트이름, 오브젝트, callback함수)
    // 이는 서버측에서 socket.on(이벤트이름, (값, callback함수) => {} ) 로 사용 가능
    socket.emit("enter_room", input.value, backendDone );
    input.value = "";
}

form.addEventListener("submit", handleRoomSubmit);