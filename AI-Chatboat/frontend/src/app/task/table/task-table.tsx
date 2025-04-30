"use client";
import React, { useEffect, useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon, ReceiptText, SquareUser, Menu, ArrowUp, ArrowDown, Ellipsis, Filter, X, EyeOff } from "lucide-react"
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

interface Task {
    _id: string;
    subject: string;
    name: string;
    relatedTo: string;
    date: string;
    endDate: string;
    status: string;
    priority: string;
    assigned: string;
    notes: string;
    createdAt: string;
}

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

interface Column {
    name: string;
    uid: string;
    sortable: boolean;
    width: string;
    render?: (row: Task) => React.ReactNode;
}

const columns: Column[] = [
    { name: "Subject", uid: "subject", sortable: true, width: "120px" },
    { name: "Related To", uid: "relatedTo", sortable: true, width: "120px" },
    { name: "Name", uid: "name", sortable: true, width: "120px" },
    { name: "Assigned By", uid: "assigned", sortable: true, width: "150px" },
    { name: "Task Notes", uid: "notes", sortable: true, width: "100px" },
    {
        name: "Task Date",
        uid: "date",
        sortable: true,
        width: "170px",
        render: (row: Task) => formatDate(row.date),
    },
    {
        name: "Due Date",
        uid: "endDate",
        sortable: true,
        width: "170px",
        render: (row: Task) => formatDate(row.date),
    },
    { name: "Priority", uid: "priority", sortable: true, width: "100px" },
    { name: "Status", uid: "status", sortable: true, width: "100px" },
    { name: "Action", uid: "actions", sortable: true, width: "100px" },
];

const INITIAL_VISIBLE_COLUMNS = ["subject", "name", "assigned", "relatedTo", "date", "endDate", "status", "priority", "notes", "actions"];

const taskSchema = z.object({
    subject: z.string().nonempty({ message: "Required" }),
    relatedTo: z.string().nonempty({ message: "Required" }),
    name: z.string().nonempty({ message: "Required" }),
    assigned: z.string().nonempty({ message: "Required" }),
    date: z.date().optional(),
    endDate: z.date().optional(),
    status: z.enum(["Pending", "Resolved", "InProgress"]),
    priority: z.enum(["High", "Medium", "Low"]),
    notes: z.string().optional(),
});

