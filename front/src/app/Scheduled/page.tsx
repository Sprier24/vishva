import ScheduledEventForm from "../Scheduled/form"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { Calendar1 } from "lucide-react"

export default function CertificatePage() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
                    <div className="flex items-center gap-2 px-4">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb>
                        <BreadcrumbList className="flex items-center space-x-2">
                            <BreadcrumbItem className="hidden sm:block md:block">
                            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="hidden sm:block md:block"/>

                            <BreadcrumbItem className="hidden sm:block md:block">
                            <BreadcrumbLink href="/Scheduled/table">Event or Meeting</BreadcrumbLink>
                            </BreadcrumbItem>

                            <BreadcrumbSeparator className="hidden sm:block md:block"/>
                                <span  className="hidden sm:block md:block">
                                    Create Event or Meeting
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
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-8xl mx-auto border-none shadow-none">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Create Event or Meeting</CardTitle>
                            <CardDescription className="text-center">
                                Make event or meeting, hosted by you or client / customer
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ScheduledEventForm />
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}