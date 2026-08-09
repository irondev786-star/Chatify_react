
import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import API_URL from "./backend_Url";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { Link } from "react-router-dom";


import "../css/home_header.css";
import "../css/chat_box.css";
import "../css/message_box.css";

async function fetchUser(navigate, setUser, setChats) {
    try {
        const response = await axios.get(
            API_URL + "/Profile",
            {
                withCredentials: true
            }
        );

        const data = response.data;

        setUser({
            email: data.email,
            last_name: data.last_name,
            first_name: data.first_name,
            created_At: data.created_at,
            profile_pic: data.profile_pic,
            id: data.current_user_id
        });

        setChats(data.chats || []);

    } catch (err) {
        console.log("Profile error:", err);

        if (err.response?.status === 401) {
            navigate("/");
        }
    }
}

const Homepage = () => {

    const navigate = useNavigate();

    const [reload, setReload] = useState(false);

    const [chats, setChats] = useState([]);

    const [chatUsers, setChatUsers] = useState([]);

    const [selectedChat, setSelectedChat] = useState(null);

    const [search, setSearch] = useState("");

    const [messages, setMessages] = useState([]);

    const [socket, setSocket] = useState(null);

    const [notifications, setNotifications] = useState([]);

    const [showNotifications, setShowNotifications] =
        useState(false);

    const selectedChatRef = useRef(null);

    const [user, setUser] = useState({
        email: "",
        last_name: "",
        first_name: "",
        profile_pic: "",
        created_At: "",
        id: ""
    });

    useEffect(() => {

        fetchUser(
            navigate,
            setUser,
            setChats
        );

    }, [navigate, reload]);

    useEffect(() => {

        selectedChatRef.current =
            selectedChat;

    }, [selectedChat]);

    useEffect(() => {

        if (!user.id) {
            return;
        }

        const newSocket = io(API_URL, {
            withCredentials: true
        });

        newSocket.on("connect", () => {

            console.log(
                "SOCKET CONNECTED:",
                newSocket.id
            );

            newSocket.emit(
                "con",
                user.id
            );

            console.log(
                "Joined user room:",
                user.id
            );

        });

        newSocket.on(
            "connect_error",
            (err) => {

                console.log(
                    "SOCKET CONNECTION ERROR:",
                    err.message
                );

            }
        );

        newSocket.on(
            "msg",
            (data) => {

                console.log(
                    "MESSAGE RECEIVED:",
                    data
                );

                if (
                    !data ||
                    !data.msg
                ) {
                    return;
                }

                const currentChat =
                    selectedChatRef.current;

                if (
                    currentChat &&
                    String(data.Chat_id) ===
                    String(currentChat.chat_id)
                ) {

                    const incomingMessage = {

                        id:
                            data.msg.id,

                        content:
                            data.msg.content,

                        date:
                            data.msg.date,

                        sended_by:
                            data.msg.sended_by

                    };

                    setMessages(
                        previousMessages => {

                            if (
                                previousMessages.some(
                                    message =>
                                        String(
                                            message.id
                                        ) ===
                                        String(
                                            incomingMessage.id
                                        )
                                )
                            ) {
                                return previousMessages;
                            }

                            return [
                                ...previousMessages,
                                incomingMessage
                            ];

                        }
                    );

                } else {

                    const notification = {

                        id:
                            Date.now() +
                            Math.random(),

                        message_id:
                            data.msg.id,

                        chat_id:
                            data.Chat_id,

                        sender_id:
                            data.msg.sended_by,

                        content:
                            data.msg.content,

                        date:
                            data.msg.date,

                        read:
                            false

                    };

                    setNotifications(
                        previousNotifications => [
                            ...previousNotifications,
                            notification
                        ]
                    );

                }

            }
        );

        newSocket.on(
            "disconnect",
            (reason) => {

                console.log(
                    "SOCKET DISCONNECTED:",
                    reason
                );

            }
        );

        setSocket(newSocket);

        return () => {

            newSocket.disconnect();

        };

    }, [user.id]);

    useEffect(() => {

        const getChatUsers = async () => {

            if (
                chats.length === 0 ||
                !user.id
            ) {
                return;
            }

            try {

                const memberIds =
                    chats.flatMap(
                        chat =>
                            chat.members || []
                    );

                const uniqueMemberIds =
                    [
                        ...new Set(
                            memberIds.filter(
                                memberId =>
                                    String(
                                        memberId
                                    ) !==
                                    String(
                                        user.id
                                    )
                            )
                        )
                    ];

                const responses =
                    await Promise.all(
                        uniqueMemberIds.map(
                            memberId =>
                                axios.get(
                                    API_URL +
                                    "/Profile/" +
                                    memberId,
                                    {
                                        withCredentials:
                                            true
                                    }
                                )
                        )
                    );

                const users =
                    responses.map(
                        response =>
                            response.data
                    );

                setChatUsers(users);

            } catch (err) {

                console.log(
                    "Chat users error:",
                    err
                );

            }

        };

        getChatUsers();

    }, [chats, user.id]);

    async function searchUser() {

        try {

            const response =
                await axios.get(
                    API_URL +
                    "/Profile?search=" +
                    search,
                    {
                        withCredentials:
                            true
                    }
                );

            await axios.post(
                API_URL +
                "/Chats/single/" +
                response.data.id,
                {},
                {
                    withCredentials:
                        true
                }
            );

            setSearch("");

            setReload(!reload);

        } catch (err) {

            console.log(
                "Search error:",
                err
            );

            alert(
                "Something went wrong"
            );

        }

    }

    function getUnreadCount() {

        return notifications.filter(
            notification =>
                !notification.read
        ).length;

    }

    function formatNotificationTime(date) {

        if (!date) {
            return "";
        }

        const messageDate =
            new Date(date);

        const now =
            new Date();

        const difference =
            now.getTime() -
            messageDate.getTime();

        const seconds =
            Math.floor(
                difference / 1000
            );

        const minutes =
            Math.floor(
                seconds / 60
            );

        const hours =
            Math.floor(
                minutes / 60
            );

        const days =
            Math.floor(
                hours / 24
            );

        if (seconds < 60) {
            return "Just now";
        }

        if (minutes < 60) {
            return `${minutes}m ago`;
        }

        if (hours < 24) {
            return `${hours}h ago`;
        }

        if (days < 7) {
            return `${days}d ago`;
        }

        return messageDate.toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short"
            }
        );
    }

    function getNotificationUser(
        senderId
    ) {

        return chatUsers.find(
            chatUser =>
                String(
                    chatUser.id
                ) ===
                String(senderId)
        );

    }

    async function openNotification(
        notification
    ) {

        setNotifications(
            previousNotifications =>
                previousNotifications.map(
                    item =>
                        item.id ===
                        notification.id
                            ? {
                                ...item,
                                read: true
                            }
                            : item
                )
        );

        setShowNotifications(false);

        const selectedUser =
            chatUsers.find(
                chatUser =>
                    String(
                        chatUser.id
                    ) ===
                    String(
                        notification.sender_id
                    )
            );

        if (!selectedUser) {

            console.log(
                "User not found:",
                notification.sender_id
            );

            return;

        }

        try {

            const chat_dets =
                await axios.post(
                    API_URL +
                    "/Chats/single/" +
                    selectedUser.id,
                    {},
                    {
                        withCredentials:
                            true
                    }
                );

            const chatData =
                chat_dets.data;

            const formattedMessages =
                (
                    chatData.messages ||
                    []
                ).map(
                    message => ({

                        id:
                            message.id,

                        content:
                            message.content,

                        date:
                            message.sent_at,

                        sended_by:
                            message.sender_id

                    })
                );

            setMessages(
                formattedMessages
            );

            setSelectedChat({

                chat_id:
                    chatData.id,

                user_id:
                    selectedUser.id,

                user:
                    selectedUser,

                name:
                    selectedUser.first_name,

                profile_pic:
                    selectedUser.profile_pic,

                data:
                    chatData

            });

        } catch (err) {

            console.log(
                "Notification chat error:",
                err
            );

        }

    }

    return (
        <>

            <div className="chatify-header">

                <div className="chatify-logo">
                    Chatify
                </div>

                <div className="user-section">

                    <div
                        className="notification-container"
                        style={{
                            position: "relative",
                            display: "flex",
                            alignItems: "center"
                        }}
                        onClick={() =>
                            setShowNotifications(
                                previous =>
                                    !previous
                            )
                        }
                    >

                        <button
                            className="notification-button"
                            style={{
                                position: "relative",
                                width: "44px",
                                height: "44px",
                                borderRadius: "50%",
                                border: "1px solid #333",
                                background: "#000",
                                color: "#fff",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "20px",
                                transition: "0.2s"
                            }}
                        >

                            <svg
                                width="21"
                                height="21"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                            </svg>

                            {getUnreadCount() > 0 && (

                                <span
                                    className="notification-count"
                                    style={{
                                        position: "absolute",
                                        top: "-4px",
                                        right: "-4px",
                                        minWidth: "20px",
                                        height: "20px",
                                        padding: "0 5px",
                                        borderRadius: "999px",
                                        background: "#fff",
                                        color: "#000",
                                        border: "2px solid #000",
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxSizing: "border-box"
                                    }}
                                >
                                    {
                                        getUnreadCount() > 99
                                            ? "99+"
                                            : getUnreadCount()
                                    }
                                </span>

                            )}

                        </button>

                        {showNotifications && (

                            <div
                                className="notification-dropdown"
                                onClick={e =>
                                    e.stopPropagation()
                                }
                                style={{
                                    position: "absolute",
                                    top: "55px",
                                    right: "0",
                                    width: "360px",
                                    maxWidth: "calc(100vw - 30px)",
                                    background: "#fff",
                                    border: "1px solid #ddd",
                                    borderRadius: "16px",
                                    boxShadow: "0 15px 45px rgba(0,0,0,0.22)",
                                    overflow: "hidden",
                                    zIndex: 9999,
                                    color: "#000"
                                }}
                            >

                                <div
                                    className="notification-header"
                                    style={{
                                        padding: "18px 18px 14px",
                                        borderBottom: "1px solid #eee",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "#fff"
                                    }}
                                >

                                    <div>

                                        <h3
                                            style={{
                                                margin: 0,
                                                fontSize: "18px",
                                                fontWeight: "700",
                                                color: "#000"
                                            }}
                                        >
                                            Notifications
                                        </h3>

                                        <span
                                            style={{
                                                display: "block",
                                                marginTop: "4px",
                                                fontSize: "12px",
                                                color: "#777"
                                            }}
                                        >
                                            Your unread messages
                                        </span>

                                    </div>

                                    {getUnreadCount() > 0 && (

                                        <span
                                            style={{
                                                padding: "5px 9px",
                                                borderRadius: "999px",
                                                background: "#000",
                                                color: "#fff",
                                                fontSize: "11px",
                                                fontWeight: "700"
                                            }}
                                        >
                                            {getUnreadCount()} unread
                                        </span>

                                    )}

                                </div>

                                <div
                                    style={{
                                        maxHeight: "420px",
                                        overflowY: "auto"
                                    }}
                                >

                                    {notifications.length === 0 ? (

                                        <div
                                            className="no-notifications"
                                            style={{
                                                padding: "45px 20px",
                                                textAlign: "center",
                                                color: "#777"
                                            }}
                                        >

                                            <div
                                                style={{
                                                    width: "55px",
                                                    height: "55px",
                                                    borderRadius: "50%",
                                                    background: "#f3f3f3",
                                                    margin: "0 auto 12px",
                                                    display: "flex",
                                                    alignItems: "center",
                                                    justifyContent: "center"
                                                }}
                                            >

                                                <svg
                                                    width="25"
                                                    height="25"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="#777"
                                                    strokeWidth="1.8"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                >
                                                    <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
                                                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                                                </svg>

                                            </div>

                                            <strong
                                                style={{
                                                    display: "block",
                                                    color: "#333",
                                                    fontSize: "14px",
                                                    marginBottom: "5px"
                                                }}
                                            >
                                                All caught up
                                            </strong>

                                            <span
                                                style={{
                                                    fontSize: "12px"
                                                }}
                                            >
                                                You have no new messages
                                            </span>

                                        </div>

                                    ) : (

                                        notifications
                                            .slice()
                                            .reverse()
                                            .map(
                                                notification => {

                                                    const notificationUser =
                                                        getNotificationUser(
                                                            notification.sender_id
                                                        );

                                                    return (

                                                        <div
                                                            key={
                                                                notification.id
                                                            }
                                                            className={
                                                                `notification-item ${
                                                                    notification.read
                                                                        ? "notification-read"
                                                                        : "notification-unread"
                                                                }`
                                                            }
                                                            onClick={() =>
                                                                openNotification(
                                                                    notification
                                                                )
                                                            }
                                                            style={{
                                                                position: "relative",
                                                                display: "flex",
                                                                gap: "12px",
                                                                padding: "14px 16px",
                                                                cursor: "pointer",
                                                                borderBottom: "1px solid #f0f0f0",
                                                                background:
                                                                    notification.read
                                                                        ? "#fff"
                                                                        : "#f6f6f6",
                                                                transition: "background 0.2s"
                                                            }}
                                                        >

                                                            <div
                                                                className="notification-avatar"
                                                                style={{
                                                                    flexShrink: 0,
                                                                    width: "42px",
                                                                    height: "42px",
                                                                    borderRadius: "50%",
                                                                    overflow: "hidden",
                                                                    background: "#000",
                                                                    display: "flex",
                                                                    alignItems: "center",
                                                                    justifyContent: "center",
                                                                    color: "#fff",
                                                                    fontWeight: "700",
                                                                    fontSize: "14px"
                                                                }}
                                                            >

                                                                {notificationUser?.profile_pic ? (

                                                                    <img
                                                                        src={
                                                                            notificationUser.profile_pic
                                                                        }
                                                                        alt="Profile"
                                                                        style={{
                                                                            width: "100%",
                                                                            height: "100%",
                                                                            objectFit: "cover"
                                                                        }}
                                                                    />

                                                                ) : (

                                                                    notificationUser?.first_name
                                                                        ? notificationUser.first_name
                                                                            .charAt(0)
                                                                            .toUpperCase()
                                                                        : "?"

                                                                )}

                                                            </div>

                                                            <div
                                                                className="notification-content"
                                                                style={{
                                                                    minWidth: 0,
                                                                    flex: 1,
                                                                    paddingRight: "8px"
                                                                }}
                                                            >

                                                                <div
                                                                    style={{
                                                                        display: "flex",
                                                                        justifyContent: "space-between",
                                                                        alignItems: "center",
                                                                        gap: "8px"
                                                                    }}
                                                                >

                                                                    <strong
                                                                        style={{
                                                                            fontSize: "13px",
                                                                            fontWeight: notification.read
                                                                                ? "600"
                                                                                : "750",
                                                                            color: "#111",
                                                                            whiteSpace: "nowrap",
                                                                            overflow: "hidden",
                                                                            textOverflow: "ellipsis"
                                                                        }}
                                                                    >
                                                                        {notificationUser
                                                                            ? `${notificationUser.first_name} ${notificationUser.last_name || ""}`
                                                                            : "New message"}
                                                                    </strong>

                                                                    <span
                                                                        style={{
                                                                            flexShrink: 0,
                                                                            fontSize: "10px",
                                                                            color: "#888"
                                                                        }}
                                                                    >
                                                                        {
                                                                            formatNotificationTime(
                                                                                notification.date
                                                                            )
                                                                        }
                                                                    </span>

                                                                </div>

                                                                <p
                                                                    style={{
                                                                        margin: "5px 0 0",
                                                                        fontSize: "12px",
                                                                        lineHeight: "1.4",
                                                                        color: "#666",
                                                                        whiteSpace: "nowrap",
                                                                        overflow: "hidden",
                                                                        textOverflow: "ellipsis"
                                                                    }}
                                                                >
                                                                    {
                                                                        notification.content
                                                                    }
                                                                </p>

                                                            </div>

                                                            {!notification.read && (

                                                                <span
                                                                    className="unread-dot"
                                                                    style={{
                                                                        position: "absolute",
                                                                        right: "8px",
                                                                        top: "50%",
                                                                        transform: "translateY(-50%)",
                                                                        width: "7px",
                                                                        height: "7px",
                                                                        borderRadius: "50%",
                                                                        background: "#000"
                                                                    }}
                                                                />

                                                            )}

                                                        </div>

                                                    );

                                                }
                                            )

                                    )}

                                </div>

                            </div>

                        )}

                    </div>

                    <div className="user-name">

                        {
                            user.first_name
                        }{" "}
                        {
                            user.last_name
                        }

                    </div>

                    <div className="user-avatar">

                        <Link to="/ChangPic">

                            <img
                                src={
                                    user.profile_pic ||
                                    "/default-profile.png"
                                }
                                alt="Profile"
                            />

                        </Link>

                    </div>

                </div>

            </div>

            <div className="chat-container">

                <div
                    className={
                        `chat-users ${
                            selectedChat
                                ? "mobile-hidden"
                                : ""
                        }`
                    }
                >

                    <div className="message-input">

                        <input
                            type="text"
                            placeholder="Search Your User"
                            value={search}
                            onChange={
                                e =>
                                    setSearch(
                                        e.target.value
                                    )
                            }
                        />

                        <button
                            onClick={
                                searchUser
                            }
                        >
                            Search
                        </button>

                    </div>

                    {chatUsers.length === 0 ? (

                        <p>
                            No chats available
                        </p>

                    ) : (

                        chatUsers.map(
                            chatUser => (

                                <ChatBox
                                    key={
                                        chatUser.id
                                    }
                                    profile_pic={
                                        chatUser.profile_pic
                                    }
                                    name={
                                        chatUser.first_name
                                    }
                                    id={
                                        chatUser.id
                                    }
                                    setSelectedChat={
                                        setSelectedChat
                                    }
                                    setMessages={
                                        setMessages
                                    }
                                    chatUsers={
                                        chatUsers
                                    }
                                />

                            )
                        )

                    )}

                </div>

                <div
                    className={
                        `messageBox ${
                            selectedChat
                                ? "mobile-active"
                                : ""
                        }`
                    }
                >

                    {selectedChat ? (

                        <MessageBox
                            chat={
                                selectedChat
                            }
                            setSelectedChat={
                                setSelectedChat
                            }
                            currentUserId={
                                user.id
                            }
                            messages={
                                messages
                            }
                            setMessages={
                                setMessages
                            }
                            selectedChat={
                                selectedChat
                            }
                            socket={
                                socket
                            }
                        />

                    ) : (

                        <div
                            className="no-chat-selected"
                        >

                            <h2>
                                Chatify
                            </h2>

                            <p>
                                Select a chat to start messaging
                            </p>

                        </div>

                    )}

                </div>

            </div>

        </>
    );
};

