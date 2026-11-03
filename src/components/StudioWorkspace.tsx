import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Map, CalendarDays, Library, BookOpen, Bell, UserRound,
  UsersRound, ChartNoAxesCombined, CreditCard, Link2, Settings2,
  Search, LogOut, ArrowUpRight, ChevronRight, Sparkles, CircleHelp,
} from "lucide-react";
import { SidebarProvider, Sidebar, SidebarContent, SidebarFooter, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CommandDialog, CommandInput, CommandEmpty, CommandList, CommandGroup, CommandItem } from "@/components/ui/command";
import { useAuth } from "@/contexts/AuthContext";

type Role = "client" | "admin";
type NavItem = { title: string; url: string; icon: typeof LayoutDashboard };
type NavGroup = { title: string; items: NavItem[] };

const clientGroups: NavGroup[] = [
  { title: "Seu espaço", items: [
    { title: "Visão geral", url: "/client", icon: LayoutDashboard },
    { title: "Minha jornada", url: "/client/journey", icon: Map },
    { title: "Encontros", url: "/client/encontros", icon: CalendarDays },
  ] },
  { title: "Desenvolvimento", items: [
    { title: "Módulos", url: "/client/modules", icon: BookOpen },
    { title: "Biblioteca", url: "/client/materials", icon: Library },
  ] },
  { title: "Sua conta", items: [
    { title: "Comunicados", url: "/client/announcements", icon: Bell },
    { title: "Meu perfil", url: "/client/profile", icon: UserRound },
  ] },
];
const adminGroups: NavGroup[] = [
  { title: "Operação", items: [
    { title: "Visão geral", url: "/admin", icon: LayoutDashboard },
    { title: "Encontros", url: "/admin/encontros", icon: CalendarDays },
    { title: "Mentorados", url: "/admin/users", icon: UsersRound },
    { title: "Evolução", url: "/admin/progress", icon: ChartNoAxesCombined },
  ] },
  { title: "Conteúdo", items: [
    { title: "Biblioteca", url: "/admin/materials", icon: Library },
    { title: "Jornadas e pilares", url: "/admin/journey", icon: Map },
    { title: "Comunicados", url: "/admin/announcements", icon: Bell },
  ] },
  { title: "Administração", items: [
    { title: "Financeiro", url: "/admin/financial", icon: CreditCard },
    { title: "Convites", url: "/admin/invites", icon: Link2 },
    { title: "Configurações", url: "/admin/settings", icon: Settings2 },
  ] },
];

const isActivePath = (pathname: string, target: string) =>
  pathname === target || (target !== "/client" && target !== "/admin" && pathname.startsWith(target + "/"));

