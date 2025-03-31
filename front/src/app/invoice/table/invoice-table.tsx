"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, Printer } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import axios from "axios";
import { format } from "date-fns"
import { Chip, Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip, User } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar"

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
    status: string;
    date: string;
    totalWithoutGst: number;
    totalWithGst: number;
    paidAmount: number;
    remainingAmount: number;
    createdAt: string;
}

export const invoiceSchema = z.object({
    companyName: z.string().nonempty({ message: "Required" }),
    customerName: z.string().nonempty({ message: "Required" }),
    contactNumber: z
        .string()
        .regex(/^\d*$/, { message: "Contact number must be numeric" })
        .optional(),
    emailAddress: z.string().optional(),
    address: z.string().optional(),
    gstNumber: z.string().optional(),
    productName: z.string().nonempty({ message: "Required" }),
    amount: z.number().positive({ message: "Required" }),
    discount: z.number().optional(),
    gstRate: z.number().optional(),
    status: z.enum(["Paid", "Unpaid"]),
    date: z.date().refine((val) => !isNaN(val.getTime()), { message: "Required" }),
    paidAmount: z.number().optional(),
    remainingAmount: z.number().optional(),
    totalWithoutGst: z.number().optional(),
    totalWithGst: z.number().optional(),
});

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');  // Ensure two digits for day
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Get month and ensure two digits
    const year = date.getFullYear();  // Get the full year
    return `${day}/${month}/${year}`;  // Returns "dd-mm-yyyy"
};

const columns = [
    { name: "Company Name", uid: "companyName", sortable: true },
    { name: "Client / Customer Name", uid: "customerName", sortable: true },
    { name: "Contact Number", uid: "contactNumber", sortable: true },
    { name: "Email Address", uid: "emailAddress", sortable: true },
    { name: "Company Address", uid: "address", sortable: true },
    { name: "GST Number", uid: "gstNumber", sortable: true },
    { name: "Product Name", uid: "productName", sortable: true },
    { name: "Product Amount", uid: "amount", sortable: true },
    { name: "Discount", uid: "discount", sortable: true },
    { name: "Before GST", uid: "totalWithoutGst", sortable: true },
    { name: "GST Rate", uid: "gstRate", sortable: true },
    { name: "After GST", uid: "totalWithGst", sortable: true },
    {
        name: "Invoice Date",
        uid: "date",
        sortable: true,
        render: (row: any) => formatDate(row.date)
    },

    { name: "Paid Amount", uid: "paidAmount", sortable: true },
    { name: "Remaining Amount", uid: "remainingAmount", sortable: true },
    { name: "Status", uid: "status", sortable: true },
    { name: "Action", uid: "actions", sortable: true }
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "customerName", "contactNumber", "emailAddress", "address", "gstNumber", "productName", "amount", "discount", "gstRate", "status", "date", "endDate", "totalWithoutGst", "totalWithGst", "paidAmount", "remainingAmount", "actions"];

const formSchema = invoiceSchema;



