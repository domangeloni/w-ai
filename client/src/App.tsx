import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Welcome from "./pages/Welcome";
import Features from "./pages/Features";
import Subscribe from "./pages/Subscribe";
import AppHome from "./pages/AppHome";
import History from "./pages/History";
import Strategies from "./pages/Strategies";
import Chat from "./pages/Chat";
import AnalysisResult from "./pages/AnalysisResult";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/welcome"} component={Welcome} />
      <Route path={"/features"} component={Features} />
      <Route path={"/subscribe"} component={Subscribe} />
      <Route path={"/home"} component={AppHome} />
      <Route path={"/history"} component={History} />
      <Route path={"/strategies"} component={Strategies} />
      <Route path={"/chat"} component={Chat} />
      <Route path={"/analysis/:id"} component={AnalysisResult} />
      <Route path={"/404"} component={NotFound} />
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
        defaultTheme="dark"
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
