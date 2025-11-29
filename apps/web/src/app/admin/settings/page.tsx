'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@parallel/ui';
import {
  Settings,
  Shield,
  Bell,
  Database,
  CreditCard,
  Zap,
  Save,
  RefreshCw,
} from 'lucide-react';

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    // General
    siteName: 'Parallel',
    siteUrl: 'https://parallel.ai',
    maintenanceMode: false,

    // User Settings
    allowSignups: true,
    requireEmailVerification: true,
    maxPersonasPerUser: 5,
    maxConversationsPerUser: 50,

    // AI Settings
    defaultAIProvider: 'openai',
    maxTokensPerMessage: 4000,
    enableContentModeration: true,

    // Credits
    freeCreditsDaily: 50,
    welcomeCredits: 100,
    referralCredits: 50,

    // Notifications
    enableEmailNotifications: true,
    enablePushNotifications: true,
    adminEmailAlerts: true,
  });

  const handleSave = () => {
    // Save settings to database
    console.log('Saving settings:', settings);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button variant="glow" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              General Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Site Name</label>
              <input
                type="text"
                value={settings.siteName}
                onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Site URL</label>
              <input
                type="text"
                value={settings.siteUrl}
                onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Maintenance Mode</p>
                <p className="text-sm text-white/60">Disable access for non-admin users</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, maintenanceMode: !settings.maintenanceMode })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.maintenanceMode ? 'bg-violet-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.maintenanceMode ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              User Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Allow New Signups</p>
                <p className="text-sm text-white/60">Enable user registration</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, allowSignups: !settings.allowSignups })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.allowSignups ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.allowSignups ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Require Email Verification</p>
                <p className="text-sm text-white/60">Users must verify their email</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, requireEmailVerification: !settings.requireEmailVerification })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.requireEmailVerification ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.requireEmailVerification ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Max Personas Per User</label>
              <input
                type="number"
                value={settings.maxPersonasPerUser}
                onChange={(e) => setSettings({ ...settings, maxPersonasPerUser: parseInt(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              AI Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Default AI Provider</label>
              <select
                value={settings.defaultAIProvider}
                onChange={(e) => setSettings({ ...settings, defaultAIProvider: e.target.value })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              >
                <option value="openai">OpenAI (GPT-4)</option>
                <option value="anthropic">Anthropic (Claude)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Max Tokens Per Message</label>
              <input
                type="number"
                value={settings.maxTokensPerMessage}
                onChange={(e) => setSettings({ ...settings, maxTokensPerMessage: parseInt(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Content Moderation</p>
                <p className="text-sm text-white/60">Auto-filter inappropriate content</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableContentModeration: !settings.enableContentModeration })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.enableContentModeration ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.enableContentModeration ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Credit Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Credit Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Free Credits Daily</label>
              <input
                type="number"
                value={settings.freeCreditsDaily}
                onChange={(e) => setSettings({ ...settings, freeCreditsDaily: parseInt(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Welcome Credits (New Users)</label>
              <input
                type="number"
                value={settings.welcomeCredits}
                onChange={(e) => setSettings({ ...settings, welcomeCredits: parseInt(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Referral Credits</label>
              <input
                type="number"
                value={settings.referralCredits}
                onChange={(e) => setSettings({ ...settings, referralCredits: parseInt(e.target.value) })}
                className="w-full h-12 px-4 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
              />
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-white/60">Send email updates to users</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enableEmailNotifications: !settings.enableEmailNotifications })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.enableEmailNotifications ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.enableEmailNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-white/60">Send push notifications</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enablePushNotifications: !settings.enablePushNotifications })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.enablePushNotifications ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.enablePushNotifications ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
              <div>
                <p className="font-medium">Admin Email Alerts</p>
                <p className="text-sm text-white/60">Receive alerts for critical events</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, adminEmailAlerts: !settings.adminEmailAlerts })}
                className={`w-12 h-6 rounded-full transition ${
                  settings.adminEmailAlerts ? 'bg-green-500' : 'bg-white/20'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.adminEmailAlerts ? 'translate-x-6' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Database Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">Supabase Connection</span>
                <span className="flex items-center gap-2 text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-400" />
                  Connected
                </span>
              </div>
              <p className="text-sm text-white/40">Database is healthy and responsive</p>
            </div>
            <Button variant="outline" className="w-full">
              <RefreshCw className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
            <Button variant="outline" className="w-full">
              <Database className="w-4 h-4 mr-2" />
              Run Migrations
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
