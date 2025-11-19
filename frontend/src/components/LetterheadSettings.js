import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Eye, FileText } from 'lucide-react';
import { toast } from 'sonner';

export function LetterheadSettings({ settings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(settings.letterhead_path || null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Aceitar Imagens e DOCX/PDF
    const validTypes = [
      'image/png', 'image/jpeg', 'image/jpg', 
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!validTypes.includes(file.type) && !file.name.endsWith('.docx')) {
      toast.error('Formato inválido! Use PNG, JPG ou DOCX');
      return;
    }

    // Verificar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Arquivo muito grande! Máximo 10MB');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        setPreview(base64Data);
        await onSave({
          ...settings,
          letterhead_path: base64Data,
          letterhead_filename: file.name
        });
        toast.success('Timbrado carregado com sucesso!');
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Erro ao ler arquivo');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Erro ao fazer upload do timbrado');
      console.error(error);
      setUploading(false);
    }
  };

  const removeLetterhead = async () => {
    try {
      setPreview(null);
      await onSave({
        ...settings,
        letterhead_path: null,
        letterhead_filename: null
      });
      toast.success('Timbrado removido');
    } catch (error) {
      toast.error('Erro ao remover timbrado');
    }
  };

  const isImage = settings.letterhead_filename && 
    (settings.letterhead_filename.endsWith('.png') || 
     settings.letterhead_filename.endsWith('.jpg') || 
     settings.letterhead_filename.endsWith('.jpeg'));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timbrado do Laudo</CardTitle>
        <CardDescription>
          Faça upload do cabeçalho da sua clínica (Imagem ou DOCX)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="letterhead-upload">Arquivo de Cabeçalho</Label>
          <div className="flex gap-2 mt-2">
            <label htmlFor="letterhead-upload" className="flex-1">
              <input
                id="letterhead-upload"
                type="file"
                accept=".png,.jpg,.jpeg,.docx,.pdf"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                as="span"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={uploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Carregando...' : 'Escolher Arquivo (Img/DOCX)'}
              </Button>
            </label>
            {settings.letterhead_filename && (
              <>
                {isImage && (
                  <Button
                    onClick={() => setShowPreview(true)}
                    variant="outline"
                    title="Visualizar"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={removeLetterhead}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  title="Remover"
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          {settings.letterhead_filename && (
            <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
              <FileText className="h-4 w-4" />
              <span>Arquivo atual: {settings.letterhead_filename}</span>
            </div>
          )}
          {!isImage && settings.letterhead_filename && (
             <p className="text-xs text-amber-600 mt-1">
               Nota: Arquivos DOCX serão usados na exportação, mas não aparecem na prévia.
             </p>
          )}
        </div>

        {showPreview && preview && isImage && (
          <div 
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative bg-white rounded-lg p-2 max-w-4xl max-h-[90vh] overflow-auto">
              <img 
                src={preview} 
                alt="Timbrado" 
                className="max-w-full h-auto"
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}