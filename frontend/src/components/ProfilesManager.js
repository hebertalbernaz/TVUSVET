import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Trash2, Save, Plus, CheckCircle, Upload, Edit2, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/services/database';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function ProfilesManager({ onProfileChanged }) {
  const [profiles, setProfiles] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const logoInputRef = useRef(null);
  const sigInputRef = useRef(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
        const ps = await db.getProfiles();
        const s = await db.getSettings();
        setProfiles(ps);
        setActiveId(s.active_profile_id);
    } catch (e) { console.error(e); }
  };

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const openNewProfile = () => {
      setFormData({ 
          name: '', clinic_name: '', clinic_address: '', veterinarian_name: '', crmv: '',
          professional_email: '', professional_phone: '', letterhead_path: null, signature_path: null 
      });
      setIsEditing(true);
  };

  const openEditProfile = (profile) => {
      setFormData({ ...profile });
      setIsEditing(true);
  };

  const saveProfile = async () => {
      if (!formData.name) return toast.error("O perfil precisa de um nome");
      try {
          if (formData.id) await db.updateProfile(formData.id, formData);
          else await db.createProfile(formData.name, formData);
          toast.success("Salvo!");
          setIsEditing(false);
          load();
          if (onProfileChanged) onProfileChanged();
      } catch (e) { toast.error("Erro ao salvar"); }
  };

  const activate = async (id) => {
    await db.activateProfile(id);
    toast.success("Perfil Ativado");
    load();
    if(onProfileChanged) onProfileChanged();
  };

  const remove = async (id) => {
    if(!window.confirm("Excluir este perfil?")) return;
    await db.deleteProfile(id);
    load();
  };

  if (isEditing) {
      return (
          <Card className="border-l-4 border-l-primary bg-card">
              <CardHeader>
                  <CardTitle>{formData.id ? 'Editar Perfil' : 'Novo Perfil'}</CardTitle>
                  <CardDescription>Preencha os dados completos para este perfil.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Nome do Perfil (Interno)</Label><Input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Ex: Clínica Centro" /></div>
                      <div className="space-y-2"><Label>Nome da Clínica (Cabeçalho)</Label><Input value={formData.clinic_name || ''} onChange={e => setFormData({...formData, clinic_name: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Veterinário</Label><Input value={formData.veterinarian_name || ''} onChange={e => setFormData({...formData, veterinarian_name: e.target.value})} /></div>
                      <div className="space-y-2"><Label>CRMV</Label><Input value={formData.crmv || ''} onChange={e => setFormData({...formData, crmv: e.target.value})} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Email</Label><Input value={formData.professional_email || ''} onChange={e => setFormData({...formData, professional_email: e.target.value})} /></div>
                      <div className="space-y-2"><Label>Telefone</Label><Input value={formData.professional_phone || ''} onChange={e => setFormData({...formData, professional_phone: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Endereço</Label><Input value={formData.clinic_address || ''} onChange={e => setFormData({...formData, clinic_address: e.target.value})} /></div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                      <div className="border border-dashed border-border p-4 rounded text-center space-y-2 bg-muted/20">
                          <Label>Logo do Cabeçalho</Label>
                          {formData.letterhead_path && <img src={formData.letterhead_path} className="h-16 mx-auto object-contain bg-white rounded p-1" alt="Logo" />}
                          <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'letterhead_path')} />
                          <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="outline" onClick={() => logoInputRef.current.click()}><Upload className="h-3 w-3 mr-2"/> Upload</Button>
                              {formData.letterhead_path && <Button size="sm" variant="destructive" onClick={() => setFormData({...formData, letterhead_path: null})}><X className="h-3 w-3"/></Button>}
                          </div>
                      </div>
                      <div className="border border-dashed border-border p-4 rounded text-center space-y-2 bg-muted/20">
                          <Label>Assinatura</Label>
                          {formData.signature_path && <img src={formData.signature_path} className="h-16 mx-auto object-contain bg-white rounded p-1" alt="Assinatura" />}
                          <input type="file" ref={sigInputRef} className="hidden" accept="image/*" onChange={e => handleFileChange(e, 'signature_path')} />
                          <div className="flex gap-2 justify-center">
                              <Button size="sm" variant="outline" onClick={() => sigInputRef.current.click()}><Upload className="h-3 w-3 mr-2"/> Upload</Button>
                              {formData.signature_path && <Button size="sm" variant="destructive" onClick={() => setFormData({...formData, signature_path: null})}><X className="h-3 w-3"/></Button>}
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button variant="ghost" onClick={() => setIsEditing(false)}>Cancelar</Button>
                      <Button onClick={saveProfile}><Save className="mr-2 h-4 w-4"/> Salvar Perfil</Button>
                  </div>
              </CardContent>
          </Card>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">Seus Perfis</h2>
          <Button onClick={openNewProfile}><Plus className="mr-2 h-4 w-4"/> Novo Perfil</Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {profiles.map(p => {
            const isActive = activeId === p.id;
            return (
                <Card key={p.id} className={`transition-all border-l-4 ${isActive ? 'border-l-green-500 bg-green-500/5 dark:bg-green-900/10' : 'border-l-transparent bg-card'}`}>
                    <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isActive ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                                <Building2 className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-bold flex items-center gap-2">
                                    {p.name}
                                    {isActive && <span className="text-[10px] bg-green-200 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 rounded-full uppercase">Ativo</span>}
                                </div>
                                <div className="text-sm text-muted-foreground">{p.clinic_name || 'Sem nome da clínica'}</div>
                                <div className="flex gap-2 mt-1">
                                    {p.letterhead_path ? <span className="text-[10px] text-primary font-bold">✓ Logo</span> : <span className="text-[10px] text-muted-foreground">Sem Logo</span>}
                                    {p.signature_path ? <span className="text-[10px] text-primary font-bold">✓ Assinatura</span> : <span className="text-[10px] text-muted-foreground">Sem Assin.</span>}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => openEditProfile(p)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Editar
                            </Button>
                            {!isActive && (
                                <Button size="sm" onClick={() => activate(p.id)}>Ativar</Button>
                            )}
                            <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-red-500" onClick={() => remove(p.id)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            );
        })}
        {profiles.length === 0 && <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/20">Nenhum perfil. Crie o primeiro!</div>}
      </div>
    </div>
  );
}