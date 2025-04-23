"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, Menu, ArrowUp, ArrowDown, Ellipsis } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { SortDescriptor, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from "@heroui/react"
import axios from "axios";
import { Dropdown, DropdownItem, DropdownMenu, DropdownTrigger, Pagination, Tooltip } from "@heroui/react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface Account {
    _id: string;
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    accountType: string;
    IFSCCode: string;
    UpiId: string;
    createdAt: string;
}

const generateUniqueId = () => {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
};

const columns = [
    { name: "", uid: "selection", sortable: false, width: "120px" }, // Increased width
    { name: "#", uid: "index", sortable: false, width: "50px" },
    { name: "Bank Name", uid: "bankName", sortable: true, width: "120px" },
    { name: "Bank IFSC Code", uid: "IFSCCode", sortable: true, width: "120px" },
    { name: "Bank Account Holder Name", uid: "accountHolderName", sortable: true, width: "120px" },
    { name: "Bank Account Number", uid: "accountNumber", sortable: true, width: "120px" },
    { name: "Account Type", uid: "accountType", sortable: true, width: "120px" },
    { name: "UPI ID", uid: "UpiId", sortable: true, width: "100px" },
   
];

const INITIAL_VISIBLE_COLUMNS = ["selection", "index", "bankName", "accountHolderName", "accountNumber", "accountType", "IFSCCode", "UpiId"];

const accountSchema = z.object({
    bankName: z.string().nonempty({ message: "Required" }),
    IFSCCode: z.string().nonempty({ message: "Required" }),
    accountHolderName: z.string().nonempty({ message: "Required" }),
    accountNumber: z.string().nonempty({ message: "Required" }),
    accountType: z.enum(["Current", "Savings", "Other"], { message: "Required" }),
    UpiId: z.string().optional(),
});

export default function AccountTable() {
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [accounts, setLeads] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const fetchAccounts = React.useCallback(async () => {
        try {
            const response = await axios.get(
                `http://localhost:8000/api/v1/account/getAllAccounts`
            );
            let accountsData;
            if (typeof response.data === 'object' && 'data' in response.data) {
                accountsData = response.data.data;
            } else if (Array.isArray(response.data)) {
                accountsData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }
            if (!Array.isArray(accountsData)) {
                accountsData = [];
            }
            const sortedAccounts = [...accountsData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            const accountsWithKeys = sortedAccounts.map((account: Account) => ({
                ...account,
                key: account._id || generateUniqueId()
            }));
            setLeads(accountsWithKeys);
            setError(null);
        } catch (error) {
            console.error("Error fetching accounts:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch accounts: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch account.");
            }
            setLeads([]);
        }
    }, []);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);

    const form = useForm<z.infer<typeof accountSchema>>({
        resolver: zodResolver(accountSchema),
        defaultValues: {
            accountHolderName: "",
            bankName: "",
            accountNumber: "",
            accountType: "Current",
            IFSCCode: "",
            UpiId: ""
        },
    })

    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns;
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
                    UpiId: account.UpiId
                };
                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }
        return filteredLeads;
    }, [accounts, filterValue, hasSearchFilter]);

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

    const handleEditClick = React.useCallback((account: Account) => {
        setSelectedAccount(account);
        form.reset({
            accountHolderName: account.accountHolderName,
            bankName: account.bankName,
            accountNumber: account.accountNumber,
            accountType: account.accountType as "Current" | "Savings" | "Other",
            IFSCCode: account.IFSCCode,
            UpiId: account.UpiId
        });
        setIsEditOpen(true);
    }, [form]);

    const handleDeleteClick = React.useCallback((account: Account) => {
        setSelectedAccount(account);
        setIsDeleteDialogOpen(true);
    }, []);

    const handleDeleteConfirm = async () => {
        if (!selectedAccount?._id) return;
        try {
            const response = await fetch(`http://localhost:8000/api/v1/account/deleteAccount/${selectedAccount._id}`, {
                method: "DELETE",
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to delete Account");
            }
            toast({
                title: "Account Deleted",
                description: "The account has been successfully deleted",
            });
            fetchAccounts();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to delete account",
                variant: "destructive",
            });
        } finally {
            setIsDeleteDialogOpen(false);
            setSelectedAccount(null);
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
                description: "The account has been successfully updated",
            });
            setIsEditOpen(false);
            setSelectedAccount(null);
            form.reset();
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

    const renderCell = React.useCallback((account: Account, columnKey: string, index: number) => {
        const cellValue = account[columnKey as keyof Account];
    
        if (columnKey === "selection") {
            return (
                <div className="flex items-center gap-2">
                    {/* Ellipsis dropdown menu */}
                    <Dropdown>
                        <DropdownTrigger>
                            <Button variant="ghost" size="sm" className="p-1">
                                <Ellipsis className="h-4 w-4 text-gray-500" />
                            </Button>
                        </DropdownTrigger>
                        <DropdownMenu>
                            <DropdownItem 
                                onClick={() => handleEditClick(account)}
                                className="flex items-center gap-2"
                            >
                                <Edit className="h-4 w-4" />
                                <span>Edit</span>
                            </DropdownItem>
                            <DropdownItem 
                                onClick={() => handleDeleteClick(account)}
                                className="flex items-center gap-2 text-red-600"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span>Delete</span>
                            </DropdownItem>
                        </DropdownMenu>
                    </Dropdown>
    
                    {/* Checkbox */}
                    <input
                        type="checkbox"
                        checked={selectedRows.has(account._id)}
                        onChange={(e) => {
                            const newSelection = new Set(selectedRows);
                            if (e.target.checked) {
                                newSelection.add(account._id);
                            } else {
                                newSelection.delete(account._id);
                            }
                            setSelectedRows(newSelection);
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            );
        }
        if (columnKey === "index") {
            return index + 1;
        }

        if ((columnKey === "date" || columnKey === "endDate") && cellValue) {
            return formatDate(cellValue);
        }

        if (columnKey === "UpiId") {
            return cellValue || "N/A";
        }

       

        return cellValue;
    }, [handleEditClick, handleDeleteClick, selectedRows]);

    const renderHeaderCell = (column: any) => {
        if (column.uid === "selection") {
               return (
                   <input
                       type="checkbox"
                       checked={selectedRows.size === sortedItems.length && sortedItems.length > 0}
                       onChange={(e) => {
                           const newSelection = new Set<string>();
                           if (e.target.checked) {
                               sortedItems.forEach(item => newSelection.add(item._id));
                           }
                           setSelectedRows(newSelection);
                       }}
                       className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                   />
               );
           }
          

        if (!column.sortable) {
            return column.name;
        }


        return (
            <Dropdown>
                <DropdownTrigger>
                    <div className="flex items-center gap-1 cursor-pointer">
                        <span>{column.name}</span>
                        <Menu className="h-4 w-4 ml-2" />
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
                </DropdownMenu>
            </Dropdown>
        );


    };

    // Add this sort handler
    const handleSort = (column: string, direction: 'ascending' | 'descending') => {
        setSortDescriptor({
            column,
            direction
        });
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, accounts.length, router]);

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
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Account Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Store client / customer&apos;s bank account details</h1>
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
                                        <TableRow key={item._id}>
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

            <Dialog open={isEditOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsEditOpen(false);
                }
            }}>
                <DialogContent className="sm:max-w-[700px] max-h-[80vh] sm:max-h-[700px] overflow-auto hide-scrollbar p-4"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}>
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
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
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
                                    name="UpiId"
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
                            Are you sure you want to delete this account?
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
            {error && <div className="text-red-500">{error}</div>}
        </div>
    );
}