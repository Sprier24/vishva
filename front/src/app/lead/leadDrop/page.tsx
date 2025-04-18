"use client";
import React, { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SearchBar from "@/components/globalSearch";
import Notification from "@/components/notification";
import { Calendar1, Mail, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

interface Lead {
  _id: string;
  companyName: string;
  customerName: string;
  amount: number;
  productName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  notes: string;
  date: string;
  endDate: string;
  status: "New" | "Discussion" | "Demo" | "Proposal" | "Decided";
  isActive: boolean;
}

const statusColors = {
  Proposal: "bg-orange-100 text-orange-800 border-orange-200",
  New: "bg-blue-100 text-blue-800 border-blue-200",
  Discussion: "bg-purple-100 text-purple-800 border-purple-200",
  Demo: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Decided: "bg-green-100 text-green-800 border-green-200",
};

const statusOrder = ["Proposal", "New", "Discussion", "Demo", "Decided"];

const getAllLeads = async (): Promise<Lead[]> => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/lead/getAllLeads");
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw new Error("Failed to fetch leads");
  }
};

export default function LeadBoard() {
  const [groupedLeads, setGroupedLeads] = useState<Record<string, Lead[]>>({});
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const fetchedLeads = await getAllLeads();
        const grouped = fetchedLeads.reduce((acc, lead) => {
          if (!acc[lead.status]) acc[lead.status] = [];
          acc[lead.status].push(lead);
          return acc;
        }, {} as Record<string, Lead[]>);

        setGroupedLeads(grouped);
        setTotalValue(fetchedLeads.reduce((sum, lead) => sum + lead.amount, 0));
      } catch (error) {
        toast({
          title: "Error",
          description: error instanceof Error ? error.message :  "There was an error fetching leads",
          variant: "destructive",
      }); 
      }
    };
    fetchLeads();
  }, []);

  const handleDragStart = (e: React.DragEvent, lead: Lead, fromStatus: string) => {
    e.dataTransfer.setData("lead", JSON.stringify(lead));
    e.dataTransfer.setData("fromStatus", fromStatus);
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    const leadData = e.dataTransfer.getData("lead");
    const fromStatus = e.dataTransfer.getData("fromStatus");

    if (!leadData || !fromStatus || fromStatus === toStatus) return;

    const lead: Lead = JSON.parse(leadData);
    const updatedLead = { ...lead, status: toStatus };

    setGroupedLeads((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus]?.filter((l) => l._id !== lead._id) || [],
      [toStatus]: [...(prev[toStatus] || []), updatedLead as Lead],
    }));

    try {
      await fetch("http://localhost:8000/api/v1/lead/updateLeadStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead._id, status: toStatus }),
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0'); 
    const month = String(date.getMonth() + 1).padStart(2, '0');  
    const year = date.getFullYear(); 
    return `${day}-${month}-${year}`;  
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

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
                <BreadcrumbSeparator className="hidden sm:block md:block" />
                <BreadcrumbItem className="hidden sm:block md:block">
                  <BreadcrumbLink href="/lead/table">Lead</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block md:block" />
                <span className="hidden sm:block md:block">
                  Drag & Drop
                </span>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4 ml-auto mr-4">
            <div  >
              <SearchBar />
            </div>
            <a href="/email" className="relative group">
              <Mail className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
              <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Email
              </div>
            </a>
            <a href="/calendar" className="relative group">
              <Calendar1 className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
              <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Calendar
              </div>
            </a>
            <div>
              <Notification />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </CardContent>
            </Card>
            {statusOrder.map((status) => (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedLeads[status]?.length || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(
                      groupedLeads[status]?.reduce((sum, lead) => sum + lead.amount, 0) || 0
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
            {Object.keys(statusColors).map((status) => {
              const leads = groupedLeads[status] || [];
              return (
                <div
                  key={status}
                  className={`rounded-lg border p-4 transition-colors ${draggedOver === status ? "bg-accent/50" : "bg-background"
                    }`}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDraggedOver(status)}
                  onDragLeave={() => setDraggedOver(null)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-medium px-3 py-1 rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                      {status}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {leads.length} leads
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
                    {leads.length > 0 ? (
                      leads.map((lead) => (
                        <Card
                          key={lead._id}
                          className="cursor-grab hover:shadow-sm active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead, status)}
                          onClick={() => {
                            setSelectedLead(lead);
                            setIsModalOpen(true);
                          }}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium line-clamp-1">
                              {lead.productName}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {lead.companyName}
                            </p>
                            <p className="text-sm font-semibold mt-2">
                              {formatCurrency(lead.amount)}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No lead in this status
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {isModalOpen && selectedLead && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative mx-4 w-full max-w-2xl rounded-lg bg-background shadow-lg">
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>

              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">{selectedLead.productName}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Company</h3>
                    <p>{selectedLead.companyName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Customer</h3>
                    <p>{selectedLead.customerName}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Value</h3>
                    <p>{formatCurrency(selectedLead.amount)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedLead.status]}`}>
                      {selectedLead.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h3>
                    <p>{formatDate(selectedLead.date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">End Date</h3>
                    <p>{formatDate(selectedLead.endDate)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Contact</h3>
                    <p>{selectedLead.contactNumber}</p>
                    <p className="text-blue-600">{selectedLead.emailAddress}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Notes</h3>
                    <p className="whitespace-pre-line">{selectedLead.notes || "No notes"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}