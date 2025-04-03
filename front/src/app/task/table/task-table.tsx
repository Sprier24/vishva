"use client";
import React, { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Edit, Trash2, Loader2, PlusCircle, SearchIcon, ChevronDownIcon } from "lucide-react"
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
    const day = String(date.getDate()).padStart(2, '0');  // Ensure two digits for day
    const month = String(date.getMonth() + 1).padStart(2, '0');  // Get month and ensure two digits
    const year = date.getFullYear();  // Get the full year
    return `${day}/${month}/${year}`;  // Returns "dd-mm-yyyy"
};


const columns = [
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
        render: (row: any) => formatDate(row.date),
    },
    {
        name: "Due Date",
        uid: "endDate",
        sortable: true,
        width: "170px",
        render: (row: any) => formatDate(row.date),
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

export default function TaskTable() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [selectedKeys, setSelectedKeys] = useState<Iterable<string> | 'all' | undefined>(undefined);
    const router = useRouter();

    const fetchTasks = async () => {
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
            setError(null);
        } catch (error) {
            console.error("Error fetching tasks:", error);
            if (axios.isAxiosError(error)) {
                setError(`Failed to fetch tasks: ${error.response?.data?.message || error.message}`);
            } else {
                setError("Failed to fetch tasks.");
            }
            setTasks([]);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const [isAddNewOpen, setIsAddNewOpen] = useState(false);
    const [filterValue, setFilterValue] = useState("");
    const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
    const [statusFilter, setStatusFilter] = useState("all");
    const [rowsPerPage, setRowsPerPage] = useState(5);
    const [sortDescriptor, setSortDescriptor] = useState({
        column: "createdAt",
        direction: "descending",
    });
    const [page, setPage] = useState(1);
    const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

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


    const form = useForm<z.infer<typeof taskSchema>>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            name: "",
            subject: "",
            assigned: "",
            relatedTo: "",
            date: new Date(),
            endDate: undefined,
            status: "New",
            priority: "Medium",
            notes: "",
        },
    });


    const hasSearchFilter = Boolean(filterValue);

    const headerColumns = React.useMemo(() => {
        if (visibleColumns.size === columns.length) return columns; // Check if all columns are selected
        return columns.filter((column) => visibleColumns.has(column.uid));
    }, [visibleColumns]);

    const filteredItems = React.useMemo(() => {
        let filteredTasks = [...tasks];

        if (hasSearchFilter) {
            filteredTasks = filteredTasks.filter((task) => {
                const searchableFields = {
                    subject: task.subject,
                    relatedTo: task.relatedTo,
                    name: task.name,
                    assigned: task.assigned,
                    notes: task.notes,
                    date: task.date,
                    endDate: task.endDate,
                    priority: task.priority,
                    status: task.status,
                };

                return Object.values(searchableFields).some(value =>
                    String(value || '').toLowerCase().includes(filterValue.toLowerCase())
                );
            });
        }

        if (statusFilter !== "all") {
            filteredTasks = filteredTasks.filter((task) =>
                statusFilter === task.status
            );
        }

        return filteredTasks;
    }, [tasks, filterValue, statusFilter]);

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

    // Function to handle edit button click
    const handleEditClick = (task: Task) => {
        setSelectedTask(task);
        form.reset({
            name: task.name,
            subject: task.subject,
            assigned: task.assigned,
            relatedTo: task.relatedTo,
            date: task.date ? new Date(task.date) : undefined,
            endDate: task.endDate ? new Date(task.endDate) : undefined,
            status: task.status,
            priority: task.priority,
            notes: task.notes,
        });
        setIsEditOpen(true);
    };

    // Function to handle delete button click

    const handleDeleteClick = (task: Task) => {
        setTaskToDelete(task);
        setIsDeleteConfirmationOpen(true);
    };
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

            // Close dialog and reset form
            setIsEditOpen(false);
            setSelectedTask(null);
            form.reset();

            // Refresh the leads list
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

    const renderCell = React.useCallback((tasks: Task, columnKey: string) => {
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
                            onClick={() => router.push("/task")}
                        >
                            Create Task
                        </Button>
                    </div>
                </div>
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
    }, [filterValue, visibleColumns, onRowsPerPageChange, tasks.length, onSearchChange]);

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
                            <h1 className="text-3xl font-bold mb-4 mt-4 text-center">Task Record</h1>
                            <h1 className="text-1xl mb-4 mt-4 text-center">Create your company's activities or task here</h1>
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
                                <TableBody emptyContent={"Create task and add data"} items={sortedItems}>
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
                            Are you sure you want to delete this task?,
                            The data won't be retrieved again.
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

        </div>

    );
}