export default function InvoiceTable() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const router = useRouter();

    const fetchInvoices = async () => {
        setIsLoading(true);
        try {
            const response = await axios.get(
                "http://localhost:8000/api/v1/invoice/getAllInvoices"
            );

            let invoicesData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                invoicesData = response.data.data;
            } else if (Array.isArray(response.data)) {
                invoicesData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }

            if (!Array.isArray(invoicesData)) {
                invoicesData = [];
            }

            const sortedInvoices = [...invoicesData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const invoicesWithKeys = sortedInvoices.map((invoice: Invoice) => ({
                ...invoice,
                key: invoice._id || generateUniqueId()
            }));

            setInvoices(invoicesWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching invoices:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch invoices: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch invoice.");
            }
            setInvoices([]);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, []);

    const [isAddNewOpen, setIsAddNewOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [selectedKeys, setSelectedKeys] = useState(new Set([]));
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);

    const fetchBase64Image = async (imageUrl: string): Promise<string> => {
        try {
            console.log("Fetching logo from:", imageUrl);
            const response = await fetch(imageUrl);
            if (!response.ok) throw new Error("Failed to fetch image");

            const blob = await response.blob();
            return new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
        } catch (error) {
            console.error("Error loading image:", error);
            return "";
        }
    };

    const printInvoice = async (invoiceId: string) => {
        try {
            // Fetch owner details
            const ownerResponse = await fetch("http://localhost:8000/api/v1/owner/getOwnerForInvoice");
            const ownerResult = await ownerResponse.json();
            if (!ownerResponse.ok) throw new Error(ownerResult.message);

            const owner = ownerResult.data;

            // Fetch the logo (convert to Base64)
            let ownerLogoBase64 = "";
            if (owner.logo) {
                const imageUrl = `http://localhost:8000/uploads/${currentOwner.logo}`;
                ownerLogoBase64 = await fetchBase64Image(imageUrl);
                console.log("Base64 Encoded Logo:", ownerLogoBase64 ? "Logo loaded successfully" : "Failed to load logo");
            }

            // Find the invoice
            const invoiceToPrint = invoices.find((invoice) => invoice._id === invoiceId);
            if (!invoiceToPrint) {
                console.error("Invoice not found");
                return;
            }

            // Extract invoice details
            const { companyName, customerName, contactNumber, emailAddress, address, productName, amount, discount, totalWithoutGst, totalWithGst, paidAmount, remainingAmount, } = invoiceToPrint;

            const gstAmount = totalWithGst - totalWithoutGst;
            const cgst = gstAmount / 2;
            const sgst = cgst;

            // Generate Invoice HTML
            const invoiceContent = `
                <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice</title>
                    <style>
                        body { font-family: 'Arial', sans-serif; background-color: #f4f4f9; padding: 20px; }
                        .invoice-container { max-width: 800px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); }
                        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #004080; padding-bottom: 15px; }
                        .header h1 { color: #004080; font-size: 28px; }
                        .company-info, .client-info { margin-top: 20px; }
                        .company-info p, .client-info p { margin: 4px 0; }
                        .table-container { margin-top: 20px; }
                        table { width: 100%; border-collapse: collapse; }
                        th, td { border: 1px solid #ddd; padding: 10px; text-align: center; }
                        th { background-color: #004080; color: white; }
                        .total-section { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
                        .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
                        .logo-container { text-align: right; margin-bottom: 10px; }
                        .logo-container img { max-width: 150px; height: auto; display: block; }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <div class="header">
                            <h1>INVOICE</h1>
                            <div>
                                <p><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                        
                        <div class="company-info">
                            <h3>Company Information</h3>
                            <div class="logo-container">
                                ${ownerLogoBase64 ? `<img id="logo-img" src="${ownerLogoBase64}" style="width: 150px; height: auto;">` : ""}
                            </div>
                            <p><strong>${owner.companyName ?? "N/A"}</strong></p>
                            <p>${owner.contactNumber ?? "N/A"} | ${owner.emailAddress ?? "N/A"}</p>
                            <p>GST No: ${owner.gstNumber ?? "N/A"}</p>
                        </div>
                        
                        <div class="client-info">
                            <h3>Invoice To:</h3>
                            <p><strong>Company Name: ${companyName}</strong></p>
                            <p>Customer Name: ${customerName}</p>
                            <p>Email: ${emailAddress}</p>
                            <p>Contact Number: ${contactNumber}</p>
                            <p>Address: ${address}</p>
                        </div>
                        
                        <div class="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Product</th>
                                        <th>Price (₹)</th>
                                        <th>Discount (%)</th>
                                        <th>Total (₹)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td>${productName}</td>
                                        <td>${amount.toFixed(2)}</td>
                                        <td>${discount}</td>
                                        <td>${totalWithoutGst.toFixed(2)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="total-section">
                            <p>GST (CGST + SGST): ₹${(cgst + sgst).toFixed(2)}</p>
                            <p>Grand Total: ₹${totalWithGst.toFixed(2)}</p>
                            <p>Paid: ₹${paidAmount.toFixed(2)}</p>
                            <p>Remaining: ₹${remainingAmount.toFixed(2)}</p>
                        </div>
                        
                        <div class="footer">
                            <p>Thank you for your business!</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            // Create an iframe for printing
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            const doc = iframe.contentWindow?.document;
            if (!doc) return;

            doc.open();
            doc.write(invoiceContent);
            doc.close();

            // Wait for the logo to load, then print
            const logoImg = doc.getElementById("logo-img") as HTMLImageElement;
            if (logoImg) {
                logoImg.onload = () => {
                    setTimeout(() => {
                        iframe.contentWindow?.print();
                        document.body.removeChild(iframe);
                    }, 1000); // Increased delay for better loading
                };
            } else {
                setTimeout(() => {
                    iframe.contentWindow?.print();
                    document.body.removeChild(iframe);
                }, 1000);
            }
        } catch (error) {
            console.error("Error generating invoice:", error);
        }
    };


    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            companyName: "",
            customerName: "",
            emailAddress: "",
            contactNumber: "",
            address: "",
            productName: "",
            amount: 0,
            gstNumber: "",
            discount: 0,
            gstRate: 0,
            status: "Unpaid",
            date: new Date(),
            totalWithoutGst: 0,
            totalWithGst: 0,
            paidAmount: "",
            remainingAmount: 0,
        }
    })

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns; // Check if all columns are selected
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);


    const filteredItems = React.useMemo(() => {
        let filteredInvoices = [...invoices];

        if (hasSearchFilter) {
            filteredInvoices = filteredInvoices.filter((invoice) => {
                const searchableFields = {
                    companyName: invoice.companyName,
                    customerName: invoice.customerName,
                    contactNumber: invoice.contactNumber,
                    emailAddress: invoice.emailAddress,
                    address: invoice.address,
                    gstNumber: invoice.gstNumber,
                    productName: invoice.productName,
                    amount: invoice.amount,
                    discount: invoice.discount,
                    totalWithoutGst: invoice.totalWithoutGst,
                    gstRate: invoice.gstRate,
                    totalWithGst: invoice.totalWithGst,
                    date: invoice.date,
                    paidAmount: invoice.paidAmount,
                    remainingAmount: invoice.remainingAmount,
                    status: invoice.status,
                };

                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }

        if (statusFilter !== "all") {
            filteredInvoices = filteredInvoices.filter((invoice) =>
                statusFilter === invoice.status
            );
        }

        return filteredInvoices;
    }, [invoices, filterValue, statusFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Invoice];
            const second = b[sortDescriptor.column as keyof Invoice];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Invoice | null>(null);

    // Function to handle edit button click
    const handleEditClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        // Pre-fill the form with invoice data
        form.reset({
            companyName: invoice.companyName,
            customerName: invoice.customerName,
            emailAddress: invoice.emailAddress,
            contactNumber: invoice.contactNumber || "",
            address: invoice.address,
            gstNumber: invoice.gstNumber,
            productName: invoice.productName,
            amount: invoice.amount,
            discount: invoice.discount || 0,
            gstRate: invoice.gstRate || 0,
            status: invoice.status as "Unpaid" | "Paid",
            date: invoice.date ? new Date(invoice.date) : undefined,
            totalWithoutGst: invoice.totalWithoutGst || 0,
            totalWithGst: invoice.totalWithGst || 0,
            paidAmount: invoice.paidAmount || 0,
            remainingAmount: invoice.remainingAmount || 0,
        });
        setIsEditDialogOpen(true);
    };

    // Function to handle delete button click
    const handleDeleteClick = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedInvoice?._id) return;

        try {
            const response = await fetch(`http://localhost:8000/api/v1/invoice/deleteInvoice/${selectedInvoice._id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete invoice");
            }

            toast({
                title: "Invoice Deleted",
                description: "The invoice has been successfully deleted.",
            });

            fetchInvoices();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete invoice",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedInvoice(null);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false)


    async function onEdit(values: z.infer<typeof formSchema>) {
        if (!selectedInvoice?._id) return;

        setIsLoading(true);
        try {
            const response = await fetch(`http://localhost:8000/api/v1/invoice/updateInvoice/${selectedInvoice._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update invoice");
            }

            toast({
                title: "Invoice Updated",
                description: "The invoice has been successfully updated.",
            });

            // Close dialog and reset form
            setIsEditDialogOpen(false);
            setSelectedInvoice(null);
            form.reset();

            // Refresh the invoices list
            fetchInvoices();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update invoice",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    }

    const renderCell = React.useCallback((invoice: Invoice, columnKey: string) => {
        const cellValue = invoice[columnKey as keyof Invoice];

        switch (columnKey) {
            case "actions":
                return (
                    <div className="relative flex items-center gap-2">
                        <Tooltip>
                            <span
                                className="text-lg text-default-400 cursor-pointer active:opacity-50"
                                onClick={() => handleEditClick(invoice)}
                            >
                                <Edit className="h-4 w-4" />
                            </span>
                        </Tooltip>
                        <Tooltip>
                            <span
                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                onClick={() => handleDeleteClick(invoice)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </span>
                        </Tooltip>
                        <Tooltip color="danger">
                            <span
                                className="text-lg text-danger cursor-pointer active:opacity-50"
                                onClick={() => printInvoice(invoice._id)}  // Ensure this triggers the print function
                            >
                                <Printer className="h-4 w-4" />
                            </span>
                        </Tooltip>
                    </div>
                );
            case "date":
                return formatDate(cellValue);
            case "endDate":
                return formatDate(cellValue);
            case "contactNumber":
            case "emailAddress":
            case "address":
            case "gstNumber":
                return cellValue ? cellValue : "N/A";
            default:
                return cellValue;
        }
    }, []);

    const onNextPage = React.useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = React.useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(e.target.value));
        setPage(1);
    }, []);

    const onSearchChange = React.useCallback((value: string) => {
        if (value) {
            setFilterValue(value);
            setPage(1);
        } else {
            setFilterValue("");
        }
    }, []);

    const onClear = React.useCallback(() => {
        setFilterValue("");
        setPage(1);
    }, []);

    const topContent = React.useMemo(() => {
        return (
            <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between gap-3 items-end">
                    <div className="relative w-full sm:max-w-[20%]">
                        <Input
                            isClearable
                            className="w-full pr-12 sm:pr-14 pl-12"
                            startContent={
                                <SearchIcon className="h-4 w-5 text-muted-foreground absolute left-3 top-1/2 transform -translate-y-1/2" />
                            }
                            placeholder="Search"
                            value={filterValue}
                            onChange={(e) => setFilterValue(e.target.value)}
                            onClear={() => setFilterValue("")}
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-end gap-3 w-full">
                        <Dropdown>
                            <DropdownTrigger className="w-full sm:w-auto">
                                <Button
                                    endContent={<ChevronDownIcon className="text-small" />}
                                    variant="default"
                                    className="px-3 py-2 text-sm sm:text-base w-full sm:w-auto flex items-center justify-between"
                                >
                                    Hide Columns
                                </Button>
                            </DropdownTrigger>
                            <DropdownMenu
                                disallowEmptySelection
                                aria-label="Table Columns"
                                closeOnSelect={false}
                                selectedKeys={visibleColumns}
                                selectionMode="multiple"
                                onSelectionChange={(keys) => {
                                    const newKeys = new Set<string>(Array.from(keys as Iterable<string>));
                                    setVisibleColumns(newKeys);
                                }}
                                className="min-w-[180px] sm:min-w-[220px] max-h-96 overflow-auto rounded-lg shadow-lg p-2 bg-white border border-gray-300 hide-scrollbar"
                            >
                                {columns.map((column) => (
                                    <DropdownItem
                                        key={column.uid}
                                        className="capitalize px-4 py-2 rounded-md text-gray-800 hover:bg-gray-200 transition-all"
                                    >
                                        {column.name}
                                    </DropdownItem>
                                ))}
                            </DropdownMenu>
                        </Dropdown>

                        <Button
                            className="addButton w-full sm:w-auto flex items-center justify-between"
                            style={{ backgroundColor: 'hsl(339.92deg 91.04% 52.35%)' }}
                            variant="default"
                            size="default"
                            endContent={<PlusCircle />}
                            onClick={() => router.push("/invoice")}
                        >
                            Create Invoice
                        </Button>
                    </div>

                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {invoices.length} invoice</span>
                    <label className="flex items-center text-default-400 text-small gap-2">
                        Rows per page
                        <div className="relative">
                            <select
                                className="border border-gray-300 dark:border-gray-600 bg-transparent rounded-md px-3 py-1 text-default-400 text-sm cursor-pointer focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-all"
                                onChange={onRowsPerPageChange}
                            >
                                <option value="5">5</option>
                                <option value="10">10</option>
                                <option value="15">15</option>
                            </select>
                        </div>
                    </label>
                </div>
            </div>
        );
    }, [filterValue, visibleColumns, onRowsPerPageChange, invoices.length, onSearchChange]);

    const bottomContent = React.useMemo(() => {
        return (
            <div className="py-2 px-2 flex justify-between items-center">
                <span className="w-[30%] text-small text-default-400"></span>
                <Pagination
                    isCompact
                    showShadow
                    color="success"
                    page={page}
                    total={pages}
                    onChange={setPage}
                    classNames={{
                        cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
                        item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
                    }}
                />
                <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        disabled={pages === 1}
                        onClick={onPreviousPage}
                    >
                        Previous
                    </Button>
                    <Button
                        className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                        variant="default"
                        size="sm"
                        onClick={onNextPage}
                    >
                        Next
                    </Button>
                </div>
            </div>
        );
    }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

    const { watch, setValue } = form;
    const amount = watch("amount") ?? 0;
    const discount = watch("discount") ?? 0;
    const gstRate = watch("gstRate") ?? 0;
    const paidAmount = watch("paidAmount") ?? 0;

    useEffect(() => {

        const { totalWithoutGst, totalWithGst, remainingAmount } = calculateGST(amount, discount, gstRate, paidAmount);

        setValue("totalWithoutGst", totalWithoutGst);
        setValue("totalWithGst", totalWithGst);
        setValue("remainingAmount", remainingAmount);
    }, [amount, discount, gstRate, paidAmount, setValue]);

    const calculateGST = (
        amount: number,
        discount: number,
        gstRate: number,
        paidAmount: number
    ) => {

        const discountedAmount = amount - amount * (discount / 100);
        const gstAmount = discountedAmount * (gstRate / 100);
        const totalWithoutGst = discountedAmount;
        const totalWithGst = discountedAmount + gstAmount;
        const remainingAmount = totalWithGst - paidAmount;

        return {
            totalWithoutGst,
            totalWithGst,
            remainingAmount,
        };
    };

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15 max-w-screen-xl">
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Invoice Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Make an invoice for a client / customer</h1>
                            <Table
                                isHeaderSticky
                                aria-label="Leads table with custom cells, pagination and sorting"
                                bottomContent={bottomContent}
                                bottomContentPlacement="outside"
                                classNames={{ wrapper: "max-h-[382px] overflow-y-auto" }}
                                topContent={topContent}
                                topContentPlacement="outside"
                                onSelectionChange={setSelectedKeys}
                                onSortChange={setSortDescriptor}
                            >
                                <TableHeader columns={headerColumns}>
                                    {(column) => (
                                        <TableColumn
                                            key={column.uid}
                                            align={column.uid === "actions" ? "center" : "start"}
                                            allowsSorting={column.sortable}
                                        >
                                            {column.name}
                                        </TableColumn>
                                    )}
                                </TableHeader>
                                <TableBody emptyContent={"Create Invoice and add data"} items={sortedItems}>
                                    {(item) => (
                                        <TableRow key={item._id}>
                                            {(columnKey) => (
                                                <TableCell style={{ fontSize: "12px", padding: "8px" }}>
                                                    {renderCell(item, columnKey)}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditDialogOpen(false);
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Update Invoice</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter company name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client / Customer Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter client / customer name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter contact number"
                                                    type="tel"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                                        field.onChange(value);
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="emailAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter valid email address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter full company address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gstNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter GST number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="productName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter product name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Amount</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter product amount" type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="discount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount (%)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter discount" type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="gstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Rate (%)</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    value={field.value}
                                                    onChange={(e) => field.onChange(Number(e.target.value))}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                >
                                                    <option value="0">0%</option>
                                                    <option value="5">5%</option>
                                                    <option value="12">12%</option>
                                                    <option value="18">18%</option>
                                                    <option value="28">28%</option>
                                                    <option value="35">35%</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="paidAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Paid Amount</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter paid amount" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="remainingAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remaining Amount</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} readOnly />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                >
                                                    <option value="Unpaid">Unpaid</option>
                                                    <option value="Paid">Paid</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <div className="form-group">
                                            <label htmlFor="date" className="text-sm font-medium text-gray-700">
                                                Invoice Date
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                id="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                                className="w-full p-3 border border-gray-400 rounded-md text-black custom-input cursor-pointer"
                                                required
                                            />
                                            <style>
                                                {`
                                            .custom-input:focus {
                                                border-color: black !important;
                                                box-shadow: none !important;
                                                outline: none !important;
                                            }
                                            `}
                                            </style>
                                        </div>
                                    )}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Invoice"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsDeleteDialogOpen(false);
                }
            }}>
                <DialogContent className="fixed left-1/2 top-[7rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6 sm:max-w-sm sm:p-4 xs:max-w-[90%] xs:p-3 xs:top-[5rem]"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle className="text-lg xs:text-base">Confirm Deletion</DialogTitle>
                        <DialogDescription className="text-sm xs:text-xs">
                            Are you sure you want to delete this invoice? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                            className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                            className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs bg-gray-800"
                        >
                            Delete
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}