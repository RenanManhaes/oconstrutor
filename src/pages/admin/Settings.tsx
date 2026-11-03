import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, Upload, FileText, Image, Video, Trash2, Copy } from "lucide-react";
import { compressImage } from "@/lib/compress-image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
  metadata: { size: number; mimetype: string } | null;
}

const AdminSettings = () => {
  const { user, profile } = useAuth();

  // Profile state
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Platform settings
  const [mentoringName, setMentoringName] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [sequential, setSequential] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // File manager
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  useEffect(() => {
    const load = async () => {
      if (user) {
        const { data: phoneData } = await supabase.from("profiles").select("phone").eq("user_id", user.id).single();
        if (phoneData?.phone) setPhone(phoneData.phone);
      }

      const { data } = await supabase.from("platform_settings").select("key, value");
      if (data) {
        const map = Object.fromEntries(data.map((r: any) => [r.key, r.value]));
        setMentoringName(map.mentoring_name || "");
        setMentorName(map.mentor_name || "");
        setSequential(map.sequential_content === "true");
        setEmailNotifications(map.email_notifications === "true");
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const loadFiles = useCallback(async () => {
    setLoadingFiles(true);
    const { data } = await supabase.storage.from("media").list("uploads", {
      limit: 100,
      sortBy: { column: "created_at", order: "desc" },
    });
    if (data) setFiles(data.filter(f => f.name !== ".emptyFolderPlaceholder") as StorageFile[]);
    setLoadingFiles(false);
  }, []);

  useEffect(() => { loadFiles(); }, [loadFiles]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase.from("profiles")
        .update({ full_name: fullName, phone, avatar_url: avatarUrl })
        .eq("user_id", user.id);
      if (error) throw error;
      toast.success("Perfil atualizado!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const compressed = await compressImage(file, { maxWidth: 400, maxHeight: 400, quality: 0.8 });
      const ext = compressed.name.split(".").pop() || "jpg";
      const path = `avatars/${user.id}.${ext}`;
      const { error } = await supabase.storage.from("media").upload(path, compressed, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("media").getPublicUrl(path);
      setAvatarUrl(data.publicUrl);
      await supabase.from("profiles").update({ avatar_url: data.publicUrl }).eq("user_id", user.id);
      toast.success("Avatar atualizado!");
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const updates = [
        { key: "mentoring_name", value: mentoringName },
        { key: "mentor_name", value: mentorName },
        { key: "sequential_content", value: String(sequential) },
        { key: "email_notifications", value: String(emailNotifications) },
      ];
      for (const u of updates) {
        const { error } = await supabase.from("platform_settings").update({ value: u.value }).eq("key", u.key);
        if (error) throw error;
      }
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setUploadingFile(true);
    try {
      for (const file of Array.from(fileList)) {
        const safeName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
        const { error } = await supabase.storage.from("media").upload(`uploads/${safeName}`, file);
        if (error) throw error;
      }
      toast.success(`${fileList.length} arquivo(s) enviado(s)!`);
      loadFiles();
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
    } finally {
      setUploadingFile(false);
      e.target.value = "";
    }
  };

  const handleDeleteFile = async (name: string) => {
    const { error } = await supabase.storage.from("media").remove([`uploads/${name}`]);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Arquivo excluído."); loadFiles(); }
  };

  const handleCopyUrl = (name: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(`uploads/${name}`);
    navigator.clipboard.writeText(data.publicUrl);
    toast.success("URL copiada!");
  };

  const getFileIcon = (name: string) => {
    const ext = name.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) return <Image className="h-4 w-4 text-blue-400" />;
    if (["mp4", "mov", "avi", "mkv"].includes(ext)) return <Video className="h-4 w-4 text-purple-400" />;
    return <FileText className="h-4 w-4 text-accent" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>;

  const initials = (fullName || user?.email || "A").split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="font-heading font-bold text-2xl text-foreground">Configurações</h1>
        <p className="text-muted-foreground text-sm mt-1">Perfil, plataforma e arquivos.</p>
      </div>

      {/* Profile */}
      <Card className="bg-card/50 border-accent/10">
        <CardHeader>
          <CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">Meu Perfil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-5">
            <div className="relative group">
              <Avatar className="h-20 w-20 border-2 border-accent/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-accent/20 text-accent text-xl font-bold">{initials}</AvatarFallback>
              </Avatar>
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                {uploadingAvatar ? <Loader2 className="h-5 w-5 text-white animate-spin" /> : <Upload className="h-5 w-5 text-white" />}
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploadingAvatar} />
              </label>
            </div>
            <div>
              <p className="font-heading font-bold text-foreground">{fullName || "Admin"}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge className="mt-1 bg-accent/10 text-accent border-accent/20 text-[10px]">Admin</Badge>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nome completo</Label>
              <Input value={fullName} onChange={e => setFullName(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Telefone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" placeholder="(00) 00000-0000" />
            </div>
          </div>
          <Button onClick={handleSaveProfile} disabled={savingProfile} className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90">
            {savingProfile ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Perfil</>}
          </Button>
        </CardContent>
      </Card>

      {/* Platform Settings */}
      <Card className="bg-card/50 border-accent/10">
        <CardHeader>
          <CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">Plataforma</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nome da Mentoria</Label>
              <Input value={mentoringName} onChange={e => setMentoringName(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-muted-foreground text-sm">Nome do Mentor</Label>
              <Input value={mentorName} onChange={e => setMentorName(e.target.value)} className="bg-background/50 border-accent/10 text-foreground" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Liberação sequencial de conteúdo</p>
              <p className="text-xs text-muted-foreground">Clientes só acessam o próximo após concluir o anterior</p>
            </div>
            <Switch checked={sequential} onCheckedChange={setSequential} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-foreground">Notificações por email</p>
              <p className="text-xs text-muted-foreground">Enviar avisos por email para os clientes</p>
            </div>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </div>
          <Button onClick={handleSaveSettings} disabled={savingSettings} className="bg-accent text-accent-foreground font-heading font-bold hover:bg-accent/90">
            {savingSettings ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Salvando...</> : <><Save className="h-4 w-4 mr-2" /> Salvar Configurações</>}
          </Button>
        </CardContent>
      </Card>

      {/* File Manager */}
      <Card className="bg-card/50 border-accent/10">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-heading text-muted-foreground uppercase tracking-wider">Arquivos da Plataforma</CardTitle>
          <label>
            <Button size="sm" disabled={uploadingFile} className="bg-accent text-accent-foreground font-heading font-semibold hover:bg-accent/90" asChild>
              <span className="cursor-pointer">
                {uploadingFile ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Upload className="h-4 w-4 mr-1" />}
                Enviar Arquivos
              </span>
            </Button>
            <input type="file" multiple className="hidden" onChange={handleFileUpload} disabled={uploadingFile} />
          </label>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground/70 mb-4">Faça upload de imagens, vídeos, PDFs e outros materiais. Copie a URL para usar nos encontros.</p>
          {loadingFiles ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-accent" /></div>
          ) : files.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">Nenhum arquivo enviado ainda.</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {files.map((file) => (
                <div key={file.id || file.name} className="flex items-center gap-3 p-3 rounded-lg bg-background/30 border border-accent/5 hover:border-accent/15 transition-colors">
                  {getFileIcon(file.name)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{file.name}</p>
                    <p className="text-[11px] text-muted-foreground/60">
                      {file.metadata?.size ? formatSize(file.metadata.size) : "—"} • {new Date(file.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/10" onClick={() => handleCopyUrl(file.name)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteFile(file.name)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
