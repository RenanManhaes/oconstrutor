import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ClientSidebar } from "./ClientSidebar";
import { Bell, LogOut, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function ClientLayout() {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-navy-dark">
        <ClientSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-gold/10 px-4 bg-navy-dark/80 backdrop-blur-sm sticky top-0 z-30">
            <SidebarTrigger className="text-gray-400 hover:text-gold" />
            <div className="flex items-center gap-3">
              <button className="h-8 w-8 rounded-full bg-navy-light flex items-center justify-center text-gray-400 hover:text-gold transition-colors">
                <Bell className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-8 w-8 rounded-full bg-gold/20 flex items-center justify-center text-gold text-xs font-bold">
                    {profile?.full_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-navy-light border-gold/10">
                  <DropdownMenuItem className="text-gray-300 text-xs cursor-default focus:bg-transparent">
                    {profile?.full_name || "Usuário"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/client/profile")} className="text-gray-300 hover:text-white cursor-pointer">
                    <User className="h-4 w-4 mr-2" /> Perfil
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-400 hover:text-red-300 cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
