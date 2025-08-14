"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

type Tab = {
  id: string;
  content: React.ReactNode;
};

interface CustomTabsProps {
  tabTitles: string[];
  tabs: Tab[];
  defaultActive?: string;
}

export function CustomTabs({ tabTitles, tabs, defaultActive }: CustomTabsProps) {
  const [activeTab, setActiveTab] = React.useState<string>(
    defaultActive || tabs[0]?.id
  );

  const [indicatorStyle, setIndicatorStyle] = React.useState<{
    left: number;
    width: number;
  }>({ left: 0, width: 0 });

  const tabsRef = React.useRef<(HTMLDivElement | null)[]>([]);

  React.useEffect(() => {
    const index = tabs.findIndex((t) => t.id === activeTab);
    const currentTab = tabsRef.current[index];
    if (currentTab) {
      setIndicatorStyle({
        left: currentTab.offsetLeft,
        width: currentTab.offsetWidth,
      });
    }
  }, [activeTab, tabs]);

  return (
    <div className="w-full">
      <div className="relative flex space-x-10 border-b border-gray-200 pb-2">
        {tabTitles.map((title, index) => {
          const tabId = tabs[index]?.id;
          const isActive = activeTab === tabId;

          return (
            <div
              key={tabId}
              ref={(el) => { tabsRef.current[index] = el; }}
              onClick={() => setActiveTab(tabId!)}
              className={cn(
                "cursor-pointer text-sm font-medium pb-2 transition-colors",
                isActive ? "text-blue-500" : "text-gray-500 hover:text-blue-500"
              )}
            >
              {title}
            </div>
          );
        })}

        <span
          className="absolute bottom-0 h-[2px] bg-blue-500 transition-all duration-300"
          style={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
        />
      </div>

      <div className="mt-8">
        {tabs.map(
          (tab) =>
            tab.id === activeTab && (
              <div key={tab.id} className="animate-fadeIn">
                {tab.content}
              </div>
            )
        )}
      </div>
    </div>
  );
}
