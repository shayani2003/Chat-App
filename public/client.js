

const socket = io();
let name;
let textarea = document.querySelector('#textarea');
let sendBtn = document.querySelector('#sendBtn');
let messageArea = document.querySelector('.message_area');

do {
    name = prompt('Please enter your name: ');
} while (!name);

socket.emit('new-user-joined', name);   // 🔹 tell server new user joined

// Send message when pressing Enter
textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage(e.target.value);
    }
});

sendBtn.addEventListener('click', () => {
    if (textarea.value.trim() !== '') {
        sendMessage(textarea.value);
    }
});

function sendMessage(message) {
    let msg = {
        user: name,
        message: message.trim()
    };

    appendMessage(msg, 'outgoing');
    textarea.value = '';
    scrollToBottom();

    socket.emit('message', msg);
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div');

    if (msg.user === "System") {
        // 🔹 System message (user joined/left)
        mainDiv.classList.add("system-message");
        mainDiv.innerHTML = `<p>${msg.message}</p>`;
    } else {
        mainDiv.classList.add(type, 'message');

        // Timestamp
        let time = new Date();
        let hours = time.getHours();
        let minutes = time.getMinutes();
        let ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        let formattedTime = `${hours}:${minutes < 10 ? '0' + minutes : minutes} ${ampm}`;

        let markup = `
            <h4>${msg.user}</h4>
            <p>${msg.message}</p>
            <span class="timestamp">${formattedTime}</span>
        `;
        mainDiv.innerHTML = markup;
    }

    messageArea.appendChild(mainDiv);
}

// Receive message
socket.on('message', (msg) => {
    if (msg.user === "System") {
        appendMessage(msg, "system");
    } else {
        appendMessage(msg, "incoming");
    }
    scrollToBottom();
});

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}

