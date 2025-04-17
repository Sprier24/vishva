"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, Printer } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import axios from "axios";
import { format } from "date-fns"
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

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
        render: (row: Invoice) => (row.date)
    },
    { name: "Paid Amount", uid: "paidAmount", sortable: true },
    { name: "Remaining Amount", uid: "remainingAmount", sortable: true },
    { name: "Status", uid: "status", sortable: true },
    { name: "Action", uid: "actions", sortable: true }
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "customerName", "contactNumber", "emailAddress", "address", "gstNumber", "productName", "amount", "discount", "gstRate", "status", "date", "totalWithoutGst", "totalWithGst", "paidAmount", "remainingAmount", "actions"];

const formSchema = invoiceSchema;

export default function InvoiceTable() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const router = useRouter();

    const fetchInvoices = React.useCallback(async () => {
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
    }, []);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);

    const printInvoice = React.useCallback(async (invoiceId: string) => {
        try {
            const ownerResponse = await fetch("http://localhost:8000/api/v1/owner/getOwnerForInvoice");
            const ownerResult = await ownerResponse.json();
            if (!ownerResponse.ok) throw new Error(ownerResult.message);

            const owner = ownerResult.data;
            const logoUrl = owner.logo ? `http://localhost:8000/uploads/${owner.logo}` : null;

            const invoiceToPrint = invoices.find((invoice) => invoice._id === invoiceId);
            if (!invoiceToPrint) {
                console.error("Invoice not found");
                toast({
                    title: "Error",
                    description: "Invoice not found",
                    variant: "destructive",
                });
                return;
            }

            const { companyName, customerName, contactNumber, emailAddress, productName, amount, discount, totalWithoutGst, totalWithGst, paidAmount, remainingAmount } = invoiceToPrint;

            const gstAmount = totalWithGst - (totalWithoutGst || 0);
            const cgst = gstAmount / 2;
            const sgst = cgst;

            const invoiceContent = `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Invoice #${invoiceId.slice(-6)}</title>
                    <style>
                        @page {
                            size: A4;
                            margin: 0;
                            @bottom {
                                content: element(footer);
                            }
                        }
                        body {
                            font-family: 'Helvetica Neue', Arial, sans-serif;
                            margin: 0;
                            padding: 20px;
                            color: #333;
                            line-height: 1.5;
                            position: relative;
                            height: 100%;
                        }
                        .invoice-container {
                            max-width: 800px;
                            margin: 0 auto;
                            padding: 30px;
                            position: relative;
                            min-height: 100%;
                            padding-bottom: 60px; /* Space for footer */
                        }
                        .header {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #004080;
                        }
                        .logo-box {
                            width: 120px;
                            height: 120px;
                            overflow: hidden;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            border: 1px solid #eee;
                        }
                        .logo-box img {
                            width: 100%;
                            height: 100%;
                            object-fit: cover;
                        }
                        .invoice-title {
                            text-align: right;
                        }
                        .invoice-title h1 {
                            color: #004080;
                            font-size: 28px;
                            margin: 0 0 5px 0;
                        }
                        .columns {
                            display: flex;
                            gap: 40px;
                            margin-bottom: 30px;
                        }
                        .column {
                            flex: 1;
                        }
                        .info-section {
                            margin-bottom: 25px;
                        }
                        .info-section h3 {
                            font-size: 16px;
                            color: #004080;
                            margin: 0 0 10px 0;
                            padding-bottom: 5px;
                            border-bottom: 1px solid #eee;
                        }
                        .info-row {
                            margin-bottom: 5px;
                        }
                        table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 30px 0;
                        }
                        th {
                            background-color: #004080;
                            color: white;
                            text-align: left;
                            padding: 10px 15px;
                        }
                        td {
                            padding: 12px 15px;
                            border-bottom: 1px solid #eee;
                        }
                        .total-section {
                            text-align: right;
                            margin-top: 30px;
                        }
                        .grand-total {
                            font-size: 18px;
                            font-weight: bold;
                            color: #004080;
                            margin-top: 15px;
                            padding-top: 10px;
                            border-top: 2px solid #004080;
                        }
                        .footer {
                        position: fixed;
                        bottom: 10mm; /* Match your @page margin */
                        left: 15mm;
                        right: 15mm;
                        padding-top: 20px;
                        font-size: 12px;
                        color: #999;
                        text-align: center;
                    }
                    </style>
                </head>
                <body>
                    <div class="invoice-container">
                        <div class="header">
                            <div class="logo-box">
                                ${logoUrl ? `<img src="${logoUrl}" alt="Company Logo" onerror="this.style.display='none'">` : ''}
                            </div>
                            <div class="invoice-title">
                                <h1>INVOICE</h1>
                                <p>Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })} 
                                ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}</p>
                            </div>
                        </div>
                        
                        <div class="columns">
                            <div class="column">
                                <div class="info-section">
                                    <h3>Company Infomation</h3>
                                    <div class="info-row"><strong>Name :</strong> ${owner.companyName || "N/A"}</div>
                                    <div class="info-row"><strong>Contact :</strong> ${owner.contactNumber || "N/A"}</div>
                                    <div class="info-row"><strong>Email :</strong> ${owner.emailAddress || "N/A"}</div>
                                    <div class="info-row"><strong>GST No :</strong> ${owner.gstNumber || "N/A"}</div>
                                </div>
                            </div>
                            
                            <div class="column">
                                <div class="info-section">
                                    <h3>Invoice To</h3>
                                    <div class="info-row"><strong>Company :</strong> ${companyName || "N/A"}</div>
                                    <div class="info-row"><strong>Customer :</strong> ${customerName || "N/A"}</div>
                                    <div class="info-row"><strong>Contact :</strong> ${contactNumber || "N/A"}</div>
                                    <div class="info-row"><strong>Email :</strong> ${emailAddress || "N/A"}</div>
                                </div>
                            </div>
                        </div>
                        
                        <table>
                            <thead>
                                <tr>
                                    <th>Description</th>
                                    <th>Price</th>
                                    <th>Discount</th>
                                    <th>Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${productName || "Service"}</td>
                                    <td>₹${amount?.toFixed(2) || "0.00"}</td>
                                    <td>${discount || "0"}%</td>
                                    <td>₹${totalWithoutGst?.toFixed(2) || "0.00"}</td>
                                </tr>
                            </tbody>
                        </table>
                        
                        <div class="total-section">
                            <div>Subtotal : ₹${totalWithoutGst?.toFixed(2) || "0.00"}</div>
                            <div>GST (${gstAmount > 0 ? `${cgst.toFixed(2)}% CGST + ${sgst.toFixed(2)}% SGST` : '0%'}) : ₹${gstAmount.toFixed(2)}</div>
                            <div class="grand-total">Grand Total : ₹${totalWithGst?.toFixed(2) || "0.00"}</div>
                            <div style="margin-top: 15px;">Paid Amount : ₹${paidAmount?.toFixed(2) || "0.00"}</div>
                            <div>Remaining Amount : ₹${remainingAmount?.toFixed(2) || "0.00"}</div>
                        </div>
                        
                   <div class="footer">
                        <p>"Thank you for your business! We appreciate your trust in us and hope to continue working with you on future projects."</p>
                    </div>
                </div>
                <script>
                    window.onload = function() {
                        setTimeout(function() {
                            window.print();
                            setTimeout(function() {
                                window.parent.postMessage('removePrintIframe', '*');
                            }, 1000);
                        }, 500);
                    };
                </script>
            </body>
            </html>
        `;

            const iframe = document.createElement("iframe");
            iframe.style.position = "absolute";
            iframe.style.width = "1px";
            iframe.style.height = "1px";
            iframe.style.left = "-9999px";
            document.body.appendChild(iframe);

            const doc = iframe.contentDocument;
            if (!doc) {
                throw new Error("Failed to create print document");
            }

            doc.open();
            doc.write(invoiceContent);
            doc.close();

            const handlePrintComplete = (event: MessageEvent) => {
                if (event.data === 'removePrintIframe') {
                    window.removeEventListener('message', handlePrintComplete);
                    document.body.removeChild(iframe);
                }
            };

            window.addEventListener('message', handlePrintComplete);

        } catch (error) {
            console.error("Error generating invoice:", error);
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to generate invoice",
                variant: "destructive",
            });
        }
    },[invoices]);

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
            paidAmount: 0,
            remainingAmount: 0,
        }
    })

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns;
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
        return filteredInvoices;
    }, [invoices, filterValue, hasSearchFilter]);

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

    const handleEditClick = React.useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
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
    }, [form]);

    const handleDeleteClick = React.useCallback((invoice: Invoice) => {
        setSelectedInvoice(invoice);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = React.useCallback(async () => {
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
                description: "The invoice has been successfully deleted",
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
    }, [selectedInvoice,fetchInvoices]);

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onEdit(values: z.infer<typeof formSchema>) {
        if (!selectedInvoice?._id) return;
        setIsSubmitting(true);
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
                description: "The invoice has been successfully updated",
            });
            setIsEditDialogOpen(false);
            setSelectedInvoice(null);
            form.reset();
            fetchInvoices();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update invoice",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
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
                        <Tooltip color="danger">
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
                                onClick={() => printInvoice(invoice._id)}
                            >
                                <Printer className="h-4 w-4" />
                            </span>
                        </Tooltip>
                    </div>
                );
            case "contactNumber":
            case "emailAddress":
            case "address":
            case "gstNumber":
                return cellValue ? cellValue : "N/A";
            case "date": {
                if (!cellValue) return "N/A";

                const date = new Date(cellValue);
                if (isNaN(date.getTime())) return "Invalid Date";

                const day = String(date.getDate()).padStart(2, "0");
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const year = date.getFullYear();

                return `${day}/${month}/${year}`;
            }
            default:
                return cellValue;
        }
    }, [ handleEditClick, handleDeleteClick, printInvoice]);

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
    }, [filterValue, visibleColumns, onRowsPerPageChange, invoices.length, router]);

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
    }, [page, pages, onPreviousPage, onNextPage]);

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
                                sortDescriptor={sortDescriptor}
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
                                                    {renderCell(item, columnKey.toString())}
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
                                                <Input
                                                    placeholder="Enter product amount"
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.valueAsNumber || "";
                                                        field.onChange(value);
                                                    }}
                                                />
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
                                                <Input
                                                    placeholder="Enter discount"
                                                    type="number"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.valueAsNumber || "";
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
                                                <Input
                                                    type="number"
                                                    placeholder="Enter paid amount"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.valueAsNumber || "";
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
                        <DialogTitle className="text-lg xs:text-base">Confirm Delete</DialogTitle>
                        <DialogDescription className="text-sm xs:text-xs">
                            Are you sure you want to delete this invoice?
                            The data won&apos;t be retrieved again.
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
            {error && <div className="text-red-500 p-2">{error}</div>}
        </div>
    );
}