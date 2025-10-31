import { useRef } from "react";
import Navbar from "@/components/Navbar";
import UploadSection from "@/components/UploadSection";
import Dashboard from "@/components/Dashboard";

const Admin = () => {
  const uploadRef = useRef<HTMLDivElement>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Navbar />
      <div ref={dashboardRef}>
        <Dashboard />
      </div>
      <div ref={uploadRef}>
        <UploadSection onUploadComplete={scrollToDashboard} />
      </div>
      
    </div>
  );
};

export default Admin;
