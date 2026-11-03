import { Home, Map, Calendar, Bell, User, LogOut } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const menuItems = [
  { title: "Início", url: "/client", icon: Home },
  { title: "Minha Jornada", url: "/client/journey", icon: Map },
  { title: "Encontros", url: "/client/encontros", icon: Calendar },
  { title: "Avisos", url: "/client/announcements", icon: Bell },
  { title: "Perfil", url: "/client/profile", icon: User },
];

export function ClientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <img src="/logo-badge.svg" alt="O Construtor" className="h-7 w-7 object-contain shrink-0" />
        {!collapsed && <span className="font-heading font-bold text-sm tracking-wide text-sidebar-foreground">O CONSTRUTOR</span>}
      </div>
      <SidebarContent>
        <SidebarGroup>
          {!collapsed && <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">Menu</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/client"} className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
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
        <button className="flex items-center gap-2 text-sidebar-foreground/50 hover:text-sidebar-foreground text-sm w-full px-2 py-1.5 rounded-md hover:bg-sidebar-accent transition-colors">
          <LogOut className="h-4 w-4" />
          {!collapsed && <span>Sair</span>}
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}
