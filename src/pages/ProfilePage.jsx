import "./ProfilePage.scss";
import Header from "../components/Header";
import Footer from "../components/Footer";
import AppContext from "../context/AppContext";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn } = useContext(AppContext);

  // user info
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });
  // Snapshot of user info before entering edit mode (used for Cancel)
  const [originalUserInfo, setOriginalUserInfo] = useState({ name: "", email: "" });

  // Whether inputs are editable (edit mode) or read-only (view mode)
  const [editable, setEditable] = useState(false);
  // Whether the user logged in via OAuth (email may be read-only)
  const [isOAuthUser, setIsOAuthUser] = useState(false);

  // password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // error messages
  const [errors, setErrors] = useState({
    name: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
    general: "",
  });

  // Safely parse JSON from a fetch Response
  const safeJson = async (res) => {
    const text = await res.text();
    if (!text) return null; // No body
    try {
      return JSON.parse(text); // Valid JSON
    } catch {
      return null; // Non-JSON body
    }
  };

  // Normalize various response shapes into a consistent { name, email } object.
  // Falls back to provided default if fields are missing.
  const extractUser = (obj, fallback) => {
    if (!obj) return fallback;
    const name =
      obj?.user?.name ??
      obj?.data?.user?.name ??
      obj?.data?.name ??
      obj?.name ??
      fallback.name;

    const email =
      obj?.user?.email ??
      obj?.data?.user?.email ??
      obj?.data?.email ??
      obj?.email ??
      fallback.email;

    return { name, email };
  };

  const isValidPassword = (password) => {
    const lengthCheck = password.length >= 8;
    const alphabetCheck = /[a-zA-Z]/.test(password);
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const numberCheck = /\d/.test(password);
    return lengthCheck && alphabetCheck && specialCharCheck && numberCheck;
  };

  const handleNameChange = (e) => {
    const input = e.target.value;
    const alphabetOnly = input.replace(/[^a-zA-Z\s]/g, "");
    setUserInfo({ ...userInfo, name: alphabetOnly });
  };

  // --- lifecycle -------------------------------------------------------------

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const response = await fetch("http://localhost:8080/users/me", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("사용자 정보를 불러오지 못했습니다");

        const data = await response.json();
        setUserInfo({ name: data.name, email: data.email });
        setOriginalUserInfo({ name: data.name, email: data.email });

        // If backend indicates OAuth provider, lock down email field
        if (data.oauthProvider) setIsOAuthUser(true);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    };

    fetchUserInfo();
  }, []);

  // --- actions: logout / delete ---------------------------------------------------------------

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    setIsLoggedIn(false);
    navigate("/");
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm("Sure you want to delete your Account?");
    if (!confirmed) return;

    let password = null;

    // Only ask for password if NOT an OAuth user
    if (!isOAuthUser) {
      password = prompt("Re-Enter your password:");
      if (!password) return;
    }

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8080/users/me", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        // If OAuth user, send empty object; else send { password }
        body: JSON.stringify(isOAuthUser ? {} : { password }),
      });

      if (response.ok) {
        alert("회원 탈퇴가 완료되었습니다.");
        localStorage.removeItem("accessToken");
        setIsLoggedIn(false);
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "회원 탈퇴에 실패했습니다.");
      }
    } catch (error) {
      console.error("회원 탈퇴 중 오류:", error);
      alert("오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // --- actions: edit mode toggling ------------------------------------------
  // Enter edit mode and snapshot current values for later cancel
  const enterEditMode = () => {
    setOriginalUserInfo({ ...userInfo }); // Keep original values
    setEditable(true);
  };

  // Cancel editing: restore snapshot, clear passwords and errors, exit mode
  const handleCancelEdit = () => {
    setUserInfo({ ...originalUserInfo });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setErrors({
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      general: "",
    });
    setEditable(false);
  };

  // --- actions: save profile -------------------------------------------------
  // Validate inputs, send update request, and handle responses robustly.
  const handleSaveProfile = async () => {
    // Prepare a fresh error map
    const newErrors = {
      name: "",
      currentPassword: "",
      newPassword: "",
      confirmNewPassword: "",
      general: "",
    };
    if (!userInfo.name) newErrors.name = "Please enter your name."; // name required
    if (!currentPassword) newErrors.currentPassword = "Please enter your current password."; // current password required
    if (newPassword) { // new password is optional; validate only if provided
      if (!isValidPassword(newPassword)) {
        newErrors.newPassword =
          "Password must be at least 8 characters long and include a letter, a number, and a special character.";
      }
      if (!confirmNewPassword) {
        newErrors.confirmNewPassword = "Please re-enter your password.";
      } else if (newPassword !== confirmNewPassword) {
        newErrors.confirmNewPassword = "Passwords do not match.";
      }
    } else if (confirmNewPassword) {
      newErrors.newPassword = "Please enter your new password.";
    }

    setErrors(newErrors);
    if (Object.values(newErrors).some((msg) => msg !== "")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const response = await fetch("http://localhost:8080/users/me", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userInfo.name,
          email: userInfo.email,              // email may be readOnly for OAuth users
          password: newPassword || undefined, // let backend ignore when undefined
          currentPassword: currentPassword,
        }),
      });

      const data = await safeJson(response);

      if (!response.ok) {
        if (response.status === 401) {
          setErrors({
            ...newErrors,
            currentPassword: data?.error || "현재 비밀번호가 올바르지 않습니다.",
          });
        } else {
          setErrors({
            ...newErrors,
            general: data?.error || data?.message || "회원 정보 수정에 실패했습니다.",
          });
        }
        return;
      }

      // --- 여기부터는 OK(200)지만, 백엔드가 에러 메시지를 200으로 보내는 경우를 방어
      if (data?.error) {
        // 백엔드가 200으로 내려도 error 필드가 있으면 실패로 간주
        const msg = String(data.error);
        if (msg.includes("현재 비밀번호") || msg.toLowerCase().includes("password")) {
          setErrors({ ...newErrors, currentPassword: msg });
        } else {
          setErrors({ ...newErrors, general: msg });
        }
        return;
      }
      if (data?.message) {
        const msg = String(data.message);
        if (msg.includes("현재 비밀번호") || msg.toLowerCase().includes("password")) {
          setErrors({ ...newErrors, currentPassword: msg });
          return;
        }
      }

      const normalized = extractUser(data, { name: userInfo.name, email: userInfo.email });

      alert("회원 정보가 성공적으로 수정되었습니다.");
      setUserInfo({ name: normalized.name, email: normalized.email });
      setOriginalUserInfo({ name: normalized.name, email: normalized.email });
      setEditable(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setErrors({
        name: "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        general: "",
      });
    } catch (error) {
      console.error("회원 정보 수정 오류:", error);
      setErrors({
        name: "",
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
        general: "서버 오류가 발생했습니다.",
      });
    }
  };

  // --- render ----------------------------------------------------------------
  return (
    <div className="profile-page">
      <Header />

      <main className="profile-page__main">
        <div className="profile-page__top">
          <h2>My Account</h2>
          <button className="profile-page__logout" onClick={handleLogout}>
            Log Out
          </button>
        </div>

        {/* add 'is-editing' so inputs darken only in edit mode (styled in SCSS) */}
        <div className={`profile-page__form ${editable ? "is-editing" : ""}`}>
          <label>Name (English)</label>
          <input
            type="text"
            value={userInfo.name}
            onChange={handleNameChange}
            readOnly={!editable}
          />
          {errors.name && <p className="error-msg">{errors.name}</p>}

          <label>Email</label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
            readOnly={!editable || isOAuthUser}
          />
          {/* email validation not requested */}

          {editable && (
            <>
              <label>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
              {errors.currentPassword && <p className="error-msg">{errors.currentPassword}</p>}

              <label>New Password (optional)</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              {errors.newPassword && <p className="error-msg">{errors.newPassword}</p>}

              <label>Re-type new password</label>
              <input
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
              {errors.confirmNewPassword && (
                <p className="error-msg">{errors.confirmNewPassword}</p>
              )}
            </>
          )}

          {!editable ? (
            <button className="profile-page__save-button" onClick={enterEditMode}>
              Edit Profile
            </button>
          ) : (
            <div className="profile-page__actions">
              <button className="profile-page__cancel-button" onClick={handleCancelEdit}>
                Cancel
              </button>
              <button className="profile-page__save-button" onClick={handleSaveProfile}>
                Save Changes
              </button>
            </div>
          )}

          {errors.general && <p className="error-msg">{errors.general}</p>}

          <div className="profile-page__warning">
            <p className="profile-page__delete-link" onClick={handleDeleteAccount}>
              Delete Account
            </p>
            <p className="profile-page__warning-description">
              When you delete your account, all drives and related data within the workspaces you
              participated in will be permanently removed.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProfilePage;
