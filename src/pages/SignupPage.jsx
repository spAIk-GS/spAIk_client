import { useState } from "react";
import Header from "../components/Header";
import { useNavigate } from "react-router-dom";
import "./SignupPage.scss";


function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    general: "",
  });
  const [successMsg, setSuccessMsg] = useState("");

  const navigate = useNavigate();

  const handleNameChange = (e) => {
    const input = e.target.value;
    const alphabetOnly = input.replace(/[^a-zA-Z\s]/g, "");
    setName(alphabetOnly);
  };

  const handleSignup = async () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "", general: "" };

    if (!name) newErrors.name = "Please enter your name.";
    if (!email) newErrors.email = "Please enter your email address.";
    if (!password) newErrors.password = "Please enter your password.";
    if (!confirmPassword) newErrors.confirmPassword = "Please re-enter your password.";

    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (password && !isValidPassword(password)) {
      newErrors.password = "Password must be at least 8 characters long and include a letter, a number, and a special character.";
    }

    if (email && !isValidEmail(email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    setErrors(newErrors);

    // 하나라도 에러가 있으면 중단
    if (Object.values(newErrors).some((msg) => msg !== "")) return;

    try {
      const response = await fetch("http://localhost:8080/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),  
      });

      if (response.ok) {
        // 이거 주석 나중에 지우셈
        //const data = await response.json();
        //localStorage.setItem("user", JSON.stringify(data.user));
        //localStorage.setItem("accessToken", data.token);
        setSuccessMsg("회원가입이 완료되었습니다.");
        setErrors({ name: "", email: "", password: "", confirmPassword: "", general: "" });

        // 로그인 페이지로 이동 (1초 후 ? )
        setTimeout(() => {
          navigate("/login");
        }, 500)
      } else {
        const errorData = await response.json();
        setErrors({ ...newErrors, general: errorData.error || "회원가입 중 오류가 발생했습니다." });
        setSuccessMsg("");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ ...newErrors, general: "서버 오류가 발생했습니다." });
      setSuccessMsg("");
    }
  };

  const isValidPassword = (password) => {
    const lengthCheck = password.length >= 8;
    const alphabetCheck = /[a-zA-Z]/.test(password);
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const numberCheck = /\d/.test(password);
    return lengthCheck && alphabetCheck && specialCharCheck && numberCheck;
  };

  const isValidEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  return (
    <div className="signup-page">
      <div className="signup-page-wrapper">
        <Header />
        <div className="signup-content">
          <div className="signup-card">
            <h2>Let’s create your profile!</h2>

            <label htmlFor="name">Name (English)</label>
            <input
              type="text"
              id="name"
              placeholder="Enter your name"
              value={name}
              onChange={handleNameChange}
            />
            {errors.name && <p className="error-msg">{errors.name}</p>}

            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {errors.email && <p className="error-msg">{errors.email}</p>}

            <label htmlFor="password">Password (8+ characters)</label>
            <input
              type="password"
              id="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {errors.password && <p className="error-msg">{errors.password}</p>}

            <label htmlFor="confirm-password">Re-type password</label>
            <input
              type="password"
              id="confirm-password"
              placeholder="Re-type your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            {errors.confirmPassword && <p className="error-msg">{errors.confirmPassword}</p>}

            {/* 이 부분은 나중에 제거 */}
            {errors.general && <p className="error-msg">{errors.general}</p>}
            {successMsg && <p className="success-msg">{successMsg}</p>}

            <button className="signup-btn" onClick={handleSignup}>
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
