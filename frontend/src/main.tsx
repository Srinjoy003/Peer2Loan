import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set theme before rendering to prevent flash
const savedTheme = localStorage.getItem("theme");
const initialTheme = savedTheme || "dark";
if (initialTheme === "dark") {
	document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")!).render(<App />);
