"use client";

import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, CirclePlus, Diff, ReceiptText, SquareUser } from "lucide-react"
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
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { Calendar } from "@/components/ui/calendar"

interface Lead {
    _id: string;
    companyName: string;
    customerName: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    productName: string;
    amount: string;
    gstNumber: string;
    status: string;
    date: string;
    endDate: string;
    notes: string;
    isActive: string;
}

interface Contact {
    companyName: string;
    customerName: string;
    contactNumber: string;
    emailAddress: string;
    address: string;
    gstNumber?: string;
    description?: string;
}

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
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};

const columns = [
    { name: "Company Name", uid: "companyName", sortable: true, width: "120px" },
    { name: "Client / Customer Name", uid: "customerName", sortable: true, width: "120px" },
    { name: "Contact Number", uid: "contactNumber", sortable: true, width: "100px" },
    { name: "Email Address", uid: "emailAddress", sortable: true, width: "150px" },
    { name: "Company Address", uid: "address", sortable: true, width: "180px" },
    { name: "GST Number", uid: "gstNumber", sortable: true, width: "100px" },
    { name: "Product Name", uid: "productName", sortable: true, width: "120px" },
    { name: "Product Amount", uid: "amount", sortable: true, width: "100px" },
    {
        name: "Lead Date",
        uid: "date",
        sortable: true,
        width: "170px",
        render: (row: any) => formatDate(row.date),
    },
    {
        name: "Final Date",
        uid: "endDate",
        sortable: true,
        width: "120px",
        render: (row: any) => formatDate(row.endDate)
    },
    {
        name: "Notes",
        uid: "notes",
        sortable: true,
        width: "180px"
    },
    { name: "Status", uid: "status", sortable: true, width: "100px" },
    { name: "Action", uid: "actions", sortable: true, width: "100px" },
];
const INITIAL_VISIBLE_COLUMNS = ["companyName", "customerName", "contactNumber", "emailAddress", "address", "productName", "amount", "gstNumber", "status", "date", "endDate", "notes", "actions"];

const formSchema = z.object({
    companyName: z.string().nonempty({ message: "Company name is required" }),
    customerName: z.string().nonempty({ message: "Customer name is required" }),
    contactNumber: z
        .string()
        .regex(/^\d*$/, { message: "Contact number must be numeric" })
        .nonempty({ message: "Contact number is required" }),
    emailAddress: z.string().email({ message: "Invalid email address" }),
    address: z.string().nonempty({ message: "Company address is required" }),
    productName: z.string().nonempty({ message: "Product name is required" }),
    amount: z.number().positive({ message: "Product amount is required" }),
    gstNumber: z.string().nonempty({ message: "GST number is required" }),
    status: z.enum(["Proposal", "New", "Discussion", "Demo", "Decided"]),
    date: z.date().refine((val) => !isNaN(val.getTime()), { message: "Lead Date is required" }),
    endDate: z.date().refine((val) => !isNaN(val.getTime()), { message: "Final Date is required" }),
    notes: z.string().optional(),
    isActive: z.boolean(),
});

