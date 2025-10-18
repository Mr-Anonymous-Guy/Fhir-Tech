import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { DemoProvider } from "@/contexts/DemoContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Auth from "./pages/Auth";
import Welcome from "./pages/Welcome";
import Dashboard from "./pages/Dashboard";
import Search from "./pages/Search";
import Mappings from "./pages/Mappings";
import BulkUpload from "./pages/BulkUpload";
import AuditTrail from "./pages/AuditTrail";
import Layout from "./components/Layout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ThemeProvider>
        <DemoProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/app" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="search" element={<Search />} />
                <Route path="mappings" element={<Mappings />} />
                <Route path="bulk-upload" element={<BulkUpload />} />
                <Route path="audit" element={<AuditTrail />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
            </AuthProvider>
          </DemoProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );

export default App;
