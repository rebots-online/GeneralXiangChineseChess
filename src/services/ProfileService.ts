export interface UserProfile {
  userId: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
}

class ProfileService {
  private static instance: ProfileService;

  static getInstance(): ProfileService {
    if (!ProfileService.instance) {
      ProfileService.instance = new ProfileService();
    }
    return ProfileService.instance;
  }

  getProfile(userId: string): UserProfile | null {
    if (typeof localStorage === 'undefined') return null;
    const data = localStorage.getItem(`profile_${userId}`);
    return data ? (JSON.parse(data) as UserProfile) : null;
  }

  saveProfile(profile: UserProfile): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(`profile_${profile.userId}` , JSON.stringify(profile));
  }
}

export default ProfileService.getInstance();
