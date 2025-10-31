import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";

interface AudioPlayerProps {
  title: string;
  language: "English" | "Japanese";
  audioFile: string; // Pass the actual audio URL
}

const AudioPlayer = ({ title, language, audioFile }: AudioPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [canPlay, setCanPlay] = useState(false);
  const [volume, setVolume] = useState(70);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onCanPlay = () => setCanPlay(true);
    const onEnded = () => setIsPlaying(false);
    const onError = () => {
      console.warn("Audio error", audio.error);
      setCanPlay(false);
      setIsPlaying(false);
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  // Reset when audioFile changes
  useEffect(() => {
    setCanPlay(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  }, [audioFile]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!canPlay) return console.warn("Audio not ready to play");

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.then === "function") {
      playPromise
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Play failed:", err);
          setIsPlaying(false);
        });
    } else {
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="p-6 shadow-card animate-scale-in">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{language} Audio</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${
          language === "English" 
            ? "bg-primary/10 text-primary" 
            : "bg-accent/10 text-accent"
        }`}>
          {language}
        </div>
      </div>

      <audio ref={audioRef} src={audioFile} preload="metadata" />

      <div className="space-y-4">
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            max={duration || 100}
            step={0.1}
            onValueChange={handleSeek}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            size="lg"
            onClick={togglePlay}
            className="rounded-full w-12 h-12 p-0 shadow-elevated hover:scale-110 transition-transform"
          >
            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </Button>

          <div className="flex items-center gap-2 flex-1">
            <Button variant="ghost" size="sm" onClick={toggleMute} className="rounded-full p-2">
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0])}
              className="w-24 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AudioPlayer;
