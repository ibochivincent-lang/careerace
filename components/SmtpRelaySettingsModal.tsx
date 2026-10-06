'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Mail, ShieldCheck, Check, Key, Server, Lock, ExternalLink } from 'lucide-react';

export interface SmtpConfig {
  provider: 'sovereign' | 'gmail' | 'outlook' | 'custom';
  host: string;
  port: number;
  user: string;
  pass: string;
  fromName: string;
}

const DEFAULT_CONFIG: SmtpConfig = {
  provider: 'sovereign',
  host: 'relay.careerace.online',
  port: 587,
  user: '',
  pass: '',
  fromName: ''
};

export interface SmtpRelaySettingsModalProps {
  open?: boolean;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  onSave?: (config: SmtpConfig) => void;
}

export function SmtpRelaySettingsModal({
  open,
  isOpen,
  onOpenChange,
  onClose,
  onSave
}: SmtpRelaySettingsModalProps) {
  const isModalOpen = open ?? isOpen ?? false;
  const handleModalClose = () => {
    if (onOpenChange) onOpenChange(false);
    if (onClose) onClose();
  };

  const [config, setConfig] = useState<SmtpConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('careerace_custom_smtp');
      if (stored) {
        try {
          setConfig(JSON.parse(stored));
        } catch {}
      }
    }
  }, [isModalOpen]);

  function handleProviderSelect(provider: 'sovereign' | 'gmail' | 'outlook' | 'custom') {
    if (provider === 'sovereign') {
      setConfig({
        provider: 'sovereign',
        host: 'relay.careerace.online',
        port: 587,
        user: '',
        pass: '',
        fromName: config.fromName || 'Vincent Lang'
      });
    } else if (provider === 'gmail') {
      setConfig((p) => ({
        ...p,
        provider: 'gmail',
        host: 'smtp.gmail.com',
        port: 465
      }));
    } else if (provider === 'outlook') {
      setConfig((p) => ({
        ...p,
        provider: 'outlook',
        host: 'smtp.office365.com',
        port: 587
      }));
    } else {
      setConfig((p) => ({
        ...p,
        provider: 'custom'
      }));
    }
  }

  function handleSave() {
    if (config.provider !== 'sovereign') {
      if (!config.user.trim()) {
        toast.error('Please enter your account email or username.');
        return;
      }
      if (!config.pass.trim()) {
        toast.error('Please enter your App Password or SMTP token.');
        return;
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('careerace_custom_smtp', JSON.stringify(config));
    }

    if (onSave) onSave(config);
    toast.success('SMTP & Relay credentials saved locally!');
    handleModalClose();
  }

  return (
    <Dialog open={isModalOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border shadow-2xl rounded-2xl">
        <DialogHeader className="space-y-1.5 pb-2 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold text-foreground">
                Email Relay &amp; DKIM Settings
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Connect your personal Gmail, Outlook, or sovereign DKIM relay for direct 1-click dispatch.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Provider Selection Cards */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleProviderSelect('sovereign')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                config.provider === 'sovereign'
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                  : 'border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-xs">Sovereign Relay</span>
                {config.provider === 'sovereign' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Zero-config DKIM relay verified with your Walrus address.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleProviderSelect('gmail')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                config.provider === 'gmail'
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                  : 'border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-xs">Google / Gmail</span>
                {config.provider === 'gmail' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Personal Gmail using 16-character Google App Password.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleProviderSelect('outlook')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                config.provider === 'outlook'
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                  : 'border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-xs">Microsoft Outlook</span>
                {config.provider === 'outlook' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Office365 / Outlook personal email using App Password.
              </p>
            </button>

            <button
              type="button"
              onClick={() => handleProviderSelect('custom')}
              className={`p-3 rounded-xl border text-left transition-all relative ${
                config.provider === 'custom'
                  ? 'border-emerald-500 bg-emerald-500/5 shadow-xs'
                  : 'border-border/80 hover:bg-muted/40'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-xs">Custom SMTP</span>
                {config.provider === 'custom' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Self-hosted, ProtonMail Bridge, or custom company relay.
              </p>
            </button>
          </div>

          {/* Form details for custom/gmail/outlook */}
          {config.provider !== 'sovereign' && (
            <div className="p-3 rounded-xl bg-muted/30 border border-border/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground text-[11px]">Credentials &amp; Security</span>
                <Badge variant="outline" className="text-[9px] text-emerald-600 border-emerald-500/30">
                  Stored Locally Only
                </Badge>
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">Your Email Address / Username</label>
                <input
                  type="email"
                  value={config.user}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((p) => ({ ...p, user: e.target.value }))}
                  placeholder="candidate@gmail.com"
                  className="w-full h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  {config.provider === 'gmail' ? 'Gmail 16-character App Password' : 'App Password / SMTP Token'}
                </label>
                <input
                  type="password"
                  value={config.pass}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((p) => ({ ...p, pass: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="w-full h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  Never use your primary account password. Generate a secure App Password from Google Account → Security → 2-Step Verification → App Passwords.
                </p>
              </div>

              {config.provider === 'custom' && (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div className="col-span-2">
                    <label className="text-[10px] text-muted-foreground block mb-1">SMTP Host</label>
                    <input
                      type="text"
                      value={config.host}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((p) => ({ ...p, host: e.target.value }))}
                      placeholder="smtp.yourdomain.com"
                      className="w-full h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-muted-foreground block mb-1">Port</label>
                    <input
                      type="number"
                      value={config.port}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfig((p) => ({ ...p, port: Number(e.target.value) || 587 }))}
                      className="w-full h-8 px-3 rounded-lg border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {config.provider === 'sovereign' && (
            <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Zero-Setup Sovereign Relay Active</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Applications are dispatched through the decentralized CareerAce DKIM relay, attaching your Walrus verified credential link directly in the email signature.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2 border-t border-border">
          <Button variant="ghost" size="sm" onClick={handleModalClose} className="text-xs">
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
          >
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
