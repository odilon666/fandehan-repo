import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLayout from "./layouts/AdminLayout";
import ClientLayout from "./layouts/ClientLayout";
import DashboardHome from "./components/DashboardHome";
import Engines from "./components/Engines";
import Reservations from "./components/Reservation";
import Users from "./components/Users";
import Reports from "./components/Reports";
import Maintenance from "./components/Maintenance";
import Payment from "./components/Payement";
import SupportAdmin from "./pages/SupportAdmin";
import UserEngines from "./components/user/Userengin"; // Casse corrigée
import UserReservations from "./components/user/Commande";
import UserPayment from "./components/user/Payement";
import UserProfile from "./components/user/EditProfile";
import SupportClient from "./components/user/SupportClient";
import SupportForm from "./components/SupportForm";
import LoginTest from "./components/LoginTest";

const NotFound = () => <div>Page non trouvée</div>;

export default function App() {
  return (
    <Routes>
      <Route path="/login-test" element={<LoginTest />} />
      <Route path="/" element={<LoginTest />} />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute role="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="engines" element={<Engines />} />
        <Route path="reservations" element={<Reservations />} />
        <Route path="users" element={<Users />} />
        <Route path="reports" element={<Reports />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="payment" element={<Payment />} />
        <Route path="support" element={<SupportAdmin />} />
        <Route path="dashboard" element={<DashboardHome />} />
      </Route>
      <Route
        path="/user/*"
        element={
          <ProtectedRoute role="user">
            <ClientLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<UserEngines />} />
        <Route path="reservations" element={<UserReservations />} />
        <Route path="payment" element={<UserPayment />} />
        <Route path="profile" element={<UserProfile />} />
        <Route path="support" element={<SupportClient />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}