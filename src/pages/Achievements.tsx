import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, Calendar, FileText, Image } from "lucide-react";

interface Achievement {
  id: string;
  title: string;
  description: string;
  achievement_date: string;
  image_url: string | null;
  school_level?: string;
}

const Achievements = () => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    achievement_date: "",
    image_url: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("school_level")
      .eq("id", user.id)
      .single();

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .order("role", { ascending: false })
      .limit(1)
      .single();

    if (profile && roleData) {
      setSchoolLevel(profile.school_level || "");
      fetchAchievements(roleData.role, profile.school_level);
    }
  };

  const fetchAchievements = async (role: string, level: string | null) => {
    const query = supabase.from("achievements").select("*").order("achievement_date", { ascending: false });
    
    if (role === "admin" && level) {
      query.eq("school_level", level as any);
    }

    const { data } = await query;
    if (data) setAchievements(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("achievements")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Prestasi berhasil diupdate!");
      } else {
        const { error } = await supabase
          .from("achievements")
          .insert({
            ...formData,
            school_level: schoolLevel as any,
          });

        if (error) throw error;
        toast.success("Prestasi berhasil ditambahkan!");
      }

      setOpen(false);
      resetForm();
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;

    try {
      const { error } = await supabase
        .from("achievements")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Prestasi berhasil dihapus!");
      fetchProfile();
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      achievement_date: "",
      image_url: "",
    });
    setEditingId(null);
  };

  const openEditDialog = (achievement: Achievement) => {
    setFormData({
      title: achievement.title,
      description: achievement.description,
      achievement_date: achievement.achievement_date,
      image_url: achievement.image_url || "",
    });
    setEditingId(achievement.id);
    setOpen(true);
  };

  const openDetailDialog = (achievement: Achievement) => {
    setSelectedAchievement(achievement);
    setDetailOpen(true);
  };

  const getSchoolLevelLabel = (level: string) => {
    const labels: Record<string, string> = {
      tk: "TK",
      sd: "SD",
      smp: "SMP",
      sma: "SMA",
    };
    return labels[level] || level.toUpperCase();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prestasi</h1>
            <p className="text-muted-foreground">Kelola data prestasi sekolah</p>
          </div>
          <Sheet open={open} onOpenChange={(value) => {
            setOpen(value);
            if (!value) resetForm();
          }}>
            <SheetTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Prestasi
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
              <SheetHeader>
                <SheetTitle>{editingId ? "Edit Prestasi" : "Tambah Prestasi"}</SheetTitle>
                <SheetDescription>Isi informasi prestasi dengan lengkap</SheetDescription>
              </SheetHeader>
              <form onSubmit={handleSubmit} className="space-y-6 mt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Judul Prestasi</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="achievement_date">Tanggal</Label>
                  <Input
                    id="achievement_date"
                    type="date"
                    value={formData.achievement_date}
                    onChange={(e) => setFormData({ ...formData, achievement_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">URL Gambar</Label>
                  <Input
                    id="image_url"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                  {formData.image_url && (
                    <div className="mt-2 rounded-lg overflow-hidden border">
                      <img 
                        src={formData.image_url} 
                        alt="Preview"
                        className="w-full h-40 object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading} className="flex-1">
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                </div>
              </form>
            </SheetContent>
          </Sheet>
        </div>

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Detail Prestasi</DialogTitle>
              <DialogDescription>Informasi lengkap prestasi sekolah</DialogDescription>
            </DialogHeader>
            {selectedAchievement && (
              <div className="space-y-6">
                {/* Image Section */}
                {selectedAchievement.image_url && (
                  <div className="rounded-lg overflow-hidden border">
                    <img 
                      src={selectedAchievement.image_url} 
                      alt={selectedAchievement.title}
                      className="w-full h-64 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">{selectedAchievement.title}</h3>
                  {selectedAchievement.school_level && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                      {getSchoolLevelLabel(selectedAchievement.school_level)}
                    </span>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">Tanggal Prestasi</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(selectedAchievement.achievement_date).toLocaleDateString("id-ID", {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>

                  {selectedAchievement.image_url && (
                    <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                      <Image className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Gambar</p>
                        <a 
                          href={selectedAchievement.image_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline truncate block max-w-[200px]"
                        >
                          Lihat gambar
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <p className="font-medium">Deskripsi</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedAchievement.description}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setDetailOpen(false);
                      openEditDialog(selectedAchievement);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => {
                      setDetailOpen(false);
                      handleDelete(selectedAchievement.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Hapus
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Daftar Prestasi</CardTitle>
            <CardDescription>Total {achievements.length} prestasi</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Judul</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Deskripsi</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {achievements.map((achievement) => (
                  <TableRow 
                    key={achievement.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => openDetailDialog(achievement)}
                  >
                    <TableCell className="font-medium">{achievement.title}</TableCell>
                    <TableCell>{new Date(achievement.achievement_date).toLocaleDateString("id-ID")}</TableCell>
                    <TableCell className="max-w-md truncate">{achievement.description}</TableCell>
                    <TableCell className="text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="ghost" onClick={() => openDetailDialog(achievement)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => openEditDialog(achievement)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(achievement.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {achievements.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      Belum ada data prestasi
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Achievements;
