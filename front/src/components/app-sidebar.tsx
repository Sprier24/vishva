"use client";

import * as React from "react";
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
} from "lucide-react";
import { Progress } from "@/components/ui/progress"; // Ensure this exists
import icon from "../../public/logo icon.ico";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";

const data = {
  teams: [
    {
      name: "Spriers",
      logo: icon,
      plan: "Information Technology",
    },
  ],
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
        { title: "Drag & Drop", url: "/lead/leadDrop" },
      ],
    },
    {
      title: "Deal",
      url: "/deal",
      icon: Handshake,
      items: [
        { title: "Record", url: "/deal/table" },
        { title: "Graph", url: "/Deal-chart" },
        { title: "Drag & Drop", url: "/deal/dealDrop" },
      ],
    },
    {
      title: "Invoice",
      url: "/invoice",
      icon: ReceiptText,
      items: [
        { title: "Record", url: "/invoice/table" },
        { title: "Graph", url: "/Invoice-chart" },
        { title: "Drag & Drop", url: "/invoice/invoiceDrop" },
      ],
    },
    {
      title: "Reminder",
      url: "/reminder",
      icon: BellMinus,
      items: [
        { title: "Record", url: "/reminder/table" },
        { title: "Email", url: "/reminder/reminderEmail" },
      ],
    },
    {
      title: "Task",
      url: "/task",
      icon: BookCheck,
      items: [
        { title: "Record", url: "/task/table" },
        { title: "Drag & Drop", url: "/task/taskDrop" },
      ],
    },
    {
      title: "Complaint",
      url: "/complaint",
      icon: UserX,
      items: [
        { title: "Record", url: "/complaint/table" },
        { title: "Email", url: "/complaint/complaintEmail" },
      ],
    },
    {
      title: "Contact",
      url: "/contact",
      icon: SquareUser,
      items: [
        { title: "Record", url: "/contact/table" },
        { title: "Email", url: "/contact/contactEmail" },
      ],
    },
    {
      title: "Account",
      url: "/account",
      icon: HandCoins,
      items: [{ title: "Record", url: "/Account/table" }],
    },
    {
      title: "Documents",
      url: "/document",
      icon: ScrollText,
      items: [{ title: "Drive", url: "/document" }],
    },
    {
      title: "Event or Meeting",
      url: "/scheduled",
      icon: CalendarCog,
      items: [{ title: "Record", url: "/Scheduled/table" }],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [isClient, setIsClient] = React.useState(false);
  const [activePath, setActivePath] = React.useState("");
  const [windowWidth, setWindowWidth] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const pathname = usePathname(); // Get current path
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    setIsLoading(true); // Show loader
    setIsClient(true);
    setActivePath(pathname);
    setWindowWidth(window.innerWidth);

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);

    // Progress bar animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10; // Increment by 10% every 100ms
      });
    }, 100);

    // Clear everything when loading is complete
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setProgress(100);
      clearInterval(interval);
    }, 1000); // Total loading time set to 1 second (1000ms)

    return () => {
      clearTimeout(timeout);
      clearInterval(interval);
      window.removeEventListener("resize", handleResize);
    };
  }, [pathname]);

  const updatedNavMain = React.useMemo(
    () =>
      data.navMain.map((item) => ({
        ...item,
        isActive: isClient && activePath === item.url,
        items: item.items
          ?.filter(
            (subItem) => !(windowWidth < 768 && subItem.title === "Drag & Drop")
          ) // Hide Drag & Drop if width < 768px
          .map((subItem) => ({
            ...subItem,
            isActive: isClient && activePath === subItem.url,
          })),
      })),
    [isClient, activePath, windowWidth]
  );

  return (
    <>
      {/* Show progress bar when loading */}
      {isLoading && (
        <div className="fixed top-0 left-0 w-full z-50">
          <Progress value={progress} className="h-1 w-full bg-blue-500" />
        </div>
      )}
      <Sidebar collapsible="icon" {...props}>
        <SidebarHeader>
          {/* <TeamSwitcher teams={data.teams} /> */}
        </SidebarHeader>
        <SidebarContent>
          <NavMain items={updatedNavMain} />
        </SidebarContent>
        <SidebarFooter>
          <NavUser user={data.user} />
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}


// npm install @heroui/progress -- force