import React, { useEffect } from "react";
import { BetanIASidebar } from "./BetanIASidebar";
import { BetanIAChat } from "./BetanIAChat";
import { BetanIAWidgetsEnhanced } from "./BetanIAWidgetsEnhanced";
import { BetanIAHeader } from "./BetanIAHeader";
import { useFilterStore } from "@/stores/filterStore";
import { useSportsDataV2 } from "@/hooks/useSportsDataV2";
import { ErrorBoundary } from "./ErrorBoundary";

export const BetanIALayout = () => {
  const { updateData } = useFilterStore();
  const sportsData = useSportsDataV2();

  // Update filter store when sports data changes
  useEffect(() => {
    if (sportsData.fixtures.length > 0) {
      updateData(sportsData.fixtures, sportsData.leagues, sportsData.teams);
    }
  }, [sportsData.fixtures, sportsData.leagues, sportsData.teams, updateData]);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {/* Apple-like Header */}
      <BetanIAHeader />
      
      {/* Main Layout Grid */}
      <div className="flex h-[calc(100vh-4rem)] w-full">
        {/* Left Sidebar - Navigation & Filters */}
        <aside className="w-80 flex-shrink-0 border-r border-border/50 bg-card/50">
          <BetanIASidebar />
        </aside>
        
        {/* Center Chat Area */}
        <main className="flex-1 min-w-0 relative">
          <BetanIAChat />
        </main>
        
        {/* Right Widgets Panel */}
        <aside className="w-96 flex-shrink-0 border-l border-border/50 bg-card/50">
          <ErrorBoundary>
            <BetanIAWidgetsEnhanced />
          </ErrorBoundary>
        </aside>
      </div>
    </div>
  );
};