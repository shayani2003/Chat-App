const socket = io();


// =====================================================
// VARIABLES
// =====================================================

let name;

let selectedUser = null;

let currentMode = 'group';

let currentGroup = 'General';

let typingTimer;


// =====================================================
// DOM ELEMENTS
// =====================================================

const textarea =
    document.querySelector('#textarea');

const sendBtn =
    document.querySelector('#sendBtn');

const messageArea =
    document.querySelector('.message_area');

const userList =
    document.querySelector('#userList');

const groupList =
    document.querySelector('#groupList');

const onlineCount =
    document.querySelector('#onlineCount');

const chatTitle =
    document.querySelector('#chatTitle');

const chatSubtitle =
    document.querySelector('#chatSubtitle');

const typingIndicator =
    document.querySelector('#typingIndicator');

const connectionStatus =
    document.querySelector('#connectionStatus');

const characterCount =
    document.querySelector('#characterCount');

const createGroupBtn =
    document.querySelector('#createGroupBtn');


// =====================================================
// USER NAME
// =====================================================

do {

    name = prompt('Please enter your name:');

    name = name
        ? name.trim().slice(0, 30)
        : '';

} while (!name);


// Tell server that we joined
socket.emit(
    'new-user-joined',
    name,
    (response) => {

        if (!response.ok) {
            alert(response.error);
        }

    }
);


// =====================================================
// CONNECTION STATUS
// =====================================================

socket.on('connect', () => {

    connectionStatus.textContent =
        'Online';

});


socket.on('disconnect', () => {

    connectionStatus.textContent =
        'Disconnected';

    typingIndicator.textContent = '';

});


// =====================================================
// SEND MESSAGE
// =====================================================

textarea.addEventListener(
    'keydown',
    (e) => {

        // Enter = send
        // Shift + Enter = new line

        if (
            e.key === 'Enter' &&
            !e.shiftKey
        ) {

            e.preventDefault();

            sendCurrentMessage();
        }

    }
);


// Detect typing
textarea.addEventListener(
    'input',
    () => {

        characterCount.textContent =
            textarea.value.length;


        sendTyping(true);


        clearTimeout(typingTimer);


        // Stop typing after 700ms
        typingTimer =
            setTimeout(
                () => {

                    sendTyping(false);

                },
                700
            );

    }
);


// Send button
sendBtn.addEventListener(
    'click',
    sendCurrentMessage
);


// =====================================================
// SEND CURRENT MESSAGE
// =====================================================

function sendCurrentMessage() {

    const message =
        textarea.value.trim();


    if (!message) {
        return;
    }


    if (message.length > 1000) {

        alert(
            'Message cannot exceed 1000 characters.'
        );

        return;
    }


    stopTyping();


    // PRIVATE CHAT
    if (currentMode === 'private') {

        if (!selectedUser) {

            alert(
                'Select a user first.'
            );

            return;
        }


        socket.emit(
            'private-message',
            {
                to: selectedUser.id,
                message
            },

            handleServerResponse
        );

    }


    // GROUP CHAT
    else {

        socket.emit(
            'group-message',
            {
                groupName: currentGroup,
                message
            },

            handleServerResponse
        );

    }


    textarea.value = '';

    characterCount.textContent = '0';
}


function handleServerResponse(response) {

    if (
        response &&
        !response.ok
    ) {

        alert(response.error);

    }

}


// =====================================================
// ONLINE USERS
// =====================================================

socket.on(
    'online-users',
    (users) => {

        onlineCount.textContent =
            users.length;


        userList.innerHTML = '';


        users.forEach(
            (user) => {

                // Don't show yourself
                if (
                    user.id === socket.id
                ) {
                    return;
                }


                const button =
                    document.createElement('button');

                button.className =
                    'user_item';


                const dot =
                    document.createElement('span');

                dot.className =
                    'online_dot';


                const username =
                    document.createElement('span');

                username.textContent =
                    user.name;


                button.append(
                    dot,
                    username
                );


                button.addEventListener(
                    'click',
                    () => {

                        openPrivateChat(user);

                    }
                );


                userList.appendChild(button);

            }
        );

    }
);


