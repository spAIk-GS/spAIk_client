import { BrowserRouter, Routes, Route } from "react-router-dom";
import Main from "../pages/MainPage"; 
import Login from "../pages/LoginPage"; 
import Signup from "../pages/SignupPage";
import Profile from "../pages/ProfilePage";
import Upload from "../pages/UploadPage";
import TermsPage from "../pages/TermsPage";
import PolicyPage from "../pages/PolicyPage";
import ForgotPage from "../pages/ForgotPage";
import ProductPage from "../pages/ProductPage";
import ResultPage from "../pages/ResultPage";
import HistoryPage from "../pages/HistoryPage";
import OAuthCallback from "../pages/OAuthCallback";
import GetstartedPage3 from "../pages/GetstartedPage3";



const AppRouter = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/policy" element={<PolicyPage />} />  
      <Route path="/forgot" element={<ForgotPage />} />
      <Route path="/result/:presentationId" element={<ResultPage />} />
      <Route path="/product" element={<ProductPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/getStarted" element={<GetstartedPage3 />} />
      <Route path="/oauth/callback" element={<OAuthCallback />} />


    </Routes>
  </BrowserRouter>
);

export default AppRouter;