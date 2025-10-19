import { useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/@/ui/avatar"
import { Badge } from "@/components/@/ui/badge"
import { Button } from "@/components/@/ui/button"
import { Card, CardContent, CardFooter } from "@/components/@/ui/card"
import { Star, Users, Music, TrendingUp, CheckCircle, Gem } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface ProducerCardProps {
  producer: {
    name: string
    avatar: string
    genre: string
    rating: number
    gems: number
    followers: string
    title: string
    projects?: number
    verified?: boolean
    username?: string
  }
}

const genreColors: Record<string, string> = {
  "House": "bg-blue-500/10 text-blue-500 border-blue-500/20",
  "Hip Hop": "bg-purple-500/10 text-purple-500 border-purple-500/20",
  "R&B": "bg-pink-500/10 text-pink-500 border-pink-500/20",
  "Electronic": "bg-green-500/10 text-green-500 border-green-500/20",
  "Urban": "bg-orange-500/10 text-orange-500 border-orange-500/20",
  "Acoustic": "bg-amber-500/10 text-amber-500 border-amber-500/20",
  "default": "bg-gray-500/10 text-gray-500 border-gray-500/20"
}

export default function ProducerCard({ producer }: ProducerCardProps) {
  const navigate = useNavigate()
  const genreColor = genreColors[producer.genre] || genreColors.default
  const isVerified = producer.verified !== undefined ? producer.verified : Math.random() > 0.3

  const handleViewProfile = () => {
    const username = producer.username || producer.name.toLowerCase().replace(/\s+/g, '-')
    navigate(`/user/${username}`)
  }

  return (
    <Card className="hover-card group border border-border/50 hover:border-primary/30 transition-all duration-300">
      <CardContent className="p-4">
        {/* Header Section - Compact */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                <AvatarImage src={producer.avatar} className="object-cover" />
                <AvatarFallback className="bg-primary text-primary-foreground font-medium text-sm">
                  {producer.name[0]}
                </AvatarFallback>
              </Avatar>
              
              {/* Verified badge */}
              {isVerified && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border border-background flex items-center justify-center">
                  <CheckCircle className="h-2 w-2 text-white fill-white" />
                </div>
              )}
            </div>
            
            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <h3 className="font-semibold text-sm text-foreground truncate">
                  {producer.name}
                </h3>
              </div>
              <p className="text-xs text-muted-foreground leading-tight truncate">{producer.title}</p>
            </div>
          </div>
          
          {/* Rating - Compact */}
          <div className="flex items-center gap-0.5 bg-muted rounded-full px-1.5 py-0.5">
            <Star className="h-2.5 w-2.5 text-yellow-500 fill-yellow-500" />
            <span className="text-xs font-semibold text-foreground">{producer.rating.toFixed(2)}</span>
          </div>
        </div>
        
        {/* Genre Badge - Compact */}
        <Badge 
          variant="outline" 
          className={`${genreColor} font-medium text-xs px-1.5 py-0.5 mb-3`}
        >
          <Music className="h-2.5 w-2.5 mr-1" />
          {producer.genre}
        </Badge>
        
        {/* Stats Grid - More Compact */}
        <div className="grid grid-cols-2 gap-1.5 mb-3">
          <div className="text-center p-1.5 bg-muted/50 rounded-md">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Gem className="h-2.5 w-2.5 text-amber-500" />
              <span className="text-xs font-semibold text-foreground">{producer.gems.toLocaleString()}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Gems</p>
          </div>
          
          <div className="text-center p-1.5 bg-muted/50 rounded-md">
            <div className="flex items-center justify-center gap-0.5 mb-0.5">
              <Users className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-xs font-semibold text-foreground">{producer.followers}</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Followers</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0">
        {/* Action Button - Compact */}
        <Button 
          onClick={handleViewProfile}
          className="w-full text-xs h-7"
          variant="ghost"
          size="sm"
        >
          <TrendingUp className="h-3 w-3 mr-1" />
          View Profile
        </Button>
      </CardFooter>
    </Card>
  )
}