// =====================================================
// ONLINE / OFFLINE NOTIFICATION
// =====================================================

socket.on(
    'user-status',
    (status) => {

        appendSystemMessage(
            `${status.name} is ${status.status}`,
            status.timestamp
        );

        scrollToBottom();

    }
);


// =====================================================
// GROUP LIST
// =====================================================

socket.on(
    'group-list',
    (groups) => {

        groupList.innerHTML = '';


        groups.forEach(
            (groupName) => {

                const button =
                    document.createElement('button');

                button.className =
                    'group_item';


                button.textContent =
                    `# ${groupName}`;


                button.addEventListener(
                    'click',
                    () => {

                        openGroup(groupName);

                    }
                );


                groupList.appendChild(button);

            }
        );

    }
);


// =====================================================
// CREATE GROUP
// =====================================================

createGroupBtn.addEventListener(
    'click',
    () => {

        const groupName =
            prompt(
                'Enter a group name:'
            );


        if (
            !groupName ||
            !groupName.trim()
        ) {
            return;
        }


        socket.emit(
            'create-group',
            groupName.trim(),

            (response) => {

                if (!response.ok) {

                    alert(response.error);

                    return;
                }


                openGroup(
                    response.groupName
                );

            }
        );

    }
);


// =====================================================
// OPEN GROUP CHAT
// =====================================================

function openGroup(groupName) {

    currentMode = 'group';

    currentGroup = groupName;

    selectedUser = null;


    chatTitle.textContent =
        `# ${groupName}`;


    chatSubtitle.textContent =
        'Group chat';


    typingIndicator.textContent = '';


    messageArea.innerHTML = '';


    textarea.placeholder =
        `Message ${groupName}...`;


    socket.emit(
        'join-group',
        groupName,

        (response) => {

            if (!response.ok) {
                alert(response.error);
            }

        }
    );

}


// =====================================================
// OPEN PRIVATE CHAT
// =====================================================

function openPrivateChat(user) {

    currentMode = 'private';

    selectedUser = user;


    chatTitle.textContent =
        user.name;


    chatSubtitle.textContent =
        'Private chat';


    typingIndicator.textContent = '';


    messageArea.innerHTML = '';


    textarea.placeholder =
        `Message ${user.name}...`;

}


// =====================================================
// PRIVATE MESSAGE RECEIVED
// =====================================================

socket.on(
    'private-message',
    (msg) => {

        // Check whether this message belongs
        // to the currently open private chat.

        const isCurrentChat =
            currentMode === 'private' &&
            selectedUser &&
            (
                msg.from === selectedUser.id ||
                msg.to === selectedUser.id
            );


        if (!isCurrentChat) {

            // Later we can show unread count here.

            return;
        }


        appendMessage(
            msg,

            msg.from === socket.id
                ? 'outgoing'
                : 'incoming'
        );


        scrollToBottom();


        // Receiver tells sender:
        // "I have read this message."

        if (
            msg.from !== socket.id
        ) {

            socket.emit(
                'message-read',
                {
                    messageId: msg.id,
                    from: msg.from
                }
            );

        }

    }
);


// =====================================================
// MESSAGE SENT
// =====================================================

socket.on(
    'message-sent',
    (msg) => {

        if (
            currentMode !== 'private' ||
            !selectedUser ||
            msg.to !== selectedUser.id
        ) {

            return;
        }


        // Display our message
        // after server accepts it.

        appendMessage(
            msg,
            'outgoing'
        );


        scrollToBottom();

    }
);


// =====================================================
// READ RECEIPT RECEIVED
// =====================================================

socket.on(
    'message-read',
    ({ messageId }) => {

        const message =
            document.querySelector(
                `[data-message-id="${messageId}"]`
            );


        if (!message) {
            return;
        }


        const status =
            message.querySelector(
                '.message_status'
            );


        if (status) {

            status.textContent =
                '✓✓ Read';

        }

    }
);


// =====================================================
// GROUP MESSAGE RECEIVED
// =====================================================

