import { useState, useEffect } from "react";
import { DollarSign, Plus, Check, AlertTriangle, Search, CalendarDays, Loader2, Pencil, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  user_id: string;
  full_name: string | null;
}

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  due_date: string;
  paid_at: string | null;
  status: string;
  notes: string | null;
}

const statusColors: Record<string, string> = {
  paid: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  overdue: "bg-red-500/10 text-red-400 border-red-500/20",
};

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  overdue: "Vencido",
};

const AdminFinancial = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  // Generate dialog
  const [genOpen, setGenOpen] = useState(false);
  const [genUserId, setGenUserId] = useState("");
  const [genAmount, setGenAmount] = useState("");
  const [genMonths, setGenMonths] = useState("12");
  const [genStartDate, setGenStartDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [generating, setGenerating] = useState(false);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Payment | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editStatus, setEditStatus] = useState("pending");
  const [editPaidAt, setEditPaidAt] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const openEdit = (p: Payment) => {
    setEditing(p);
    setEditAmount(String(p.amount));
    setEditDueDate(p.due_date);
    setEditStatus(p.status);
    setEditPaidAt(p.paid_at ? p.paid_at.split("T")[0] : "");
    setEditNotes(p.notes || "");
    setEditOpen(true);
  };

  const handleStatusChange = (newStatus: string) => {
    setEditStatus(newStatus);
    if (newStatus === "paid" && !editPaidAt) {
      const d = new Date();
      setEditPaidAt(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`);
    }
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSavingEdit(true);
    const payload: any = {
      amount: parseFloat(editAmount),
      due_date: editDueDate,
      status: editStatus,
      notes: editNotes || null,
      paid_at: editStatus === "paid" ? new Date(editPaidAt + "T12:00:00").toISOString() : null,
    };
    const { error } = await supabase.from("user_payments").update(payload).eq("id", editing.id);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Parcela atualizada!");
      setEditOpen(false);
      await fetchData();
    }
    setSavingEdit(false);
  };

  const deletePayment = async () => {
    if (!editing) return;
    const { error } = await supabase.from("user_payments").delete().eq("id", editing.id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else {
      toast.success("Parcela excluída!");
      setEditOpen(false);
      await fetchData();
    }
  };

  const fetchData = async () => {
    const [usersRes, paymentsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name"),
      supabase.from("user_payments").select("*").order("due_date", { ascending: true }),
    ]);
    setUsers(usersRes.data || []);
    setPayments(paymentsRes.data as Payment[] || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getUserName = (uid: string) => users.find(u => u.user_id === uid)?.full_name || "Sem nome";

  const generateInstallments = async () => {
    if (!genUserId || !genAmount || !genMonths) return;
    setGenerating(true);
    const amount = parseFloat(genAmount);
    const months = parseInt(genMonths);
    const startDate = new Date(genStartDate + "T12:00:00");

    const installments = Array.from({ length: months }, (_, i) => {
      const date = new Date(startDate);
      date.setMonth(date.getMonth() + i);
      return {
        user_id: genUserId,
        amount,
        due_date: date.toISOString().split("T")[0],
        status: "pending",
      };
    });

    const { error } = await supabase.from("user_payments").insert(installments as any);
    if (error) {
      toast.error("Erro ao gerar parcelas: " + error.message);
    } else {
      toast.success(`${months} parcelas geradas com sucesso!`);
      setGenOpen(false);
      setGenAmount("");
      setGenMonths("12");
      await fetchData();
    }
    setGenerating(false);
  };

  const markAsPaid = async (paymentId: string) => {
    const { error } = await supabase
      .from("user_payments")
      .update({ status: "paid", paid_at: new Date().toISOString() } as any)
      .eq("id", paymentId);
    if (error) toast.error("Erro ao dar baixa");
    else {
      toast.success("Pagamento confirmado!");
      await fetchData();
    }
  };

  const filtered = payments.filter(p => {
    if (selectedUser !== "all" && p.user_id !== selectedUser) return false;
    if (search) {
      const name = getUserName(p.user_id).toLowerCase();
      if (!name.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  // Summary
  const totalPaid = filtered.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount), 0);
  const totalPending = filtered.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount), 0);
  const totalOverdue = filtered.filter(p => p.status === "overdue").reduce((s, p) => s + Number(p.amount), 0);

  // Auto-mark overdue
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    const overdue = payments.filter(p => p.status === "pending" && p.due_date < today);
    if (overdue.length > 0) {
      Promise.all(
        overdue.map(p =>
          supabase.from("user_payments").update({ status: "overdue" } as any).eq("id", p.id)
        )
      ).then(() => {
        if (overdue.length > 0) fetchData();
      });
    }
  }, [payments.length]);

  if (loading) return <div className="text-gray-400 p-8">Carregando...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="studio-eyebrow mb-3">Pagamentos e parcelas</p>
          <h1 className="studio-title text-[30px] leading-tight sm:text-[38px]">Financeiro<span className="text-[#d6aa86]">.</span></h1>
          <p className="text-gray-400 text-sm mt-1">Gerencie pagamentos e parcelas dos mentorados.</p>
        </div>
        <Button className="bg-gradient-gold text-navy-dark font-heading font-semibold" onClick={() => setGenOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Gerar Parcelas
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Pago", value: totalPaid, color: "text-emerald-400", icon: Check },
          { label: "Pendente", value: totalPending, color: "text-yellow-400", icon: CalendarDays },
          { label: "Vencido", value: totalOverdue, color: "text-red-400", icon: AlertTriangle },
        ].map((s, i) => (
          <Card key={i} className="bg-[#1e2a25] border-[#36473d]">
            <CardContent className="p-4 flex items-center gap-3">
              <s.icon className={`h-5 w-5 ${s.color}`} />
              <div>
                <p className={`font-heading font-bold text-lg ${s.color}`}>
                  R$ {s.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 bg-[#1e2a25] border-[#36473d] text-white placeholder:text-gray-600" />
        </div>
        <Select value={selectedUser} onValueChange={setSelectedUser}>
          <SelectTrigger className="w-56 bg-[#1e2a25] border-[#36473d] text-white">
            <SelectValue placeholder="Todos os usuários" />
          </SelectTrigger>
          <SelectContent className="bg-navy-dark border-gold/10">
            <SelectItem value="all">Todos os usuários</SelectItem>
            {users.map(u => (
              <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Sem nome"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Payments list */}
      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-gray-500 text-sm">Nenhum pagamento encontrado.</p>}
        {filtered.map(p => (
          <Card key={p.id} className="bg-[#1e2a25] border-[#36473d]">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-gold/10 flex items-center justify-center shrink-0">
                <DollarSign className="h-4 w-4 text-gold" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">{getUserName(p.user_id)}</p>
                <p className="text-xs text-gray-500">
                  Venc: {new Date(p.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                  {p.paid_at && ` • Pago: ${new Date(p.paid_at).toLocaleDateString("pt-BR")}`}
                </p>
              </div>
              <p className="text-sm font-heading font-bold text-white">
                R$ {Number(p.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <Badge variant="outline" className={statusColors[p.status] || ""}>
                {statusLabels[p.status] || p.status}
              </Badge>
              {p.status !== "paid" && (
                <Button size="sm" variant="outline" className="border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => markAsPaid(p.id)}>
                  <Check className="h-3.5 w-3.5 mr-1" /> Baixa
                </Button>
              )}
              <Button size="sm" variant="outline" className="border-gold/20 text-gold hover:bg-gold/10" onClick={() => openEdit(p)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generate Dialog */}
      <Dialog open={genOpen} onOpenChange={setGenOpen}>
        <DialogContent className="bg-navy-dark border-gold/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">Gerar Parcelas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Usuário</Label>
              <Select value={genUserId} onValueChange={setGenUserId}>
                <SelectTrigger className="bg-[#1e2a25] border-[#36473d] text-white">
                  <SelectValue placeholder="Selecione o mentorado" />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-gold/10">
                  {users.map(u => (
                    <SelectItem key={u.user_id} value={u.user_id}>{u.full_name || "Sem nome"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Valor mensal (R$)</Label>
              <Input type="number" step="0.01" value={genAmount} onChange={e => setGenAmount(e.target.value)}
                className="bg-[#1e2a25] border-[#36473d] text-white" placeholder="500.00" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Nº de parcelas</Label>
                <Input type="number" value={genMonths} onChange={e => setGenMonths(e.target.value)}
                  className="bg-[#1e2a25] border-[#36473d] text-white" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Data início</Label>
                <Input type="date" value={genStartDate} onChange={e => setGenStartDate(e.target.value)}
                  className="bg-[#1e2a25] border-[#36473d] text-white" />
              </div>
            </div>
            <Button onClick={generateInstallments} disabled={generating || !genUserId || !genAmount}
              className="w-full bg-gradient-gold text-navy-dark font-heading font-bold">
              {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              {generating ? "Gerando..." : "Gerar Parcelas"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-navy-dark border-gold/10">
          <DialogHeader>
            <DialogTitle className="font-heading text-white">Editar Parcela</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Valor (R$)</Label>
              <Input type="number" step="0.01" value={editAmount} onChange={e => setEditAmount(e.target.value)}
                className="bg-[#1e2a25] border-[#36473d] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Data de vencimento</Label>
              <Input type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                className="bg-[#1e2a25] border-[#36473d] text-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Status</Label>
              <Select value={editStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="bg-[#1e2a25] border-[#36473d] text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-navy-dark border-gold/10">
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="overdue">Vencido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {editStatus === "paid" && (
              <div className="space-y-2">
                <Label className="text-gray-400 text-sm">Data de pagamento</Label>
                <Input type="date" value={editPaidAt} onChange={e => setEditPaidAt(e.target.value)}
                  className="bg-[#1e2a25] border-[#36473d] text-white" />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Observações</Label>
              <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
                className="bg-[#1e2a25] border-[#36473d] text-white" placeholder="Opcional" />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-between">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="border-red-500/30 text-red-400 hover:bg-red-500/10">
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-navy-dark border-gold/10">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Excluir parcela?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-400">
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="bg-navy-light border-gold/10 text-white hover:bg-navy-light/80">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={deletePayment} className="bg-red-500 hover:bg-red-600 text-white">
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditOpen(false)} className="border-gold/10 text-gray-300 hover:bg-navy-light">
                Cancelar
              </Button>
              <Button onClick={saveEdit} disabled={savingEdit || !editAmount || !editDueDate}
                className="bg-gradient-gold text-navy-dark font-heading font-bold">
                {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Salvar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminFinancial;
