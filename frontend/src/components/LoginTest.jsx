import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function LoginTest() {
  console.log("Rendering LoginTest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  useEffect(() => {
    console.log("useAuth returned:", { login }); // Vérifie si login est défini au montage
  }, [login]);

  const handleLogin = async (e) => {
    e.preventDefault();
    console.log("Form submitted, HandleLogin triggered with:", { email, password });
    if (!login) {
      console.error("Login function is undefined from useAuth during submission");
      setError("Erreur interne : fonction de connexion non disponible.");
      return;
    }
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    try {
      console.log("Attempting to call login function...");
      const result = await login(email, password);
      console.log("Login result:", result);
      if (!result.success) {
        console.log("Login failed with error:", result.error);
        setError(result.error);
      } else {
        console.log("Login succeeded, redirecting to /user");
      }
    } catch (err) {
      console.error("Error in handleLogin:", err);
      setError("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  const handleEmailChange = (e) => {
    console.log("Email changed to:", e.target.value);
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    console.log("Password changed to:", e.target.value);
    setPassword(e.target.value);
  };

  const handleFocus = (field) => {
    console.log(`${field} input focused`);
  };

  return (
    <div>
      <div className="background-anim"></div>
      <div className="login-container">
        <h2>Test de Connexion</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onFocus={() => handleFocus("Email")}
            placeholder="Email"
            required
          />
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            onFocus={() => handleFocus("Password")}
            placeholder="Mot de passe"
            required
          />
          <button type="submit" className="login-button">
            Se connecter
          </button>
        </form>
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}