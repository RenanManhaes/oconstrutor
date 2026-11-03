import { Home, Users, Map, BookOpen, Calendar, BarChart3, Bell, Settings, LogOut, DollarSign, Share2 } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

const menuItems = [
  { title: "Dashboard", url: "/admin", icon: Home },
  { title: "Encontros", url: "/admin/encontros", icon: Calendar },
  { title: "Biblioteca", url: "/admin/materials", icon: BookOpen },
  { title: "Jornada / Pilares", url: "/admin/journey", icon: Map },
  { title: "Usuários", url: "/admin/users", icon: Users },
  { title: "Convites", url: "/admin/invites", icon: Share2 },
  { title: "Progresso", url: "/admin/progress", icon: BarChart3 },
  { title: "Financeiro", url: "/admin/financial", icon: DollarSign },
  { title: "Avisos", url: "/admin/announcements", icon: Bell },
  { title: "Configurações", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <img src="/logo-badge.svg" alt="O Construtor" className="h-7 w-7 object-contain shrink-0" />
        {!collapsed && (
          <div>
            <span className="font-heading font-bold text-sm tracking-wide text-sidebar-foreground block">O CONSTRUTOR</span>
            <span className="text-[10px] text-sidebar-primary uppercase tracking-widest">Admin</span>
          </div>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">Gestão</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/admin"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <item.icon className="h-4 w-4 mr-2 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-3">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-sm w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
