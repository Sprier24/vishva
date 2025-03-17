import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CardLineChart from "../Invoice-chart/chart"

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

export default function CertificatePage() {
    return (
       <SidebarProvider>
           <AppSidebar />
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
                          <BreadcrumbLink href="/invoice">
                            Invoice
                          </BreadcrumbLink>                            
                        </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem>
                          <BreadcrumbLink href="/Invoice-chart">
                            Graph
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
                <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15 ">
                    <Card className="max-w-5xl mx-h-10xl">
                        <CardHeader>
                            <CardTitle className="text-3xl font-bold text-center">Invoice</CardTitle>
                            <CardDescription className="text-center">
                                Manage and track your invoices effectively.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CardLineChart/>
                        </CardContent>
                    </Card>
                </div>
            </SidebarInset>
        </SidebarProvider>
    )
}
