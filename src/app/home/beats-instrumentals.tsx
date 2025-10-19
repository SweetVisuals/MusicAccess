import React, { useState } from 'react';
import { PageLayout } from "@/components/layout/PageLayout";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import ProjectCard from "@/components/profile/music/ProjectCard";
import { Search, SlidersHorizontal, DollarSign, Music, Clock, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/@/ui/badge";

// Placeholder data for projects (similar to trendingProjects from homepage.tsx)
const beatsInstrumentalsProjects = [
  {
    id: "bi-1",
    user_id: "user1",
    created_at: new Date("2025-06-15T10:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Chill Lo-Fi Beat",
    artworkUrl: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg",
    tracks: [{ id: "bi-1-1", title: "Chill Vibes", duration: "2:50" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "BeatMaster",
      avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
      tag: "Producer"
    },
    price: 25,
    bpm: 80,
    key: "C Major"
  },
  {
    id: "bi-2",
    user_id: "user2",
    created_at: new Date("2025-06-10T14:30:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Epic Orchestral Instrumental",
    artworkUrl: "https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg",
    tracks: [{ id: "bi-2-1", title: "Grandeur", duration: "4:30" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "SymphonySounds",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
      tag: "Composer"
    },
    price: 150,
    bpm: 120,
    key: "D Minor"
  },
  {
    id: "bi-3",
    user_id: "user3",
    created_at: new Date("2025-06-18T09:15:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Trap Banger",
    artworkUrl: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    tracks: [{ id: "bi-3-1", title: "Trap Anthem", duration: "3:10" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "TrapKing",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
      tag: "Beat Maker"
    },
    price: 40,
    bpm: 140,
    key: "G Minor"
  },
  {
    id: "bi-4",
    user_id: "user4",
    created_at: new Date("2025-06-05T11:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Smooth Jazz Instrumental",
    artworkUrl: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
    tracks: [{ id: "bi-4-1", title: "Evening Breeze", duration: "3:55" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "JazzFlow",
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
      tag: "Musician"
    },
    price: 75,
    bpm: 95,
    key: "Bb Major"
  },
  {
    id: "bi-5",
    user_id: "user5",
    created_at: new Date("2025-06-19T16:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Acoustic Folk Melody",
    artworkUrl: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg",
    tracks: [{ id: "bi-5-1", title: "Forest Song", duration: "3:20" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "NatureTunes",
      avatar: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg",
      tag: "Acoustic Artist"
    },
    price: 30,
    bpm: 110,
    key: "E Major"
  },
  {
    id: "bi-6",
    user_id: "user6",
    created_at: new Date("2025-06-12T08:45:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Cinematic Score",
    artworkUrl: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
    tracks: [{ id: "bi-6-1", title: "Hero's Journey", duration: "5:10" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "FilmScorer",
      avatar: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg",
      tag: "Composer"
    },
    price: 200,
    bpm: 70,
    key: "A Minor"
  },
  {
    id: "bi-7",
    user_id: "user7",
    created_at: new Date("2025-06-01T13:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Upbeat Pop Instrumental",
    artworkUrl: "https://images.pexels.com/photos/1537638/pexels-photo-1537638.jpeg",
    tracks: [{ id: "bi-7-1", title: "Sunny Day", duration: "2:40" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "PopVibes",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
      tag: "Producer"
    },
    price: 35,
    bpm: 128,
    key: "F Major"
  },
  {
    id: "bi-8",
    user_id: "user8",
    created_at: new Date("2025-06-17T20:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Dark Trap Beat",
    artworkUrl: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
    tracks: [{ id: "bi-8-1", title: "Shadow Play", duration: "3:00" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "NightBeats",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
      tag: "Beat Maker"
    },
    price: 50,
    bpm: 130,
    key: "C# Minor"
  }
];


export default function BeatsInstrumentalsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [bpmRange, setBpmRange] = useState<[number, number]>([60, 180]);
  const [keyFilter, setKeyFilter] = useState("all");
  const [quickFilter, setQuickFilter] = useState("all"); // "all", "popular", "new"

  const filteredProjects = beatsInstrumentalsProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = genreFilter === "all" || project.creator.tag.toLowerCase().includes(genreFilter.toLowerCase());
    const matchesType = typeFilter === "all" || project.totalTracks === (typeFilter === "single" ? 1 : 3);
    const matchesPrice = project.price >= priceRange[0] && project.price <= priceRange[1];
    const matchesBpm = project.bpm >= bpmRange[0] && project.bpm <= bpmRange[1];
    const matchesKey = keyFilter === "all" || project.key === keyFilter;

    let matchesQuickFilter = true;
    if (quickFilter === "popular") {
      matchesQuickFilter = project.isPopular;
    } else if (quickFilter === "new") {
      const projectDate = new Date(project.created_at);
      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      matchesQuickFilter = projectDate > sevenDaysAgo;
    }

    return matchesSearch && matchesGenre && matchesType && matchesPrice && matchesBpm && matchesKey && matchesQuickFilter;
  });

  const availableKeys = Array.from(new Set(beatsInstrumentalsProjects.map(p => p.key))).sort();

  return (
    <PageLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/home/homepage" className="text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">Beats & Instrumentals</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="price-range-input" className="text-sm text-muted-foreground">Price:</Label>
              <Input
                id="price-range-input"
                type="text"
                placeholder="50-150"
                value={priceRange[0] === 0 && priceRange[1] === 200 ? "" : `${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange([isNaN(min) ? 0 : min, isNaN(max) ? 200 : max]);
                }}
                className="w-[120px] h-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="bpm-range-input" className="text-sm text-muted-foreground">BPM:</Label>
              <Input
                id="bpm-range-input"
                type="text"
                placeholder="80-120"
                value={bpmRange[0] === 60 && bpmRange[1] === 180 ? "" : `${bpmRange[0]}-${bpmRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setBpmRange([isNaN(min) ? 60 : min, isNaN(max) ? 180 : max]);
                }}
                className="w-[120px] h-9"
              />
            </div>
            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Genre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genres</SelectItem>
                <SelectItem value="lo-fi">Lo-Fi</SelectItem>
                <SelectItem value="orchestral">Orchestral</SelectItem>
                <SelectItem value="trap">Trap</SelectItem>
                <SelectItem value="jazz">Jazz</SelectItem>
                <SelectItem value="folk">Folk</SelectItem>
                <SelectItem value="cinematic">Cinematic</SelectItem>
                <SelectItem value="pop">Pop</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="single">Single Track</SelectItem>
                <SelectItem value="ep">EP (Multiple Tracks)</SelectItem>
              </SelectContent>
            </Select>
            <Select value={keyFilter} onValueChange={setKeyFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Keys</SelectItem>
                {availableKeys.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={quickFilter} onValueChange={setQuickFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Quick Filters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="popular">Popular</SelectItem>
                <SelectItem value="new">New Arrivals</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative w-full mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search beats, instrumentals, producers..."
            className="pl-9 pr-4 py-2 w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Projects Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                variant="grid"
                id={project.id}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-muted-foreground">No beats or instrumentals found matching your criteria.</p>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
