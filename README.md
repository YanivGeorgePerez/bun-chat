# Snugchat - Private Chats Made Simple

Snugchat is a secure, encrypted chat application built with Node.js, Express, MongoDB, and WebSockets. It is designed for private communication between partners, friend groups, or small teams. With a modern, responsive UI and real-time messaging, Snugchat offers features like custom chat code selection with live availability checking, connection status indicators, ping measurements, and an option to delete chats.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Project Structure](#project-structure)
- [Future Improvements](#future-improvements)
- [License](#license)

## Overview


Snugchat provides a simple yet secure platform for real-time communication. All messages are encrypted using AES encryption before being stored in MongoDB. Users can create chats by either using a system-generated code or choosing their own custom code. As you type your desired custom chat code, the interface checks for availability in real time and displays whether the code is available or already taken. 

The chat interface displays connection status, including a visual indicator that turns green when connected (with live ping information on hover) and red when disconnected. It also shows how many users are currently connected to the chat. A "Delete Chat" option is provided to remove the chat after password verification.

## Features

- **AES-256 Encryption:**  
  All messages are encrypted with AES (using the `crypto-js` library) before being stored, ensuring your conversations remain private.

- **Custom Chat Code Generation:**  
  - **Auto-generated or Custom:** Users can either have a random chat code generated or choose their own custom code.
  - **Live Availability Check:** As you type a custom code, the app verifies its availability in real time.
  - **Input Validation:** Only letters, numbers, spaces, underscores (`_`), and dashes (`-`) are allowed.

- **Real-Time Messaging:**  
  Powered by WebSockets (via the `ws` library), Snugchat delivers instant messaging with encrypted message exchange.

- **Connection Status Indicator:**  
  The chat header shows:
  - A connection indicator (green when connected, red when disconnected). Hovering displays the latest ping in milliseconds.
  - The number of connected users.

- **Chat Deletion:**  
  A "Delete Chat" button lets you remove the chat (after confirming with your password).

- **Responsive, Modern UI:**  
  Consistent design across the home and chat pages with modal dialogs for entering your display name and error messages. The design is optimized for both desktop and mobile devices.

## Tech Stack

- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)
- **Real-Time Messaging:** WebSockets (using the `ws` library)
- **Encryption:** CryptoJS (AES encryption)
- **Templating:** EJS
- **Frontend:** HTML, CSS (responsive design), JavaScript

## Installation

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/your-repo-link/snugchat.git
   cd snugchat
