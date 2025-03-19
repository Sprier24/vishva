"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import axios from "axios";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip, User } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface Account {
    _id: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    IFSCCode: string;
    UpiID: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0]; // Returns "YYYY-MM-DD"
};


const columns = [
    { name: "Bank Name", uid: "bankName", sortable: true, width: "120px" },
    { name: "Bank IFSC Code", uid: "IFSCCode", sortable: true, width: "120px" },
    { name: "Bank Account Holder Name", uid: "accountHolderName", sortable: true, width: "120px" },
    { name: "Bank Account Number", uid: "accountNumber", sortable: true, width: "120px" },
    { name: "Account Type", uid: "accountType", sortable: true, width: "120px" },
    { name: "UPI ID", uid: "UpiID", sortable: true, width: "100px" },
    { name: "Action", uid: "actions", sortable: true, width: "100px" },

];
const INITIAL_VISIBLE_COLUMNS = ["accountHolderName", "accountNumber", "bankName", "accountType", "IFSCCode", "UpiID", "actions"];

const accountSchema = z.object({
    bankName: z.string().min(2, { message: "Bank name is required." }),
    IFSCCode: z.string().min(2, { message: "Bank IFSC code is required." }),
    accountHolderName: z.string().min(2, { message: "Bank account holder name is required." }),
    accountNumber: z.string().min(2, { message: "Bank account number is required." }),
    accountType: z.enum(["Current", "Savings", "Other"], { message: "Account type is required." }),
    UpiId: z.string().min(2, { message: "UpiId is required." }),
});

export default function AccountTable() {
    const [accounts, setLeads] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Iterable<string> | 'all' | undefined>(undefined);
    const router = useRouter();


    const fetchAccounts = async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/account/getAllAccounts`
            );

            // Log the response structure
            console.log('Full API Response:', {
                status: response.status,
                data: response.data,
                type: typeof response.data,
                hasData: 'data' in response.data
            });

            // Handle the response based on its structure
            let accountsData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                // Response format: { data: [...leads] }
                accountsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                // Response format: [...leads]
                accountsData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }

            // Ensure leadsData is an array
            if (!Array.isArray(accountsData)) {
                accountsData = [];
            }

            // Map the data with safe key generation
            const accountsWithKeys = accountsData.map((account: Account) => ({
                ...account,
                key: account._id || generateUniqueId()
            }));

            setLeads(accountsWithKeys);
            setError(null); // Clear any previous errors
        } catch (error) {
            console.error("Error fetching accounts:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch accounts: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch account.");
            }
            setLeads([]); // Set empty array on error
        }
    };


    useEffect(() => {
        fetchAccounts();
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

    const handleSortChange = (column: string) => {
        setSortDescriptor((prevState) => {
            if (prevState.column === column) {

                return {
                    column,
                    direction: prevState.direction === "ascending" ? "descending" : "ascending",
                };
            } else {

                return {
                    column,
                    direction: "ascending",
                };
            }
        });
    };


    // Form setup
    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            accountType: "Current",
            IFSCCode: "",
            UpiID: ""
        },
    })

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns; // Check if all columns are selected
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredLeads = [...accounts];

        if (hasSearchFilter) {
            filteredLeads = filteredLeads.filter((account) => {
                const searchableFields = {
                    accountHolderName: account.accountHolderName,
                    accountNumber: account.accountNumber,
                    bankName: account.bankName,
                    accountType: account.accountType,
                    IFSCCode: account.IFSCCode,
                    UpiID: account.UpiID
                };

                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }

        return filteredLeads;
    }, [accounts, filterValue]);

    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Account];
            const second = b[sortDescriptor.column as keyof Account];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

    // Function to handle edit button click
    const handleEditClick = (account: Account) => {
        setSelectedAccount(account);
        // Pre-fill the form with lead data
        form.reset({
            _id: account._id,
            accountHolderName: account.accountHolderName,
            accountNumber: account.accountNumber,
            bankName: account.bankName,
            accountType: account.accountType,
            IFSCCode: account.IFSCCode,
            UpiID: account.UpiID
        });
        setIsEditOpen(true);
    };


    // Function to handle delete button click
    const handleDeleteClick = async (account: Account) => {
        if (!window.confirm("Are you sure you want to delete this lead?")) {
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/v1/account/deleteAccount/${account._id}`, {
                method: "DELETE",
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete Account");
            }

            toast({
                title: "Lead Deleted",
                description: "The account has been successfully deleted.",
            });

            // Refresh the leads list
            fetchAccounts();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete lead",
                variant: "destructive",
            });
        }
    };

    const [isSubmitting, setIsSubmitting] = useState(false)
    async function onEdit(values: z.infer<typeof accountSchema>) {
        if (!selectedAccount?._id) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8000/api/v1/account/updateAccount/${selectedAccount._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update account");
            }

            toast({
                title: "Account Updated",
                description: "The account has been successfully updated.",
            });

            // Close dialog and reset form
            setIsEditOpen(false);
            setSelectedAccount(null);
            form.reset();

            // Refresh the leads list
            fetchAccounts();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update account",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    }


    const renderCell = React.useCallback((account: Account, columnKey: string) => {
        const cellValue = account[columnKey as keyof Account];

        // Format dates if the column is "date" or "endDate"
        if ((columnKey === "date" || columnKey === "endDate") && cellValue) {
            return formatDate(cellValue);
        }
        // Render note column with a fallback message if there's no note
        if (columnKey === "notes") {
            return cellValue || "No note available";
        }
        // Render actions column with edit and delete buttons
        if (columnKey === "actions") {
            return (
                <div className="relative flex items-center gap-2">
                    <Tooltip content="Update">
                        <span
                            className="text-lg text-default-400 cursor-pointer active:opacity-50"
                            onClick={() => handleEditClick(account)}
                        >
                            <Edit className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip color="danger" content="Delete">
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDeleteClick(account)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </span>
                    </Tooltip>
                </div>
            );
        }

        // For all other columns, return the raw cell value
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
                            onClick={() => router.push("/Account")}
                        >
                            Create Account
                        </Button>
                    </div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-default-400 text-small">Total {accounts.length} account</span>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, accounts.length, onSearchChange]);

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
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Account Record</h1>
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
                                <TableBody emptyContent={"Create account and add data"} items={sortedItems}>
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

            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4">
                    <DialogHeader>
                        <DialogTitle>Update Account</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="bankName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter bank name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="IFSCCode"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank IFSC Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter bank IFSC code" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="accountHolderName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Account Holder Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter bank account holder name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="accountNumber"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Bank Account Number</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter bank account number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="accountType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Account Type</FormLabel>
                                            <FormControl>
                                                <select
                                                    {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                >
                                                    <option value="Savings">Savings</option>
                                                    <option value="Current">Current</option>
                                                    <option value="Other">Other</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="UpiID"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>UPI ID (Optional)</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter UPI ID" {...field} />
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
                                    "Update Account"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

        </div>

    );
}