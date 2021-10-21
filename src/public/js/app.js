// 프론트에서 script(src="/socket.io/socket.io.js")  를 가져오면 io()에 접근할 수 있다. 작업관리자에서 확인 가능
const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel; // dataChannel은 offer를 만드는쪽이 만들어야하고 offer를 만들기전에 만들어야한다.

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = myStream.getVideoTracks()[0];
    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.innerText = camera.label;
      if (currentCamera.label === camera.label) {
        option.selected = true;
      }
      camerasSelect.appendChild(option);
    });
  } catch (e) {
    console.log(e);
  }
}

async function getMedia(deviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: "user" },
  };
  const cameraConstraints = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? initialConstrains : cameraConstraints
    );
    myFace.srcObject = myStream;
    if (!deviceId) {
      await getCameras();
    }
  } catch (e) {
    console.log(e);
  }
}

function handleMuteClick() {
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (!muted) {
    muteBtn.innerText = "Unmute";
    muted = true;
  } else {
    muteBtn.innerText = "Mute";
    muted = false;
  }
}
function handleCameraClick() {
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  if (cameraOff) {
    cameraBtn.innerText = "Turn Camera Off";
    cameraOff = false;
  } else {
    cameraBtn.innerText = "Turn Camera On";
    cameraOff = true;
  }
}

async function handleCameraChange() {
  await getMedia(camerasSelect.value);
  console.log(myPeerConnection.getSender());
  // peerConnection은 senders라는것을 가진다.
  // sender는 다른 브라우저로 보내진 비디오와 오디오 데이터를 컨트롤하는 방법
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0];
    const videoSender = myPeerConnection
      .getSender()
      .find((sender) => sender.track.kind === "video");
    console.log(videoSender); // videoSender에는 replaceTrack이라는것이 있다.
    videoSender.replaceTrack(videoTrack);
  }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join  a room )

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
  welcome.hidden = true;
  call.hidden = false;
  await getMedia();
  makeConnection();
}

async function handleWelcomeSubmit(event) {
  event.preventDefault();
  const input = welcomeForm.querySelector("input");
  // socketIO는 굉장히 빠르기 때문에 makeConnection함수를 콜백으로 보내서 실행한다면
  // myPeerConnection이 생성이 안되있을 수 있다. 때문에 순서를 바꿔 getMedia()를 먼저 실행하도록한다.
  await initCall();
  socket.emit("join_room", input.value);
  roomName = input.value;
  input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket cdoe

// on("welcome")은 peerA측에서 돌아가는 코드
socket.on("welcome", async () => {
  //video, audio가 아닌 text라면 dataChannel을 이용
  //offer생성자 즉, 방의 첫번째 사람이 dataChannel을 생성해야한다. 이 때 offer생정 전에 만들어야함
  myDataChannel = myPeerConnection.createDataChannel("chat");
  // 만들어진 dataChannel에 meesage이벤트를 등록하여 메시지를 받으면(send()) 반응하도록한다.
  myDataChannel.addEventListener("message", console.log);
  console.log("data channel 만들었음");

  // 방에 누군가 접속했을 때 offer를 생성한다.
  // 생성된 offer에는 sdp라는 다른 브라우저가 참가할 수 있는 초대장?이 있다.
  const offer = await myPeerConnection.createOffer();
  // offer를 가지고나면 이 offer로 연결을 구성해야한다.
  myPeerConnection.setLocalDescription(offer);

  /* peerA가 방장이라면 peerB가 접속했을 때 peerA가 offer를 생성하고
    setLocalDescription하고 이 offer를 peerB로 보낸다.
  */
  console.log("sent the offer");
  socket.emit("offer", offer, roomName);
  // 비디오와 오디오를 전달하는데에는 서버가 필요업지만 offer를 주고받기 위해서는 서버가 필요하다.
});

// on("offer")는 peerB측에서 돌아가는 코드
socket.on("offer", async (offer) => {
  // 새로운 datachannel이 있으면 알림을 받음
  myPeerConnection.addEventListener("datachannel", (event) => {
    myDataChannel = event.channel;
    myDataChannel.addEventListener("message", console.log);
  });

  console.log("received the offer");
  // 전달 받은 offer로 remoteDescription 설정
  myPeerConnection.setRemoteDescription(offer);
  const answer = await myPeerConnection.createAnswer();
  // answer를 setLocal하고
  myPeerConnection.setLocalDescription(answer);
  // offer에 대한 답을 answer로 해야하므로
  socket.emit("answer", answer, roomName);
  console.log("sent the answer");
});

// on("answer")는 peerA측에서 돌아가는 코드
socket.on("answer", (answer) => {
  myPeerConnection.setRemoteDescription(answer);
  console.log("received the answer");
});

socket.on("ice", (ice) => {
  myPeerConnection.addIceCandidate(ice);
  console.log("received candidate");
});

//RTC Code

function makeConnection() {
  // 서로 다른 사용자간의 연결을 위해 생성
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        // STUN 서버는 컴퓨터가 공용 IP주소를 찾게해줌 즉, 어떤것을 request하면 인터넷에서 내가 누군지를 알려줌
        // 예를들어 다른 wi-fi환경이면 다른 네트워크이기 때문에 정상작동하지 않는데 이 때 STUN서버가 필요하다.
        // 이것은 google이 제공하는것으로 테스트에만 쓰이고 실제로는 내 소유의 STUN서버로 돌려야한다.
        // 공용주소를 알아내기위한 STUN서버
        urls: [
          "stun:stun.l.google.com:19302",
          "stun:stun1.l.google.com:19302",
          "stun:stun2.l.google.com:19302",
          "stun:stun3.l.google.com:19302",
          "stun:stun4.l.google.com:19302",
        ],
      },
    ],
  });
  myPeerConnection.addEventListener("icecandidate", handleIce);
  myPeerConnection.addEventListener("addstream", handleAddStream);
  // 양쪽 브라우저에서 카메라, 마이크 데이터 stream을 받아서 구성  통상의 addStream 대신하는 작업
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
}

function handleIce(data) {
  // candidate는 브라우저가 소통하는 방법을 알려주는것
  // peerA와 peerB가 icecandidate 이벤트로 생성한 candidate들을 서로 주고 받음
  socket.emit("ice", data.candidate, roomName);
  console.log("sent candidate");
}

function handleAddStream(data) {
  const peersFace = document.getElementById("peersFace");
  peersFace.srcObject = data.stream;
}