const ChatBox = ({
    profile_pic,
    name,
    id,
    setSelectedChat,
    setMessages,
    chatUsers
}) => {

    async function openChat() {

        try {

            const selectedUser =
                chatUsers.find(
                    user =>
                        String(
                            user.id
                        ) ===
                        String(id)
                );

            console.log(
                "Selected user:",
                selectedUser
            );

            const chat_dets =
                await axios.post(
                    API_URL +
                    "/Chats/single/" +
                    id,
                    {},
                    {
                        withCredentials:
                            true
                    }
                );

            const chatData =
                chat_dets.data;

            console.log(
                "CHAT ID:",
                chatData.id
            );

            console.log(
                "SELECTED USER:",
                selectedUser
            );

            const formattedMessages =
                (
                    chatData.messages ||
                    []
                ).map(
                    message => ({

                        id:
                            message.id,

                        content:
                            message.content,

                        date:
                            message.sent_at,

                        sended_by:
                            message.sender_id

                    })
                );

            setMessages(
                formattedMessages
            );

            setSelectedChat({

                chat_id:
                    chatData.id,

                user_id:
                    id,

                user:
                    selectedUser,

                name:
                    name,

                profile_pic:
                    profile_pic,

                data:
                    chatData

            });

        } catch (err) {

            console.log(
                "Open chat error:",
                err
            );

        }

    }

    return (

        <div
            className="chat-user"
            onClick={openChat}
        >

            <div
                className="chat-user-avatar"
            >

                <img
                    src={
                        profile_pic ||
                        "/default-profile.png"
                    }
                    alt="Profile"
                />

            </div>

            <div
                className="chat-user-info"
            >

                <h3>
                    {name}
                </h3>

            </div>

        </div>

    );
};

