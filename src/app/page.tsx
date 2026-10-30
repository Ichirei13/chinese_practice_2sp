import { AppProvider } from "@/context/AppContext";
import App from "./App";

export default function Page() {
  return (
    <AppProvider semester="2sp">
      <App />
    </AppProvider>
  );
}
