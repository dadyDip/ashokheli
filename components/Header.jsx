"use client";
import { useState } from "react";

export default function Header({ onLogin }) {
  const [showLogin, setShowLogin] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const handleGuest = () => {
    const guestId = "guest-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("guestId", guestId);
    onLogin({ id: guestId, type: "guest" });
  };

  const handleLogin = () => {
    if (!name) return alert("Enter a name!");
    const userId = "user-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("userId", userId);
    localStorage.setItem("userName", name);
    localStorage.setItem("userEmail", email);
    onLogin({ id: userId, type: "user", name, email });
  };

  return (
    <div style={{ display: "flex", justifyContent: "flex-end", padding: "1rem" }}>
      {!showLogin ? (
        <>
          <button onClick={() => setShowLogin(true)}>Login / Sign Up</button>
          <button onClick={handleGuest} style={{ marginLeft: "1rem" }}>
            Continue as Guest
          </button>
        </>
      ) : (
        <>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button onClick={handleLogin}>Enter</button>
        </>
      )}
    </div>
  );
}
