import ProfileService, { UserProfile } from '../ProfileService';

describe('ProfileService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('saves and retrieves profile', () => {
    const profile: UserProfile = { userId: 'u1', displayName: 'Tester' };
    ProfileService.saveProfile(profile);
    const loaded = ProfileService.getProfile('u1');
    expect(loaded).toEqual(profile);
  });
});
