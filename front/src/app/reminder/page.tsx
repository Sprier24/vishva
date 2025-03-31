import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import reminder from "../reminder/table"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button" 
import { Calendar1, Mail } from "lucide-react"


export default function CertificatePage() {
    return (
        <SidebarProvider>
            <AppSidebar/>
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2 px-4 w-full">
                        <SidebarTrigger className="-ml-1"/>
                        <Separator orientation="vertical" className="mr-2 h-4"/>
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="/dashboard">
                                        Dashboard
                                    </BreadcrumbLink>
                                    <BreadcrumbLink href="/invoice">
                                   
                                    </BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block"/>
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Invoice</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>

                        <a href="/email" className="relative group">
                            <Mail className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
                            <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                Email
                            </div>
                        </a>

                        {/* Calendar Icon with Tooltip */}
                        <a href="/calendar" className="relative group">
                            <Calendar1 className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
                            <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                Calendar
                            </div>
                        </a>

                        {/* Add button in the header */}
                        <div className="ml-auto">
                            <Button>Invocie List</Button>
                        </div>
                    </div>
                </header>
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
                    <Card className="max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Invocie Manager</CardTitle>
                            <CardDescription className="text-center">
                                Manage and track your Invocie effectively.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <reminder />
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
