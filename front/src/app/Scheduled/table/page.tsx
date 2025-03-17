import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import SecheduledTable from "./scheduled-table"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button" 
import { ModeToggle } from "@/components/ModeToggle"
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';

export default function LeadTablePage() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                        <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <ModeToggle />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                            <BreadcrumbList>
                            <BreadcrumbItem className="hidden md:block">
                                <BreadcrumbLink href="/dashboard">
                                Dashboard
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                            <BreadcrumbItem>
                                <BreadcrumbLink href="/Scheduled">
                                Schedule
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                <BreadcrumbLink href="/Scheduled/table">
                                Schedule List
                                </BreadcrumbLink>              
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                        </div>
                        <div className="flex items-center space-x-4 ml-auto mr-4">
                        <div  >
                                <SearchBar/>
                            </div>
                            <div>
                            <Notification/>
                            </div>
                        </div>
                    </header>
                

                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-12 pt-15">
                    {/* Increase width by changing max-w-2xl to max-w-4xl or max-w-7xl */}
                    <Card className="max-w-6xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Scheduled Manager</CardTitle>
                            <CardDescription className="text-center">
                                Manage and track your Scheduled effectively.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SecheduledTable />
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
