import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Home, Train } from "lucide-react";
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import Layout from "@/layouts/default"; // available: default, navbar, sidebar
import Index from "@/pages/Index";
import Results from "@/pages/Results";
import RealTimeTraining from "@/pages/RealTimeTraining";
const queryClient = new QueryClient();

export const navItems = [
  {
    title: "Home",
    to: "/",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Results",
    to: "/results",
    icon: <Home className="h-4 w-4" />,
  },
  {
    title: "Real-Time Training",
    to: "/real-time-training",
    icon: <Train className="h-4 w-4" />,
  },
];

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Index />} />
              <Route path="results" element={<Results />} />
              <Route path="real-time-training" element={<RealTimeTraining />} />
            </Route>
          </Routes>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;