// src/components/UserLayout.jsx
import React from "react";
import UserSidebar from "./UserSidebar";

export default function UserLayout({ children }) {
  return (
    <div className="flex">
      <UserSidebar />
      <div className="flex-1 p-6 bg-gray-100 min-h-screen">{children}</div>
    </div>
  );
}
