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

  useEffect(() => {
    getMessages();
    getStadiums();
  }, []);

  async function getMessages() {
    try {
      const response = await fetch("http://localhost:5000/api/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(data);
      } else {
        setMessage(data.message || "Could not load messages");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setLoading(false);
  }

  async function getStadiums() {
    try {
      const response = await fetch("http://localhost:5000/api/stadiums");
      const data = await response.json();

      if (response.ok) {
        setStadiums(data);
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }
  }

  async function handleSend(event) {
    event.preventDefault();

    if (!stadiumId || !text.trim()) {
      setMessage("Please choose a stadium and enter a message");
      setMessageType("danger");
      return;
    }

    setSending(true);

    try {
      const response = await fetch("http://localhost:5000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stadiumId, text }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessages([data, ...messages]);
        setStadiumId("");
        setText("");
        setMessage("Message sent successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Could not send message");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setSending(false);
  }

  async function handleReply(event, messageId) {
    event.preventDefault();

    if (!replyText[messageId] || !replyText[messageId].trim()) {
      setMessage("Please enter a reply");
      setMessageType("danger");
      return;
    }

    setReplyingId(messageId);

    try {
      const response = await fetch(
        `http://localhost:5000/api/messages/${messageId}/reply`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reply: replyText[messageId] }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        const updatedMessages = messages.map((item) => {
          if (item._id === messageId) {
            return data;
          }

          return item;
        });

        setMessages(updatedMessages);
        setReplyText({ ...replyText, [messageId]: "" });
        setMessage("Reply sent successfully");
        setMessageType("success");
      } else {
        setMessage(data.message || "Could not send reply");
        setMessageType("danger");
      }
    } catch (error) {
      setMessage("Could not connect to the server");
      setMessageType("danger");
    }

    setReplyingId("");
  }

  const stadiumOptions = stadiums.filter((stadium) => {
    return stadium.owner?._id !== user?._id;
  });

  return (
    <section>
      <div className="mb-4">
        <h1>Messages</h1>
        <p className="text-muted mb-0">
          Contact stadium owners and follow replies in one place.
        </p>
      </div>

      {message && <div className={`alert alert-${messageType}`}>{message}</div>}

      {user?.role !== "owner" && (
        <form className="card soft-card p-4 mb-4" onSubmit={handleSend}>
          <h2 className="h4">Send Message</h2>

          <label className="form-label">Stadium</label>
          <select
            className="form-select mb-3"
            value={stadiumId}
            onChange={(event) => setStadiumId(event.target.value)}
          >
            <option value="">Choose a stadium</option>
            {stadiumOptions.map((stadium) => (
              <option value={stadium._id} key={stadium._id}>
                {stadium.name} - {stadium.owner?.name}
              </option>
            ))}
          </select>

          <label className="form-label">Message</label>
          <textarea
            className="form-control mb-3"
            rows="3"
            value={text}
            onChange={(event) => setText(event.target.value)}
          />

          <button type="submit" className="btn btn-success" disabled={sending}>
            {sending ? "Sending..." : "Send"}
          </button>
        </form>
      )}

      {loading && (
        <div className="text-center py-5">
          <div className="spinner-border text-success" role="status"></div>
          <p className="mt-3 text-muted">Loading messages...</p>
        </div>
      )}

      {!loading && messages.length === 0 && (
        <div className="empty-state">No messages yet.</div>
      )}

      <div className="row g-4">

        {messages.map((item) => (
          <div className="col-md-6" key={item._id}>
            <div className="card soft-card p-3 h-100">
              <h3 className="h5">{item.stadium?.name}</h3>
              <p className="mb-1">From: {item.user?.name}</p>
              <p className="mb-1">Owner: {item.owner?.name}</p>
              <p>{item.text}</p>

              {item.reply ? (
                <div className="alert alert-success mb-0">
                  <strong>Reply:</strong> {item.reply}
                </div>
              ) : (
                <p className="text-muted">No reply yet</p>
              )}

              {user?.role === "owner" && !item.reply && (
                <form className="mt-3" onSubmit={(event) => handleReply(event, item._id)}>
                  <label className="form-label">Reply</label>
                  <textarea
                    className="form-control mb-3"
                    rows="2"
                    value={replyText[item._id] || ""}
                    onChange={(event) =>
                      setReplyText({ ...replyText, [item._id]: event.target.value })
                    }
                  />
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={replyingId === item._id}
                  >
                    {replyingId === item._id ? "Replying..." : "Reply"}
                  </button>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default Messages;
