import ScheduledEventForm from "../Scheduled/form"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb"

export default function CertificatePage() {
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 w-full">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="mr-2 h-4" />
                        <Breadcrumb className="flex items-center space-x-2">
                            <BreadcrumbList className="flex items-center space-x-2">
                                <BreadcrumbItem className="flex items-center">
                                    <BreadcrumbLink href="/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbLink href="/Scheduled/table">
                                        Scheduled
                                    </BreadcrumbLink>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbLink href="">
                                        Create
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-8xl mx-auto border-none">
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
