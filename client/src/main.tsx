import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { initializeAdMob } from "./utils/admob";

// Initialize AdMob when app starts
initializeAdMob();

createRoot(document.getElementById("root")!).render(<App />);
