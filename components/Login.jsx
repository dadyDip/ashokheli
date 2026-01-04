"use client";
import { useState } from "react";

export default function Login({ onLogin }) {
  const [name, setName] = useState("");

  const handleLogin = () => {
    if (!name.trim()) return;
    localStorage.setItem("playerName", name);
    onLogin(name);
  };

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Enter your name"
        style={{ padding: 10, marginRight: 10 }}
      />
      <button onClick={handleLogin}>Enter</button>
    </div>
  );
}
