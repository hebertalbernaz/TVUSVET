import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Upload, Image as ImageIcon } from 'lucide-react';

export function LetterheadSettings({ settings, onSave }) {
  const [formData, setFormData] = useState(settings || {});
  const logoInputRef = useRef(null);
  const signatureInputRef = useRef(null);

  const handleFileChange = (e, field) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* 1. DADOS DE CONTATO DO CABEÇALHO */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Profissional (Cabeçalho)</CardTitle>
          <CardDescription>Estes dados aparecerão no canto superior direito do laudo.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Email Profissional</Label>
            <Input 
              value={formData.professional_email || ''} 
              onChange={e => setFormData({...formData, professional_email: e.target.value})} 
              placeholder="ex: contato@vet.com.br"
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone / WhatsApp</Label>
            <Input 
              value={formData.professional_phone || ''} 
              onChange={e => setFormData({...formData, professional_phone: e.target.value})} 
              placeholder="ex: (11) 99999-9999"
            />
          </div>
        </CardContent>
      </Card>

      {/* 2. LOGO E ASSINATURA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LOGO (Esquerda) */}
        <Card>
          <CardHeader>
            <CardTitle>Logo (Superior Esquerdo)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px] bg-muted/10 relative">
              {formData.letterhead_path ? (
                <>
                  <img src={formData.letterhead_path} alt="Logo" className="max-h-[100px] object-contain" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setFormData({...formData, letterhead_path: null})}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhum logo</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={logoInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'letterhead_path')} 
            />
            <Button variant="outline" className="w-full" onClick={() => logoInputRef.current.click()}>
              <Upload className="mr-2 h-4 w-4" /> Carregar Logo
            </Button>
          </CardContent>
        </Card>

        {/* ASSINATURA (Fim da Página) */}
        <Card>
          <CardHeader>
            <CardTitle>Assinatura (Rodapé Final)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center min-h-[150px] bg-muted/10 relative">
              {formData.signature_path ? (
                <>
                  <img src={formData.signature_path} alt="Assinatura" className="max-h-[80px] object-contain" />
                  <Button 
                    variant="destructive" 
                    size="icon" 
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={() => setFormData({...formData, signature_path: null})}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </>
              ) : (
                <div className="text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Nenhuma assinatura</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              ref={signatureInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={(e) => handleFileChange(e, 'signature_path')} 
            />
            <Button variant="outline" className="w-full" onClick={() => signatureInputRef.current.click()}>
              <Upload className="mr-2 h-4 w-4" /> Carregar Assinatura
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">Salvar Todas Configurações</Button>
      </div>
    </div>
  );
}