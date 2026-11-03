import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Ban, KeyRound, Trash2, CheckCircle, Loader2, Mail, Link2, Copy, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface EnrichedUser {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: string;
  created_at: string;
  email: string;
  role: string;
  last_sign_in: string | null;
  banned: boolean;
}

const AdminUsers = () => {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showResetPw, setShowResetPw] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EnrichedUser | null>(null);
  const [creating, setCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [justCreatedUser, setJustCreatedUser] = useState<{ id: string; email: string; name: string } | null>(null);

  // New user form
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [resetPw, setResetPw] = useState("");

  const callManageUsers = useCallback(async (body: Record<string, unknown>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Não autenticado");

    const res = await supabase.functions.invoke("manage-users", { body });
    if (res.error) throw new Error(res.error.message);
    if (res.data?.error) throw new Error(res.data.error);
    return res.data;
  }, []);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await callManageUsers({ action: "list_users" });
      setUsers(data.users || []);
    } catch (err: any) {
      toast.error("Erro ao carregar usuários: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [callManageUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleCreateUser = async () => {
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha nome, e-mail e senha.");
      return;
    }
    setCreating(true);
    try {
      const result = await callManageUsers({
        action: "create_user",
        email: newEmail,
        password: newPassword,
        full_name: newName,
        phone: newPhone,
      });
      toast.success("Usuário criado com sucesso!");
      setJustCreatedUser({ id: result.user_id, email: newEmail, name: newName });
      setShowNew(false);
      setNewName(""); setNewEmail(""); setNewPhone(""); setNewPassword("");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleSendInvite = async (userId: string) => {
    setInviteLoading(true);
    try {
      await callManageUsers({ action: "send_invite", user_id: userId });
      toast.success("Convite enviado com sucesso!");
      setShowInvite(false);
      setJustCreatedUser(null);
    } catch (err: any) {
      toast.error("Erro ao enviar convite: " + err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const handleToggleBlock = async (user: EnrichedUser) => {
    setActionLoading(user.user_id);
    try {
      const action = user.status === "blocked" || user.banned ? "unblock_user" : "block_user";
      await callManageUsers({ action, user_id: user.user_id });
      toast.success(action === "block_user" ? "Usuário bloqueado." : "Usuário desbloqueado.");
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetPassword = async () => {
    if (!resetPw || resetPw.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setActionLoading(selectedUser?.user_id || "");
    try {
      await callManageUsers({ action: "reset_password", user_id: selectedUser?.user_id, new_password: resetPw });
      toast.success("Senha redefinida com sucesso!");
      setShowResetPw(false);
      setResetPw("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async () => {
    setActionLoading(selectedUser?.user_id || "");
    try {
      await callManageUsers({ action: "delete_user", user_id: selectedUser?.user_id });
      toast.success("Usuário excluído.");
      setShowDelete(false);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleApproveUser = async (user: EnrichedUser) => {
    setActionLoading(user.user_id);
    try {
      await callManageUsers({ action: "approve_user", user_id: user.user_id });
      toast.success(`${user.full_name || user.email} aprovado com sucesso!`);
      loadUsers();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const registerLink = "https://oconstrutor.empresaprospera.com.br/register";

  const copyRegisterLink = () => {
    navigator.clipboard.writeText(registerLink);
    toast.success("Link de cadastro copiado!");
  };

  const filtered = users
    .filter(
      (u) =>
        (u.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") return -1;
      if (a.status !== "pending" && b.status === "pending") return 1;
      return 0;
    });

  const formatDate = (d: string | null) => {
    if (!d) return "Nunca";
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  return (
    <div className="max-w-6xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="studio-eyebrow mb-3">Gestão de pessoas</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Mentorados<span className="text-[#d6aa86]">.</span></h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie os clientes da mentoria. <span className="text-accent">{users.length}</span> cadastrados.
          </p>
        </div>
        <Dialog open={showNew} onOpenChange={setShowNew}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-accent text-accent-foreground font-heading font-semibold hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-1" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-accent/10">
            <DialogHeader>
              <DialogTitle className="font-heading text-foreground">Cadastrar Novo Usuário</DialogTitle>
              <DialogDescription className="text-muted-foreground text-sm">
                O usuário receberá acesso imediato com as credenciais definidas.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Nome completo *</Label>
                <Input value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="Nome do cliente" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">E-mail *</Label>
                <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="email@exemplo.com" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Telefone</Label>
                <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="(00) 00000-0000" />
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-sm">Senha temporária *</Label>
                <Input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="Mínimo 6 caracteres" />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90"
                onClick={handleCreateUser}
                disabled={creating}
              >
                {creating ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Criando...</> : "Cadastrar"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Link de cadastro */}
      <Card className="bg-card/30 border-accent/10">
        <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <Link2 className="h-5 w-5 text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground font-medium">Link de cadastro para mentorados</p>
            <p className="text-xs text-muted-foreground truncate">{registerLink}</p>
          </div>
          <Button size="sm" variant="outline" onClick={copyRegisterLink} className="border-accent/20 text-accent hover:bg-accent/10">
            <Copy className="h-4 w-4 mr-1" /> Copiar Link
          </Button>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-[#1e2a25] border-[#36473d] text-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          {search ? "Nenhum usuário encontrado." : "Nenhum usuário cadastrado ainda."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((user) => {
            const isPending = user.status === "pending";
            const isBlocked = user.status === "blocked" || user.banned;
            const initials = (user.full_name || user.email)
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <Card key={user.id} className="bg-[#1e2a25] border-[#36473d] hover:border-accent/15 transition-colors">
                <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center text-accent text-sm font-bold shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-foreground font-medium">{user.full_name || "Sem nome"}</p>
                      <Badge
                        variant={isBlocked ? "destructive" : isPending ? "outline" : "default"}
                        className={
                          isBlocked
                            ? "text-[10px]"
                            : isPending
                            ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20 text-[10px]"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"
                        }
                      >
                        {isBlocked ? "Bloqueado" : isPending ? "Pendente" : "Ativo"}
                      </Badge>
                      {user.role === "admin" && (
                        <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">Admin</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{user.email}{user.phone ? ` • ${user.phone}` : ""}</p>
                    <p className="text-xs text-muted-foreground/50">
                      Último acesso: {formatDate(user.last_sign_in)} • Cadastro: {formatDate(user.created_at)}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {isPending && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        title="Aprovar usuário"
                        onClick={() => handleApproveUser(user)}
                        disabled={actionLoading === user.user_id}
                      >
                        {actionLoading === user.user_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                      title="Enviar convite"
                      onClick={() => { setSelectedUser(user); setShowInvite(true); }}
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-accent hover:bg-accent/10"
                      title="Redefinir senha"
                      onClick={() => { setSelectedUser(user); setShowResetPw(true); }}
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className={`h-8 w-8 ${isBlocked ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10" : "text-muted-foreground hover:text-red-400 hover:bg-red-500/10"}`}
                      title={isBlocked ? "Desbloquear" : "Bloquear"}
                      onClick={() => handleToggleBlock(user)}
                      disabled={actionLoading === user.user_id}
                    >
                      {actionLoading === user.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isBlocked ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Ban className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      title="Excluir"
                      onClick={() => { setSelectedUser(user); setShowDelete(true); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Send Invite Dialog */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="bg-card border-accent/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Enviar Convite</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Enviar email de convite para <strong>{selectedUser?.full_name || selectedUser?.email}</strong>?
              O usuário receberá um link para acessar a plataforma.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)} className="border-accent/10 text-muted-foreground">
              Cancelar
            </Button>
            <Button
              onClick={() => selectedUser && handleSendInvite(selectedUser.user_id)}
              disabled={inviteLoading}
              className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90"
            >
              {inviteLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Mail className="h-4 w-4 mr-2" /> Enviar Convite</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post-creation invite dialog */}
      <Dialog open={!!justCreatedUser} onOpenChange={() => setJustCreatedUser(null)}>
        <DialogContent className="bg-card border-accent/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Usuário Criado!</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              <strong>{justCreatedUser?.name}</strong> foi cadastrado com sucesso.
              Deseja enviar um email de convite para <strong>{justCreatedUser?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJustCreatedUser(null)} className="border-accent/10 text-muted-foreground">
              Não, obrigado
            </Button>
            <Button
              onClick={() => justCreatedUser && handleSendInvite(justCreatedUser.id)}
              disabled={inviteLoading}
              className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90"
            >
              {inviteLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Enviando...</> : <><Mail className="h-4 w-4 mr-2" /> Enviar Convite</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={showResetPw} onOpenChange={setShowResetPw}>
        <DialogContent className="bg-card border-accent/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Redefinir Senha</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Defina uma nova senha para <strong>{selectedUser?.full_name || selectedUser?.email}</strong>.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nova senha</Label>
              <Input type="password" value={resetPw} onChange={(e) => setResetPw(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="Mínimo 6 caracteres" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetPw(false)} className="border-accent/10 text-muted-foreground">
              Cancelar
            </Button>
            <Button onClick={handleResetPassword} disabled={!!actionLoading} className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90">
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Redefinir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="bg-card border-accent/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-foreground">Excluir Usuário</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Tem certeza que deseja excluir <strong>{selectedUser?.full_name || selectedUser?.email}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(false)} className="border-accent/10 text-muted-foreground">
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser} disabled={!!actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
