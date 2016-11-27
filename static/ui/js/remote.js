(function() {
	"use strict";

	const local = document.querySelector("video.local");
	const remote = document.querySelector("video.remote");

	const connection = new webkitRTCPeerConnection({
		"iceServers": [
			{
				"url": "stun:stun.services.mozilla.com",
			},
			{
				"url": "stun:stun.l.google.com:19302",
			},
		],
	});
	connection.addEventListener("icecandidate", event => {
		if (!event.candidate)
				return;

		ws.send(JSON.stringify({
			"ice": event.candidate,
		}));
	});
	connection.addEventListener("addstream", event => {
		if (remote.src)
			return;

		remote.src = URL.createObjectURL(event.stream);

		document.body.classList.add("connected");
	});

	const ws = new WebSocket(`wss://${window.location.host}/`);
	ws.addEventListener("open", () => {
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		})
		.then(stream => {
			connection.addStream(stream);

			local.src = URL.createObjectURL(stream);

			connection.createOffer()
			.then(description => connection.setLocalDescription(description))
			.then(() => {
				ws.send(JSON.stringify({
					"sdp": connection.localDescription,
				}));
			});
		});
	});
	ws.addEventListener("message", event => {
		let data = JSON.parse(JSON.parse(event.data).utf8Data);
		if (data.sdp)
			connection.setRemoteDescription(new RTCSessionDescription(data.sdp));
		else if (data.ice)
			connection.addIceCandidate(new RTCIceCandidate(data.ice));
	});
})();
