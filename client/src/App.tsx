import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import KidsMode from "./pages/KidsMode";
import SwarmViz from "./pages/SwarmViz";
import SwarmVisualization from "./pages/SwarmVisualization";
import Dashboard from "./pages/Dashboard";
import Marketing from "./pages/Marketing";
import BuildPass from "./pages/BuildPass";
import Agents from "./pages/Agents";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/swarm" component={SwarmViz} />
      <Route path="/swarm/live" component={SwarmVisualization} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/marketing" component={Marketing} />
      <Route path="/build" component={BuildPass} />
      <Route path={"/"} component={Home} />
      <Route path={"/kids"} component={KidsMode} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
