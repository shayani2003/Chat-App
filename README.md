# 💬 Talking – Real-Time Chat Application

### 📌 Project Overview

Talking is a real-time chat application built with Node.js, Express.js, and Socket.IO.
It allows users to communicate instantly by opening the app in different browsers, different tabs, or even on different devices connected to the same network (LAN).

This project demonstrates how to use WebSockets for real-time communication and includes modern features such as a dark mode toggle and a responsive UI.

---

### 🚀 Features

✅ Real-time messaging – messages are sent and received instantly.

✅ User identification – users are asked for their name before joining the chat.

✅ Outgoing & incoming messages – messages are styled differently based on who sent them.

✅ Dark mode toggle 🌙 – users can switch between light and dark themes (saved in localStorage).

✅ Responsive design – works smoothly on desktop and mobile devices.

✅ Multiple users support – open in different browsers, tabs, or devices on the same Wi-Fi/LAN network to test real-time chat.

---

### 🛠️ Tech Stack

Frontend: HTML, CSS, JavaScript

Backend: Node.js, Express.js

Real-Time Communication: Socket.IO

Storage: LocalStorage (for saving theme preference)

---

### ⚙️ Installation & Setup

Follow these steps to run the project on your local system:

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/talking-chat-app.git
cd talking-chat-app
```
### 2️⃣ Install Dependencies

Make sure you have Node.js installed. Then run:
```bash
npm install
```
### 3️⃣ Start the Server
```bash
node server.js
```

### 4️⃣ Open in Browser
```bash
http://localhost:3000
```

---
👉 Open in different browsers or tabs to chat in real-time.
👉 To chat from different devices on the same LAN (e.g., mobile + laptop):

Find your system’s IP address (e.g., 192.168.1.5).

On other devices connected to the same Wi-Fi, open:
```bash
http://192.168.1.5:3000
```
