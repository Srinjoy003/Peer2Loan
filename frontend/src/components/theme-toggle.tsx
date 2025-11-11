import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";
import { useEffect, useState } from "react";

export function ThemeToggle() {
	// Initialize from localStorage or default to dark, avoiding flash
	const getInitialTheme = () => {
		const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
		return savedTheme || "dark";
	};

	const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

	useEffect(() => {
		// Ensure the class matches the state
		document.documentElement.classList.toggle("dark", theme === "dark");
	}, [theme]);

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
		localStorage.setItem("theme", newTheme);
		document.documentElement.classList.toggle("dark", newTheme === "dark");
	};

	return (
		<Button
			variant="outline"
			size="icon"
			onClick={toggleTheme}
			className="rounded-full"
			title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
		>
			{theme === "light" ? (
				<Moon className="h-5 w-5" />
			) : (
				<Sun className="h-5 w-5" />
			)}
		</Button>
	);
}
