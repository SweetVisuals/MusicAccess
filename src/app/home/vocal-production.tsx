import React from 'react';
import { PageLayout } from "@/components/layout/PageLayout";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function VocalProductionPage() {
  return (
    <PageLayout>
      <div className="flex-1 space-y-8 p-8 pt-6">
        <div className="flex items-center gap-4 mb-4">
          <Link to="/home/homepage" className="text-muted-foreground hover:text-primary transition-colors duration-300 ease-in-out">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h2 className="text-2xl font-bold tracking-tight">Vocal Production</h2>
        </div>
        <p>Content for Vocal Production page.</p>
      </div>
    </PageLayout>
  );
}
