import React, { useState } from "react";
import { motion } from "framer-motion";

const BASE_URL = "http://localhost:5000/api/v1/users";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", name: "", username: "" });
  const [step, setStep] = useState("auth");
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
    try {
      const url = isLogin ? `${BASE_URL}/login` : `${BASE_URL}/register`;
      const res = await fetch(url, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong");

      setMessage(data.message || "Success");

      if (!isLogin) {
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
        window.location.href = "/dashboard";
      }
    } catch (error) {
      setMessage(error.message);
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
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 to-gray-800 flex items-center justify-center text-white px-4">
      <div className="text-center">
        <motion.h1
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-5xl font-bold mb-6"
        >
          Dev Dashboard
        </motion.h1>

        {step === "auth" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto"
          >
            <h2 className="text-2xl font-semibold mb-4">{isLogin ? "Login" : "Register"}</h2>

            {!isLogin && (
              <>
                <input
                  className="w-full mb-3 px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  name="name"
                  placeholder="Name"
                  value={form.name}
                  onChange={handleChange}
                />
                <input
                  className="w-full mb-3 px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  name="username"
                  placeholder="Username"
                  value={form.username}
                  onChange={handleChange}
                />
              </>
            )}

            <input
              className="w-full mb-3 px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              name="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
            />
            <input
              className="w-full mb-6 px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
            />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 mb-3 text-lg font-semibold bg-purple-600 hover:bg-purple-700 rounded-xl transition-colors"
              onClick={handleAuth}
            >
              {isLogin ? "Login" : "Register"}
            </motion.button>

            <p className="text-sm">
              {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
              <button
                onClick={toggleMode}
                className="text-purple-400 hover:underline focus:outline-none"
              >
                {isLogin ? "Register" : "Login"}
              </button>
            </p>
          </motion.div>
        )}

        {step === "verify" && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 p-8 rounded-2xl shadow-xl w-full max-w-md mx-auto"
          >
            <h3 className="text-xl font-semibold mb-4">Verify OTP</h3>
            <input
              className="w-full mb-4 px-4 py-2 rounded bg-gray-800 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full py-2 text-lg font-semibold bg-green-600 hover:bg-green-700 rounded-xl transition-colors"
              onClick={handleVerifyOtp}
            >
              Verify
            </motion.button>
          </motion.div>
        )}

        {message && (
          <p className="mt-4 text-sm text-purple-300">{message}</p>
        )}
      </div>
    </div>
  );
}