const filterSchema = z.object({
    companyName: z.string().optional(),
    customerName: z.string().optional(),
    subject: z.string().optional(),
    status: z.string().optional(),
});
export default function TaskTable() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const router = useRouter();
    const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]); const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({});
    const [filteredLeads, setFilteredLeads] = useState([]);

    const fetchTasks = useCallback(async () => {
        try {
            const response = await axios.get(
                "http://localhost:8000/api/v1/task/getAllTasks"
            );

            console.log('Full API Response:', {
                status: response.status,
                data: response.data,
                type: typeof response.data,
                hasData: 'data' in response.data
            });

            let TaskData;
            if (typeof response.data === 'object' && 'data' in response.data) {

                TaskData = response.data.data;
            } else if (Array.isArray(response.data)) {

                TaskData = response.data;
            } else {
                console.error('Unexpected response format:', response.data);
                throw new Error('Invalid response format');
            }

            if (!Array.isArray(TaskData)) {
                TaskData = [];
            }

            const sortedTasks = [...TaskData].sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const TaskWithKeys = sortedTasks.map((task: Task) => ({
                ...task,
                key: task._id || generateUniqueId()
            }));

            setTasks(TaskWithKeys);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            if (axios.isAxiosError(error)) {
                toast({
                    title: "Error",
                    description: `Failed to fetch tasks: ${error.response?.data?.message || error.message}`,
                    variant: "destructive",
                });
            } else {
                toast({
                    title: "Error",
                    description: "Failed to fetch tasks.",
                    variant: "destructive",
                });
            }
            setTasks([]);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

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
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
    const [conditions, setConditions] = useState<Record<string, { operator: string; value?: string }>>({});

    const filterFields = [
        { name: " companyName", label: "Company Name" },
        { name: " customerName", label: "Customer Name" },
        { name: "subject", label: "Subject" },
        { name: " status", label: "Status" },
    ];
    const form = useForm<z.infer<typeof taskSchema>>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            name: "",
            subject: "",
            assigned: "",
            relatedTo: "",
            date: new Date(),
            endDate: undefined,
            status: "Pending",
            priority: "Medium",
            notes: "",
        },
    });

    const filterForm = useForm<z.infer<typeof filterSchema>>({
        resolver: zodResolver(filterSchema),
        defaultValues: {
            companyName: "",
            customerName: "",
            subject: "",
            status: ""
        },
    });
    const hasSearchFilter = Boolean(filterValue);
    const hasAppliedFilters = Object.keys(appliedFilters).length > 0;

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns;
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredDeals = [...tasks];

        // Apply search filter
        if (filterValue) {
            filteredDeals = filteredDeals.filter(task =>
                Object.values(task).some(value =>
                    String(value).toLowerCase().includes(filterValue.toLowerCase())
                )
            );
        }

        // Apply advanced filters
        if (Object.keys(conditions).length > 0) {
            filteredDeals = filteredDeals.filter(tasks => {
                return Object.entries(conditions).every(([field, condition]) => {
                    const dealValue = String(tasks[field as keyof Task] ?? "").toLowerCase();
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
    }, [tasks, filterValue, conditions]);


    const pages = Math.ceil(filteredItems.length / rowsPerPage);

    const items = React.useMemo(() => {
        const start = (page - 1) * rowsPerPage;
        const end = start + rowsPerPage;

        return filteredItems.slice(start, end);
    }, [page, filteredItems, rowsPerPage]);

    const sortedItems = React.useMemo(() => {
        return [...items].sort((a, b) => {
            const first = a[sortDescriptor.column as keyof Task];
            const second = b[sortDescriptor.column as keyof Task];
            const cmp = first < second ? -1 : first > second ? 1 : 0;

            return sortDescriptor.direction === "descending" ? -cmp : cmp;
        });
    }, [sortDescriptor, items]);

    const [isEditOpen, setIsEditOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleEditClick = useCallback((task: Task) => {
        setSelectedTask(task);
        form.reset({
            name: task.name,
            subject: task.subject,
            assigned: task.assigned,
            relatedTo: task.relatedTo,
            date: task.date ? new Date(task.date) : undefined,
            endDate: task.endDate ? new Date(task.endDate) : undefined,
            status: task.status as "Pending" | "InProgress" | "Resolved",
            priority: task.priority as "High" | "Medium" | "Low",
            notes: task.notes,
        });
        setIsEditOpen(true);
    }, [form]);

    const handleDeleteClick = useCallback((task: Task) => {
        setTaskToDelete(task);
        setIsDeleteConfirmationOpen(true);
    }, []);

    const [isSubmitting, setIsSubmitting] = useState(false)

    async function onEdit(values: z.infer<typeof taskSchema>) {
        if (!selectedTask?._id) return;

        setIsSubmitting(true);
        try {
            const response = await fetch(`http://localhost:8000/api/v1/task/updateTask/${selectedTask._id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(values),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to update task");
            }

            toast({
                title: "Task Updated",
                description: "The task has been successfully updated",
            });
            setIsEditOpen(false);
            setSelectedTask(null);
            form.reset();
            fetchTasks();
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "There was an error updating the task",
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

    const clearFilters = () => {
        setFilters([]);
        setConditions({});
        setFilterValue("");
        setPage(1);
    };

    const removeFilter = (key: string) => {
        const newFilters = { ...appliedFilters };
        delete newFilters[key];
        setAppliedFilters(newFilters);
        filterForm.setValue(key as any, "");
    };
    const renderCell = useCallback((tasks: Task, columnKey: string) => {
        const cellValue = tasks[columnKey as keyof Task];

        if ((columnKey === "date" || columnKey === "endDate") && cellValue) {
            return formatDate(cellValue);
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
                            onClick={() => handleEditClick(tasks)}
                        >
                            <Edit className="h-4 w-4" />
                        </span>
                    </Tooltip>
                    <Tooltip>
                        <span
                            className="text-lg text-danger cursor-pointer active:opacity-50"
                            onClick={() => handleDeleteClick(tasks)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </span>
                    </Tooltip>
                </div>
            );
        }
        return cellValue;
    }, [handleDeleteClick, handleEditClick,]);

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
    const onNextPage = useCallback(() => {
        if (page < pages) {
            setPage(page + 1);
        }
    }, [page, pages]);

    const onPreviousPage = useCallback(() => {
        if (page > 1) {
            setPage(page - 1);
        }
    }, [page]);

    const onRowsPerPageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
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

                        <Button
                            className="addButton w-full sm:w-auto flex items-center justify-between"
                            style={{ backgroundColor: 'hsl(339.92deg 91.04% 52.35%)' }}
                            variant="default"
                            size="default"
                            endContent={<PlusCircle />}
                            onClick={() => router.push("/task")}
                        >
                            Create Task
                        </Button>
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
                    <span className="text-default-400 text-small">Total {tasks.length} task</span>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, tasks.length, router]);

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
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Task Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Create your company&apos;s activities or task here</h1>
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
                        <DialogTitle>Update Task</DialogTitle>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onEdit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="subject"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Subject</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter task subject" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="relatedTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Related To</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter what the task is related to" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Enter the name of the person who will do the task" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="assigned"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Assigned By</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="Enter the name of the person who will give the task"
                                                    {...field} />
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
                                                Task Date
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
                                                Due Date
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

                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <FormControl>
                                                <select {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="InProgress">In Progress</option>
                                                    <option value="Resolved">Resolved</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="priority"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Priority</FormLabel>
                                            <FormControl>
                                                <select {...field}
                                                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                                                >
                                                    <option value="High">High</option>
                                                    <option value="Medium">Medium</option>
                                                    <option value="Low">Low</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Task Notes (Optional)</FormLabel>
                                        <FormControl>
                                            <textarea
                                                {...field}
                                                placeholder="Enter task in detail..."
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
                                        Creating Task...
                                    </>
                                ) : (
                                    "Update Task"
                                )}
                            </Button>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={isDeleteConfirmationOpen} onOpenChange={(open) => {
                if (!open) {
                    setIsDeleteConfirmationOpen(false);
                }
            }}>
                <DialogContent className="fixed left-1/2 top-[7rem] transform -translate-x-1/2 z-[9999] w-full max-w-md bg-white shadow-lg rounded-lg p-6"
                    onInteractOutside={(e) => {
                        e.preventDefault();
                    }}
                >
                    <DialogHeader>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task?
                            The data won&apos;t be retrieved again.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-4 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteConfirmationOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="px-4 py-2 text-sm xs:px-3 xs:py-1 xs:text-xs bg-gray-800"
                            variant="destructive"
                            onClick={async () => {
                                if (taskToDelete) {
                                    try {
                                        const response = await fetch(`http://localhost:8000/api/v1/task/deleteTask/${taskToDelete._id}`, {
                                            method: "DELETE",
                                        });

                                        if (!response.ok) {
                                            const errorData = await response.json();
                                            throw new Error(errorData.message || "Failed to delete task");
                                        }

                                        toast({
                                            title: "Task Deleted",
                                            description: "The task has been successfully deleted",
                                        });

                                        fetchTasks();
                                    } catch (error) {
                                        toast({
                                            title: "Error",
                                            description: error instanceof Error ? error.message : "Failed to delete task",
                                            variant: "destructive",
                                        });
                                    } finally {
                                        setIsDeleteConfirmationOpen(false);
                                        setTaskToDelete(null);
                                    }
                                }
                            }}
                        >
                            Delete
                        </Button>
                    </div>
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
        </div>
    );
}