const MessageBox = ({
    chat,
    setSelectedChat,
    currentUserId,
    messages,
    setMessages,
    selectedChat,
    socket
}) => {

    const [message, setMessage] =
        useState("");

    const messagesEndRef =
        useRef(null);

    useEffect(() => {

        if (messagesEndRef.current) {

            messagesEndRef.current.scrollIntoView({
                behavior: "auto",
                block: "end"
            });

        }

    }, [messages]);

    const formatMessageTime = (
        date
    ) => {

        if (!date) {
            return "";
        }

        const messageDate =
            new Date(date);

        const now =
            new Date();

        const isToday =
            messageDate.toDateString() ===
            now.toDateString();

        if (isToday) {

            return messageDate.toLocaleTimeString(
                [],
                {
                    hour: "2-digit",
                    minute: "2-digit"
                }
            );

        }

        return messageDate.toLocaleDateString(
            [],
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    };

    async function sendMessage() {

        if (!message.trim()) {
            return;
        }

        if (!socket) {

            alert(
                "Socket is not connected"
            );

            return;

        }

        const newMessage = {

            id:
                Date.now(),

            content:
                message,

            date:
                new Date(),

            sended_by:
                currentUserId

        };

        setMessages(
            previousMessages => [
                ...previousMessages,
                newMessage
            ]
        );

        const chat_id =
            selectedChat.chat_id;

        console.log(
            "Sending message to user:",
            selectedChat.user_id
        );

        console.log(
            "Chat ID:",
            selectedChat.chat_id
        );

        socket.emit(
            "msg",
            {
                send_to:
                    selectedChat.user_id,

                Chat_id:
                    selectedChat.chat_id,

                Msg:
                    newMessage
            }
        );

        try {

            await axios.post(
                API_URL +
                "/message/" +
                chat_id,
                {
                    content:
                        message
                },
                {
                    withCredentials:
                        true
                }
            );

        } catch (err) {

            console.log(
                "Message error:",
                err
            );

            alert(
                "Message could not be delivered"
            );

        }

        setMessage("");

    }

    return (
        <>

            <div className="message-header">

                <button
                    className="back-button"
                    onClick={() =>
                        setSelectedChat(
                            null
                        )
                    }
                >
                    ←
                </button>

                <img
                    src={
                        chat.profile_pic ||
                        "/default-profile.png"
                    }
                    alt="Profile"
                />

                <h3>
                    {chat.name}
                </h3>

            </div>

            <div className="messages">

                {messages.map(
                    message => (

                        message.sended_by ===
                        currentUserId ? (

                            <div
                                className="message sent"
                                key={
                                    message.id
                                }
                            >

                                {
                                    message.content
                                }

                                <div
                                    className="time sent"
                                >
                                    {
                                        formatMessageTime(
                                            message.date
                                        )
                                    }
                                </div>

                            </div>

                        ) : (

                            <div
                                className="message received"
                                key={
                                    message.id
                                }
                            >

                                {
                                    message.content
                                }

                                <div
                                    className="time received"
                                >
                                    {
                                        formatMessageTime(
                                            message.date
                                        )
                                    }
                                </div>

                            </div>

                        )

                    )
                )}

                <div
                    ref={messagesEndRef}
                />

            </div>

            <div className="message-input">

                <input
                    type="text"
                    placeholder="Enter your message"
                    value={message}
                    onChange={
                        e =>
                            setMessage(
                                e.target.value
                            )
                    }
                    onKeyDown={
                        e => {

                            if (
                                e.key ===
                                "Enter"
                            ) {

                                sendMessage();

                            }

                        }
                    }
                />

                <button
                    onClick={
                        sendMessage
                    }
                >
                    Send
                </button>

            </div>

        </>
    );
};

export default Homepage;
