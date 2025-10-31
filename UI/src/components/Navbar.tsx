import { Link, useLocation } from "react-router-dom";
import { Headphones, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-primary p-2 rounded-lg">
              <Headphones className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg group-hover:text-primary transition-colors">
              NomuBeat
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "default" : "ghost"}
                size="sm"
              >
                Home
              </Button>
            </Link>
            <Link to="/admin">
              <Button 
                variant={location.pathname === "/admin" ? "default" : "ghost"}
                size="sm"
                className="gap-2"
              >
                <Shield className="h-4 w-4" />
                Admin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
