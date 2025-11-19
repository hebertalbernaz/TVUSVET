import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Upload, X, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function LetterheadSettings({ settings, onSave }) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(settings.letterhead_path || null);
  const [showPreview, setShowPreview] = useState(false);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Verificar tipo de arquivo
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato inválido! Use PNG, JPG, PDF ou DOCX');
      return;
    }

    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande! Máximo 5MB');
      return;
    }

    setUploading(true);
    try {
      // Converter para base64 para armazenamento local
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timbrado do Laudo</CardTitle>
        <CardDescription>
          Configure o cabeçalho que aparecerá nos laudos exportados
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="letterhead-upload">Upload do Timbrado (PNG, JPG, PDF ou DOCX)</Label>
          <p className="text-sm text-gray-500 mb-2">
            Faça upload de um arquivo com o cabeçalho da sua clínica (máximo 5MB)
          </p>
          <div className="flex gap-2">
            <label htmlFor="letterhead-upload" className="flex-1">
              <input
                id="letterhead-upload"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.docx"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                as="span"
                variant="outline"
                className="w-full cursor-pointer"
                disabled={uploading}
                data-testid="letterhead-upload-button"
              >
                <Upload className="mr-2 h-4 w-4" />
                {uploading ? 'Carregando...' : 'Escolher Arquivo'}
              </Button>
            </label>
            {preview && (
              <>
                <Button
                  onClick={() => setShowPreview(true)}
                  variant="outline"
                  data-testid="preview-letterhead-button"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar
                </Button>
                <Button
                  onClick={removeLetterhead}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  data-testid="remove-letterhead-button"
                >
                  <X className="mr-2 h-4 w-4" />
                  Remover
                </Button>
              </>
            )}
          </div>
          {settings.letterhead_filename && (
            <p className="text-sm text-green-600 mt-2">
              ✓ Timbrado configurado: {settings.letterhead_filename}
            </p>
          )}
        </div>

        {/* Preview Modal */}
        {showPreview && preview && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
            onClick={() => setShowPreview(false)}
          >
            <div className="relative bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
              <Button
                onClick={() => setShowPreview(false)}
                className="absolute top-2 right-2 z-10"
                variant="outline"
                size="sm"
              >
                <X className="h-4 w-4" />
              </Button>
              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Pré-visualização do Timbrado</h3>
                {settings.letterhead_filename?.endsWith('.pdf') || settings.letterhead_filename?.endsWith('.docx') ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      Pré-visualização não disponível.
                      <br />
                      O arquivo será incluído nos laudos exportados como cabeçalho quando possível.
                    </p>
                  </div>
                ) : (
                  <img 
                    src={preview} 
                    alt="Timbrado" 
                    className="max-w-full h-auto border rounded shadow-lg"
                  />
                )}
              </div>
            </div>
          </div>
        )}

        <Separator />

        <div>
          <p className="text-sm text-gray-600 mb-3">
            <strong>Nota:</strong> O sistema utilizará as informações dos "Dados da Clínica" 
            para criar o cabeçalho do laudo automaticamente. O timbrado personalizado aparecerá 
            no topo do documento exportado.
          </p>
          <p className="text-sm text-gray-500">
            <strong>Dica:</strong> Use uma imagem com fundo branco ou transparente para melhor 
            integração com o laudo.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
