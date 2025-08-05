import React, { useState } from 'react';
import { AppSidebar } from "@/components/homepage/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/@/ui/sidebar";
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
import { HomeLayout } from "@/components/layout/HomeLayout"; // Import HomeLayout

// Placeholder data for projects (similar to trendingProjects from homepage.tsx)
const soundPacksProjects = [
  {
    id: "sp-1",
    user_id: "user1",
    created_at: new Date("2025-06-15T10:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Cinematic Risers & Hits Vol. 1",
    artworkUrl: "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg",
    tracks: [{ id: "sp-1-1", title: "Riser 1", duration: "0:10" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "SoundFX Pro",
      avatar: "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg",
      tag: "Sound Designer"
    },
    price: 35,
    category: "SFX",
    format: "WAV"
  },
  {
    id: "sp-2",
    user_id: "user2",
    created_at: new Date("2025-06-10T14:30:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Vintage Drum Breaks",
    artworkUrl: "https://images.pexels.com/photos/1644616/pexels-photo-1644616.jpeg",
    tracks: [{ id: "sp-2-1", title: "Breakbeat 1", duration: "0:08" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "GrooveLabs",
      avatar: "https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg",
      tag: "Producer"
    },
    price: 25,
    category: "Drums",
    format: "AIFF"
  },
  {
    id: "sp-3",
    user_id: "user3",
    created_at: new Date("2025-06-18T09:15:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Ambient Textures & Drones",
    artworkUrl: "https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg",
    tracks: [{ id: "sp-3-1", title: "Ethereal Pad", duration: "1:30" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "Atmosphere Creator",
      avatar: "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg",
      tag: "Sound Designer"
    },
    price: 45,
    category: "Pads",
    format: "WAV"
  },
  {
    id: "sp-4",
    user_id: "user4",
    created_at: new Date("2025-06-05T11:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "80s Synthwave Loops",
    artworkUrl: "https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg",
    tracks: [{ id: "sp-4-1", title: "Synthwave Loop 1", duration: "0:15" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "RetroWave",
      avatar: "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg",
      tag: "Producer"
    },
    price: 30,
    category: "Synths",
    format: "MP3"
  },
  {
    id: "sp-5",
    user_id: "user5",
    created_at: new Date("2025-06-19T16:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Vocal Chops & Ad-libs",
    artworkUrl: "https://images.pexels.com/photos/1751731/pexels-photo-1751731.jpeg",
    tracks: [{ id: "sp-5-1", title: "Vocal Chop 1", duration: "0:05" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "VocalistX",
      avatar: "https://images.pexels.com/photos/1587009/pexels-photo-1587009.jpeg",
      tag: "Vocalist"
    },
    price: 20,
    category: "Vocals",
    format: "WAV"
  },
  {
    id: "sp-6",
    user_id: "user6",
    created_at: new Date("2025-06-12T08:45:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Hardstyle Kicks & Screeches",
    artworkUrl: "https://images.pexels.com/photos/1694900/pexels-photo-1694900.jpeg",
    tracks: [{ id: "sp-6-1", title: "Hard Kick 1", duration: "0:02" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "Hardcore Beats",
      avatar: "https://images.pexels.com/photos/1036623/pexels-photo-1036623.jpeg",
      tag: "Producer"
    },
    price: 40,
    category: "Drums",
    format: "WAV"
  },
  {
    id: "sp-7",
    user_id: "user7",
    created_at: new Date("2025-06-01T13:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Ethnic Percussion Loops",
    artworkUrl: "https://images.pexels.com/photos/1537638/pexels-photo-1537638.jpeg",
    tracks: [{ id: "sp-7-1", title: "African Drum Loop", duration: "0:12" }],
    totalTracks: 1,
    isPopular: false,
    creator: {
      name: "World Rhythms",
      avatar: "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg",
      tag: "Percussionist"
    },
    price: 28,
    category: "Percussion",
    format: "WAV"
  },
  {
    id: "sp-8",
    user_id: "user8",
    created_at: new Date("2025-06-17T20:00:00Z").toISOString(),
    updated_at: new Date().toISOString(),
    title: "Glitch & Stutter FX",
    artworkUrl: "https://images.pexels.com/photos/1649771/pexels-photo-1649771.jpeg",
    tracks: [{ id: "sp-8-1", title: "Glitch FX 1", duration: "0:07" }],
    totalTracks: 1,
    isPopular: true,
    creator: {
      name: "Digital Disruptor",
      avatar: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg",
      tag: "Sound Designer"
    },
    price: 32,
    category: "SFX",
    format: "WAV"
  }
];


export default function SoundPacksPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [formatFilter, setFormatFilter] = useState("all");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 50]);
  const [quickFilter, setQuickFilter] = useState("all"); // "all", "popular", "new"

  const filteredProjects = soundPacksProjects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          project.creator.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || project.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesFormat = formatFilter === "all" || project.format.toLowerCase() === formatFilter.toLowerCase();
    const matchesPrice = project.price >= priceRange[0] && project.price <= priceRange[1];

    let matchesQuickFilter = true;
    if (quickFilter === "popular") {
      matchesQuickFilter = project.isPopular;
    } else if (quickFilter === "new") {
      const projectDate = new Date(project.created_at);
      const now = new Date();
      const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
      matchesQuickFilter = projectDate > sevenDaysAgo;
    }

    return matchesSearch && matchesCategory && matchesFormat && matchesPrice && matchesQuickFilter;
  });

  const availableCategories = Array.from(new Set(soundPacksProjects.map(p => p.category))).sort();
  const availableFormats = Array.from(new Set(soundPacksProjects.map(p => p.format))).sort();

  return (
    <HomeLayout>
      <div className="flex-1 space-y-8 p-8 pt-14">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link to="/home/homepage" className="text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h2 className="text-2xl font-bold tracking-tight">Sound Packs</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Label htmlFor="price-range-input" className="text-sm text-muted-foreground">Price:</Label>
              <Input
                id="price-range-input"
                type="text"
                placeholder="0-50"
                value={priceRange[0] === 0 && priceRange[1] === 50 ? "" : `${priceRange[0]}-${priceRange[1]}`}
                onChange={(e) => {
                  const [min, max] = e.target.value.split('-').map(Number);
                  setPriceRange([isNaN(min) ? 0 : min, isNaN(max) ? 50 : max]);
                }}
                className="w-[120px] h-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filter by Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {availableCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Formats</SelectItem>
                {availableFormats.map(format => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
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
            placeholder="Search sound packs, designers..."
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
            <p className="col-span-full text-center text-muted-foreground">No sound packs found matching your criteria.</p>
          )}
        </div>
      </div>
    </HomeLayout>
  );
}
