import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/image.png";
import {
  FiUser, FiSettings, FiHelpCircle, FiLogOut,
  FiBell, FiGrid, FiChevronDown, FiClock, FiCheckSquare
} from "react-icons/fi";
import { io } from "socket.io-client";
import { API_URL } from "../config";

export default function Navbar({ onToggleSidebar }) {
  const [dateTime, setDateTime] = useState(new Date());
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const socketRef = useRef(null);
  const profileRef = useRef(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();
  const [user] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));
  const initials = user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U';

  function handleLogout() {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) { }
    navigate("/");
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Notification logic
  useEffect(() => {
    if (!user._id) return;

    // 1. Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await fetch(`${API_URL}/notifications/${user._id}`);
        if (res.ok) {
          const data = await res.json();
          setNotifications(data);
          setUnreadCount(data.filter(n => !n.isRead).length);
        }
      } catch (err) {
        console.error("Fetch notifications error:", err);
      }
    };

    fetchNotifications();

    // 2. Setup Socket.io
    socketRef.current = io(`${API_URL}`);
    socketRef.current.emit("joinRoom", { userId: user._id });

    socketRef.current.on("newNotification", (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 20));
      setUnreadCount(prev => prev + 1);

      // Play a subtle sound or visual alert if needed
      if (Notification.permission === "granted") {
        new window.Notification(notif.title, { body: notif.message });
      }
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [user._id]);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) { }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_URL}/notifications/read-all/${user._id}`, { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) { }
  };

  const formatDate = (t) => {
    if (!t) return 'N/A';
    const d = new Date(t);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const timeStr = dateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const dateStr = dateTime.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });

  return (
    <nav style={navStyle}>
      {/* Left - Logo & toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          className="d-lg-none"
          style={iconBtnStyle}
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <FiGrid size={20} color="#4f46e5" />
        </button>

        <div
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => navigate("/dashboard")}
        >
          <img src={logo} alt="logo" width="38" height="38" style={{ borderRadius: '50%', border: '2px solid #e0e7ff', objectFit: 'cover' }} />
          <span className="outfit-font" style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', letterSpacing: '-0.5px', lineHeight: 1 }}>SRLM</span>
        </div>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Clock */}
        <div className="d-none d-lg-flex" style={{ flexDirection: 'column', alignItems: 'flex-end', lineHeight: '1.15', marginRight: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{timeStr}</span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>{dateStr}</span>
        </div>


        {/* Notification Bell */}
        <div style={{ position: 'relative' }} ref={notifRef}>
          <button
            style={iconBtnStyle}
            onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
            aria-label="Notifications"
          >
            <FiBell size={20} color="#64748b" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: '2px', right: '2px',
                minWidth: '16px', height: '16px', borderRadius: '10px',
                background: '#ef4444', border: '2px solid #fff',
                fontSize: '9px', color: 'white', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '0 3px'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div style={dropdownStyle}>
              {/* Header */}
              <div style={{ padding: '14px 18px 10px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="outfit-font" style={{ fontWeight: 700, fontSize: '15px', color: '#1e293b' }}>Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markAllAsRead(); }}
                      style={{ background: 'none', border: 'none', color: '#4f46e5', fontSize: '11px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <FiCheckSquare size={12} /> Mark all read
                    </button>
                  )}
                </div>
              </div>

              {/* Items */}
              <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8' }}>
                    <FiBell size={28} style={{ marginBottom: '8px', opacity: 0.3 }} />
                    <p style={{ margin: 0, fontSize: '13px' }}>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notif, i) => (
                    <button
                      key={notif._id}
                      style={{
                        width: '100%', textAlign: 'left', border: 'none',
                        background: !notif.isRead ? '#f0f4ff' : '#fff',
                        padding: '12px 18px', display: 'block',
                        borderBottom: '1px solid #f1f5f9', cursor: 'pointer',
                        transition: 'background 0.15s',
                        position: 'relative'
                      }}
                      onClick={() => {
                        markAsRead(notif._id);
                        setShowNotifications(false);
                        if (notif.link) navigate(notif.link);
                      }}
                    >
                      {!notif.isRead && (
                        <div style={{ position: 'absolute', left: '6px', top: '50%', transform: 'translateY(-50%)', width: '6px', height: '6px', borderRadius: '50%', background: '#4f46e5' }} />
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <span style={{ fontWeight: notif.isRead ? 600 : 700, fontSize: '13px', color: '#1e293b', maxWidth: '190px' }}>
                          {notif.title}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <FiClock size={10} /> {formatDate(notif.createdAt)}
                        </span>
                      </div>
                      <p style={{ fontSize: '11.5px', color: '#64748b', margin: 0, lineHeight: '1.4', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {notif.message}
                      </p>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div style={{ padding: '10px 18px', borderTop: '1px solid #f1f5f9' }}>
                  <button
                    style={{ width: '100%', background: 'none', border: 'none', color: '#4f46e5', fontWeight: 600, fontSize: '13px', cursor: 'pointer', padding: '4px 0' }}
                    onClick={() => { setShowNotifications(false); navigate(user.role?.toLowerCase() === 'admin' ? "/admin" : "/requests"); }}
                  >
                    View all activity →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', borderRadius: '10px', padding: '4px 8px 4px 4px', transition: 'background 0.15s' }}
            onClick={() => { setShowProfile(v => !v); setShowNotifications(false); }}
            aria-label="Profile"
          >
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '14px',
              fontFamily: "'Outfit', sans-serif", flexShrink: 0
            }}>
              {initials}
            </div>
            <div className="d-none d-md-flex" style={{ flexDirection: 'column', alignItems: 'flex-start', lineHeight: '1.2' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name || 'User'}
              </span>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 500 }}>
                {user.role || 'User'}
              </span>
            </div>
            <FiChevronDown size={14} color="#94a3b8" className="d-none d-md-block" />
          </button>

          {showProfile && (
            <div style={{ ...dropdownStyle, minWidth: '260px' }}>
              {/* User info header */}
              <div style={{ padding: '16px 18px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '50%',
                    background: 'var(--primary-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: '18px',
                    fontFamily: "'Outfit', sans-serif", flexShrink: 0
                  }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>{user.name || 'User'}</div>
                    <div style={{ fontSize: '12px', color: '#94a3b8' }}>{user.email}</div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '5px', flexWrap: 'wrap' }}>
                      <span style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '20px', padding: '1px 9px', fontSize: '10px', fontWeight: 700 }}>
                        {user.role}
                      </span>
                      {user.department && (
                        <span style={{ background: '#f1f5f9', color: '#64748b', borderRadius: '20px', padding: '1px 9px', fontSize: '10px', fontWeight: 600 }}>
                          {user.department}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '8px 8px' }}>
                {[
                  { icon: <FiUser size={16} />, label: 'My Profile', to: '/profile' },
                  { icon: <FiSettings size={16} />, label: 'Settings', to: '/settings' },
                  { icon: <FiHelpCircle size={16} />, label: 'Help Center', to: '/help' },
                ].map(item => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowProfile(false)}
                    style={menuItemStyle}
                  >
                    <span style={{ color: '#64748b', display: 'flex' }}>{item.icon}</span>
                    <span style={{ fontSize: '13.5px', fontWeight: 500, color: '#374151' }}>{item.label}</span>
                  </Link>
                ))}

                <div style={{ height: '1px', background: '#f1f5f9', margin: '8px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{ ...menuItemStyle, color: '#ef4444', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <span style={{ color: '#ef4444', display: 'flex' }}><FiLogOut size={16} /></span>
                  <span style={{ fontSize: '13.5px', fontWeight: 600, color: '#ef4444' }}>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

// ── Shared styles ─────────────────────────────
const navStyle = {
  position: 'fixed', top: 0, left: 0, right: 0,
  height: '64px', zIndex: 1050,
  background: '#fff',
  borderBottom: '1px solid #e8eaf0',
  boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 24px',
};

const iconBtnStyle = {
  width: '38px', height: '38px',
  borderRadius: '10px',
  background: '#f8fafc',
  border: '1px solid #e8eaf0',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
  transition: 'background 0.15s',
};

const dropdownStyle = {
  position: 'absolute', right: 0, top: 'calc(100% + 10px)',
  background: '#fff',
  borderRadius: '14px',
  boxShadow: '0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)',
  border: '1px solid #e8eaf0',
  minWidth: '300px',
  zIndex: 2000,
  overflow: 'hidden',
};

const menuItemStyle = {
  display: 'flex', alignItems: 'center', gap: '10px',
  padding: '9px 10px', borderRadius: '8px',
  textDecoration: 'none', cursor: 'pointer',
  transition: 'background 0.12s',
  width: '100%',
};