export default function LeadTable() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Iterable<string> | 'all' | undefined>(undefined);
    const [isContactFormVisible, setIsContactFormVisible] = useState(false);
    const [isInvoiceFormVisible, setIsInvoiceFormVisible] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const [newInvoice, setNewInvoice] = useState<Invoice>({
        _id: "",
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        gstNumber: "",
        productName: "",
        amount: 0, // Initialize as a number
        discount: 0, // Initialize as a number
        gstRate: 0, // Initialize as a number
        status: "",
        date: "",
        totalWithGst: 0, // Initialize as a number
        totalWithoutGst: 0, // Initialize as a number
        paidAmount: 0, // Initialize as a number
        remainingAmount: 0, // Initialize as a number
    });

    const [newContact, setNewContact] = useState<Contact>({
        companyName: "",
        customerName: "",
        contactNumber: "",
        emailAddress: "",
        address: "",
        gstNumber: "",
        description: "",
    });

    const fetchLeads = async () => {
        try {
            const response = await axios.get(
                "http://localhost:8000/api/v1/lead/getAllLeads"
            );
            console.log('Full API Response:', {
                status: response.status,
                data: response.data,
                type: typeof response.data,
                hasData: 'data' in response.data
            });
            let leadsData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                leadsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                leadsData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }
            if (!Array.isArray(leadsData)) {
                leadsData = [];
            }
            const leadsWithKeys = leadsData.map((lead: Lead) => ({
                ...lead,
                key: lead._id || generateUniqueId()
            }));
            setLeads(leadsWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching leads:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch leads: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch leads.");
            }
            setLeads([]);
        }
    };

    useEffect(() => {
        fetchLeads();
    }, []);

    const [isAddNewOpen, setIsAddNewOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "companyName",
        direction: "ascending",
    });
    const [page, setPage] = useState(1);
    const router = useRouter();
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

    // Form setup
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
            status: "New",
            date: new Date(),
            endDate: undefined,
            notes: "",
            isActive: true,
        },
    })

    const handleAddContactClick = (lead: Lead) => {
        setIsContactFormVisible(true);

        // Pre-populate the contact form with the lead's information
        setNewContact({
            companyName: lead.companyName,
            customerName: lead.customerName,
            contactNumber: lead.contactNumber || "", // Default to empty if not available
            emailAddress: lead.emailAddress,
            address: lead.address,
            gstNumber: lead.gstNumber, // Optional, you can leave this empty or populate based on your needs
            description: "", // Optional, same as above
        });
    };

    const handleAddInvoice = (lead: Lead) => {
        setIsInvoiceFormVisible(true);

        // Pre-populate the contact form with the lead's information
        setNewInvoice({
            _id: "", // Default empty string, assuming this will be set later
            companyName: lead.companyName,
            customerName: lead.customerName,
            contactNumber: lead.contactNumber || "", // Default to empty if not available
            emailAddress: lead.emailAddress,
            address: lead.address,
            gstNumber: lead.gstNumber,
            productName: lead.productName,
            amount: lead.amount, // Default to 0 (since amount is a number)
            discount: 0, // Default to 0 (since discount is a number)
            gstRate: 0, // Default to 0 (since gstRate is a number)
            status: "", // Default empty string for status
            date: "", // Default empty string for date
            totalWithGst: 0, // Default to 0 (since totalWithGst is a number)
            totalWithoutGst: 0, // Default to 0 (since totalWithoutGst is a number)
            paidAmount: 0, // Default to 0 (since paidAmount is a number)
            remainingAmount: 0, // Default to 0 (since remainingAmount is a number)
        });
    };

    const handleInvocieSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation: Check if any required field is empty
        const {
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
        } = newInvoice;

        if (
            !companyName ||
            !customerName ||
            !contactNumber ||
            !emailAddress ||
            !address ||
            !gstNumber
        ) {
            toast({
                title: "Error",
                description: "Plwasem Fill  The All the field sre required",
            });
            return;
        }
        try {
            // Assuming you have an endpoint for saving contacts
            await axios.post(
                "http://localhost:8000/api/v1/invoice/invoiceAdd",
                newInvoice
            );
            setIsInvoiceFormVisible(false);
            setNewInvoice({
                _id: "",
                companyName: "",
                customerName: "",
                contactNumber: "",
                emailAddress: "",
                address: "",
                gstNumber: "",
                productName: "",
                amount: 0,
                discount: 0,
                gstRate: 0,
                status: "paid",
                date: "",
                totalWithoutGst: 0,
                totalWithGst: 0,
                paidAmount: 0,
                remainingAmount: 0,
            });

            toast({
                title: "Invoice Submitted",
                description: "The Invoice has been successfully created",
            });
        } catch (error) {
            console.error("Error saving contact:", error);
            toast({
                title: "Failed To Add Invoice",
                description: "The Invoice has been Failed .",
            });
        }
    };

    const calculateGST = (
        amount: number,
        discount: number,
        gstRate: number,
        paidAmount: number
    ) => {
        // Subtract the discount from the amount to get the discounted amount
        const discountedAmount = amount - amount * (discount / 100);
        const gstAmount = discountedAmount * (gstRate / 100); // Calculate GST on the discounted amount
        const totalWithoutGst = discountedAmount;
        const totalWithGst = discountedAmount + gstAmount; // Add GST to the discounted amount
        const remainingAmount = totalWithGst - paidAmount; // Calculate the remaining amount

        return {
            totalWithoutGst,
            totalWithGst,
            remainingAmount,
        };
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        const updatedInvoice = { ...newInvoice, [name]: value };

        if (
            name === "amount" ||
            name === "discount" ||
            name === "gstRate" ||
            name === "paidAmount"
        ) {
            const { totalWithoutGst, totalWithGst, remainingAmount } = calculateGST(
                updatedInvoice.amount,
                updatedInvoice.discount,
                updatedInvoice.gstRate,
                updatedInvoice.paidAmount
            );

            setNewInvoice({
                ...updatedInvoice,
                totalWithoutGst,
                totalWithGst,
                remainingAmount,
            });
        } else {
            setNewInvoice(updatedInvoice);
        }
    };

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns; // Check if all columns are selected
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredLeads = [...leads];

        if (hasSearchFilter) {
            filteredLeads = filteredLeads.filter((lead) => {
                const searchableFields = {
                    companyName: lead.companyName,
                    customerName: lead.customerName,
                    emailAddress: lead.emailAddress,
                    productName: lead.productName,
                    status: lead.status,
                    notes: lead.notes,
                };

                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }

        if (statusFilter !== "all") {
            filteredLeads = filteredLeads.filter((lead) =>
                statusFilter === lead.status
            );
        }

        return filteredLeads;
    }, [leads, filterValue, statusFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Lead];
            const second = b[sortDescriptor.column as keyof Lead];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

    // Function to handle edit button click
    const handleEditClick = (lead: Lead) => {
        setSelectedLead(lead);
        // Pre-fill the form with lead data
        form.reset({
            companyName: lead.companyName,
            customerName: lead.customerName,
            emailAddress: lead.emailAddress,
            contactNumber: lead.contactNumber || "",
            address: lead.address,
            productName: lead.productName,
            amount: parseFloat(lead.amount),
            gstNumber: lead.gstNumber,
            status: lead.status as "New" | "Discussion" | "Demo" | "Proposal" | "Decided",
            date: lead.date ? new Date(lead.date) : undefined,
            endDate: lead.endDate ? new Date(lead.endDate) : undefined,
            notes: lead.notes || "",
            isActive: lead.isActive === "true",
        });
        setIsEditOpen(true);
    };

    // Function to handle delete button click
    const handleDeleteClick = async (lead: Lead) => {
        setSelectedLead(lead);
        setIsDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!selectedLead?._id) return;

        try {
            const response = await fetch(`http://localhost:8000/api/v1/lead/deleteLead/${selectedLead._id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete lead");
            }

            toast({
                title: "Lead Deleted",
                description: "The lead has been successfully deleted.",
            });

            // Refresh the leads list
            fetchLeads();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete lead",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedLead(null);
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onEdit(values: z.infer<typeof formSchema>) {
        if (!selectedLead?._id) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8000/api/v1/lead/updateLead/${selectedLead._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update lead");
            }

            toast({
                title: "Lead Updated",
                description: "The lead has been successfully updated",
            });

            // Close dialog and reset form
            setIsEditOpen(false);
            setSelectedLead(null);
            form.reset();

            // Refresh the leads list
            fetchLeads();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error updating the lead",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Basic validation: Check if any required field is empty
        const {
            companyName,
            customerName,
            contactNumber,
            emailAddress,
            address,
            gstNumber,
            description,
        } = newContact;

        if (
            !companyName ||
            !customerName ||
            !contactNumber ||
            !emailAddress ||
            !address ||
            !gstNumber ||
            !description
        ) {

            toast({
                title: "Error",
                description: `Please Fill All Fields Are Required`,
            })
        }
        try {
            // Assuming you have an endpoint for saving contacts
            await axios.post(
                "http://localhost:8000/api/v1/contact/createContact",
                newContact
            );
            setIsContactFormVisible(false);
            setNewContact({
                companyName: "",
                customerName: "",
                contactNumber: "",
                emailAddress: "",
                address: "",
                gstNumber: "",
                description: "",
            });
            toast({
                title: "Contact Submitted",
                description: `The contact has been successfully created`,
            })
        } catch (error) {
            console.error("Error saving contact:", error);

            toast({
                title: "Error",
                description: `Your Contact has been Failed to submit.`,
            })
        }
    };

    const renderCell = React.useCallback((lead: Lead, columnKey: string) => {
        const cellValue = lead[columnKey as keyof Lead];

        if ((columnKey === "date" || columnKey === "endDate") && cellValue) {
            return formatDate(cellValue);
        }

        if (columnKey === "notes") {
            return cellValue || "N/A";
        }

        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip content="Update">
                        <span
                            className="text-lg text-default-400 cursor-pointer active:opacity-50"
                            onClick={() => handleEditClick(lead)}
                        >
                            <Edit className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip color="danger" content="Delete">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDeleteClick(lead)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip color="danger" content="Add Contact">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleAddContactClick(lead)}
                        >
                            <ReceiptText className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip color="danger" content="Add Invoice">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleAddInvoice(lead)}
                        >
                            <SquareUser className="h-4 w-4" />
                        </span>
                    </Tooltip>
                </div>
            );
        }

        return cellValue;
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
                                className="min-w-[180px] sm:min-w-[220px] max-h-96 overflow-auto rounded-lg shadow-lg p-2 bg-white border border-gray-300"
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
                            onClick={() => router.push("/lead")}
                        >
                            Create Lead
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {leads.length} lead</span>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, leads.length, onSearchChange]);

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

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15 max-w-screen-xl">
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Lead Record</h1>
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
                                <TableBody emptyContent={"Create lead and add data"} items={sortedItems}>
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
            <Dialog open={isContactFormVisible} onOpenChange={(open) => setIsContactFormVisible(open)}>
                <DialogContent className="w-[100vw] max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4">
                    <DialogHeader>
                        <DialogTitle>Add Contact</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={handleContactSubmit} className="space-y-6">
                            {/* First row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter company name"
                                                    value={newContact.companyName}
                                                    onChange={(e) =>
                                                        setNewContact({ ...newContact, companyName: e.target.value })
                                                    }
                                                />
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
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter client / customer Name"
                                                    value={newContact.customerName}
                                                    onChange={(e) =>
                                                        setNewContact({ ...newContact, customerName: e.target.value })
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Second row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="contactNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Contact Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter contact number"
                                                    value={newContact.contactNumber}
                                                    onChange={(e) =>
                                                        setNewContact({ ...newContact, contactNumber: e.target.value })
                                                    }
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter valid email address"
                                                    value={newContact.emailAddress}
                                                    onChange={(e) =>
                                                        setNewContact({
                                                            ...newContact,
                                                            emailAddress: e.target.value,
                                                        })
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Third row */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter company address"
                                                    value={newContact.address}
                                                    onChange={(e) =>
                                                        setNewContact({ ...newContact, address: e.target.value })
                                                    }
                                                />
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
                                            <FormLabel>GST Number</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter GST number"
                                                    value={newContact.gstNumber}
                                                    onChange={(e) =>
                                                        setNewContact({ ...newContact, gstNumber: e.target.value })
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            {/* Notes */}
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <textarea
                                                placeholder="Enter more details here..."
                                                value={newContact.description}
                                                onChange={(e) =>
                                                    setNewContact({ ...newContact, description: e.target.value })
                                                }
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Submit Button */}
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting Contact...
                                    </>
                                ) : (
                                    "Add Contact"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            {isInvoiceFormVisible && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm"
                    onClick={() => setIsInvoiceFormVisible(false)} // Close on clicking outside
                >
                    <div
                        className="bg-white p-4 rounded-md shadow-lg w-11/12 sm:w-full max-w-2xl max-h-[90vh] overflow-y-auto relative scrollbar-hide"
                        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                    >

                        {/* Close Icon */}
                        <button
                            className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
                            onClick={() => setIsInvoiceFormVisible(false)}
                        >
                            ✖
                        </button>
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">
                            Add Invoice
                        </h3>
                        <form
                            onSubmit={handleInvocieSubmit}
                            className="space-y-6 p-6 w-full"
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="form-group">
                                    <label
                                        htmlFor="companyName"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Company Name
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        id="companyName"
                                        placeholder="Enter company name"
                                        value={newInvoice.companyName}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                companyName: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="customerName"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Client / Customer Name
                                    </label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        id="customerName"
                                        placeholder="Enter client / customer name"
                                        value={newInvoice.customerName}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                customerName: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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

                                <div className="form-group">
                                    <label
                                        htmlFor="contactNumber"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Contact Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="contactNumber"
                                        id="contactNumber"
                                        placeholder="Enter contact number"
                                        value={newInvoice.contactNumber}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                contactNumber: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="emailAddress"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Email Address (Optional)
                                    </label>
                                    <input
                                        type="email"
                                        name="emailAddress"
                                        id="emailAddress"
                                        placeholder="Enter valid email address"
                                        value={newInvoice.emailAddress}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                emailAddress: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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

                                <div className="form-group">
                                    <label
                                        htmlFor="address"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Company Address (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        id="address"
                                        placeholder="Enter full company address"
                                        value={newInvoice.address}
                                        onChange={(e) =>
                                            setNewInvoice({ ...newInvoice, address: e.target.value })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="gstNumber"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        GST Number (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        name="gstNumber"
                                        id="gstNumber"
                                        placeholder="Enter GST number"
                                        value={newInvoice.gstNumber}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                gstNumber: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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

                                <div className="form-group">
                                    <label
                                        htmlFor="productName"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Product Name
                                    </label>
                                    <input
                                        type="text"
                                        name="productName"
                                        id="productName"
                                        placeholder="Enter product name"
                                        value={newInvoice.productName}
                                        onChange={(e) =>
                                            setNewInvoice({
                                                ...newInvoice,
                                                productName: e.target.value,
                                            })
                                        }
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="amount"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Product Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="amount"
                                        id="amount"
                                        placeholder="Enter product amount"
                                        value={newInvoice.amount}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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

                                <div className="form-group">
                                    <label
                                        htmlFor="discount"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Discount (Optional)
                                    </label>
                                    <input
                                        type="number"
                                        name="discount"
                                        id="discount"
                                        placeholder="Enter discount"
                                        value={newInvoice.discount}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="gstRate"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        GST Rate (Optional)
                                    </label>
                                    <select
                                        name="gstRate"
                                        id="gstRate"
                                        value={newInvoice.gstRate}
                                        className="w-full p-3 border border-gray-300 rounded-md text-black custom-input cursor-pointer"
                                        onChange={handleChange}
                                    >
                                        <option value="0">0%</option>
                                        <option value="5">5%</option>
                                        <option value="12">12%</option>
                                        <option value="18">18%</option>
                                        <option value="28">28%</option>
                                        <option value="35">35%</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label
                                        htmlFor="paidAmount"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Paid Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="paidAmount"
                                        id="paidAmount"
                                        placeholder="Enter paid amount"
                                        value={newInvoice.paidAmount}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                                <div className="form-group">
                                    <label
                                        htmlFor="remainingAmount"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Remaining Amount
                                    </label>
                                    <input
                                        type="number"
                                        name="remainingAmount"
                                        id="remainingAmount"
                                        value={newInvoice.remainingAmount}
                                        onChange={handleChange}
                                        className="w-full p-3 border border-gray-400 rounded-md text-black custom-input"
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
                            </div>

                            <div className="form-group">
                                <label
                                    htmlFor="status"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Status
                                </label>
                                <select
                                    name="status"
                                    id="status"
                                    value={newInvoice.status}
                                    onChange={(e) =>
                                        setNewInvoice({ ...newInvoice, status: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-300 rounded-md text-black custom-input cursor-pointer"
                                >
                                    <option value="paid">Paid</option>
                                    <option value="unpaid">Unpaid</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label
                                    htmlFor="date"
                                    className="text-sm font-medium text-gray-700"
                                >
                                    Invoice Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    id="date"
                                    value={newInvoice.date}
                                    onChange={(e) =>
                                        setNewInvoice({ ...newInvoice, date: e.target.value })
                                    }
                                    className="w-full p-3 border border-gray-300 rounded-md text-black custom-input cursor-pointer"
                                    required
                                />
                            </div>

                            <div className="flex justify-end mt-6">
                                <button
                                    type="submit"
                                    className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-400 w-full sm:w-auto text-sm sm:text-base"
                                >
                                    Add Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4">
                    <DialogHeader>
                        <DialogTitle>Update Lead</DialogTitle>
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
                                            <FormLabel>Contact Number</FormLabel>
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
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter valid email address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Company Address</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter full company address" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

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
                                                        const value = e.target.valueAsNumber || 0;
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
                                    name="gstNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter GST number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
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
                                                    <option value="Proposal">Proposal</option>
                                                    <option value="New">New</option>
                                                    <option value="Discussion">Discussion</option>
                                                    <option value="Demo">Demo</option>
                                                    <option value="Decided">Decided</option>
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
                                    name="date"
                                    render={({ field }) => (
                                        <div className="form-group">
                                            <label htmlFor="date" className="text-sm font-medium text-gray-700">
                                                Lead Date
                                            </label>
                                            <input
                                                type="date"
                                                name="date"
                                                id="date"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                                className="w-full p-3 border border-gray-300 rounded-md text-black"
                                                required
                                            />
                                        </div>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="endDate"
                                    render={({ field }) => (
                                        <div className="form-group">
                                            <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                                                Final Date
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                id="endDate"
                                                value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                onChange={(e) => field.onChange(new Date(e.target.value))}
                                                className="w-full p-3 border border-gray-300 rounded-md text-black"
                                                required
                                            />
                                        </div>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <textarea
                                                placeholder="Enter more details here..."
                                                {...field}
                                                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black resize-none"
                                                rows={3}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    "Update Lead"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent className="fixed left-1/2 top-[7rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6 
              sm:max-w-sm sm:p-4 xs:max-w-[90%] xs:p-3 xs:top-[5rem]">
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