'use client';
import { useEffect, useState } from 'react';
import AuthService from '@/services/AuthService';
import ProfileService, { UserProfile } from '@/services/ProfileService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const auth = AuthService.getInstance();
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const user = auth.getCurrentUser();
    if (user) {
      const existing = ProfileService.getProfile(user.id) || {
        userId: user.id,
        displayName: user.displayName || '',
        email: user.email,
        avatarUrl: '',
        bio: ''
      };
      setProfile(existing);
    }
  }, []);

  if (!auth.isAuthenticated()) {
    useEffect(() => {
      const id = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(id);
    }, []);
    return <p className="p-4">Please sign in first. Returning you to game...</p>;
  }

  const save = () => {
    if (profile) {
      ProfileService.saveProfile(profile);
      alert('Profile saved');
    }
  };

  return (
    <div className="max-w-md mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Your Profile</h1>
      <Input
        placeholder="Display Name"
        value={profile?.displayName ?? ''}
        onChange={e => setProfile(p => p ? { ...p, displayName: e.target.value } : p)}
      />
      <Input
        placeholder="Avatar URL"
        value={profile?.avatarUrl ?? ''}
        onChange={e => setProfile(p => p ? { ...p, avatarUrl: e.target.value } : p)}
      />
      <Input
        placeholder="Bio"
        value={profile?.bio ?? ''}
        onChange={e => setProfile(p => p ? { ...p, bio: e.target.value } : p)}
      />
      <Button onClick={save}>Save</Button>
    </div>
  );
}
