Object.defineProperty(Element, "create", {
	value(tag, attributes = {}, ...children) {
		let element = document.createElement(tag);

		for (let key in attributes)
			element.setAttribute(key, attributes[key]);

		children.forEach(child => element.appendChild(child));

		return element;
	},
});

Object.defineProperty(Element.prototype, "createChild", {
	value(tag, attributes = {}, ...children) {
		return this.appendChild(Element.create(tag, attributes, ...children));
	},
});

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

		load();
	});

	const ws = new WebSocket("wss://localhost:8080/");
	ws.addEventListener("open", () => {
		navigator.mediaDevices.getUserMedia({
			audio: true,
			video: true,
		})
		.then(stream => {
			connection.addStream(stream);

			local.src = URL.createObjectURL(stream);
		});
	});
	ws.addEventListener("message", event => {
		let data = JSON.parse(JSON.parse(event.data).utf8Data);
		if (data.sdp) {
			connection.setRemoteDescription(new RTCSessionDescription(data.sdp))
			.then(() => {
				connection.createAnswer()
				.then(description => connection.setLocalDescription(description))
				.then(() => {
					ws.send(JSON.stringify({
						"sdp": connection.localDescription,
					}));
				});
			});
		} else if (data.ice)
			connection.addIceCandidate(new RTCIceCandidate(data.ice));
	});

	function load() {
		const questions = [
			"How's your day?",
			"Do you play any sports?",
			"How about video games?",
			"Seen any movies lately?",
			"What are you studying?",
			"How's it going?",
			"What's your dream?",
			"Same time next week?",
			"👍",
		];

		let container = document.body.createChild(
			"div",
			{
				class: "topics",
			}
		);

		let items = questions.map(item => {
			return container.createChild(
				"div",
				null,
				document.createTextNode(item)
			);
		});

		let index = 0;
		items[index].classList.add("active");

		container.addEventListener("click", event => {
			if (index === items.length - 1)
				return;

			items.forEach((element, i) => {
				element.classList.toggle("complete", i <= index);
				element.classList.toggle("active", i === index + 1);
			});

			++index;

			container.style.setProperty("transform", `translateY(-${index * 0.0625}em)`)
		});
	}
})();
