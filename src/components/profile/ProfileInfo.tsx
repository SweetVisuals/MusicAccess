import useProfile from '@/hooks/useProfile';

const ProfileInfo = () => {
  const { profile } = useProfile();

  return (
    <div className="px-6 py-6 max-w-7xl mx-auto">
      {/* Empty container - tags moved to ProfileHeader */}
    </div>
  );
};

export default ProfileInfo;
