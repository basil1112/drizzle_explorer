import React, { useState, useEffect } from 'react';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Message } from 'primereact/message';
import { InputSwitch } from 'primereact/inputswitch';
import { Profile } from '../../types';

interface SettingsViewProps {
    darkMode: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ darkMode }) => {
    const [profile, setProfile] = useState<Profile | null>(null);
    const [profileName, setProfileName] = useState('');
    const [showThumbnails, setShowThumbnails] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadProfile();
        loadSettings();
    }, []);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const profileData = await window.electronAPI.getProfile();
            setProfile(profileData);
            setProfileName(profileData.name);
        } catch (error) {
            console.error('Error loading profile:', error);
            showMessage('error', 'Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const loadSettings = async () => {
        try {
            const thumbnailsSetting = await window.electronAPI.getSetting('showThumbnails');
            setShowThumbnails(thumbnailsSetting === 'true');
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const handleSaveProfile = async () => {
        if (!profileName.trim()) {
            showMessage('error', 'Profile name cannot be empty');
            return;
        }

        try {
            setSaving(true);
            const updatedProfile = await window.electronAPI.updateProfile(profileName);
            setProfile(updatedProfile);
            showMessage('success', 'Profile updated successfully');
        } catch (error) {
            console.error('Error saving profile:', error);
            showMessage('error', 'Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateUUID = async () => {
        if (!confirm('Are you sure you want to regenerate your UUID? This action cannot be undone.')) {
            return;
        }

        try {
            setSaving(true);
            const updatedProfile = await window.electronAPI.regenerateUUID();
            setProfile(updatedProfile);
            showMessage('success', 'UUID regenerated successfully');
        } catch (error) {
            console.error('Error regenerating UUID:', error);
            showMessage('error', 'Failed to regenerate UUID');
        } finally {
            setSaving(false);
        }
    };

    const handleCopyUUID = () => {
        if (profile?.uuid) {
            navigator.clipboard.writeText(profile.uuid);
            showMessage('success', 'UUID copied to clipboard');
        }
    };

    const handleThumbnailsToggle = async (value: boolean) => {
        try {
            setShowThumbnails(value);
            await window.electronAPI.setSetting('showThumbnails', value.toString());
            showMessage('success', `Thumbnails ${value ? 'enabled' : 'disabled'}`);
        } catch (error) {
            console.error('Error saving thumbnails setting:', error);
            showMessage('error', 'Failed to save setting');
            // Revert the toggle on error
            setShowThumbnails(!value);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className={`h-full flex items-center justify-center ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
                <i className="pi pi-spin pi-spinner text-4xl" />
            </div>
        );
    }

    return (
        <div className={`h-full overflow-auto p-6 ${darkMode ? 'bg-[#252525]' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto">
                <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    Settings
                </h2>

                {message && (
                    <Message 
                        severity={message.type === 'success' ? 'success' : 'error'} 
                        text={message.text}
                        className="mb-4 w-full"
                    />
                )}

                <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                    <div className="space-y-6">
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                Profile Information
                            </h3>

                            <div className="space-y-4">
                                {/* Profile Name */}
                                <div>
                                    <label 
                                        htmlFor="profileName" 
                                        className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        Profile Name
                                    </label>
                                    <div className="flex gap-2">
                                        <InputText
                                            id="profileName"
                                            value={profileName}
                                            onChange={(e) => setProfileName(e.target.value)}
                                            className="flex-1"
                                            placeholder="Enter profile name"
                                            disabled={saving}
                                        />
                                        <Button
                                            label="Save"
                                            icon="pi pi-save"
                                            onClick={handleSaveProfile}
                                            disabled={saving || !profileName.trim() || profileName === profile?.name}
                                            loading={saving}
                                        />
                                    </div>
                                </div>

                                {/* UUID */}
                                <div>
                                    <label 
                                        className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                    >
                                        Unique ID (UUID)
                                    </label>
                                    <div className="flex gap-2">
                                        <InputText
                                            value={profile?.uuid || ''}
                                            readOnly
                                            className="flex-1 font-mono text-sm"
                                        />
                                        <Button
                                            icon="pi pi-copy"
                                            tooltip="Copy to clipboard"
                                            onClick={handleCopyUUID}
                                            disabled={!profile?.uuid}
                                        />
                                        <Button
                                            icon="pi pi-refresh"
                                            tooltip="Regenerate UUID"
                                            onClick={handleRegenerateUUID}
                                            disabled={saving}
                                            severity="warning"
                                        />
                                    </div>
                                    <small className={`block mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        This is your unique identifier. Use it for synchronization or identification purposes.
                                    </small>
                                </div>

                                {/* Metadata */}
                                {profile && (
                                    <div className={`pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                            <div>
                                                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Created:
                                                </span>
                                                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {new Date(profile.createdAt).toLocaleString()}
                                                </span>
                                            </div>
                                            <div>
                                                <span className={`font-medium ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                    Last Updated:
                                                </span>
                                                <span className={`ml-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    {new Date(profile.updatedAt).toLocaleString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className={`mb-4 ${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                    <div className="space-y-6">
                        <div>
                            <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                                Display Settings
                            </h3>

                            <div className="space-y-4">
                                {/* Show Thumbnails Toggle */}
                                <div className={`p-4 rounded-lg border ${darkMode ? 'border-gray-700 bg-[#323232]' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <label 
                                                htmlFor="showThumbnails" 
                                                className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
                                            >
                                                Show Thumbnails
                                            </label>
                                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Display image and video thumbnails in file browser
                                            </p>
                                        </div>
                                        <InputSwitch
                                            id="showThumbnails"
                                            checked={showThumbnails}
                                            onChange={(e) => handleThumbnailsToggle(e.value)}
                                            className="ml-4"
                                        />
                                    </div>
                                    <Message 
                                        severity="warn" 
                                        text="Note: Displaying thumbnails will use more memory when browsing files with many images or videos."
                                        className="text-xs p-2"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className={`${darkMode ? 'bg-[#2a2a2a]' : 'bg-white'}`}>
                    <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                        About
                    </h3>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        <p>Drizzle Explorer - A modern file explorer built with Electron and React</p>
                        <p className="mt-2">Version 1.0.0</p>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default SettingsView;
