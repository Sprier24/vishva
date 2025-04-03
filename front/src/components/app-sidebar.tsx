"use client"

import * as React from "react"
import {
  BellMinus,
  BookCheck,
  CalendarCog,
  HandCoins,
  Handshake,
  LayoutDashboard,
  ReceiptText,
  ScrollText,
  SquareUser,
  Target,
  UserX,
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

import { Progress } from "@/components/ui/progress"; 
import { Cloud } from "lucide-react"; 

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
      items: [{ title: "Dashboard", url: "/dashboard" }],
    },

    {
      title: "Lead",
      url: "/lead",
      icon: Target,
      items: [
        { title: "Record", url: "/lead/table" },
        { title: "Graph", url: "/Lead-chart" },
        { title: "Drag & Drop", url: "/lead/leadDrop" }
      ],
    },

    {
      title: "Deal",
      url: "/deal",
      icon: Handshake,

      items: [
        { title: "Record", url: "/deal/table" },
        { title: "Graph", url: "/Deal-chart" },
        { title: "Drag & Drop", url: "/deal/dealDrop" }
      ],
    },

    {
      title: "Invoice",
      url: "/invoice",
      icon: ReceiptText,
      items: [
        { title: "Record", url: "/invoice/table" },
      ],
    },

    {
      title: "Reminder",
      url: "/reminder",
      icon: BellMinus,

      items: [
        { title: "Record", url: "/reminder/table" },
      ],
    },

    {
      title: "Task",
      url: "/task",
      icon: BookCheck,

      items: [
        { title: "Record", url: "/task/table" },
        { title: "Drag & Drop", url: "/task/taskDrop" }
      ],
    },

    {
      title: "Complaint",
      url: "/complaint",
      icon: UserX,

      items: [
        { title: "Record", url: "/complaint/table" },
      ],
    },

    {
      title: "Contact",
      url: "/contact",
      icon: SquareUser,

      items: [
        { title: "Record", url: "/contact/table" },
      ],
    },

    {
      title: "Account",
      url: "/account",
      icon: HandCoins,
      items: [
        { title: "Record", url: "/Account/table" }
      ],
    },

    {
      title: "Documents",
      url: "/document",
      icon: ScrollText,
      items: [
        { title: "Drive", url: "/document" }
      ],
    },

    {
      title: "Event or Meeting",
      url: "/scheduled",
      icon: CalendarCog,

      items: [
        { title: "Record", url: "/Scheduled/table" }
      ],
    },

  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isClient, setIsClient] = React.useState(false);
  const [activePath, setActivePath] = React.useState("");
  const [hover, setHover] = React.useState(false);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const sidebarRef = React.useRef<HTMLDivElement>(null);

  const storageValue = 60;

  React.useEffect(() => {
    setIsClient(true);
    setActivePath(window.location.pathname);
  }, []);

  // ✅ Detect sidebar collapse using ResizeObserver
  React.useEffect(() => {
    if (!sidebarRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        setIsCollapsed(width < 80); // Adjust based on actual collapsed width
      }
    });

    observer.observe(sidebarRef.current);

    return () => observer.disconnect();
  }, []);

  const updatedNavMain = React.useMemo(
    () =>
      data.navMain.map((item) => ({
        ...item,
        isActive: isClient && activePath === item.url,
        items: item.items?.map((subItem) => ({
          ...subItem,
          isActive: isClient && activePath === subItem.url,
        })),
      })),
    [isClient, activePath]
  );

  return (
    <Sidebar ref={sidebarRef} collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>

      {/* Cloud Storage Section */}
      <div className="px-4 py-3 space-y-1">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Cloud className="size-4 text-gray-500" />
          {!isCollapsed && (
            <span className="font-medium transition-opacity duration-300 ease-in-out">
              Your Cloud Storage
            </span>
          )}
        </div>
        <div
          className="relative group"
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
        >
          <Progress value={storageValue} className="h-1" />
          {hover && (
            <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md">
              {storageValue}% Used
            </div>
          )}
        </div>
      </div>

      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}



