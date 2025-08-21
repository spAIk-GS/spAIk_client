import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (token) {
      const bearer = `Bearer ${token}`;
      localStorage.setItem("accessToken", bearer);

      fetch("http://localhost:8080/user/me", {
        headers: { Authorization: bearer },
      })
        .then(r => r.json())
        .then(data => {
          localStorage.setItem("user", JSON.stringify(data));
          navigate("/");
        })
        .catch(err => {
          console.error("소셜 로그인 사용자 정보 요청 실패:", err);
          navigate("/login");
        });
    } else {
      navigate("/login");
    }
  }, [navigate]);

  return null;
}
