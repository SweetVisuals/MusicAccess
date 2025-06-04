import { Trophy, Music, Headphones, Mail, Link, Calendar } from 'lucide-react';
import { Card } from '@/components/@/ui/card';
import useProfile from '@/hooks/useProfile';

const AboutTab = () => {
  const { profile } = useProfile();

  // Sample data - would normally come from API
  const achievements = [
    { year: 2023, description: 'Reached 10,000 streams' },
    { year: 2022, description: 'Featured on Spotify playlist' },
    { year: 2021, description: 'First album release' },
  ];

  const equipment = [
    'Ableton Live 11',
    'Focusrite Scarlett 2i2',
    'Shure SM7B',
    'MIDI Keyboard',
  ];

  const influences = [
    'Daft Punk',
    'The Weeknd',
    'Tame Impala',
    'Flume',
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Achievements</h3>
        </div>
        <div className="space-y-3">
          {achievements.map((item, index) => (
            <div key={index} className="flex gap-4">
              <span className="text-muted-foreground">{item.year}</span>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Music className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Equipment</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {equipment.map((item, index) => (
            <span key={index} className="px-3 py-1 bg-muted rounded-full text-sm">
              {item}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Headphones className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Influences</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {influences.map((item, index) => (
            <span key={index} className="px-3 py-1 bg-muted rounded-full text-sm">
              {item}
            </span>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Mail className="h-5 w-5 text-primary" />
          <h3 className="font-medium">Connect</h3>
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{profile.email || 'No email provided'}</span>
          </div>
          {profile.website && (
            <div className="flex items-center gap-3">
              <Link className="h-4 w-4 text-muted-foreground" />
              <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {profile.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AboutTab;
