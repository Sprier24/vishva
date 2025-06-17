"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, ReceiptText, SquareUser } from "lucide-react"
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

interface Deal {
    id: string;
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

const contactSchema = z.object({
    companyName: z.string().nonempty({ message: "Required" }),
    customerName: z.string().nonempty({ message: "Required" }),
    contactNumber: z
        .string()
        .regex(/^\d*$/, { message: "Contact number must be numeric" })
        .nonempty({ message: "Required" }),
    emailAddress: z.string().email({ message: "Required" }),
    address: z.string().nonempty({ message: "Required" }),
    gstNumber: z.string().optional(),
    description: z.string().optional(),
});

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
        name: "Deal Date",
        uid: "date",
        sortable: true,
        width: "170px",
        render: (row: Deal) => formatDate(row.date),
    }
    ,
    {
        name: "Final Date",
        uid: "endDate",
        sortable: true,
        width: "120px",
        render: (row: Deal) => formatDate(row.endDate)
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
    companyName: z.string().nonempty({ message: "Required" }),
    customerName: z.string().nonempty({ message: "Required" }),
    contactNumber: z
        .string()
        .regex(/^\d*$/, { message: "Contact number must be numeric" })
        .nonempty({ message: "Required" }),
    emailAddress: z.string().email({ message: "Invalid email address" }),
    address: z.string().nonempty({ message: "Required" }),
    productName: z.string().nonempty({ message: "Required" }),
    amount: z.number().positive({ message: "Required" }),
    gstNumber: z.string().optional(),
    status: z.enum(["Proposal", "New", "Discussion", "Demo", "Decided"]),
    date: z.date().refine((val) => !isNaN(val.getTime()), { message: "Required" }),
    endDate: z.date().refine((val) => !isNaN(val.getTime()), { message: "Required" }),
    notes: z.string().optional(),
    isActive: z.boolean(),
});

