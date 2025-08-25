import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";

export default function AdminLayout() {
  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar role="admin" />
        <div className="p-4">
          <Outlet /> {/* Render nested routes here */}
        </div>
      </div>
    </div>
  );
}