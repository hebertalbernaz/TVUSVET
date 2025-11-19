import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function LetterheadSettings({ settings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null); // Referência direta ao input

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      toast.error('Use PNG, JPG ou DOCX');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        await onSave({
          ...settings,
          letterhead_path: base64Data,
          letterhead_filename: file.name
        });
        toast.success('Timbrado salvo!');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro no upload');
      setUploading(false);
    }
  };

  const removeLetterhead = async () => {
    await onSave({ ...settings, letterhead_path: null, letterhead_filename: null });
    toast.success('Removido');
  };

  const isImage = settings.letterhead_filename && /\.(jpg|jpeg|png)$/i.test(settings.letterhead_filename);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timbrado do Laudo</CardTitle>
        <CardDescription>Cabeçalho para DOCX (Imagens funcionam melhor)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Arquivo de Cabeçalho</Label>
          <div className="flex gap-2 mt-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={uploading}
              onClick={() => fileInputRef.current.click()} // Clique garantido
            >
              <Upload className="mr-2 h-4 w-4" />
              {uploading ? 'Enviando...' : 'Selecionar Arquivo'}
            </Button>

            {settings.letterhead_filename && (
              <>
                {isImage && (
                  <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button type="button" variant="destructive" onClick={removeLetterhead}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          
          {settings.letterhead_filename && (
            <p className="text-sm text-green-600 mt-2 flex items-center gap-2">
              <FileText className="h-4 w-4" /> {settings.letterhead_filename}
            </p>
          )}
        </div>

        {showPreview && isImage && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-10" onClick={() => setShowPreview(false)}>
            <img src={settings.letterhead_path} alt="Timbrado" className="max-w-full max-h-full rounded bg-white" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}