socket.on(
    'group-message',
    (msg) => {

        if (
            currentMode !== 'group' ||
            msg.groupName !== currentGroup
        ) {

            return;
        }


        appendMessage(
            msg,

            msg.from === socket.id
                ? 'outgoing'
                : 'incoming'
        );


        scrollToBottom();

    }
);


// =====================================================
// SYSTEM MESSAGE
// =====================================================

socket.on(
    'system-message',
    (msg) => {

        if (
            currentMode === 'group'
        ) {

            appendSystemMessage(
                msg.message,
                msg.timestamp
            );

            scrollToBottom();

        }

    }
);


// =====================================================
// TYPING INDICATOR
// =====================================================

socket.on(
    'typing',
    (data) => {


        // Private chat

        if (
            data.mode === 'private'
        ) {

            if (
                currentMode === 'private' &&
                selectedUser &&
                data.from === selectedUser.id
            ) {

                typingIndicator.textContent =
                    `${data.name} is typing...`;


                clearTimeout(
                    typingTimer
                );


                typingTimer =
                    setTimeout(
                        () => {

                            typingIndicator.textContent =
                                '';

                        },
                        1000
                    );

            }

        }


        // Group chat

        else if (
            data.mode === 'group'
        ) {

            if (
                currentMode === 'group' &&
                data.groupName === currentGroup
            ) {

                typingIndicator.textContent =
                    `${data.name} is typing...`;


                clearTimeout(
                    typingTimer
                );


                typingTimer =
                    setTimeout(
                        () => {

                            typingIndicator.textContent =
                                '';

                        },
                        1000
                    );

            }

        }

    }
);


// =====================================================
// SEND TYPING EVENT
// =====================================================

function sendTyping(isTyping) {

    if (
        currentMode === 'private'
    ) {

        if (!selectedUser) {
            return;
        }


        socket.emit(
            'typing',
            {
                mode: 'private',
                to: selectedUser.id
            }
        );

    }


    else {

        socket.emit(
            'typing',
            {
                mode: 'group',
                groupName: currentGroup
            }
        );

    }


    if (!isTyping) {

        typingIndicator.textContent =
            '';

    }

}


// =====================================================
// STOP TYPING
// =====================================================

function stopTyping() {

    clearTimeout(
        typingTimer
    );

    sendTyping(false);

}


// =====================================================
// DISPLAY MESSAGE
// =====================================================

function appendMessage(msg, type) {

    const mainDiv =
        document.createElement('div');


    mainDiv.classList.add(
        type,
        'message'
    );


    // Unique ID for read receipt

    mainDiv.dataset.messageId =
        msg.id;


    const header =
        document.createElement('h4');

    header.textContent =
        msg.fromName;


    const text =
        document.createElement('p');

    text.textContent =
        msg.message;


    const timestamp =
        document.createElement('span');

    timestamp.className =
        'timestamp';


    timestamp.textContent =
        formatTime(
            msg.timestamp
        );


    mainDiv.append(
        header,
        text,
        timestamp
    );


    // Read status for private messages

    if (
        type === 'outgoing' &&
        msg.type === 'private'
    ) {

        const status =
            document.createElement('span');

        status.className =
            'message_status';


        status.textContent =
            '✓ Sent';


        mainDiv.appendChild(
            status
        );

    }


    messageArea.appendChild(
        mainDiv
    );

}


// =====================================================
// SYSTEM MESSAGE UI
// =====================================================

function appendSystemMessage(
    message,
    timestamp = new Date().toISOString()
) {

    const div =
        document.createElement('div');


    div.className =
        'system-message';


    const text =
        document.createElement('span');


    text.textContent =
        `${message} • ${formatTime(timestamp)}`;


    div.appendChild(text);


    messageArea.appendChild(div);

}


// =====================================================
// FORMAT TIME
// =====================================================

function formatTime(timestamp) {

    return new Date(
        timestamp
    ).toLocaleTimeString(
        [],
        {
            hour: 'numeric',
            minute: '2-digit'
        }
    );

}


// =====================================================
// AUTO SCROLL
// =====================================================

function scrollToBottom() {

    messageArea.scrollTop =
        messageArea.scrollHeight;

}
