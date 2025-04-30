"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, Printer, SquareUser, Menu, ArrowUp, ArrowDown, Ellipsis, Filter, X, EyeOff } from "lucide-react"
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
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "customerName", "contactNumber", "emailAddress", "address", "gstNumber", "productName", "amount", "discount", "gstRate", "status", "date", "endDate", "totalWithoutGst", "totalWithGst", "paidAmount", "remainingAmount"];

const formSchema = invoiceSchema;

const filterSchema = z.object({
    companyName: z.string().optional(),
    customerName: z.string().optional(),
    productName: z.string().optional(),
    status: z.string().optional(),
    contactNumber: z.string().optional(),
    emailAddress: z.string().optional(),
});
export default function InvoiceTable() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
 const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]); const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const [filteredLeads, setFilteredLeads] = useState([]);

    const fetchInvoices = React.useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:8000/api/v1/invoice/getUnpaidInvoices"
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
   const [sortDescriptor, setSortDescriptor] = React.useState<{
          column: string | null;
          direction: 'ascending' | 'descending' | null;
      }>({
          column: null,
          direction: null
      });
      const [page, setPage] = useState(1);
      const [alphabetFilter, setAlphabetFilter] = React.useState<string | null>(null);
      const [conditions, setConditions] = useState<Record<string, { operator: string; value?: string }>>({});
  
      const filterFields = [
        { name: "companyName", label: "Company Name" },
        { name: "customerName", label: "Customer Name" },
        { name: "productName", label: "Product Name" },
        { name: "status", label: "Status" },
        { name: "contactNumber", label: "Contact Number" },
        { name: "emailAddress", label: "Email Address" },
    ];

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

    const filterForm = useForm<z.infer<typeof filterSchema>>({
            resolver: zodResolver(filterSchema),
            defaultValues: {
                companyName: "",
                customerName: "",
                productName: "",
                status: "",
                contactNumber: "",
                emailAddress: ""
            },
        });
    const hasSearchFilter = Boolean(filterValue);
    const hasAppliedFilters = Object.keys(appliedFilters).length > 0;

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns;
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

 const filteredItems = React.useMemo(() => {
         let filteredDeals = [...invoices];
 
         // Apply search filter
         if (filterValue) {
             filteredDeals = filteredDeals.filter(invoices =>
                 Object.values(invoices).some(value =>
                     String(value).toLowerCase().includes(filterValue.toLowerCase())
                 )
             );
         }
 
         // Apply advanced filters
         if (Object.keys(conditions).length > 0) {
             filteredDeals = filteredDeals.filter(invoices => {
                 return Object.entries(conditions).every(([field, condition]) => {
                     const dealValue = String(invoices[field as keyof Invoice] ?? "").toLowerCase();
                     const filterValue = condition.value ? condition.value.toLowerCase() : "";
 
                     switch (condition.operator) {
                         case "is":
                             return dealValue === filterValue;
                         case "isn't":
                             return dealValue !== filterValue;
                         case "contains":
                             return dealValue.includes(filterValue);
                         case "doesn't contain":
                             return !dealValue.includes(filterValue);
                         case "starts with":
                             return dealValue.startsWith(filterValue);
                         case "ends with":
                             return dealValue.endsWith(filterValue);
                         case "is empty":
                             return dealValue === "";
                         case "is not empty":
                             return dealValue !== "";
                         default:
                             return true;
                     }
                 });
             });
         }
 
         return filteredDeals;
     }, [invoices, filterValue, conditions]);

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
            date: invoice.date ? new Date(invoice.date) : new Date(),
            totalWithoutGst: invoice.totalWithoutGst || 0,
            totalWithGst: invoice.totalWithGst || 0,
            paidAmount: invoice.paidAmount || 0,
            remainingAmount: invoice.remainingAmount || 0,
        });
        setIsEditDialogOpen(true);
    }, [form]);

    const handleDeleteClick = React.useCallback(async (invoice: Invoice) => {
        if (!window.confirm("Are you sure you want to delete this invoice?")) {
            return;
        }
        try {
            const response = await fetch(`http://localhost:8000/api/v1/invoice/deleteInvoice/${invoice._id}`, {
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
        }
    }, [fetchInvoices]);

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
                description: "The invoice has been successfully updated.",
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

      const updateFilter = (index: number, updatedFilter: typeof filters[number]) => {
            const newFilters = [...filters];
            newFilters[index] = updatedFilter;
            setFilters(newFilters);
        };
    
        const addNewFilter = () => {
            setFilters([...filters, { field: "", operator: "", value: "" }]);
        };
    
    
    
        const onFilterSubmit = (values: z.infer<typeof filterSchema>) => {
            const newFilters: Record<string, string> = {};
    
            Object.entries(values).forEach(([key, value]) => {
                if (value) {
                    newFilters[key] = value;
                }
            });
    
            setAppliedFilters(newFilters);
            setIsFilterOpen(false);
        };
    
        const clearFilters = () => {
            setFilters([]);
            setConditions({});
            setFilterValue("");
            setPage(1);
        };
    
        const applyFilters = () => {
            const newConditions: Record<string, { operator: string; value?: string }> = {};
    
            filters.forEach(filter => {
                if (filter.field && filter.operator) {
                    // Remove any whitespace from field name
                    const fieldName = filter.field.trim();
    
                    newConditions[fieldName] = {
                        operator: filter.operator,
                        value: ["is empty", "is not empty"].includes(filter.operator) ? undefined : filter.value
                    };
                }
            });
    
            setConditions(newConditions);
            setIsFilterOpen(false);
        };
    
    
        const removeFilter = (key: string) => {
            const newFilters = { ...appliedFilters };
            delete newFilters[key];
            setAppliedFilters(newFilters);
            filterForm.setValue(key as any, "");
        };
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
                    </div>
                );
            case "contactNumber":
            case "emailAddress":
            case "address":
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
    }, [handleEditClick, handleDeleteClick]);

     const renderHeaderCell = (column: any) => {
            if (column.uid === "selection") {
                const someSelected = sortedItems.some(item => selectedRows.has(item._id));
                const allSelected = sortedItems.length > 0 && sortedItems.every(item => selectedRows.has(item._id));
    
                return (
                    <input
                        type="checkbox"
                        checked={allSelected}
                        ref={input => {
                            if (input) {
                                input.indeterminate = someSelected && !allSelected;
                            }
                        }}
                        onChange={(e) => {
                            const newSelection = new Set(selectedRows);
                            if (e.target.checked) {
                                sortedItems.forEach(item => newSelection.add(item._id));
                            } else {
                                sortedItems.forEach(item => newSelection.delete(item._id));
                            }
                            setSelectedRows(newSelection);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                );
            }
    
            return (
                <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{column.name}</span>
                        </div>
                        {column.sortable && (
                            <Dropdown>
                                <DropdownTrigger>
                                    <div className="flex items-center gap-1 cursor-pointer">
                                        <Menu className="h-4 w-4 text-gray-600" />
                                    </div>
                                </DropdownTrigger>
                                <DropdownMenu
                                    aria-label="Sort Options"
                                    className="bg-white shadow-lg border border-gray-200 rounded-xl w-44 p-2 z-[999]"
                                >
                                    <DropdownItem
                                        key="asc"
                                        onClick={() => handleSort(column.uid, "ascending")}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
                                    >
                                        <ArrowUp className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700">Ascending</span>
                                    </DropdownItem>
                                    <DropdownItem
                                        key="desc"
                                        onClick={() => handleSort(column.uid, "descending")}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
                                    >
                                        <ArrowDown className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700">Descending</span>
                                    </DropdownItem>
                                    <DropdownItem
                                        key="none"
                                        onClick={() => setSortDescriptor({ column: null, direction: null })}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 text-sm"
                                    >
                                        <X className="h-4 w-4 text-gray-500" />
                                        <span className="text-gray-700">Unsort</span>
                                    </DropdownItem>
    
                                    <DropdownItem
                                        key="hide"
                                        onClick={() => {
                                            setVisibleColumns((prev) => {
                                                const updated = new Set(prev);
                                                updated.delete(column.uid);
                                                return updated;
                                            });
                                        }}
                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-red-100 text-sm text-red-600"
                                    >
                                        <EyeOff className="h-4 w-4" />
                                        <span>Hide Column</span>
                                    </DropdownItem>
                                </DropdownMenu>
                            </Dropdown>
                        )}
                    </div>
                </div>
            );
        };
    
        const handleSort = (column: string, direction: 'ascending' | 'descending') => {
            if (sortDescriptor.column === column && sortDescriptor.direction === direction) {
                setSortDescriptor({ column: null, direction: null });
            } else {
                setSortDescriptor({ column, direction });
            }
        };
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
                           <Button
                                                   variant="outline"
                                                   onClick={() => setIsFilterOpen(true)}
                                                   className="flex items-center gap-2"
                                               >
                                                   <Filter className="h-4 w-4" />
                                                   {hasAppliedFilters && (
                                                       <span className="h-5 w-5 bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-full flex items-center justify-center text-xs">
                                                           {Object.keys(appliedFilters).length}
                                                       </span>
                                                   )}
                                               </Button>
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
                    </div>
                </div>
                  {hasAppliedFilters && (
                                    <div className="flex flex-wrap gap-2">
                                        {Object.keys(conditions).length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {Object.entries(conditions).map(([field, condition]) => (
                                                    <div key={field} className="flex items-center bg-gray-100 rounded-full px-3 py-1 text-sm">
                                                        <span className="capitalize">
                                                            {field}: {condition.operator} {condition.value || ""}
                                                        </span>
                                                        <button
                                                            onClick={() => {
                                                                const newConditions = { ...conditions };
                                                                delete newConditions[field];
                                                                setConditions(newConditions);
                                                            }}
                                                            className="ml-2 text-gray-500 hover:text-gray-700"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    onClick={clearFilters}
                                                    className="text-sm text-[hsl(339.92deg_91.04%_52.35%)] hover:underline flex items-center"
                                                >
                                                    Clear all
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {invoices.length} reminder</span>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, invoices.length]);

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
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Reminder Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Check your client / customer&apos;s due payment</h1>
                               <Table
                                                            isHeaderSticky
                                                            aria-label="Accounts table with custom cells, pagination and sorting"
                                                            bottomContent={bottomContent}
                                                            bottomContentPlacement="outside"
                                                            classNames={{
                                                                wrapper: "max-h-[382px] overflow-y-auto",
                                                                th: "border-r border-gray-200 last:border-r-0 bg-gray-100",
                                                                td: "border-r border-gray-200 last:border-r-0",
                                                            }}
                                                            topContent={topContent}
                                                            topContentPlacement="outside"
                                                            sortDescriptor={sortDescriptor}
                                                            onSortChange={setSortDescriptor}
                                                            onRowAction={(key) => {
                                                                console.log("Row clicked:", key);
                                                            }}
                                                        >
                                                            <TableHeader columns={headerColumns}>
                                                                {(column) => (
                                                                    <TableColumn
                                                                        key={column.uid}
                                                                        align={column.uid === "actions" ? "center" : "start"}
                                                                        allowsSorting={column.sortable}
                                                                        className="py-2 px-3"
                                                                    >
                                                                        {renderHeaderCell(column)}
                                                                    </TableColumn>
                                                                )}
                                                            </TableHeader>
                                                            <TableBody emptyContent={"No accounts found"} items={sortedItems}>
                                                                {(item: Account, index: number) => (
                                                                    <TableRow
                                                                        key={item._id}
                                                                        onClick={() => {
                                                                            const newSelection = new Set(selectedRows);
                                                                            if (newSelection.has(item._id)) {
                                                                                newSelection.delete(item._id);
                                                                            } else {
                                                                                newSelection.add(item._id);
                                                                            }
                                                                            setSelectedRows(newSelection);
                                                                        }}
                                                                        className="cursor-pointer"
                                                                    >
                                                                        {(columnKey) => (
                                                                            <TableCell
                                                                                style={{ fontSize: "12px", padding: "8px" }}
                                                                                className="border-r border-gray-200 last:border-r-0"
                                                                            >
                                                                                {renderCell(item, columnKey.toString(), index)}
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Update Reminder</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-6">
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
                                            <FormLabel>Customer Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter customer name" {...field} />
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
                                                <Input placeholder="Enter contact number" {...field} />
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
                                                <Input placeholder="Enter email address" {...field} />
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
                                            <FormLabel>Address</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter address" {...field} />
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
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter amount" type="number" {...field} />
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
                                            <FormLabel>Discount</FormLabel>
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
                                                <Input placeholder="Enter GST rate" type="number" {...field} />
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
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Unpaid">Unpaid</option>
                                                    <option value="Paid">Paid</option>
                                                    <option value="Pending">Pending</option>
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
                                        <FormItem>
                                            <FormLabel>Invoice Date</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    value={field.value ? format(field.value, "yyyy-MM-dd") : ""}
                                                    onChange={(e) => {
                                                        const selectedDate = e.target.value ? new Date(e.target.value) : null;
                                                        field.onChange(selectedDate);
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
                                    name="totalWithoutGst"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total Without GST</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter total without GST" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="totalWithGst"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Total With GST</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter total with GST" {...field} />
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
                                                <Input placeholder="Enter remaining amount" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
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

                 <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                                                    <DialogContent className="sm:max-w-[500px]">
                                                        <DialogHeader>
                                                            <DialogTitle>Filter Accounts</DialogTitle>
                                                            <DialogDescription>
                                                                Apply filters to narrow down your search results
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <div className="space-y-4">
                                                            {filters.map((filter, index) => (
                                                                <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                                                    <div className="col-span-4">
                                                                        <select
                                                                            value={filter.field}
                                                                            onChange={(e) => {
                                                                                const newFilters = [...filters];
                                                                                newFilters[index].field = e.target.value;
                                                                                setFilters(newFilters);
                                                                            }}
                                                                            className="w-full p-2 border rounded"
                                                                        >
                                                                            <option value="">Select Field</option>
                                                                            {filterFields.map((field) => (
                                                                                <option key={field.name} value={field.name}>
                                                                                    {field.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                    <div className="col-span-3">
                                                                        <select
                                                                            value={filter.operator}
                                                                            onChange={(e) => {
                                                                                const newFilters = [...filters];
                                                                                newFilters[index].operator = e.target.value;
                                                                                setFilters(newFilters);
                                                                            }}
                                                                            className="w-full p-2 border rounded"
                                                                        >
                                                                            <option value="">Operator</option>
                                                                            <option value="is">is</option>
                                                                            <option value="isn't">isn't</option>
                                                                            <option value="contains">contains</option>
                                                                            <option value="doesn't contain">doesn't contain</option>
                                                                            <option value="starts with">starts with</option>
                                                                            <option value="ends with">ends with</option>
                                                                            <option value="is empty">is empty</option>
                                                                            <option value="is not empty">is not empty</option>
                                                                        </select>
                                                                    </div>
                                                                    <div className="col-span-4">
                                                                        {!["is empty", "is not empty"].includes(filter.operator) && (
                                                                            <Input
                                                                                value={filter.value}
                                                                                onChange={(e) => {
                                                                                    const newFilters = [...filters];
                                                                                    newFilters[index].value = e.target.value;
                                                                                    setFilters(newFilters);
                                                                                }}
                                                                                placeholder="Value"
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    <div className="col-span-1">
                                                                        <button
                                                                            onClick={() => {
                                                                                const newFilters = [...filters];
                                                                                newFilters.splice(index, 1);
                                                                                setFilters(newFilters);
                                                                            }}
                                                                            className="text-red-500"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => setFilters([...filters, { field: "", operator: "", value: "" }])}
                                                            >
                                                                + Add Filter
                                                            </Button>
                                                            <div className="flex justify-end gap-2">
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={clearFilters}
                                                                >
                                                                    Clear All
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    onClick={applyFilters}
                                                                    className="bg-[hsl(339.92deg_91.04%_52.35%)]"
                                                                >
                                                                    Apply Filters
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
            {error && <div className="text-red-500 p-2">{error}</div>}
        </div>
    );
}
