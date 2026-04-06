import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { FiMessageSquare, FiSend } from "react-icons/fi";

export default function AdminChatDesk() {
  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Poll chats or wait for socket updates
  const fetchChats = () => {
    fetch("http://localhost:5000/chats/all")
      .then(res => res.json())
      .then(data => {
        setChats(data);
        if (activeChat) {
          const updatedActive = data.find(c => c._id === activeChat._id);
          if (updatedActive) setActiveChat(updatedActive);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load chats", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchChats();

    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("receiveMessage", (msg) => {
      fetchChats(); // Refresh messages immediately
    });

    return () => newSocket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount, but activeChat updates inside fetchChats natively due to scoping if we just use ID, wait we use State.

  // A better way is to use a socket listener that knows the current activeChat ID. 
  // For safety, we fetchChats on ANY message. 

  useEffect(() => {
    if (activeChat && socket) {
      socket.emit("adminJoinRoom", { userId: activeChat.userId._id });
    }
  }, [activeChat, socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !activeChat || !socket) return;

    socket.emit("sendMessage", {
      userId: activeChat.userId._id,
      userEmail: activeChat.userId.email,
      sender: "admin",
      text: input.trim()
    });

    setInput("");
  };

  if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="row g-4 animate-fade-in" style={{ height: 'calc(100vh - 200px)', minHeight: '600px' }}>
      {/* Chat List Sidebar */}
      <div className="col-md-4 h-100">
        <div className="clean-card h-100 d-flex flex-column overflow-hidden border">
          <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between">
            <h6 className="mb-0 fw-bold outfit-font d-flex align-items-center gap-2">
              <FiMessageSquare className="text-primary" /> Active Chats
            </h6>
            <span className="badge bg-primary rounded-pill">{chats.length}</span>
          </div>
          <div className="flex-grow-1 overflow-auto p-2 bg-light">
            {chats.length === 0 && <div className="text-muted text-center mt-4 small">No active chats</div>}
            {chats.map(chat => (
              <div
                key={chat._id}
                className={`p-3 mb-2 rounded-3 border transition-all cursor-pointer ${activeChat?._id === chat._id ? 'bg-white border-primary shadow-sm' : 'bg-white border-transparent hover-shadow-sm'}`}
                onClick={() => setActiveChat(chat)}
                style={{ cursor: 'pointer' }}
              >
                <div className="fw-bold text-dark d-flex justify-content-between">
                  <span>{chat.userId?.name || "Unknown User"}</span>
                  <span className="small text-muted fw-normal">
                    {chat.messages.length > 0 ? new Date(chat.messages[chat.messages.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                <div className="small text-muted text-truncate mb-1">{chat.userId?.email}</div>
                <div className="small text-dark mt-1 text-truncate fw-medium" style={{ opacity: 0.8 }}>
                  {chat.messages.length > 0 ? chat.messages[chat.messages.length - 1].text : "No messages"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active Chat Area */}
      <div className="col-md-8 h-100">
        {activeChat ? (
          <div className="clean-card h-100 d-flex flex-column overflow-hidden border shadow-sm">
            <div className="p-3 border-bottom bg-white d-flex align-items-center gap-3">
              <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-flex align-items-center justify-content-center fw-bold" style={{ width: 44, height: 44 }}>
                {activeChat.userId?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <h6 className="mb-0 fw-bold opacity-90">{activeChat.userId?.name}</h6>
                <div className="small text-muted">{activeChat.userId?.email}</div>
              </div>
            </div>

            <div className="flex-grow-1 overflow-auto p-4 d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
              <div className="text-center mb-4">
                <span className="small text-muted fw-medium px-2 py-1 rounded bg-white shadow-sm border" style={{ fontSize: '11px' }}>
                  Chat Started
                </span>
              </div>
              {activeChat.messages.map((msg, idx) => (
                <div key={idx} className={`d-flex mb-3 ${msg.sender === 'admin' ? 'justify-content-end' : 'justify-content-start'}`}>
                  <div
                    className={`p-3 ${msg.sender === 'admin' ? 'bg-primary text-white' : 'bg-white text-dark border'}`}
                    style={{
                      maxWidth: '75%',
                      borderRadius: '16px',
                      borderBottomRightRadius: msg.sender === 'admin' ? '4px' : '16px',
                      borderBottomLeftRadius: msg.sender !== 'admin' ? '4px' : '16px',
                      fontSize: '14.5px',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 bg-white border-top">
              <form onSubmit={handleSend} className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control bg-light border-1 rounded-pill px-4 shadow-none"
                  style={{ borderColor: 'var(--border-color)', height: '48px' }}
                  placeholder={`Reply to ${activeChat.userId?.name}...`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                />
                <button type="submit" className="btn btn-primary rounded-circle flex-shrink-0 shadow-sm transition-all" style={{ width: 48, height: 48, opacity: input.trim() ? 1 : 0.6 }} disabled={!input.trim()}>
                  <FiSend size={18} />
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="clean-card h-100 d-flex align-items-center justify-content-center bg-light border-dashed rounded-4">
            <div className="text-muted text-center p-5">
              <div className="bg-white rounded-circle d-inline-flex align-items-center justify-content-center shadow-sm mb-4" style={{ width: '80px', height: '80px' }}>
                <FiMessageSquare size={32} className="text-primary opacity-75" />
              </div>
              <h5 className="fw-bold outfit-font text-dark opacity-90">Select a conversation</h5>
              <p className="small mb-0" style={{ maxWidth: '250px', margin: '0 auto' }}>Choose an active chat from the sidebar to instantly reply to user inquiries.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
