import ProfileHeader from './ProfileHeader';
import ProfileInfo from './ProfileInfo';
import ProfileContent from './ProfileContent';

const ProfilePage = () => {
  return (
    <div className="min-h-screen bg-background">
        <div className="flex flex-col">
          <ProfileHeader />
          <div className="container max-w-6xl mx-auto px-4 md:px-6 -mt-6">
            <ProfileContent />
          </div>
        </div>
    </div>
  );
};

export default ProfilePage;