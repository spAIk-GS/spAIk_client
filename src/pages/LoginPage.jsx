  import React, { useEffect, useState, useContext } from 'react';
  import AppContext from '../context/AppContext';
  import { useNavigate } from 'react-router-dom';
  import googleLogo from '../assets/google_logo.png';
  import Header from "../components/Header";
  import './LoginPage.scss';
  import { useGoogleLogin } from '@react-oauth/google';
  import { jwtDecode } from 'jwt-decode';


  function LoginPage() {

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errorMsg, setErrorMsg] = useState('');
    const { setIsLoggedIn } = useContext(AppContext);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
      e.preventDefault();

      if (!email.trim() || !password.trim()) {
        setErrorMsg('Please enter both your email and password.');
        return;
      }


      //더미 로그인 처리
      //스프링부트 연동 후에 제거
      if (email === 'test@example.com' && password === '123456') {
        setIsLoggedIn(true);
        localStorage.setItem("accessToken", "dummy-token");
        sessionStorage.setItem("isLoggedIn", "true"); // 저장
        setErrorMsg('');
        navigate('/');
      } else {
        setErrorMsg('Invalid Email or Password');
      }
      //

      setErrorMsg("");

      try {
        const response = await fetch('http://localhost:8080/auth/login', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password }),
        });

        if (response.ok) {
          const data = await response.json();
          setIsLoggedIn(true); // 로그인 성공 처리
          setErrorMsg("");

          // Bearer 형식 저장
          localStorage.setItem("accessToken", data.token);
          console.log('[AUTH] origin:', location.origin);
          console.log('[AUTH] about to save user →', data.user);
          localStorage.setItem('user', JSON.stringify(data.user));
          console.log('[AUTH] saved user raw =', localStorage.getItem('user'));

          navigate('/');
        } else {
          let errMsg = '로그인에 실패했습니다.';
          try {
            const err = await response.json();
            errMsg = err.error || err.message || errMsg;
          } catch (e) {
            console.warn('에러 응답 파싱 실패', e);
          }
          setErrorMsg(errMsg);
        }
      } catch (error) {
        console.error('Error: ', error);
        setErrorMsg('서버 오류가 발생했습니다.');
      }

    };

    const handleGoogleLogin = () => {
      window.location.href = 'http://localhost:8080/oauth2/authorization/google';
    };

    useEffect(() => {
      const url = new URL(window.location.href);
      const token = url.searchParams.get("token");
      if (token) {
        const bearerToken = `Bearer ${token}`;
        localStorage.setItem("accessToken", bearerToken);

        // 사용자 정보 요청
        fetch("http://localhost:8080/user/me", {
          headers: {
            "Authorization": bearerToken,
          },
        })
        .then(res => res.json())
        .then(data => {
          localStorage.setItem("user", JSON.stringify(data));
          navigate("/");
        })
        .catch(err => {
          console.error("소셜 로그인 사용자 정보 요청 실패:", err);
        });
      }
    }, []);
      

  return (
    <div className="login-page"> 
      <div className="login-page-wrapper">
        <Header />
        <div className="login-content">
          <div className="login-card">
            <h2>Login For your Account</h2>

            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)} 
            /> 

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <a href="forgot" className="forgot-link">Forgot?</a>
            </div>

            <div className="password-wrapper">
              <input 
                type="password" 
                id="password" 
                placeholder="Enter your password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {errorMsg && <p className="error-msg">{errorMsg}</p>}

            <button type="submit" className="login-btn" onClick={handleLogin}>Login</button>
            <div className="or-divider">or</div>
            <button className="google-btn" onClick={handleGoogleLogin}>
              <span>Sign In with Google</span>
              <img src={googleLogo} alt="Google logo" />
            </button>

            <p className="signup-text">
              No Account? <a href="signup">Sign Up</a>
            </p>
          </div>

          <p className="terms-text">
            By using spAIk, you agree to our{" "}
            <a href="terms">Terms</a> and{" "}
            <a href="policy">Privacy Policy</a>
          </p>       
        </div>
      </div>
    </div>
    );
  }

  export default LoginPage;
