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
  const [isClient, setIsClient] = React.useState(false)
  const [activePath, setActivePath] = React.useState("")
  const [windowWidth, setWindowWidth] = React.useState(0);

  React.useEffect(() => {
    setIsClient(true)
    setActivePath(window.location.pathname)
    setWindowWidth(window.innerWidth)

    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener("resize", handleResize)

    return () => window.removeEventListener("resize", handleResize)
  }, [])

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
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarContent>
        <NavMain items={updatedNavMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}