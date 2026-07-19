"use client";

import { useAppContext } from "@/context/AppContext";
import Nav from "@/components/Nav";
import Home from "@/components/screens/Home";
import Quiz from "@/components/screens/Quiz";
import Result from "@/components/screens/Result";
import Dashboard from "@/components/screens/Dashboard";

export default function Page() {
  const { screen } = useAppContext();

  return (
    <>
      <Nav />
      <main>
        {screen === "home" && <Home />}
        {screen === "quiz" && <Quiz />}
        {screen === "result" && <Result />}
        {screen === "dashboard" && <Dashboard />}
      </main>
    </>
  );
}