export default function DealTable() {
    const [Deals, setDeals] = useState<Deal[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [isContactFormVisible, setIsContactFormVisible] = useState(false);
    const [isInvoiceFormVisible, setIsInvoiceFormVisible] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchDeal = React.useCallback(async () => {
        try {
            const response = await axios.get(
                '/api/deal'
            );
            let dealsData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                dealsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                dealsData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }
            if (!Array.isArray(dealsData)) {
                dealsData = [];
            }
            const sortedDeals = [...dealsData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const dealsWithKeys = sortedDeals.map((deal: Deal) => ({
                ...deal,
                key: deal.id || generateUniqueId()
            }));
            setDeals(dealsWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching deals:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch deals: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch deals.");
            }
            setDeals([]);
        }
    }, []);

    useEffect(() => {
        fetchDeal();
    }, [fetchDeal]);

    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);

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

    const contactform = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            companyName: "",
            customerName: "",
            contactNumber: "",
            emailAddress: "",
            address: "",
            gstNumber: "",
            description: "",
        },
    });

    const invoiceformSchema = invoiceSchema;
    const invoiceform = useForm<z.infer<typeof invoiceSchema>>({
        resolver: zodResolver(invoiceformSchema),
        defaultValues: {
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
            status: "Unpaid",
            date: new Date(),
            totalWithoutGst: 0,
            totalWithGst: 0,
            paidAmount: 0,
            remainingAmount: 0,
        }
    })

    const handleAddContactClick = React.useCallback((deal: Deal) => {
        setIsContactFormVisible(true);
        contactform.reset({
            companyName: deal.companyName,
            customerName: deal.customerName,
            contactNumber: deal.contactNumber || "",
            emailAddress: deal.emailAddress,
            address: deal.address,
            gstNumber: deal.gstNumber,
            description: "",
        });
    }, [contactform]);

    const handleAddInvoice = React.useCallback((deal: Deal) => {
        setIsInvoiceFormVisible(true);
        invoiceform.reset({
            companyName: deal.companyName,
            customerName: deal.customerName,
            contactNumber: deal.contactNumber || "",
            emailAddress: deal.emailAddress,
            address: deal.address,
            gstNumber: deal.gstNumber,
            productName: deal.productName,
            amount: parseFloat(deal.amount) || 0,
            discount: 0,
            gstRate: 0,
            status: "Unpaid",
            date: new Date(),
            totalWithoutGst: 0,
            totalWithGst: 0,
            paidAmount: 0,
            remainingAmount: 0,
        });
    }, [invoiceform]);

    const handleInvoiceSubmit = async (values: z.infer<typeof invoiceSchema>) => {
        try {
            setIsSubmitting(true);
            const {
                totalWithoutGst,
                totalWithGst,
                remainingAmount
            } = calculateGST(
                values.amount,
                values.discount ?? 0,
                values.gstRate ?? 0,
                Number(values.paidAmount) || 0
            );
            const invoiceData = {
                ...values,
                totalWithoutGst,
                totalWithGst,
                remainingAmount,
                date: format(values.date, "yyyy-MM-dd")
            };
              const response = await fetch("/api/invoice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
            const data = await response.json();
            toast({
                title: "Invoice Submmited",
                description: "The invoice has been successfully created",
            });
            setIsInvoiceFormVisible(false);
            invoiceform.reset();
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast({
                title: "Error",
                description: "There was an error creating the invoice",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const calculateGST = (
        amount: number,
        discount: number,
        gstRate: number,
        paidAmount: number
    ) => {
        const discountedAmount = amount - (amount * (discount / 100));
        const gstAmount = discountedAmount * (gstRate / 100);
        const totalWithoutGst = discountedAmount;
        const totalWithGst = discountedAmount + gstAmount;
        const remainingAmount = totalWithGst - paidAmount;
        return {
            discountedAmount,
            gstAmount,
            totalWithoutGst,
            totalWithGst,
            remainingAmount
        };
    };

    const updateCalculatedFields = () => {
        const values = invoiceform.getValues();
        const {
            totalWithoutGst,
            totalWithGst,
            remainingAmount
        } = calculateGST(
            values.amount,
            values.discount ?? 0,
            values.gstRate ?? 0,
            Number(values.paidAmount) || 0
        );
        invoiceform.setValue('totalWithoutGst', totalWithoutGst);
        invoiceform.setValue('totalWithGst', totalWithGst);
        invoiceform.setValue('remainingAmount', remainingAmount);
    };

    const handleContactSubmit = async (values: z.infer<typeof contactSchema>) => {
        try {
            setIsSubmitting(true);
             const response = await fetch("/api/contact", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });
             const data = await response.json();
              if (!response.ok) {
                     throw new Error(data.error || "Failed to submit the contact.");
                   }
            setIsContactFormVisible(false);
            contactform.reset();
            toast({
                title: "Contact Submitted",
                description: "The contact has been successfully created",
            });
        } catch (error) {
            console.error("Error saving contact:", error);
            toast({
                title: "Error",
                description: "There was an error creating the contact",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns;
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredDeals = [...Deals];
        if (hasSearchFilter) {
            filteredDeals = filteredDeals.filter((Deals) => {
                const searchableFields = {
                    companyName: Deals.companyName,
                    customerName: Deals.customerName,
                    contactNumber: Deals.contactNumber,
                    emailAddress: Deals.emailAddress,
                    address: Deals.address,
                    gstNumber: Deals.gstNumber,
                    productName: Deals.productName,
                    amount: Deals.amount,
                    date: Deals.date,
                    endDate: Deals.endDate,
                    notes: Deals.notes,
                    status: Deals.status,
                };
                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }
        return filteredDeals;
    }, [Deals, filterValue, hasSearchFilter]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;
        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Deal];
            const second = b[sortDescriptor.column as keyof Deal];
            const cmp = first < second ? -1 : first > second ? 1 : 0;
            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

    const handleEditClick = React.useCallback((Deals: Deal) => {
        setSelectedDeal(Deals);
        form.reset({
            companyName: Deals.companyName,
            customerName: Deals.customerName,
            emailAddress: Deals.emailAddress,
            contactNumber: Deals.contactNumber || "",
            address: Deals.address,
            productName: Deals.productName,
            amount: parseFloat(Deals.amount),
            gstNumber: Deals.gstNumber,
            status: Deals.status as "New" | "Discussion" | "Demo" | "Proposal" | "Decided",
            date: Deals.date ? new Date(Deals.date) : undefined,
            endDate: Deals.endDate ? new Date(Deals.endDate) : undefined,
            notes: Deals.notes || "",
            isActive: Deals.isActive === "true",
        });
        setIsEditOpen(true);
    }, [form]);

    const handleDeleteClick = React.useCallback((Deals: Deal) => {
        setSelectedDeal(Deals);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = React.useCallback(async () => {
           if (!selectedDeal?.id) return;
           try {
               const response = await fetch(`/api/deal?id=${selectedDeal.id}`, {
                   method: "DELETE",
               });
               if (!response.ok) {
                   const errorData = await response.json();
                   throw new Error(errorData.message || "Failed to delete deal");
               }
               toast({
                   title: "Deal Deleted",
                   description: "The deal has been successfully deleted",
               });
               fetchDeal();
           } catch (error) {
               toast({
                   title: "Error",
                   description: error instanceof Error ? error.message : "Failed to delete lead",
                   variant: "destructive",
               });
           } finally {
               setIsDeleteDialogOpen(false);
               setSelectedDeal(null);
           }
       }, [selectedDeal,]);
   
       const [isSubmitting, setIsSubmitting] = useState(false)
   
       async function onEdit(values: z.infer<typeof formSchema>) {
           if (!selectedDeal?.id) return;
           setIsSubmitting(true);
   
           try {
               const response = await fetch(`/api/deal?id=${selectedDeal.id}`, {
                   method: "PUT",
                   headers: { "Content-Type": "application/json" },
                   body: JSON.stringify({
                       ...values,
                       isActive: values.isActive ? 1 : 0
                   }),
               });
   
               if (!response.ok) {
                   const errorData = await response.json();
                   throw new Error(errorData.message || "Failed to update deal");
               }
   
               const result = await response.json();
   
               toast({
                   title: "Deal Updated",
                   description: "The deal has been successfully updated",
               });
   
               setIsEditOpen(false);
               setSelectedDeal(null);
               form.reset();
               fetchDeal();
               return result;
           } catch (error) {
               console.error("Update error:", error);
               toast({
                   title: "Error",
                   description: error instanceof Error ? error.message : "Update failed",
                   variant: "destructive",
               });
               throw error;
           } finally {
               setIsSubmitting(false);
           }
       }

    const renderCell = React.useCallback((Deals: Deal, columnKey: string) => {
        const cellValue = Deals[columnKey as keyof Deal];
        if ((columnKey === "date" || columnKey === "endDate") && cellValue) {
            return formatDate(cellValue);
        }
        if (columnKey === "gstNumber") {
            return cellValue || "N/A";
        }
        if (columnKey === "notes") {
            return cellValue || "N/A";
        }
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip>
                        <span
                            className="text-lg text-default-400 cursor-pointer active:opacity-50"
                            onClick={() => handleEditClick(Deals)}
                        >
                            <Edit className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDeleteClick(Deals)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleAddContactClick(Deals)}
                        >
                            <ReceiptText className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleAddInvoice(Deals)}
                        >
                            <SquareUser className="h-4 w-4" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return cellValue;
    }, [handleAddContactClick, handleAddInvoice, handleDeleteClick, handleEditClick]);

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
                            onClick={() => router.push("/deal")}
                        >
                            Create Deal
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {Deals.length} deal</span>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, Deals.length, router]);

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

    return (
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15 max-w-screen-xl">
            <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-12">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Deal Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Create a new deal for your company</h1>
                            <Table
                                isHeaderSticky
                                aria-label="Deals table with custom cells, pagination and sorting"
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
                                <TableBody emptyContent={"Create deal and add data"} items={sortedItems}>
                                    {(item) => (
                                        <TableRow key={item.id}>
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
                            Are you sure you want to delete this deal?
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

            <Dialog open={isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Update Deal</DialogTitle>
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
                                                <Input placeholder="Enter client / customer Name" {...field} />
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
                                        <FormLabel>Cpmpany Address</FormLabel>
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
                                    "Update Deal"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isContactFormVisible} onOpenChange={(open) => {
                if (!open) {
                    setIsContactFormVisible(false);
                }
            }}>
                <DialogContent className="w-[100vw] max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Create Contact</DialogTitle>
                    </DialogHeader>
                    <Form {...contactform}>
                        <form onSubmit={contactform.handleSubmit(handleContactSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={contactform.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter company name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={contactform.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client / Customer Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter client / customer Name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={contactform.control}
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
                                    control={contactform.control}
                                    name="emailAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter valid email address"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={contactform.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Address</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter company address"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={contactform.control}
                                    name="gstNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    className="w-full"
                                                    placeholder="Enter GST number"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={contactform.control}
                                name="description"
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
                                        Submitting Contact...
                                    </>
                                ) : (
                                    "Create Contact"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isInvoiceFormVisible} onOpenChange={(open) => {
                if (!open) {
                    setIsInvoiceFormVisible(false);
                }
            }}>
                <DialogContent className="w-[100vw] max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Create Invoice</DialogTitle>
                    </DialogHeader>
                    <Form {...invoiceform}>
                        <form onSubmit={invoiceform.handleSubmit(handleInvoiceSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={invoiceform.control}
                                    name="companyName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter company name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="customerName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Client / Customer Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter client / customer name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={invoiceform.control}
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
                                    control={invoiceform.control}
                                    name="emailAddress"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter valid email address"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={invoiceform.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Company Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter company address"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="gstNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Number (Optional)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter GST number"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={invoiceform.control}
                                    name="productName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Product Name</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter product name"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter amount"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.valueAsNumber || "";
                                                        field.onChange(value);
                                                        updateCalculatedFields();
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="discount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount (%)</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Enter discount"
                                                    {...field}
                                                    onChange={(e) => {
                                                        const value = e.target.valueAsNumber || "";
                                                        field.onChange(value);
                                                        updateCalculatedFields();
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="gstRate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>GST Rate (%)</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                    onChange={(e) => {
                                                        const value = Number(e.target.value);
                                                        field.onChange(value);
                                                        updateCalculatedFields();
                                                    }}
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
                                <FormField
                                    control={invoiceform.control}
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
                                                        updateCalculatedFields();
                                                    }}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="remainingAmount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Remaining Amount</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Remaining amount"
                                                    {...field}
                                                    readOnly
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <FormField
                                    control={invoiceform.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                >
                                                    <option value="Paid">Paid</option>
                                                    <option value="Unpaid">Unpaid</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={invoiceform.control}
                                    name="date"
                                    render={({ field }) => (
                                        <div className="form-group">
                                            <label htmlFor="date" className="text-sm font-medium text-gray-700">
                                                Invoice Date
                                            </label>
                                            <input
                                                type="date"
                                                name="endDate"
                                                id="endDate"
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
                                        Creating Invoice...
                                    </>
                                ) : (
                                    "Create Invoice"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
            {error && <div className="text-red-500 p-2">{error}</div>}
        </div>
    );
}




