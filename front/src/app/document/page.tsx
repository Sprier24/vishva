import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import GoogleDriveClone from "./card"

import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button" 
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { ModeToggle } from "@/components/ModeToggle"
import { Calendar1 } from "lucide-react"

export default function CertificatePage() {
    return (
        <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                <div className="flex items-center gap-2 px-4">
                    <SidebarTrigger className="-ml-1" />
                    <Separator orientation="vertical" className="mr-2 h-4"/>
                    <Breadcrumb>
                    <BreadcrumbList className="flex items-center space-x-2">
                        <BreadcrumbItem className="hidden sm:block md:block">
                        <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden sm:block md:block" />
                        <span className="hidden sm:block md:block">
                            Drive
                        </span>
                    </BreadcrumbList>
                    </Breadcrumb>
                </div>
                <div className="flex items-center space-x-4 ml-auto mr-4">
                    <div  >
                        <SearchBar />
                    </div>
                    <a href="/calendar">
                        <div>
                            <Calendar1 />
                        </div>
                    </a>
                    <div>
                        <Notification />
                    </div>
                </div>
            </header>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-15 ">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center"> </CardTitle>
                            <CardDescription className="text-center">
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <GoogleDriveClone/>
                        </CardContent>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}