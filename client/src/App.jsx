import { useState } from "react";
import AuthPage from "./pages/authPage";
import TasksPage from "./pages/TasksPage";

function App() {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
  };

  return token ? (
    <TasksPage token={token} logout={logout} />
  ) : (
    <AuthPage setToken={setToken} />
  );
}

export default App;