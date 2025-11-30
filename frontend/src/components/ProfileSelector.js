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
    const ps = await db.getProfiles();
    const settings = await db.getSettings();
    setProfiles(ps);
    setActiveProfileId(settings.active_profile_id);
    setActiveProfileName(settings.active_profile_name || settings.clinic_name || 'Sem Perfil');
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
        <Button variant="outline" className="gap-2 border-dashed border-blue-300 bg-blue-50/50 hover:bg-blue-100">
          <Building2 className="h-4 w-4 text-blue-600" />
          <span className="font-semibold text-blue-900 truncate max-w-[150px]">
            {activeProfileName}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Selecionar Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {profiles.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground text-center">
                Nenhum perfil salvo.<br/>Vá em Configurações para criar.
            </div>
        ) : (
            profiles.map(profile => (
              <DropdownMenuItem 
                key={profile.id} 
                onClick={() => handleSwitch(profile)}
                className="justify-between cursor-pointer"
              >
                {profile.name}
                {activeProfileId === profile.id && <Check className="h-3 w-3 text-green-600" />}
              </DropdownMenuItem>
            ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}