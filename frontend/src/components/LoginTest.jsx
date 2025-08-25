import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import "./login.css";

export default function LoginTest() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const { login, register } = useAuth();


  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!email || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    
    try {
      const result = await login(email, password);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    
    if (!firstName || !lastName || !email || !password) {
      setError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    
    try {
      const result = await register({
        firstName,
        lastName,
        email,
        password,
        phone
      });
      
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setError("Une erreur s'est produite lors de l'inscription.");
    }
  };

  return (
    <div>
      <div className="background-anim"></div>
      <div className="login-container">
        <h2>{isRegistering ? "Inscription" : "Connexion"}</h2>
        
        {isRegistering ? (
          <form className="login-form" onSubmit={handleRegister}>
            <input
              className="login-input"
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Prénom"
              required
            />
            <input
              className="login-input"
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Nom"
              required
            />
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="login-input"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Téléphone (optionnel)"
            />
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            <button type="submit" className="login-button">
              S'inscrire
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleLogin}>
            <input
              className="login-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
            />
            <input
              className="login-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mot de passe"
              required
            />
            <button type="submit" className="login-button">
              Se connecter
            </button>
          </form>
        )}
        
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError("");
            }}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            {isRegistering ? "Déjà un compte ? Se connecter" : "Pas de compte ? S'inscrire"}
          </button>
        </div>
        
        {/* Comptes de test */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
          <p className="font-semibold">Comptes de test :</p>
          <p>Admin: admin@test.com / password123</p>
          <p>Client: client@test.com / password123</p>
        </div>
        
        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}
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