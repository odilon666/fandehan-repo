import { Outlet } from "react-router-dom";
import UserSidebar from "../components/user/UserSidebar";
import { useAuth } from "../context/AuthContext";
import { useEffect } from "react";

export default function ClientLayout() {
  const { logout } = useAuth();

  useEffect(() => {
    console.log("Rendering ClientLayout");
  }, []);

  const handleLogout = () => {
    console.log("Logout button clicked");
    logout();
  };

  return (
    <div className="flex">
      <UserSidebar />
      <div className="flex-1">
        {/* <UserNavbar role="user" /> -- Commenté car inexistant */}
        <div className="p-4">
          <Outlet /> {/* Rend les sous-routes comme UserEngines */}
        </div>
      </div>
    </div>
  );
}