import { useState } from "react";
import { FileItem } from "@/lib/types";
import { File } from "lucide-react";

export const AudioFileManager = () => {
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [audioInstance, setAudioInstance] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const files: FileItem[] = [
    {
      id: "audio1",
      name: "Track 1.mp3",
      type: "audio",
      size: "3.2 MB",
      modified: "2025-03-05"
    },
    {
      id: "audio2",
      name: "Vocal Take.wav",
      type: "audio",
      size: "45.7 MB",
      modified: "2025-03-04"
    }
  ];

  const handleFileClick = (file: FileItem) => {
    if (audioInstance) {
      audioInstance.pause();
      setIsPlaying(false);
    }
    setSelectedFile(file);
  };

  const handlePlayPause = () => {
    if (!selectedFile) return;

    if (!audioInstance) {
      const audio = new Audio(`/audio/${selectedFile.name}`);
      setAudioInstance(audio);
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error('Audio playback failed:', e));
    } else if (audioInstance.paused) {
      audioInstance.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error('Audio playback failed:', e));
    } else {
      audioInstance.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex-1 min-w-0 overflow-y-auto p-2">
        <div className="space-y-2">
          {files.map((file) => (
            <div 
              key={file.id}
              className="p-2 rounded hover:bg-gray-100 cursor-pointer transition-colors flex items-center justify-between"
              onClick={() => handleFileClick(file)}
            >
              <div className="flex items-center gap-2">
                <File className="h-4 w-4 text-blue-500" />
                <span>{file.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">{file.size}</span>
                <span className="text-sm text-gray-500">{file.modified}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {selectedFile && (
        <div className="w-72 flex-shrink-0 border-l border-gray-200 p-4 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="font-medium text-lg">File Info</h3>
            
            <div className="space-y-4">
              <div className="relative w-32 h-32 mx-auto">
                <div className="absolute inset-0 rounded-full bg-gray-100 flex items-center justify-center">
                  <svg
                    className="absolute w-full h-full text-gray-200"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="4"
                      strokeDasharray="283"
                      strokeDashoffset="70"
                    />
                  </svg>
                  <button 
                    className="relative z-10 w-12 h-12 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors flex items-center justify-center"
                    onClick={handlePlayPause}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {!isPlaying ? (
                        <polygon points="5 3 19 12 5 21 5 3"></polygon>
                      ) : (
                        <>
                          <rect x="6" y="4" width="4" height="16"></rect>
                          <rect x="14" y="4" width="4" height="16"></rect>
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>
              <div className="text-center">
                <h4 className="font-medium">{selectedFile.name}</h4>
                <p className="text-sm text-gray-500">
                  {selectedFile.size} • {selectedFile.modified}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Name</span>
                <span className="text-sm font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Type</span>
                <span className="text-sm font-medium">{selectedFile.type}</span>
              </div>
              {selectedFile.size && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Size</span>
                  <span className="text-sm font-medium">{selectedFile.size}</span>
                </div>
              )}
              {selectedFile.modified && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Modified</span>
                  <span className="text-sm font-medium">{selectedFile.modified}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
