import "./Header.scss";
import { useContext } from "react";
import AppContext from "../context/AppContext";
import logoImage from '../assets/logo.png';

const Header = () => {
  const { isLoggedIn, isLoading } = useContext(AppContext);

  if (isLoading) return null;

  return (
    <header className="header">
      <a href="/" className="logo">
        <img src={logoImage} alt="logo" className="logo__img" />
        <span className="logo__text">spAIk</span>
      </a>
      <nav className="nav">
        {isLoggedIn ? (
          <a href="/upload">Upload</a>
        ) : (
          <a href="/login">Upload</a>
        )}
        
        <a href="/product">Product</a>

        {/* 임시 */}
        {isLoggedIn ? (
          <a href="/history">History</a>
        ) : (
          <a href="/login">History</a>
        )}

        {isLoggedIn ? (
          <a href="/profile">My</a>
        ) : (
          <a href="/login">Login</a>
        )}
      </nav>
    </header>
  );
};

export default Header;
