import React, { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";

function Messages() {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [stadiumId, setStadiumId] = useState("");
  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [replyingId, setReplyingId] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  useEffect(() => { getMessages(); getStadiums(); }, []);

  async function getMessages() {
    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setMessages(data);
      else { setMessage(data.message || "Could not load messages"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setLoading(false);
  }

  async function getStadiums() {
    try {
      const res = await fetch("http://localhost:5000/api/stadiums");
      const data = await res.json();
      if (res.ok) setStadiums(data);
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
  }

  async function handleSend(event) {
    event.preventDefault();
    if (!stadiumId || !text.trim()) { setMessage("Please choose a stadium and enter a message"); setMessageType("danger"); return; }
    setSending(true);
    try {
      const res = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ stadiumId, text }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages([data, ...messages]); setStadiumId(""); setText("");
        setMessage("Message sent successfully"); setMessageType("success");
      } else { setMessage(data.message || "Could not send message"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setSending(false);
  }

  async function handleReply(event, messageId) {
    event.preventDefault();
    if (!replyText[messageId]?.trim()) { setMessage("Please enter a reply"); setMessageType("danger"); return; }
    setReplyingId(messageId);
    try {
      const res = await fetch(`http://localhost:5000/api/messages/${messageId}/reply`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reply: replyText[messageId] }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(messages.map((m) => m._id === messageId ? data : m));
        setReplyText({ ...replyText, [messageId]: "" });
        setMessage("Reply sent successfully"); setMessageType("success");
      } else { setMessage(data.message || "Could not send reply"); setMessageType("danger"); }
    } catch {
      setMessage("Could not connect to the server"); setMessageType("danger");
    }
    setReplyingId("");
  }

  const stadiumOptions = stadiums.filter((s) => s.owner?._id !== user?._id);

  return (
    <div className="page-wrap">
      <div className="container">
        <div style={{ marginBottom: "40px" }}>
          <p className="page-eyebrow">Inbox</p>
          <h1 className="page-heading">Messages</h1>
          <p className="page-sub">Contact stadium owners and follow replies in one place.</p>
        </div>

        {message && (
          <div className={`alert-bar ${messageType === "danger" ? "alert-bar--error" : "alert-bar--success"}`}>
            {message}
          </div>
        )}

        {user?.role !== "owner" && (
          <div className="compose-panel">
            <h2 className="compose-title">Send a Message</h2>
            <form onSubmit={handleSend}>
              <div style={{ marginBottom: "16px" }}>
                <label className="field-label">Stadium</label>
                <select className="form-select" value={stadiumId} onChange={(e) => setStadiumId(e.target.value)}>
                  <option value="">Choose a stadium...</option>
                  {stadiumOptions.map((s) => (
                    <option value={s._id} key={s._id}>{s.name} — {s.owner?.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: "20px" }}>
                <label className="field-label">Message</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Write your message here..."
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-green" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </button>
            </form>
          </div>
        )}

        {loading && (
          <div className="loading-block">
            <div className="spinner-ring" />
            <p className="loading-text">Loading Messages...</p>
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="empty-block">
            <span className="empty-icon">&#128172;</span>
            <p className="empty-text">No messages yet.</p>
          </div>
        )}

        <div className="row g-4">
          {messages.map((item) => (
            <div className="col-md-6" key={item._id}>
              <div className="msg-card">
                <div className="d-flex justify-content-between align-items-start gap-2" style={{ marginBottom: "10px" }}>
                  <h3 className="msg-stadium">{item.stadium?.name}</h3>
                  {item.reply
                    ? <span className="badge-green">Replied</span>
                    : <span className="badge-orange">Awaiting Reply</span>
                  }
                </div>
                <p className="msg-meta">
                  From: <strong style={{ color: "var(--text2)" }}>{item.user?.name}</strong>
                  &nbsp;&bull;&nbsp;
                  Owner: <strong style={{ color: "var(--text2)" }}>{item.owner?.name}</strong>
                </p>
                <div className="msg-bubble">{item.text}</div>
                {item.reply ? (
                  <div className="msg-reply-block">
                    <p className="msg-reply-label">Owner Reply</p>
                    <p className="msg-reply-text">{item.reply}</p>
                  </div>
                ) : (
                  <p className="msg-no-reply">No reply yet</p>
                )}
                {user?.role === "owner" && !item.reply && (
                  <form className="msg-reply-form" onSubmit={(e) => handleReply(e, item._id)}>
                    <label className="field-label" style={{ marginBottom: "8px" }}>Your Reply</label>
                    <textarea
                      className="form-control"
                      rows="2"
                      placeholder="Write your reply..."
                      style={{ marginBottom: "12px" }}
                      value={replyText[item._id] || ""}
                      onChange={(e) => setReplyText({ ...replyText, [item._id]: e.target.value })}
                    />
                    <button type="submit" className="btn-green btn-green-sm" disabled={replyingId === item._id}>
                      {replyingId === item._id ? "Sending..." : "Send Reply"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Messages;
