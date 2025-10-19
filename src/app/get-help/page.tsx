import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/@/ui/card";
import { Button } from "@/components/@/ui/button";
import { Separator } from "@/components/@/ui/separator";
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import {
  HelpCircle,
  MessageCircle,
  FileText,
  Video,
  Mail,
  ExternalLink,
  BookOpen,
  Users,
  Settings,
  Upload
} from "lucide-react";

export default function GetHelpPage() {
  const helpCategories = [
    {
      title: "Getting Started",
      description: "New to TuneFlow? Start here to learn the basics.",
      icon: BookOpen,
      items: [
        { title: "Creating Your Profile", description: "Set up your professional profile and showcase your work" },
        { title: "Uploading Your First Project", description: "Learn how to upload and organize your music projects" },
        { title: "Navigating the Dashboard", description: "Understand the main areas of your workspace" },
      ]
    },
    {
      title: "Managing Projects",
      description: "Learn how to organize and collaborate on your music projects.",
      icon: Upload,
      items: [
        { title: "Project Organization", description: "Best practices for structuring your projects" },
        { title: "File Management", description: "How to upload, organize, and share audio files" },
        { title: "Version Control", description: "Track changes and manage project versions" },
      ]
    },
    {
      title: "Collaboration",
      description: "Work effectively with other music professionals.",
      icon: Users,
      items: [
        { title: "Finding Collaborators", description: "Discover and connect with other musicians" },
        { title: "Sharing Projects", description: "Grant access and manage permissions" },
        { title: "Communication Tools", description: "Use messages and comments effectively" },
      ]
    },
    {
      title: "Account & Settings",
      description: "Manage your account and customize your experience.",
      icon: Settings,
      items: [
        { title: "Account Settings", description: "Update your profile and preferences" },
        { title: "Privacy & Security", description: "Control your privacy and security settings" },
        { title: "Billing & Payments", description: "Manage your wallet and transactions" },
      ]
    },
  ];

  const contactOptions = [
    {
      title: "Contact Support",
      description: "Get help from our support team",
      icon: MessageCircle,
      action: "Send Message",
      href: "/messages"
    },
    {
      title: "Documentation",
      description: "Browse our comprehensive guides",
      icon: FileText,
      action: "View Docs",
      href: "#"
    },
    {
      title: "Video Tutorials",
      description: "Watch step-by-step video guides",
      icon: Video,
      action: "Watch Videos",
      href: "#"
    },
    {
      title: "Email Support",
      description: "Send us an email for detailed help",
      icon: Mail,
      action: "Send Email",
      href: "mailto:support@tuneflow.com"
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-y-auto p-8">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Help Center</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Find answers to your questions and get the help you need to make the most of TuneFlow.
            </p>
          </div>

          {/* Help Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <category.icon className="h-6 w-6 text-primary" />
                    <CardTitle className="text-xl">{category.title}</CardTitle>
                  </div>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="border-l-2 border-muted pl-4 py-2">
                        <h4 className="font-medium text-sm">{item.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator className="my-8" />

          {/* Contact Options */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6">Need More Help?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {contactOptions.map((option, index) => (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="text-center">
                    <option.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <CardDescription className="text-sm">{option.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="text-center">
                    <Button
                      variant={option.href.startsWith('mailto:') ? "outline" : "default"}
                      size="sm"
                      className="w-full"
                      asChild={option.href !== "#"}
                    >
                      {option.href === "#" ? (
                        <span className="cursor-not-allowed opacity-50">
                          {option.action}
                        </span>
                      ) : option.href.startsWith('mailto:') ? (
                        <a href={option.href} className="flex items-center justify-center gap-2">
                          <Mail className="h-4 w-4" />
                          {option.action}
                        </a>
                      ) : (
                        <a href={option.href} className="flex items-center justify-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          {option.action}
                        </a>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* FAQ Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
              <CardDescription>
                Quick answers to common questions about TuneFlow
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-b border-muted pb-4">
                  <h4 className="font-medium mb-2">How do I upload my music files?</h4>
                  <p className="text-sm text-muted-foreground">
                    Go to your Studio dashboard and click "Upload Track" to add your audio files.
                    We support WAV, MP3, and other common audio formats.
                  </p>
                </div>
                <div className="border-b border-muted pb-4">
                  <h4 className="font-medium mb-2">How do I collaborate with other musicians?</h4>
                  <p className="text-sm text-muted-foreground">
                    Share your project links with collaborators or use our messaging system to connect
                    with other professionals in our community.
                  </p>
                </div>
                <div className="border-b border-muted pb-4">
                  <h4 className="font-medium mb-2">What are the file size limits?</h4>
                  <p className="text-sm text-muted-foreground">
                    Individual files can be up to 500MB, and projects can contain unlimited files
                    with our premium plans.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">How do I monetize my music?</h4>
                  <p className="text-sm text-muted-foreground">
                    Set prices for your projects in your Studio settings. Earn when other users
                    purchase or license your work.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
