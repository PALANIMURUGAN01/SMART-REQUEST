import { useState, useRef, useEffect } from 'react';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import { io } from 'socket.io-client';
import { API_URL, SOCKET_URL } from "../config";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);

  const [userObj] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (!userObj?._id) return;

    const newSocket = io(SOCKET_URL || API_URL);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("joinRoom", { userId: userObj._id });
    });

    newSocket.on("receiveMessage", (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    // Fetch initial chat history
    fetch(`${API_URL}/chat/${userObj._id}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(err => console.error("Failed to load chat history", err));

    return () => newSocket.disconnect();
  }, [userObj?._id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || !userObj || !socket) return;

    // Determine sender dynamically
    const senderRole = (userObj.role === "admin" || userObj.role === "staff") ? "admin" : "user";

    socket.emit("sendMessage", {
      userId: userObj._id,
      userEmail: userObj.email,
      sender: senderRole,
      text: input.trim()
    });

    setInput("");
  };

  if (!userObj) return null; // Hide completely for unauthenticated users

  return (
    <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {isOpen && (
        <div
          className="clean-card shadow-lg d-flex flex-column animate-up"
          style={{
            width: '350px',
            height: '450px',
            marginBottom: '15px',
            transformOrigin: 'bottom right',
            position: 'absolute',
            bottom: '70px',
            right: '0'
          }}
        >
          {/* Header */}
          <div className="bg-primary text-white p-3 d-flex justify-content-between align-items-center" style={{ borderTopLeftRadius: '1rem', borderTopRightRadius: '1rem' }}>
            <div className="d-flex align-items-center gap-2">
              <div className="bg-white text-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm" style={{ width: 34, height: 34 }}>
                <FiMessageSquare size={18} />
              </div>
              <div>
                <h6 className="mb-0 fw-bold outfit-font" style={{ fontSize: '15px' }}>Support Chat</h6>
                <div className="small text-white opacity-75 d-flex align-items-center gap-1" style={{ fontSize: '11px' }}>
                  <span className="bg-success rounded-circle d-inline-block" style={{ width: '6px', height: '6px' }}></span>
                  We typically reply in minutes
                </div>
              </div>
            </div>
            <button className="btn btn-link text-white p-0 text-decoration-none opacity-75 hover-text-white" onClick={() => setIsOpen(false)}>
              <FiX size={22} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column" style={{ backgroundColor: '#f8fafc' }}>
            <div className="text-center mb-3 mt-1">
              <span className="small text-muted fw-medium px-2 py-1 rounded bg-white shadow-sm" style={{ fontSize: '11px' }}>
                Chat History Connected
              </span>
            </div>

            {messages.length === 0 && (
              <div className="text-center text-muted my-auto small">No messages yet. Say hello!</div>
            )}

            {messages.map((msg, idx) => (
              <div key={idx} className={`d-flex mb-3 ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                <div
                  className={`p-3 ${msg.sender === 'user' ? 'bg-primary text-white' : 'bg-white text-dark'}`}
                  style={{
                    maxWidth: '85%',
                    borderRadius: '16px',
                    borderBottomRightRadius: msg.sender === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.sender === 'admin' || msg.sender === 'bot' ? '4px' : '16px',
                    fontSize: '14.5px',
                    lineHeight: '1.45',
                    boxShadow: msg.sender === 'user' ? '0 2px 4px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.03)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-color)'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white" style={{ borderBottomLeftRadius: '1rem', borderBottomRightRadius: '1rem', borderTop: '1px solid var(--border-color)' }}>
            <form onSubmit={handleSend} className="d-flex gap-2">
              <input
                type="text"
                className="form-control border-1 bg-light rounded-pill px-3 shadow-none"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={{ fontSize: '14.5px', height: '44px', borderColor: 'var(--border-color)' }}
              />
              <button
                type="submit"
                className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 shadow-sm transition-all"
                style={{ width: '44px', height: '44px', opacity: input.trim() ? 1 : 0.6 }}
                disabled={!input.trim()}
              >
                <FiSend size={18} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center p-0 position-absolute"
        style={{
          width: '64px', height: '64px', bottom: '0', right: '0',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'scale(0.8)' : 'scale(1)'
        }}
        onClick={() => setIsOpen(!isOpen)}
        title="Chat with Support"
      >
        {isOpen ? <FiX size={28} /> : <FiMessageSquare size={28} />}
      </button>
    </div>
  );
}
