var cchelper;
var port;
var i;

document.addEventListener("keyup", (e) => {
	cchelper = document.getElementById("ccHelper-input");
	if (e.key === "e") {
		connectPort();
		setup();
		run();
	} else if (e.key === "s") {
		setup();
	}
})

function dispatchMove(move) {
	cchelper.value = move;
	cchelper.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));
}

function connectPort() {
	console.log("Connecting to native app Eeing.");
	port = browser.runtime.connect();
}

function disconnectPort() {
	port.disconnect();
}

function setup() {
	i = 0;
	port.postMessage({ cmd: "pos", fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" }); // Set the board

	var moves = [];

	// Collect all previously played moves
	let sidebar_moves = document.getElementsByClassName("main-line-ply");
	for (let move of sidebar_moves) {
		moves.push(move.innerText);
	}
	port.postMessage({ cmd: "pos", moves: moves });
	port.postMessage({ cmd: "go" });
}


function run() {
	let prev = null;
	let mutobs;
	mutobs = new MutationObserver((list) => {
		for (mutation in list) {
			let moves = document.getElementsByClassName("main-line-ply");
			if (moves.length == 0) { return } // happens between games; just return if it has disappeared
			if (document.getElementsByClassName("game-result").length != 0) { return }

			let move = moves[moves.length - 1];

			if (move == prev) { return; }
			prev = move;
			move = move.innerText;
			console.log(move);

			port.postMessage({ cmd: "pos", moves: [move] });
			if (i % 2 != 0) { // Only "go" after their moves, not ours.
				port.postMessage({ cmd: "go" });
			}
			i++;
		}
	})

	let vml = document.getElementsByClassName("play-controller-moveList")[0].firstChild;
	mutobs.observe(vml, { childList: true, subtree: true });

	port.onMessage.addListener((msg) => {
		dispatchMove(msg.bestmove);
	});

	port.onDisconnect.addListener(() => {
		console.log("Native application Eeing unexpectedly disconnected.")
	})
}
