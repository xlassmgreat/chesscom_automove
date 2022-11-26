var cchelper;
var vml;

document.addEventListener("keyup", (e) => {
  cchelper = document.getElementById("ccHelper-input");
  vml = document.getElementsByClassName("play-controller-moveList")[0];
  if (e.key === "Control") {
    setup();
    run();
  }
})

function dispatchMove(move) {
  cchelper.value = move;
  cchelper.dispatchEvent(new KeyboardEvent('keydown', {keyCode: 13}));
}
var port;

function connectPort() {
  port = browser.runtime.connect();
}

function disconnectPort() {
  port.disconnect();
}

function setup() {
  console.log("Connecting to native app.")
  connectPort();

  port.postMessage({cmd: "pos", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"}); // Set the board

  var moves = [];

  // Collect all previously played moves
  for (let i = 0; i < vml.childNodes.length; i++) {
    let move = vml.childNodes[i].childNodes;
    moves.push(move[1].firstChild.nodeValue);
    if (move[2] != null) { // The second half-move might not be played yet
      moves.push(move[2].firstChild.nodeValue);
    }
  }
  port.postMessage({cmd: "pos", moves: moves});
  port.postMessage({cmd: "go"});
}

function run() {
  let i = 0;
  let prev = null;
  let mutobs;
  mutobs = new MutationObserver((list) => {
    for (mutation in list) {
      if (vml.lastChild == null) {return} // happens between games; just return if it has disappeared
      let move = vml.lastChild.lastChild;
      if (move.classList.contains("game-result")) { return } // Game has ended

      if (move == prev) {return;}
      prev = move;
      move = move.firstChild.nodeValue;
      console.log(move);

      if (move.at(-1) == "#" || move[1] == "/") { // Former means checkmate; later means draw.
        console.log("Game ended");
        mutobs.disconnect();
        disconnectPort();
        return; // no move to play
      }

      
      port.postMessage({cmd: "pos", moves: [move]});
      if (i % 2 != 0) { // Only "go" after their moves, not ours.
        port.postMessage({cmd: "go"});
      }
      i++;
    }
  })
  mutobs.observe(vml, {childList: true, subtree: true});

  port.onMessage.addListener((msg) => {
    dispatchMove(msg.bestmove);
  });

  port.onDisconnect.addListener((p) => {
    console.log("Native application Eeing unexpectedly disconnected.")
  })
}
