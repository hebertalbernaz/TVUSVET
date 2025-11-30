import React, { useState, useEffect } from 'react';
import { Building2, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { db } from '@/services/database';
import { toast } from 'sonner';

export function ProfileSelector({ onProfileChange }) {
  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfileName, setActiveProfileName] = useState('Padrão');

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
        const ps = await db.getProfiles();
        const settings = await db.getSettings();
        setProfiles(ps);
        setActiveProfileId(settings.active_profile_id);
        setActiveProfileName(settings.active_profile_name || settings.clinic_name || 'Sem Perfil');
    } catch (e) { console.error(e); }
  };

  const handleSwitch = async (profile) => {
    await db.activateProfile(profile.id);
    setActiveProfileId(profile.id);
    setActiveProfileName(profile.name);
    toast.success(`Perfil alterado para: ${profile.name}`);
    if (onProfileChange) onProfileChange();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
            variant="outline" 
            className="gap-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary transition-colors h-9"
        >
          <Building2 className="h-4 w-4" />
          <span className="font-semibold truncate max-w-[150px]">
            {activeProfileName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Selecionar Empresa
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.length === 0 ? (
            <div className="p-3 text-xs text-muted-foreground text-center bg-muted/20 rounded-md mx-1">
                Nenhum perfil salvo.<br/>
                Vá em <strong>Configurações</strong> para criar.
            </div>
        ) : (
            profiles.map(profile => (
              <DropdownMenuItem 
                key={profile.id} 
                onClick={() => handleSwitch(profile)}
                className="justify-between cursor-pointer focus:bg-primary/10 focus:text-primary"
              >
                <span className="truncate">{profile.name}</span>
                {activeProfileId === profile.id && <Check className="h-3 w-3 text-primary" />}
              </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}