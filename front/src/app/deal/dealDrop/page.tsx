"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter } from "@heroui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { MdCancel } from "react-icons/md";
import { AppSidebar } from "@/components/app-sidebar"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb"
import { Meteors } from "@/components/ui/meteors";
import { useRouter } from "next/navigation";
import { ModeToggle } from "@/components/ModeToggle"
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { Calendar1 } from "lucide-react";

interface Deal {
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

const getAllDeals = async (): Promise<Deal[]> => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/deal/getAllDeals");
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error fetching Deals:", error);
    throw new Error("Failed to fetch Deals");
  }
};

export default function App() {
  const [groupedDeals, setGroupedDeals] = useState<Record<string, Deal[]>>({});
  const [error, setError] = useState("");
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedDeal, setSelectedDeal] = React.useState<Deal | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const router = useRouter();

  const handleDealClick = (deal: Deal) => {
    setSelectedDeal(deal);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedDeal(null);
  };

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const fetchedDeals = await getAllDeals();
        groupDealsByStatus(fetchedDeals);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      };
    }
    fetchDeals();
  }, []);

  const groupDealsByStatus = (deal: Deal[]) => {
    const grouped = deal.reduce((acc, deal) => {
      if (!acc[deal.status]) acc[deal.status] = [];
      acc[deal.status].push(deal);
      return acc;
    }, {} as Record<string, Deal[]>);
    setGroupedDeals(grouped);
  };

  const statusColors: Record<string, string> = {
    Proposal: " text-gray-800 border-2 border-black ",
    New: " text-gray-800 border-2 border-black ",
    Discussion: " text-gray-800 border-2 border-black ",
    Demo: " text-gray-800 border-2 border-black ",
    Decided: " text-gray-800 border-2 border-black ",
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}`);
      return "Invalid Date";
    }
    return date.toISOString().split("T")[0];
  };

  const handleDragStart = (e: React.DragEvent, deal: Deal, fromStatus: string) => {
    e.dataTransfer.setData("Deal", JSON.stringify(deal));
    e.dataTransfer.setData("fromStatus", fromStatus);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    setDraggedOver(null);
    const DealData = e.dataTransfer.getData("Deal");
    const fromStatus = e.dataTransfer.getData("fromStatus");

    if (!DealData || !fromStatus || fromStatus === toStatus) return;

    const deal: Deal = JSON.parse(DealData);
    const updatedDeal = { ...deal, status: toStatus };

    setGroupedDeals((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus]?.filter((l) => l._id !== deal._id) || [],
      [toStatus]: [...(prev[toStatus] || []), updatedDeal as Deal],
    }));


    try {
      const response = await fetch("http://localhost:8000/api/v1/deal/updateDealStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dealId: deal._id, status: toStatus }),
      });
      const data = await response.json();
      if (!data.success) throw new Error("Failed to update Deal status on server.");
    } catch (error) {
      console.error("handleError updating status:", error);
    }
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
                  <BreadcrumbLink href="/deal/table">Deal</BreadcrumbLink>
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
        <div className="p-6">
          {error && <p className="text-red-500 text-center">{error}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
            {Object.keys(statusColors).map((status) => {
              const DealsInStatus = groupedDeals[status] || [];
              const totalAmount = DealsInStatus.reduce((sum, Deal) => sum + Deal.amount, 0);

              return (
                <div
                  key={status}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOver(status);
                  }}
                  onDragLeave={() => setDraggedOver(null)}
                >
                  <h2 className={`text-base font-bold mb-4 px-5 py-2 rounded-lg ${statusColors[status]}`}>{status}</h2>
                  <div className="p-4 rounded-lg shadow-sm border border-black mb-4">
                    <p className="text-sm font-semibold text-gray-800">Total Deal : {DealsInStatus.length}</p>
                    <p className="text-sm font-semibold text-gray-800">Total Amount : ₹{totalAmount}</p>
                  </div>
                  <div className="mt-4 flex flex-col gap-3 min-h-[250px] max-h-[500px] h-[350px] overflow-y-auto scrollbar-hide">
                    {DealsInStatus.length === 0 ? (
                      <p className="text-gray-500 text-center">No deal available</p>
                    ) : (
                      DealsInStatus.map((Deal) => (
                        <div
                          key={Deal._id}
                          className="p-3 border border-black rounded-lg bg-white shadow-sm cursor-grab"
                          draggable
                          onDragStart={(e) => handleDragStart(e, Deal, status)}
                          onClick={() => handleDealClick(Deal)}
                        >
                          <p className="text-sm font-semibold text-gray-800">Company Name : <span>{Deal.companyName}</span></p>
                          <p className="text-sm font-semibold text-gray-800">Customer Name : <span>{Deal.customerName}</span></p>
                          <p className="text-sm font-semibold text-gray-800">Product : <span>{Deal.productName}</span></p>
                          <p className="text-sm font-semibold text-gray-800">Amount : <span>₹{Deal.amount}</span></p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isModalOpen && selectedDeal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md h-auto relative">
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r  rounded-full blur-lg scale-90 opacity-50" />

                <div className="relative bg-white border border-gray-700 rounded-lg p-6 w-[800px] h-700 flex flex-col">
                  <div
                    className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center cursor-pointer"
                    onClick={() => {
                      setIsModalOpen(false);
                    }}
                  >
                    <MdCancel className="text-gray-500 text-2xltext-gray-500 text-2xl" />

                  </div>


                  <h1 className="font-bold text-2xl text-gray-900 mb-6 text-center">Deal Record</h1>
                  <Separator className="my-4 border-gray-300" />
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                    {Object.entries(selectedDeal)
                      .filter(([key]) => !["_id", "__v", "isActive", "createdAt", "updatedAt"].includes(key))
                      .map(([key, value]) => (
                        <p key={key} className="text-lg">
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                          {["date", "endDate"].includes(key) && value
                            ? new Date(value).toLocaleDateString("en-GB")
                            : value || "N/A"}
                        </p>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}