function WorkspaceSidebar({ role, groups, onExit }: { role: Role; groups: NavGroup[]; onExit: () => void }) {
  const { state, setOpenMobile } = useSidebar();
  const { profile } = useAuth();
  const collapsed = state === "collapsed";
  const location = useLocation();
  return (
    <Sidebar collapsible="icon" className="studio-sidebar border-r-0 [&_[data-sidebar=sidebar]]:bg-[#101717] [&_[data-sidebar=sidebar]]:text-[#c1c8bf] [&_[data-sidebar=sidebar]]:border-r [&_[data-sidebar=sidebar]]:border-[#29312f]">
      <div className="studio-sidebar__brand">
        <div className="studio-sidebar__mark" aria-hidden="true">C</div>
        {!collapsed && <div>
          <div className="studio-sidebar__wordmark">O CONSTRUTOR</div>
          <p className="studio-sidebar__submark">{role === "admin" ? "Workspace · Gestão" : "Workspace · Mentoria"}</p>
        </div>}
      </div>
      <SidebarContent className="px-3 pb-3">
        {groups.map(group => (
          <div key={group.title}>
            {!collapsed && <p className="studio-sidebar__label">{group.title}</p>}
            <div className="space-y-0.5">
              {group.items.map(item => (
                <NavLink
                  key={item.url}
                  to={item.url}
                  end={item.url === "/client" || item.url === "/admin"}
                  title={collapsed ? item.title : undefined}
                  onClick={() => setOpenMobile(false)}
                  aria-current={isActivePath(location.pathname, item.url) ? "page" : undefined}
                  className={({ isActive }) => "studio-navitem " + (isActive ? "active" : "") + (collapsed ? " justify-center !px-1" : "")}
                >
                  <item.icon size={17} strokeWidth={1.8} className="shrink-0" aria-hidden="true" />
                  {!collapsed && <span className="flex-1 truncate">{item.title}</span>}
                  {!collapsed && isActivePath(location.pathname,item.url) && <span className="h-1 w-1 rounded-full bg-[#e2b18b]" aria-hidden="true" />}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </SidebarContent>
      <SidebarFooter className="studio-sidebar__footer">
        {!collapsed && (
          <div className="studio-sidebar__help mb-3">
            <div className="flex items-center gap-2 text-[#d6ad8d] mb-2"><Sparkles size={14}/><span className="text-[10px] font-bold tracking-wide uppercase">{role === "admin" ? "Seu centro de gestão" : "Sua evolução começa aqui"}</span></div>
            <p>{role === "admin" ? "Tudo o que importa para acompanhar sua comunidade, em um só lugar." : "Pequenos passos, repetidos com intenção, constroem grandes mudanças."}</p>
          </div>
        )}
        <div className={"flex items-center gap-3 " + (collapsed ? "justify-center" : "")}>
          <div className="studio-avatar shrink-0">{profile?.full_name?.slice(0,1)?.toUpperCase() || "C"}</div>
          {!collapsed && <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] font-bold text-[#f0eee7]">{profile?.full_name || "Minha conta"}</p>
            <p className="text-[10px] text-[#89958c]">{role === "admin" ? "Administrador" : "Mentorado"}</p>
          </div>}
          {!collapsed && <button type="button" onClick={onExit} aria-label="Sair da conta" title="Sair" className="studio-icon-button"><LogOut size={15}/></button>}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}

function WorkspaceBody({ role }: { role: Role }) {
  const groups = role === "admin" ? adminGroups : clientGroups;
  const items = useMemo(() => groups.flatMap(group => group.items), [role]);
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const current = [...items].sort((a,b) => b.url.length - a.url.length).find(item => isActivePath(location.pathname,item.url)) || items[0];

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(open => !open);
      }
    };
    document.addEventListener("keydown",shortcut);
    return () => document.removeEventListener("keydown",shortcut);
  }, []);

  const logout = async () => { await signOut(); navigate("/auth", { replace: true }); };
  const selectPage = (path: string) => { setSearchOpen(false); navigate(path); };
  const announcementPath = role === "admin" ? "/admin/announcements" : "/client/announcements";
  const today = new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"short", year:"numeric" }).format(new Date());

  return (
    <div className="studio-shell flex min-h-screen w-full">
      <WorkspaceSidebar role={role} groups={groups} onExit={logout} />
      <div className="studio-shell__main flex min-w-0 flex-1 flex-col">
        <header className="studio-header">
          <div className="flex min-w-0 items-center gap-3 sm:gap-4">
            <SidebarTrigger className="studio-icon-button !text-[#c4cfc5] hover:!bg-[#293732]" aria-label="Abrir ou recolher navegação" />
            <div className="hidden h-4 w-px bg-[#39433e] sm:block"/>
            <div className="flex min-w-0 items-center gap-2">
              <span className="studio-header__trail hidden sm:block">{role === "admin" ? "Gestão" : "Meu espaço"}</span>
              <ChevronRight size={13} className="hidden text-[#67766d] sm:block"/>
              <span className="studio-header__current truncate">{current.title}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
            <span className="hidden text-[11px] text-[#87968b] lg:block">{today}</span>
            <button type="button" className="studio-search" onClick={() => setSearchOpen(true)} aria-label="Buscar páginas e comandos">
              <Search size={15} strokeWidth={1.9}/>
              <span className="hidden sm:block">Buscar página...</span>
              <kbd className="studio-key hidden sm:block">Ctrl K</kbd>
            </button>
            <NavLink to={announcementPath} className="studio-icon-button relative" aria-label="Ver comunicados" title="Comunicados"><Bell size={18}/></NavLink>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="studio-avatar" aria-label="Opções da conta">{profile?.full_name?.slice(0,1)?.toUpperCase() || "C"}</button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-[200px] border-[#435047] bg-[#1e2824] p-2 text-[#f0eee7]">
                <p className="px-2 py-2 text-xs text-[#d6d9cf]">{profile?.full_name || "Minha conta"}</p>
                <DropdownMenuSeparator className="bg-[#3a4840]"/>
                {role === "client" && <DropdownMenuItem className="focus:bg-[#334038] focus:text-white" onClick={() => navigate("/client/profile")}><UserRound size={16} className="mr-2"/> Meu perfil</DropdownMenuItem>}
                <DropdownMenuItem className="focus:bg-[#334038] focus:text-white" onClick={logout}><LogOut size={16} className="mr-2"/> Encerrar sessão</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="conteudo-principal" className="studio-main-content min-h-0 flex-1" tabIndex={-1}>
          <div className="studio-page" key={location.pathname}><Outlet/></div>
        </main>
      </div>
      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder="Para onde você quer ir?" />
        <CommandList>
          <CommandEmpty>Nenhuma página encontrada.</CommandEmpty>
          {groups.map(group => (
            <CommandGroup key={group.title} heading={group.title}>
              {group.items.map(item => (
                <CommandItem key={item.url} value={item.title} onSelect={() => selectPage(item.url)}>
                  <item.icon size={16} className="mr-3 text-[#d5a987]"/>
                  {item.title}
                  <ArrowUpRight size={13} className="ml-auto text-[#76867b]"/>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
        <div className="flex items-center gap-2 border-t border-[#3a4840] px-4 py-3 text-[11px] text-[#8a958c]"><CircleHelp size={13}/> Pressione Esc para fechar</div>
      </CommandDialog>
    </div>
  );
}
export default function StudioWorkspace({ role }: { role: Role }) {
  return (
    <SidebarProvider style={{ "--sidebar-width": "254px", "--sidebar-width-icon": "70px" } as React.CSSProperties}>
      <WorkspaceBody role={role}/>
    </SidebarProvider>
  );
}
