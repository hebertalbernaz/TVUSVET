import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Upload, X, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function LetterheadSettings({ settings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        await onSave({ ...settings, letterhead_path: e.target.result, letterhead_filename: file.name });
        toast.success('Salvo!');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) { toast.error('Erro'); setUploading(false); }
  };

  const removeLetterhead = async () => {
    await onSave({ ...settings, letterhead_path: null, letterhead_filename: null });
    toast.success('Removido');
  };

  const isImage = settings.letterhead_filename && /\.(jpg|jpeg|png)$/i.test(settings.letterhead_filename);

  return (
    <Card>
      <CardHeader><CardTitle>Timbrado</CardTitle><CardDescription>Cabeçalho</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input ref={fileInputRef} type="file" accept=".png,.jpg,.jpeg,.docx,.pdf" onChange={handleFileUpload} className="hidden" />
          <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current.click()}>{uploading ? '...' : 'Selecionar'}</Button>
          {settings.letterhead_filename && (
             <>
               {isImage && <Button variant="outline" onClick={() => setShowPreview(true)}><Eye className="h-4 w-4" /></Button>}
               <Button variant="destructive" onClick={removeLetterhead}><X className="h-4 w-4" /></Button>
             </>
          )}
        </div>
        {settings.letterhead_filename && <p className="text-sm text-green-600">{settings.letterhead_filename}</p>}
        {showPreview && isImage && (
           <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-10" onClick={() => setShowPreview(false)}>
              <img src={settings.letterhead_path} className="max-w-full max-h-full bg-white" />
           </div>
        )}
      </CardContent>
    </Card>
  );
}