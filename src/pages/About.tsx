import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pencil, Phone, Mail } from "lucide-react";

interface AboutData {
  id: string;
  school_level: string;
  title: string;
  content: string;
  contact_phone: string | null;
  contact_email: string | null;
}

const About = () => {
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [aboutData, setAboutData] = useState<AboutData | null>(null);
  const [schoolLevel, setSchoolLevel] = useState<string>("");
  const [formData, setFormData] = useState({
    contact_phone: "",
    contact_email: "",
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
      fetchAboutData(profile.school_level || "");
    }
  };

  const fetchAboutData = async (level: string) => {
    if (!level) return;
    
    const { data } = await supabase
      .from("about")
      .select("*")
      .eq("school_level", level as any)
      .maybeSingle();

    if (data) {
      setAboutData(data);
      setFormData({
        contact_phone: data.contact_phone || "",
        contact_email: data.contact_email || "",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (aboutData) {
        const { error } = await supabase
          .from("about")
          .update({
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", aboutData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("about")
          .insert({
            title: "Profil Sekolah",
            content: "",
            contact_phone: formData.contact_phone || null,
            contact_email: formData.contact_email || null,
            school_level: schoolLevel as any,
          });

        if (error) throw error;
      }

      toast.success("Data kontak berhasil disimpan!");
      setEditing(false);
      fetchAboutData(schoolLevel);
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Kontak Sekolah</h1>
            <p className="text-muted-foreground">Kelola informasi kontak sekolah {schoolLevel.toUpperCase()}</p>
          </div>
          {aboutData && !editing && (
            <Button onClick={() => setEditing(true)}>
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Informasi Kontak</CardTitle>
            <CardDescription>Isi nomor telepon dan email sekolah</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Nomor Telepon
                </Label>
                <Input
                  id="contact_phone"
                  type="tel"
                  placeholder="Contoh: 021-1234567"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  disabled={!editing && aboutData !== null}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Sekolah
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  placeholder="Contoh: info@sekolah.sch.id"
                  value={formData.contact_email}
                  onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
                  disabled={!editing && aboutData !== null}
                />
              </div>

              {(editing || !aboutData) && (
                <div className="flex gap-2">
                  <Button type="submit" disabled={loading}>
                    {loading ? "Menyimpan..." : "Simpan"}
                  </Button>
                  {editing && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        if (aboutData) {
                          setFormData({
                            contact_phone: aboutData.contact_phone || "",
                            contact_email: aboutData.contact_email || "",
                          });
                        }
                      }}
                    >
                      Batal
                    </Button>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default About;
