import React, { useState } from "react";

const BASE_URL = "http://localhost:3000/api/auth";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "", username: "" });
  const [step, setStep] = useState("auth"); // 'auth' | 'verify'
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setForm({ email: "", password: "", name: "", username: "" });
    setMessage("");
  };

  const handleAuth = async () => {
    const url = isLogin ? `${BASE_URL}/login` : `${BASE_URL}/register`;
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error || "Something went wrong");
      return;
    }

    setMessage(data.message || "Success");

    if (!isLogin) {
      // Go to OTP verification step after registration
      const otpRes = await fetch(`${BASE_URL}/send-verify-otp`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email }),
      });

      const otpData = await otpRes.json();
      setMessage(otpData.message);
      setStep("verify");
    } else {
      // Redirect after login
      window.location.href = "/dashboard";
    }
  };

  const handleVerifyOtp = async () => {
    const res = await fetch(`${BASE_URL}/verify-account`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, otp }),
    });

    const data = await res.json();
    setMessage(data.message);

    if (res.ok) {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>{isLogin ? "Login" : "Register"}</h2>

      {step === "auth" && (
        <>
          {!isLogin && (
            <>
              <input
                name="name"
                placeholder="Name"
                value={form.name}
                onChange={handleChange}
              />
              <input
                name="username"
                placeholder="Username"
                value={form.username}
                onChange={handleChange}
              />
            </>
          )}

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
          />
          <input
            name="password"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={handleChange}
          />

          <button onClick={handleAuth}>
            {isLogin ? "Login" : "Register"}
          </button>

          <p>
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button onClick={toggleMode}>
              {isLogin ? "Register" : "Login"}
            </button>
          </p>
        </>
      )}

      {step === "verify" && (
        <>
          <h3>Verify OTP</h3>
          <input
            placeholder="Enter OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
          />
          <button onClick={handleVerifyOtp}>Verify</button>
        </>
      )}

      {message && <p>{message}</p>}
    </div>
  );
}
