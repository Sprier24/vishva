"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter } from "@heroui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MdCancel } from "react-icons/md";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ModeToggle } from "@/components/ModeToggle";
import { Meteors } from "@/components/ui/meteors";
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';

interface Invoice {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  emailAddress: string;
  address: string;
  gstNumber: string;
  productName: string;
  amount: number;
  discount: number;
  gstRate: number;
  status: "Unpaid" | "Paid" | "Pending";
  date: string;
  totalWithoutGst: number;
  totalWithGst: number;
  paidAmount: 0 | number;
  remainingAmount: number;
  isActive: boolean;
}

const getAllInvoices = async (): Promise<Invoice[]> => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/invoice/getAllInvoices");
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw new Error("Failed to fetch invoices");
  }
};

export default function App() {
  const [error, setError] = useState("");
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [groupedInvoices, setGroupedInvoices] = useState<Record<string, Invoice[]>>({});
  const [selectedInvoice, setSelectedInvoice] = React.useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleInvoiceClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedInvoice(null);
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const fetchedInvoices = await getAllInvoices();
        groupInvoicesByStatus(fetchedInvoices);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("An unknown error occurred");
        }
      }
    };
    fetchInvoices();
  }, []);

  const groupInvoicesByStatus = (invoices: Invoice[]) => {
    const grouped = invoices.reduce((acc, invoice) => {
      if (!acc[invoice.status]) acc[invoice.status] = [];
      acc[invoice.status].push(invoice);
      return acc;
    }, {} as Record<string, Invoice[]>);
    setGroupedInvoices(grouped);
  };

  const statusColors: Record<string, string> = {
    Pending: "text-gray-800 border-2 border-black",
    Unpaid: "text-gray-800 border-2 border-black",
    Paid: "text-gray-800 border-2 border-black",
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

  const handleDragStart = (e: React.DragEvent, invoice: Invoice, fromStatus: string) => {
    e.dataTransfer.setData("invoice", JSON.stringify(invoice));
    e.dataTransfer.setData("fromStatus", fromStatus);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    setDraggedOver(null);
    const invoiceData = e.dataTransfer.getData("invoice");
    const fromStatus = e.dataTransfer.getData("fromStatus");

    if (!invoiceData || !fromStatus || fromStatus === toStatus) return;

    const invoice: Invoice = JSON.parse(invoiceData);
    const updatedInvoice = { ...invoice, status: toStatus };

    setGroupedInvoices((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus]?.filter((l) => l._id !== invoice._id) || [],
      [toStatus]: [...(prev[toStatus] || []), updatedInvoice as Invoice],
    }));

    try {
      const response = await fetch("http://localhost:8000/api/v1/invoice/updateInvoiceStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice._id, status: toStatus }),
      });
      const data = await response.json();
      if (!data.success) throw new Error("Failed to update invoice status on server.");
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

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
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/invoice">Invoice</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/invoice/invoiceDrop">Drag & Drop</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4 ml-auto mr-4">
            <div>
              <SearchBar />
            </div>
            <div>
              <Notification />
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && <p className="text-red-500 text-center">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {Object.keys(statusColors).map((status) => {
              const invoiceStatus = groupedInvoices[status] || [];
              const totalAmount = invoiceStatus.reduce((sum, invoice) => sum + invoice.amount, 0);

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
                  <h2 className="text-base font-bold mb-4 p-4 bg-white border border-black rounded text-gray-800 text-center">
                    {status}
                  </h2>

                  <div className="p-4 rounded-lg shadow-sm border border-black mb-4">
                    <p className="text-sm font-semibold text-gray-800">Total Invoice: {invoiceStatus.length}</p>
                    <p className="text-sm font-semibold text-gray-800">Total Amount: ₹{totalAmount}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 min-h-[250px] max-h-[500px] overflow-y-auto">
                    {invoiceStatus.length === 0 ? (
                      <p className="text-center text-gray-500">No invoices available</p>
                    ) : (
                      invoiceStatus.map((invoice) => (
                        <div
                          key={invoice._id}
                          className="p-3 border border-black rounded-lg bg-white shadow-sm cursor-grab"
                          draggable
                          onDragStart={(e) => handleDragStart(e, invoice, status)}
                          onClick={() => handleInvoiceClick(invoice)}
                        >
                          <p className="text-sm font-semibold text-gray-800">Company Name: {invoice.companyName}</p>
                          <p className="text-sm font-semibold text-gray-800">Product: {invoice.productName}</p>
                          <p className="text-sm font-semibold text-gray-800">Next Date: {formatDate(invoice.date)}</p>
                          <p className="text-sm font-semibold text-gray-800">Amount: ₹{invoice.amount}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isModalOpen && selectedInvoice && (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md h-auto relative">
                <div className="absolute inset-0 h-full w-full bg-gradient-to-r  rounded-full blur-lg scale-90 opacity-50" />
                <div className="relative bg-white border border-gray-700 rounded-lg p-6 w-[800px] h-700 flex flex-col">
                  <div
                    className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center cursor-pointer"
                    onClick={closeModal}
                  >
                    <MdCancel className="text-gray-500 text-2xl" />
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Invoice Details</h1>
                  <Separator className="my-4 border-gray-300" />
                  <div className="grid grid-cols-2 gap-4 text-gray-700">
                  
                    {Object.entries(selectedInvoice)
                      .filter(([key]) => !["_id", "__v", "isActive", "createdAt", "updatedAt"].includes(key))
                      .map(([key, value]) => (
                        <p key={key} className="text-lg">
                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
                          {["date", "endDate"].includes(key) && value
                            ? new Date(value).toLocaleDateString()
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