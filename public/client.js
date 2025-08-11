const socket = io();
let name;
let textarea = document.querySelector('#textarea');
let sendBtn = document.querySelector('#sendBtn');
let messageArea = document.querySelector('.message_area');

do {
    name = prompt('Please enter your name: ');
} while (!name);

// Send message when pressing Enter (without Shift)
textarea.addEventListener('keyup', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault(); // prevent newline
        sendMessage(e.target.value);
    }
});

// Send message when clicking Send button
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

    // send to server
    socket.emit('message', msg);
}

function appendMessage(msg, type) {
    let mainDiv = document.createElement('div');
    mainDiv.classList.add(type, 'message');

    let markup = `
        <h4>${msg.user}</h4>
        <p>${msg.message}</p>
    `;
    mainDiv.innerHTML = markup;
    messageArea.appendChild(mainDiv);
}

// receive messages
socket.on('message', (msg) => {
    appendMessage(msg, 'incoming');
    scrollToBottom();
});

function scrollToBottom() {
    messageArea.scrollTop = messageArea.scrollHeight;
}
