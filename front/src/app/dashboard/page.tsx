"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { ModeToggle } from "@/components/ModeToggle"
import { Breadcrumb, BreadcrumbSeparator, BreadcrumbPage, BreadcrumbList, BreadcrumbLink, BreadcrumbItem } from "@/components/ui/breadcrumb"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { Selection } from "@nextui-org/react";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import React, { useMemo, useState, useEffect } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid, LabelList, Pie, PieChart, RadialBar, RadialBarChart, Rectangle, XAxis
} from "recharts"
import {
  Box,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  styled,
} from "@mui/material";
import { Button, Pagination, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow, Chip, Tooltip, ChipProps, Input } from "@heroui/react"
import { Pencil, Trash2, Search, Calendar1, Calendar, Filter, Plus, Mail } from "lucide-react";

const chartConfig = {
  visitors: {
    label: "Leads",
  },
  Proposal: {
    label: "Proposal",
    color: "hsl(var(--chart-1))",
  },
  New: {
    label: "New",
    color: "hsl(var(--chart-2))",
  },
  Demo: {
    label: "Demo",
    color: "hsl(var(--chart-3))",
  },
  Discussion: {
    label: "Discussion",
    color: "hsl(var(--chart-4))",
  },
  Decided: {
    label: "Decided",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

const chartConfigInvoice = {
  visitors: {
    label: "Invoice",
  },
  Unpaid: {
    label: "Unpaid",
    color: "hsl(var(--chart-3))",
  },
  Paid: {
    label: "Paid",
    color: "hsl(var(--chart-4))",
  },

} satisfies ChartConfig;

const chartConfigDeal = {
  visitors: {
    label: "Deals",
  },
  Proposal: {
    label: "Proposal",
    color: "hsl(var(--chart-1))",
  },
  New: {
    label: "New",
    color: "hsl(var(--chart-2))",
  },
  Demo: {
    label: "Demo",
    color: "hsl(var(--chart-3))",
  },
  Discussion: {
    label: "Discussion",
    color: "hsl(var(--chart-4))",
  },
  Decided: {
    label: "Decided",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig;

interface Lead {
  _id: string;
  companyName: string;
  customerName: string;
  contactNumber: string;
  assigneduser: string;
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
  status: "Paid" | "Unpaid" | "Pending";
  date: Date;
  endDate: Date;
  totalWithoutGst: number;
  totalWithGst: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
}

interface Reminder {
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
  status: "Paid" | "Unpaid" | "Pending";
  date: Date;
  endDate: Date;
  totalWithoutGst: number;
  totalWithGst: number;
  paidAmount: number;
  remainingAmount: number;
  createdAt: string;
}

interface Deal {
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
  createdAt: string;
}

interface Task {
  _id: string;
  subject: string;
  relatedTo: string;
  name: string;
  assigned: string;
  date: string;
  endDate: string;
  status: "Pending" | "Resolved" | "In Progress";
  priority: "High" | "Medium" | "Low";
  isActive: boolean;
  createdAt: string;
}

interface Schedule {
  subject: string;
  assignedUser: string;
  customer: string;
  location: string;
  status: "Scheduled" | "Completed" | "Cancelled" | "Postpone";
  eventType: "call" | "Call" | "Meeting" | "meeting" | "Demo" | "demo" | "Follow-Up" | "follow-up"
  priority: "Low" | "low" | "Medium" | "medium" | "High" | "high";
  date: string;
  recurrence: "one-time" | "Daily" | "Weekly" | "Monthly" | "Yearly";
  description: string;
  createdAt: string;
}

interface CategorizedLeads {
  [key: string]: Lead[];
}

interface CategorizedInvoices {
  [key: string]: Invoice[];
}

interface CategorizedDeals {
  [key: string]: Deal[];
}

interface CategorizedTasks {
  [key: string]: Task[];
}

interface CategorizedReminder {
  [key: string]: Reminder[];
}

interface CategorizedScheduled {
  [key: string]: Schedule[];
}

const columns = [
  { name: "Company Name", uid: "companyName", sortable: true },
  { name: "Product Name", uid: "productName", sortable: true },
  { name: "Product Amount", uid: "amount", sortable: true },
  { name: "Status", uid: "status", sortable: true },
];

const columnsDeal = [
  { name: "Company Name", uid: "companyName", sortable: true },
  { name: "Product Name", uid: "productName", sortable: true },
  { name: "Product Amount", uid: "amount", sortable: true },
  { name: "Status", uid: "status", sortable: true },
];

const columnsInvoice = [
  { name: "Company Name", uid: "companyName", sortable: true },
  { name: "Product Name", uid: "productName", sortable: true },
  { name: "Product Amount", uid: "amount", sortable: true },
  { name: "Status", uid: "status", sortable: true },
];

const columnsReminder = [
  { name: "Company Name", uid: "companyName", sortable: true },
  { name: "Product Name", uid: "productName", sortable: true },
  { name: "Paid Amount", uid: "paidAmount", sortable: true },
  { name: "Remiaining Amount", uid: "remainingAmount", sortable: true },
];

const columnsTask = [
  { name: "Subject", uid: "subject", sortable: true },
  { name: "Name", uid: "name", sortable: true },
  { name: "Task Date", uid: "date", sortable: true },
  { name: "Due Date", uid: "endDate", sortable: true },
];

const columnsSchedule = [
  { name: "Subject", uid: "subject", sortable: true },
  { name: "Location", uid: "location", sortable: true },
  { name: "Member", uid: "customer", sortable: true },
  { name: "Date", uid: "date", sortable: true },
];

const INITIAL_VISIBLE_COLUMNS = ["companyName", "productName", "amount", "status"];
const INITIAL_VISIBLE_COLUMNS_INVOICE = ["companyName", "productName", "amount", "status"];
const INITIAL_VISIBLE_COLUMNS_DEAL = ["companyName", "productName", "amount", "status"];
const INITIAL_VISIBLE_COLUMNS_TASK = ["subject", "name", "date", "endDate"];
const INITIAL_VISIBLE_COLUMNS_REMINDER = ["companyName", "productName", "paidAmount", "remainingAmount"];
const INITIAL_VISIBLE_COLUMNS_SCHEDULE = ["subject", "location", "customer", "date"];

const chartData = {
  Proposal: "#2a9d90",
  New: "#e76e50",
  Discussion: "#274754",
  Demo: "#e8c468",
  Decided: "#f4a462",
};

const chartDataInvoice = {
  Pending: "#2a9d90",
  Unpaid: "#e76e50",
  Paid: "#274754",
};

const chartDataDeal = {
  Proposal: "#2a9d90",
  New: "#e76e50",
  Discussion: "#274754",
  Demo: "#e8c468",
  Decided: "#f4a462",
};

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
  ...theme.applyStyles("dark", {
    backgroundColor: "#1A2027",
  }),
}));

const getChartDimensions = () => {
  if (typeof window !== 'undefined') {
    const width = Math.min(600, window.innerWidth - 40);
    const height = Math.min(400, width * 0.8);
    return { width, height };
  }
  return { width: 600, height: 400 };
};

export default function Page() {
  const [selectedChart, setSelectedChart] = useState("Pie Chart");
  const [selectedChartInvoice, setSelectedChartInvoice] = useState("Pie Chart");
  const [selectedChartDeal, setSelectedChartDeal] = useState("Pie Chart");

  const [filterValue, setFilterValue] = useState("");
  const [filterValueInvoice, setFilterValueInvoice] = useState("");
  const [filterValueDeal, setFilterValueDeal] = useState("");
  const [filterValueTask, setFilterValueTask] = useState("");
  const [filterValueReminder, setFilterValueReminder] = useState("");
  const [filterValueSchedule, setFilterValueSchedule] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");
  const [categorizedLeads, setCategorizedLeads] = useState<CategorizedLeads>({});
  const [categorizedInvoices, setCategorizedInvoices] = useState<CategorizedInvoices>({});
  const [categorizedDeals, setCategorizedDeals] = useState<CategorizedDeals>({});
  const [categorizedTasks, setCategorizedTasks] = useState<CategorizedTasks>({});
  const [categorizedReminder, setCategorizedReminder] = useState<CategorizedReminder>({});
  const [CategorizedScheduled, setCategorizedSchedule] = useState<CategorizedScheduled>({});
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [pageInvoice, setPageInvoice] = useState(1);
  const [pageDeal, setPageDeal] = useState(1);
  const [pageTask, setPageTask] = useState(1);
  const [pageReminder, setPageReminder] = useState(1);
  const [pageSchedule, setPageSchedule] = useState(1);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminder, setReminder] = useState<Reminder[]>([]);
  const [schedule, setSchedule] = useState<Schedule[]>([]);

  const [rowsPerPage, setRowsPerPage] = useState(5);
  const hasSearchFilter = Boolean(filterValue);
  const hasSearchFilterInvoice = Boolean(filterValueInvoice);
  const hasSearchFilterDeal = Boolean(filterValueDeal);
  const hasSearchFilterTask = Boolean(filterValueTask);
  const hasSearchFilterReminder = Boolean(filterValueReminder);
  const hasSearchFilterSchedule = Boolean(filterValueSchedule);

  const [selectedKeys, setSelectedKeys] = React.useState<Selection>(new Set());
  const [selectedKeysInvoice, setSelectedKeysInvoice] = useState(new Set([]));
  const [selectedKeysDeal, setSelectedKeysDeal] = useState(new Set([]));
  const [selectedKeysTask, setSelectedKeysTask] = useState(new Set([]));
  const [selectedKeysReminder, setSelectedKeysReminder] = useState(new Set([]));
  const [selectedKeysSchedule, setSelectedKeysSchedule] = useState(new Set([]));

  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [visibleColumnsInvoice, setVisibleColumnsInvoice] = useState(new Set(INITIAL_VISIBLE_COLUMNS_INVOICE));
  const [visibleColumnsDeal, setVisibleColumnsDeal] = useState(new Set(INITIAL_VISIBLE_COLUMNS_DEAL));
  const [visibleColumnsTask, setVisibleColumnsTask] = useState(new Set(INITIAL_VISIBLE_COLUMNS_TASK));
  const [visibleColumnsReminder, setVisibleColumnsReminder] = useState(new Set(INITIAL_VISIBLE_COLUMNS_REMINDER));
  const [visibleColumnsSchedule, setVisibleColumnsSchedule] = useState(new Set(INITIAL_VISIBLE_COLUMNS_SCHEDULE));

  const [sortDescriptor, setSortDescriptor] = useState({
    column: "createdAt",
    direction: "descending",
  });

  const [sortDescriptorInvoice, setSortDescriptorInvoice] = useState({
    column: "createdAt",
    direction: "descending",
  })

  const [sortDescriptorDeal, setSortDescriptorDeal] = useState({
    column: "createdAt",
    direction: "descending",
  });

  const [sortDescriptorTask, setSortDescriptorTask] = useState({
    column: "createdAt",
    direction: "descending",
  });

  const [sortDescriptorReminder, setSortDescriptorReminder] = useState({
    column: "createdAt",
    direction: "descending",
  })

  const [sortDescriptorSchedule, setSortDescriptorSchedule] = useState({
    column: "createdAt",
    direction: "ascending",
  })

  const filteredItems = React.useMemo(() => {
    let filteredLeads = [...leads];


    if (hasSearchFilter) {
      filteredLeads = filteredLeads.filter((lead) => {
        const searchableFields = {
          companyName: lead.companyName,
          productName: lead.productName,
          amount: lead.amount,
          status: lead.status
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

  const filteredItemsInvoice = React.useMemo(() => {
    let filteredInvoices = [...invoices];


    if (hasSearchFilterInvoice) {
      filteredInvoices = filteredInvoices.filter((invoice) => {
        const searchableFields = {
          companyName: invoice.companyName,
          productName: invoice.productName,
          amount: invoice.amount,
          status: invoice.status
        };

        return Object.values(searchableFields).some(value =>
          String(value || '').toLowerCase().includes(filterValueInvoice.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filteredInvoices = filteredInvoices.filter((invoice) =>
        statusFilter === invoice.status
      );
    }

    return filteredInvoices;
  }, [invoices, filterValueInvoice, statusFilter]);

  const filteredItemsDeal = React.useMemo(() => {
    let filteredDeals = [...deals];

    if (hasSearchFilterDeal) {
      filteredDeals = filteredDeals.filter((deal) => {
        const searchableFields = {
          companyName: deal.companyName,
          productName: deal.productName,
          amount: deal.amount,
          status: deal.status
        };

        return Object.values(searchableFields).some(value =>
          String(value || '').toLowerCase().includes(filterValueDeal.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filteredDeals = filteredDeals.filter((deal) =>
        statusFilter === deal.status
      );
    }

    return filteredDeals;
  }, [deals, filterValueDeal, statusFilter]);

  const filteredItemsTask = React.useMemo(() => {
    let filteredTasks = [...tasks];

    if (hasSearchFilterTask) {
      filteredTasks = filteredTasks.filter((task) => {
        const searchableFields = {
          subject: task.subject,
          name: task.name,
          date: task.date,
          endDate: task.endDate
        };

        return Object.values(searchableFields).some(value =>
          String(value || '').toLowerCase().includes(filterValueTask.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filteredTasks = filteredTasks.filter((task) =>
        statusFilter === task.status
      );
    }

    return filteredTasks;
  }, [tasks, filterValueTask, statusFilter]);

  const filteredItemsReminder = React.useMemo(() => {
    let filteredReminder = [...reminder];


    if (hasSearchFilterReminder) {
      filteredReminder = filteredReminder.filter((reminder) => {
        const searchableFields = {
          companyName: reminder.companyName,
          productName: reminder.productName,
          paidAmount: reminder.paidAmount,
          remainingAmount: reminder.remainingAmount

        };

        return Object.values(searchableFields).some(value =>
          String(value || '').toLowerCase().includes(filterValueReminder.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filteredReminder = filteredReminder.filter((reminder) =>
        statusFilter === reminder.status
      );
    }

    return filteredReminder;
  }, [leads, filterValueReminder, statusFilter]);

  const filteredItemsSchedule = React.useMemo(() => {
    let filteredSchedule = [...schedule];

    if (hasSearchFilterSchedule) {
      filteredSchedule = filteredSchedule.filter((schedule) => {
        const searchableFields = {
          subject: schedule.subject,
          location: schedule.location,
          customer: schedule.customer,
          date: schedule.date
        };

        return Object.values(searchableFields).some(value =>
          String(value || '').toLowerCase().includes(filterValueSchedule.toLowerCase())
        );
      });
    }

    if (statusFilter !== "all") {
      filteredSchedule = filteredSchedule.filter((schedule) =>
        statusFilter === schedule.status
      );
    }

    return filteredSchedule;
  }, [schedule, filterValueSchedule, statusFilter]);

  const headerColumns = React.useMemo(() => {
    if (visibleColumns.size === columns.length) return columns;
    return columns.filter((column) => visibleColumns.has(column.uid));
  }, [visibleColumns]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);
  const pagesInvoice = Math.ceil(invoices.length / rowsPerPage);
  const pagesDeal = Math.ceil(deals.length / rowsPerPage);
  const pagesTask = Math.ceil(tasks.length / rowsPerPage);
  const pagesReminder = Math.ceil(reminder.length / rowsPerPage);
  const pagesSchedule = Math.ceil(schedule.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const itemsInvoice = React.useMemo(() => {
    const start = (pageInvoice - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItemsInvoice.slice(start, end);
  }, [pageInvoice, filteredItemsInvoice, rowsPerPage]);

  const itemsDeal = React.useMemo(() => {
    const start = (pageDeal - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItemsDeal.slice(start, end);
  }, [pageDeal, filteredItemsDeal, rowsPerPage]);

  const itemsTask = React.useMemo(() => {
    const start = (pageTask - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItemsTask.slice(start, end);
  }, [pageTask, filteredItemsTask, rowsPerPage]);

  const itemsReminder = React.useMemo(() => {
    const start = (pageReminder - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItemsReminder.slice(start, end);
  }, [pageReminder, filteredItemsReminder, rowsPerPage]);

  const itemsSchedule = React.useMemo(() => {
    const start = (pageSchedule - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItemsSchedule.slice(start, end);
  }, [pageSchedule, filteredItemsSchedule, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof Lead];
      const second = b[sortDescriptor.column as keyof Lead];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const sortedInvoice = React.useMemo(() => {
    return [...itemsInvoice].sort((a, b) => {
      const first = a[sortDescriptorInvoice.column as keyof Invoice];
      const second = b[sortDescriptorInvoice.column as keyof Invoice];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptorInvoice.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptorInvoice, itemsInvoice]);

  const sortedDeals = React.useMemo(() => {
    return [...itemsDeal].sort((a, b) => {
      const first = a[sortDescriptorDeal.column as keyof Deal];
      const second = b[sortDescriptorDeal.column as keyof Deal];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptorDeal.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptorDeal, itemsDeal]);

  const sortedTasks = React.useMemo(() => {
    return [...itemsTask].sort((a, b) => {
      const first = a[sortDescriptorTask.column as keyof Task];
      const second = b[sortDescriptorTask.column as keyof Task];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptorTask.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptorTask, itemsTask]);

  const sortedReminder = React.useMemo(() => {
    return [...itemsReminder].sort((a, b) => {
      const first = a[sortDescriptorReminder.column as keyof Reminder];
      const second = b[sortDescriptorReminder.column as keyof Reminder];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptorReminder.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptorReminder, itemsReminder]);

  const sortedSchedule = React.useMemo(() => {
    return [...itemsSchedule].sort((a, b) => {
      const first = a[sortDescriptorSchedule.column as keyof Schedule];
      const second = b[sortDescriptorSchedule.column as keyof Schedule];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptorSchedule.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptorSchedule, itemsSchedule]);

  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/lead/getAllLeads');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedLeads = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setLeads(sortedLeads);
        const categorized = sortedLeads.reduce((acc: CategorizedLeads, lead: Lead) => {
          if (!acc[lead.status]) {
            acc[lead.status] = [];
          }
          acc[lead.status].push(lead);
          return acc;
        }, {} as CategorizedLeads);

        setCategorizedLeads(categorized);
      } catch (error) {
        console.error('Error fetching leads:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/invoice/getAllInvoices');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedInvoices = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setInvoices(sortedInvoices);
        const categorized = sortedInvoices.reduce((acc: Record<string, Invoice[]>, invoice: Invoice) => {
          if (!invoice.status) return acc;
          if (!acc[invoice.status]) {
            acc[invoice.status] = [];
          }
          acc[invoice.status].push(invoice);
          return acc;
        }, {});
        console.log("Categorized Invoices:", categorizedInvoices);

        setCategorizedInvoices(categorized);
      } catch (error) {
        console.error('Error fetching invoices:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  //Deal
  useEffect(() => {
    const fetchDeals = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/deal/getAllDeals');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedDeals = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setDeals(sortedDeals);

        const categorized = sortedDeals.reduce((acc: CategorizedDeals, deal: Deal) => {
          if (!acc[deal.status]) {
            acc[deal.status] = [];
          }
          acc[deal.status].push(deal);
          return acc;
        }, {} as CategorizedDeals);

        setCategorizedDeals(categorized);
      } catch (error) {
        console.error('Error fetching deals:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeals();
  }, []);

  //Task
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/task/getAllTasks');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedTasks = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTasks(sortedTasks);

        const categorized = sortedTasks.reduce((acc: CategorizedTasks, task: Task) => {
          if (!acc[task.status]) {
            acc[task.status] = [];
          }
          acc[task.status].push(task);
          return acc;
        }, {} as CategorizedTasks);

        setCategorizedTasks(categorized);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchTasks();
  }, []);

  //Reminder
  useEffect(() => {
    const fetchReminder = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/invoice/getUnpaidInvoices');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedReminders = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setReminder(sortedReminders);

        const categorized = sortedReminders.reduce((acc: CategorizedReminder, reminder: Reminder) => {
          if (!acc[reminder.status]) {
            acc[reminder.status] = [];
          }
          acc[reminder.status].push(reminder);
          return acc;
        }, {} as CategorizedReminder);

        setCategorizedReminder(categorized);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchReminder();
  }, []);

  //Schedule
  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/scheduledEvents/getAllScheduledEvents');
        const result = await response.json();

        if (!result || !Array.isArray(result.data)) {
          console.error('Invalid data format received:', result);
          return;
        }

        const sortedSchedules = [...result.data].sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setSchedule(sortedSchedules);

        const categorized = sortedSchedules.reduce((acc: CategorizedScheduled, schedule: Schedule) => {
          if (!acc[schedule.status]) {
            acc[schedule.status] = [];
          }
          acc[schedule.status].push(schedule);
          return acc;
        }, {} as CategorizedScheduled);

        setCategorizedSchedule(categorized);
      } catch (error) {
        console.error('Error fetching tasks:', error);
      }
    };

    fetchSchedule();
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

  //Invoice  Page
  const onNextPageInvoice = React.useCallback(() => {
    if (pageInvoice < pagesInvoice) {
      setPageInvoice(pageInvoice + 1);
    }
  }, [pageInvoice, pagesInvoice]);

  const onPreviousPageInvoice = React.useCallback(() => {
    if (pageInvoice > 1) {
      setPageInvoice(pageInvoice - 1);
    }
  }, [pageInvoice]);

  //Deal Page
  const onNextPageDeal = React.useCallback(() => {
    if (pageDeal < pagesDeal) {
      setPageDeal(pageDeal + 1);
    }
  }, [pageDeal, pagesDeal]);

  const onPreviousPageDeal = React.useCallback(() => {
    if (pageDeal > 1) {
      setPageDeal(pageDeal - 1);
    }
  }, [pageDeal]);

  //Taskk Page
  const onNextPageTask = React.useCallback(() => {
    if (pageTask < pagesTask) {
      setPageTask(pageTask + 1);
    }
  }, [pageTask, pagesTask]);

  const onPreviousPageTask = React.useCallback(() => {
    if (pageTask > 1) {
      setPageTask(pageTask - 1);
    }
  }, [pageTask]);

  //Reminder Page
  const onNextPageReminder = React.useCallback(() => {
    if (pageReminder < pagesReminder) {
      setPageReminder(pageReminder + 1);
    }
  }, [pageReminder, pagesReminder]);

  const onPreviousPageReminder = React.useCallback(() => {
    if (pageReminder > 1) {
      setPageReminder(pageReminder - 1);
    }
  }, [pageReminder]);

  //Schedule Page
  const onNextPageSchedule = React.useCallback(() => {
    if (pageSchedule < pagesSchedule) {
      setPageSchedule(pageSchedule + 1);
    }
  }, [pageSchedule, pagesSchedule]);

  const onPreviousPageSchedule = React.useCallback(() => {
    if (pageSchedule > 1) {
      setPageSchedule(pageSchedule - 1);
    }
  }, [pageSchedule]);

  //Lead Chart
  const dynamicChartData = useMemo(() => {
    return Object.entries(categorizedLeads).map(([status, leads]) => ({
      browser: status,
      visitors: leads.length,
      fill: chartData[status] || "#ccc",
    }));
  }, [categorizedLeads]);

  //Invoice Chart
  const dynamicChartDataInvoice = useMemo(() => {
    return Object.entries(categorizedInvoices).map(([status, invoices]) => ({
      browser: status,
      visitors: invoices.length,
      fill: chartDataInvoice[status] || "#ccc",
    }));
  }, [categorizedInvoices]);

  //Deal
  const dynamicChartDataDeal = useMemo(() => {
    return Object.entries(categorizedDeals).map(([status, deals]) => ({
      browser: status,
      visitors: deals.length,
      fill: chartDataDeal[status] || "#ccc",
    }));
  }, [categorizedDeals]);

  //Lead
  const renderChartLead = () => {
    const { width, height } = getChartDimensions();

    if (loading) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center h-[300px] md:h-[400px] lg:h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      );
    }

    if (dynamicChartData.length === 0) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Lead</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartData}
                  dataKey="visitors"
                  nameKey="browser"
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChart === "Pie Chart") {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Lead</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartData}
                  dataKey="visitors"
                  nameKey="browser"
                  cx="50%"
                  cy="50%"
                  outerRadius={Math.min(width, height) / 4}
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChart === "Radial Chart") {
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Lead</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px]"
            >
              <RadialBarChart
                width={width}
                height={height}
                data={dynamicChartData}
                startAngle={-90}
                endAngle={380}
                innerRadius={Math.min(width, height) / 12}
                outerRadius={Math.min(width, height) / 4}
                cx="50%"
                cy="50%"
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <RadialBar dataKey="visitors" background>
                  <LabelList
                    position="insideStart"
                    dataKey="browser"
                    className="fill-white capitalize mix-blend-luminosity"
                    fontSize={11}
                  />
                </RadialBar>
              </RadialBarChart>
              <ChartLegend
                content={<ChartLegendContent nameKey="browser" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChart === "Bar Chart") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Lead</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <BarChart width={width} height={height} data={dynamicChartData}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="browser"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    chartConfig[value as keyof typeof chartConfig]?.label
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="visitors"
                  strokeWidth={2}
                  radius={8}
                  fill="#8884d8"
                  activeBar={({ ...props }) => {
                    return (
                      <Rectangle
                        {...props}
                        fillOpacity={0.8}
                        stroke={props.payload.fill}
                        strokeDasharray={4}
                        strokeDashoffset={4}
                      />
                    );
                  }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }
  };

  //Invoice
  const renderChartInvoice = () => {
    const { width, height } = getChartDimensions();

    if (loading) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center h-[300px] md:h-[400px] lg:h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      );
    }

    if (dynamicChartDataInvoice.length === 0) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigInvoice}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartDataInvoice}
                  dataKey="visitors"
                  nameKey="browser"
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChartInvoice === "Pie Chart") {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigInvoice}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartDataInvoice}
                  dataKey="visitors"
                  nameKey="browser"
                  cx="50%"
                  cy="50%"
                  outerRadius={Math.min(width, height) / 4}
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChartInvoice === "Radial Chart") {
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigInvoice}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px]"
            >
              <RadialBarChart
                width={width}
                height={height}
                data={dynamicChartDataInvoice}
                startAngle={-90}
                endAngle={380}
                innerRadius={Math.min(width, height) / 12}
                outerRadius={Math.min(width, height) / 4}
                cx="50%"
                cy="50%"
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <RadialBar dataKey="visitors" background>
                  <LabelList
                    position="insideStart"
                    dataKey="browser"
                    className="fill-white capitalize mix-blend-luminosity"
                    fontSize={11}
                  />
                </RadialBar>
              </RadialBarChart>
              <ChartLegend
                content={<ChartLegendContent nameKey="browser" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChartInvoice === "Bar Chart") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Invoice</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfigInvoice}>
              <BarChart width={width} height={height} data={dynamicChartDataInvoice}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="browser"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tickFormatter={(value) =>
                    chartConfigInvoice[value as keyof typeof chartConfigInvoice]?.label
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel />}
                />
                <Bar
                  dataKey="visitors"
                  strokeWidth={2}
                  radius={8}
                  fill="#8884d8"
                  activeBar={({ ...props }) => {
                    return (
                      <Rectangle
                        {...props}
                        fillOpacity={0.8}
                        stroke={props.payload.fill}
                        strokeDasharray={4}
                        strokeDashoffset={4}
                      />
                    );
                  }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }
  };

  //Deal
  const renderChartDeal = () => {
    const { width, height } = getChartDimensions();

    if (loading) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0 flex items-center justify-center h-[300px] md:h-[400px] lg:h-[500px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      );
    }

    if (dynamicChartDataDeal.length === 0) {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigDeal}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartDataDeal}
                  dataKey="visitors"
                  nameKey="browser"
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChartDeal === "Pie Chart") {
      return (
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigDeal}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px] [&_.recharts-text]:fill-background"
            >
              <PieChart width={width} height={height}>
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <Pie
                  data={dynamicChartDataDeal}
                  dataKey="visitors"
                  nameKey="browser"
                  cx="50%"
                  cy="50%"
                  outerRadius={Math.min(width, height) / 4}
                  className="cursor-pointer"
                  style={{ color: "#FF7F3E" }}
                />
                <ChartLegend
                  content={<ChartLegendContent nameKey="browser" />}
                  className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

    if (selectedChartDeal === "Radial Chart") {
      return (
        <Card className="flex flex-col">
          <CardHeader className="items-center pb-0">
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 pb-0">
            <ChartContainer
              config={chartConfigDeal}
              className="mx-auto aspect-square max-h-[300px] md:h-[400px] lg:h-[500px]"
            >
              <RadialBarChart
                width={width}
                height={height}
                data={dynamicChartDataDeal}
                startAngle={-90}
                endAngle={380}
                innerRadius={Math.min(width, height) / 12}
                outerRadius={Math.min(width, height) / 4}
                cx="50%"
                cy="50%"
              >
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent hideLabel nameKey="browser" />}
                />
                <RadialBar dataKey="visitors" background>
                  <LabelList
                    position="insideStart"
                    dataKey="browser"
                    className="fill-white capitalize mix-blend-luminosity"
                    fontSize={11}
                  />
                </RadialBar>
              </RadialBarChart>
              <ChartLegend
                content={<ChartLegendContent nameKey="browser" />}
                className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              />
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }
    if (selectedChartDeal === "Bar Chart") {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Deal</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer
              config={chartConfigDeal}
              style={{ padding: "10px", borderRadius: "8px" }}
            >
              <BarChart width={width} height={height} data={dynamicChartDataDeal}>
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="browser"
                  tickLine={false}
                  tickMargin={10}
                  axisLine={false}
                  tick={{ fill: "white" }}
                  tickFormatter={(value) =>
                    chartConfigDeal[value as keyof typeof chartConfigDeal]?.label
                  }
                />
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      style={{ color: "white", border: "1px solid white" }}
                    />
                  }
                />
                <Bar
                  dataKey="visitors"
                  strokeWidth={2}
                  radius={8}
                  fill="#8884d8"
                  activeBar={({ ...props }) => {
                    return (
                      <Rectangle
                        {...props}
                        fillOpacity={0.8}
                        stroke={props.payload.fill}
                        strokeDasharray={4}
                        strokeDashoffset={4}
                      />
                    );
                  }}
                />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      );
    }

  };

  //lead
  const bottomContent = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400 ">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
        </span>
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
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pages === 1} size="sm" variant="flat" onPress={onPreviousPage}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pages === 1} size="sm" variant="flat" onPress={onNextPage}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeys, items.length, page, pages, hasSearchFilter]);

  //Invoice
  const bottomContentInvoice = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeysInvoice === "all"
            ? "All items selected"
            : `${selectedKeysInvoice.size} of ${filteredItemsInvoice.length} selected`}
        </span>
        <Pagination
          isCompact
          showShadow
          color="success"
          page={pageInvoice}
          total={pagesInvoice}
          onChange={setPageInvoice}
          classNames={{
            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
          }}
        />

        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesInvoice === 1} size="sm" variant="flat" onPress={onPreviousPageInvoice}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesInvoice === 1} size="sm" variant="flat" onPress={onNextPageInvoice}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeysInvoice, itemsInvoice.length, pageInvoice, pagesInvoice, hasSearchFilterInvoice]);

  //Deal
  const bottomContentDeal = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeysDeal === "all"
            ? "All items selected"
            : `${selectedKeysDeal.size} of ${filteredItemsDeal.length} selected`}
        </span>
        <Pagination
          isCompact
          showShadow
          color="success"
          page={pageDeal}
          total={pagesDeal}
          onChange={setPageDeal}
          classNames={{
            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
          }}
        />

        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesDeal === 1} size="sm" variant="flat" onPress={onPreviousPageDeal}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesDeal === 1} size="sm" variant="flat" onPress={onNextPageDeal}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeysDeal, deals.length, pageDeal, pagesDeal, hasSearchFilterDeal]);

  //Task
  const bottomContentTask = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeysTask === "all"
            ? "All items selected"
            : `${selectedKeysTask.size} of ${filteredItemsTask.length} selected`}
        </span>
        <Pagination
          isCompact
          showShadow
          color="success"
          page={pageTask}
          total={pagesTask}
          onChange={setPageTask}
          classNames={{
            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
          }}
        />

        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesTask === 1} size="sm" variant="flat" onPress={onPreviousPageTask}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesTask === 1} size="sm" variant="flat" onPress={onNextPageTask}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeysTask, tasks.length, pageTask, pagesTask, hasSearchFilterTask]);

  //Reminder
  const bottomContentReminder = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeysReminder === "all"
            ? "All items selected"
            : `${selectedKeysReminder.size} of ${filteredItemsReminder.length} selected`}
        </span>
        <Pagination
          isCompact
          showShadow
          color="success"
          page={pageReminder}
          total={pagesReminder}
          onChange={setPageReminder}
          classNames={{
            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
          }}
        />

        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesReminder === 1} size="sm" variant="flat" onPress={onPreviousPageReminder}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesReminder === 1} size="sm" variant="flat" onPress={onNextPageReminder}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeysReminder, reminder.length, pageReminder, pagesReminder, hasSearchFilterReminder]);

  //Schedule
  const bottomContentSchedule = React.useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeysSchedule === "all"
            ? "All items selected"
            : `${selectedKeysSchedule.size} of ${filteredItemsSchedule.length} selected`}
        </span>
        <Pagination
          isCompact
          showShadow
          color="success"
          page={pageSchedule}
          total={pagesSchedule}
          onChange={setPageSchedule}
          classNames={{
            cursor: "bg-[hsl(339.92deg_91.04%_52.35%)] shadow-md",
            item: "data-[active=true]:bg-[hsl(339.92deg_91.04%_52.35%)] data-[active=true]:text-white rounded-lg",
          }}
        />

        <div className="rounded-lg bg-default-100 hover:bg-default-200 hidden sm:flex w-[30%] justify-end gap-2">
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesSchedule === 1} size="sm" variant="flat" onPress={onPreviousPageSchedule}>
            Previous
          </Button>
          <Button className="bg-[hsl(339.92deg_91.04%_52.35%)] text-white rounded-lg" isDisabled={pagesSchedule === 1} size="sm" variant="flat" onPress={onNextPageSchedule}>
            Next
          </Button>
        </div>
      </div>
    );
  }, [selectedKeysSchedule, schedule.length, pageSchedule, pagesSchedule, hasSearchFilterSchedule]);

  const renderCell = React.useCallback((lead: Lead, columnKey: React.Key) => {
    const cellValue = lead[columnKey as keyof Lead];

    switch (columnKey) {
      case "companyName":
      case "customerName":
      case "contactNumber":
      case "emailAddress":
      case "productName":
      case "amount":
      case "gstNumber":
      case "date":
      case "endDate":
      case "notes":
        return cellValue;
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit lead">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete lead">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const renderCellInvoice = React.useCallback((invoice: Invoice, columnKey: React.Key) => {
    const cellValue = invoice[columnKey as keyof Invoice];

    switch (columnKey) {
      case "companyName":
      case "customerName":
      case "emailAddress":
      case "productName":
      case "amount":
      case "gstNumber":
      case "date":
      case "endDate":
      case "notes":
        return cellValue;
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit lead">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete lead">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const renderCellDeal = React.useCallback((deal: Deal, columnKey: React.Key) => {
    const cellValue = deal[columnKey as keyof Deal];

    switch (columnKey) {
      case "companyName":
      case "customerName":
      case "contactNumber":
      case "emailAddress":
      case "productName":
      case "amount":
      case "gstNumber":
      case "date":
      case "endDate":
      case "notes":
        return cellValue;
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit deal">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete deal">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const renderCellTask = React.useCallback((task: Task, columnKey: React.Key) => {
    const cellValue = task[columnKey as keyof Task];

    switch (columnKey) {
      case "subject":
      case "name":

        return cellValue;
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit task">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete task">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      case "date":
      case "endDate": {
        if (!cellValue) return "N/A";

        const date = new Date(cellValue);
        if (isNaN(date.getTime())) return "Invalid Date";

        // Format date as dd-mm-yyyy
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      }

      default:
        return cellValue;
    }
  }, []);

  const renderCellReminder = React.useCallback((reminder: Reminder, columnKey: React.Key) => {
    const cellValue = reminder[columnKey as keyof Reminder];

    switch (columnKey) {
      case "companyName":
      case "productName":
      case "paidAmount":
      case "remainingAmount":
        return cellValue;
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit reminder">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete reminder">
              <span className="text-lg text-danger cursorPointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      default:
        return cellValue;
    }
  }, []);

  const renderCellSchedule = React.useCallback((schedule: Schedule, columnKey: React.Key) => {
    const cellValue = schedule[columnKey as keyof Schedule];

    switch (columnKey) {
      case "subject":
      case "customer":
      case "assignedUser":
      case "location":
      case "eventType":
      case "priority":
      case "recurrence":
      case "description":
        return cellValue;
      case "status":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
          >
            {cellValue}
          </Chip>
        );
      case "actions":
        return (
          <div className="relative flex items-center gap-2">
            <Tooltip content="Edit schedule">
              <span className="text-lg text-default-400 cursor-pointer active:opacity-50">
                <Pencil size={20} />
              </span>
            </Tooltip>
            <Tooltip color="danger" content="Delete schedule">
              <span className="text-lg text-danger cursor-pointer active:opacity-50">
                <Trash2 size={20} />
              </span>
            </Tooltip>
          </div>
        );
      case "date": {
        if (!cellValue) return "N/A";

        const date = new Date(cellValue);
        if (isNaN(date.getTime())) return "Invalid Date";

        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();

        return `${day}/${month}/${year}`;
      }
    }
  }, []);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <span>Dashboard</span>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4 ml-auto mr-4">
            <div><SearchBar /></div>
            <a href="/email">
              <div>
                <Mail />
              </div>
            </a>
            <a href="/calendar"><div><Calendar1 /></div></a>
            <div><Notification /></div>
          </div>
        </header>

        {/* Main container that locks width for mobile */}
        <div className="w-full max-w-[300px] mx-auto md:max-w-full">
          <Box sx={{ width: '100%' }}>
            <h1 className="text-amber-500 font-bold mb-8 mt-4 text-xl text-center">S P R I E R S</h1>
            <Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>
              {/* Chart Sections */}
              <Grid item xs={12} md={6} lg={4} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl">
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: 'gray',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'black',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'gray',
                        },
                        '&:hover fieldset': {
                          borderColor: 'black',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'black',
                        },
                      },
                    }}
                  >
                    <InputLabel id="chart-select-label">Select Chart</InputLabel>
                    <Select
                      labelId="chart-select-label"
                      value={selectedChart}
                      onChange={(e) => setSelectedChart(e.target.value)}
                      label="Select Chart"
                    >
                      <MenuItem value="Pie Chart">Pie Chart</MenuItem>
                      <MenuItem value="Radial Chart">Radial Chart</MenuItem>
                      <MenuItem value="Bar Chart">Bar Chart</MenuItem>
                    </Select>
                  </FormControl>
                  <div className="mt-4">{renderChartLead()}</div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={4} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl">
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: 'gray',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'black',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'gray',
                        },
                        '&:hover fieldset': {
                          borderColor: 'black',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'black',
                        },
                      },
                    }}
                  >
                    <InputLabel id="chart-select-label">Select Chart</InputLabel>
                    <Select
                      labelId="chart-select-label"
                      value={selectedChartDeal}
                      onChange={(e) => setSelectedChartDeal(e.target.value)}
                      label="Select Chart"
                    >
                      <MenuItem value="Pie Chart">Pie Chart</MenuItem>
                      <MenuItem value="Radial Chart">Radial Chart</MenuItem>
                      <MenuItem value="Bar Chart">Bar Chart</MenuItem>
                    </Select>
                  </FormControl>
                  <div className="mt-4">{renderChartDeal()}</div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={4} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-4 sm:p-6 transition-all duration-300 hover:shadow-xl">
                  <FormControl
                    fullWidth
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: 'gray',
                      },
                      '& .MuiInputLabel-root.Mui-focused': {
                        color: 'black',
                      },
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'gray',
                        },
                        '&:hover fieldset': {
                          borderColor: 'black',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'black',
                        },
                      },
                    }}
                  >
                    <InputLabel id="chart-select-label">Select Chart</InputLabel>
                    <Select
                      labelId="chart-select-label"
                      value={selectedChartInvoice}
                      onChange={(e) => setSelectedChartInvoice(e.target.value)}
                      label="Select Chart"
                    >
                      <MenuItem value="Pie Chart">Pie Chart</MenuItem>
                      <MenuItem value="Radial Chart">Radial Chart</MenuItem>
                      <MenuItem value="Bar Chart">Bar Chart</MenuItem>
                    </Select>
                  </FormControl>
                  <div className="mt-4">{renderChartInvoice()}</div>
                </Item>
              </Grid>

              {/* Lead Record Section */}
              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Lead Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3 ">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValue}
                      onClear={() => setFilterValue("")}
                      onValueChange={setFilterValue}
                    />
                  </div>
                  <div className=" w-full overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Leads table with custom cells, pagination and sorting"
                      bottomContent={bottomContent}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeys}
                      selectionMode="none"
                      sortDescriptor={sortDescriptor}
                      onSelectionChange={setSelectedKeys}
                      onSortChange={setSortDescriptor}
                    >
                      <TableHeader columns={headerColumns}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No lead available"} items={sortedItems}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (<TableCell className="px-4 py-3 text-gray-700">{renderCell(item, columnKey)}</TableCell>)}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Deal Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValueDeal}
                      onClear={() => setFilterValueDeal("")}
                      onValueChange={setFilterValueDeal}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Deals table with custom cells, pagination and sorting"
                      bottomContent={bottomContentDeal}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeysDeal}
                      selectionMode="none"
                      sortDescriptor={sortDescriptorDeal}
                      onSelectionChange={setSelectedKeysDeal}
                      onSortChange={setSortDescriptorDeal}
                    >
                      <TableHeader columns={columnsDeal}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No deal available"} items={sortedDeals}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (<TableCell className="px-4 py-3 text-gray-700">{renderCellDeal(item, columnKey)}</TableCell>)}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Invoice Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValueInvoice}
                      onClear={() => setFilterValueInvoice("")}
                      onValueChange={setFilterValueInvoice}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Invoices table with custom cells, pagination and sorting"
                      bottomContent={bottomContentInvoice}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeysInvoice}
                      selectionMode="none"
                      sortDescriptor={sortDescriptorInvoice}
                      onSortChange={setSortDescriptorInvoice}
                      topContentPlacement="outside"
                    >
                      <TableHeader columns={columnsInvoice}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No invoice available"} items={sortedInvoice}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (<TableCell className="px-4 py-3 text-gray-700">{renderCellInvoice(item, columnKey)}</TableCell>)}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Reminder Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValueReminder}
                      onClear={() => setFilterValueReminder("")}
                      onValueChange={setFilterValueReminder}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Invoices table with custom cells, pagination and sorting"
                      bottomContent={bottomContentReminder}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeysReminder}
                      selectionMode="none"
                      sortDescriptor={sortDescriptorReminder}
                      onSelectionChange={setSelectedKeysReminder}
                      onSortChange={setSortDescriptorReminder}
                    >
                      <TableHeader columns={columnsReminder}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No reminder available"} items={sortedReminder}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (<TableCell className="px-4 py-3 text-gray-700">{renderCellReminder(item, columnKey)}</TableCell>)}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Task Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValueTask}
                      onClear={() => setFilterValueTask("")}
                      onValueChange={setFilterValueTask}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Tasks table with custom cells, pagination and sorting"
                      bottomContent={bottomContentTask}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeysTask}
                      selectionMode="none"
                      sortDescriptor={sortDescriptorTask}
                      onSelectionChange={setSelectedKeysTask}
                      onSortChange={setSortDescriptorTask}
                    >
                      <TableHeader columns={columnsTask}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No task available"} items={sortedTasks}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (
                              <TableCell className="px-4 py-3 text-gray-700">{renderCellTask(item, columnKey)}</TableCell>)}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>

              <Grid item xs={12} md={6} lg={6} className="pb-4">
                <Item className="bg-white shadow-lg rounded-xl p-6">
                  <h1 className="text-2xl font-semibold mb-4 mt-4 text-center">Event or Meeting Record</h1>
                  <div className="flex flex-wrap justify-between items-center gap-3">
                    <Input
                      isClearable
                      className="w-full md:w-[100%] border border-gray-100 rounded-lg"
                      placeholder="Search"
                      startContent={<Search size={20} />}
                      value={filterValueSchedule}
                      onClear={() => setFilterValueSchedule("")}
                      onValueChange={setFilterValueSchedule}
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <Table
                      isHeaderSticky
                      aria-label="Schedule table with custom cells, pagination and sorting"
                      bottomContent={bottomContentSchedule}
                      bottomContentPlacement="outside"
                      classNames={{
                        wrapper: "max-h-[382px] w-full rounded-lg shadow-sm overflow-y-auto scrollbar-hide border border-gray-100 mt-4",
                      }}
                      selectedKeys={selectedKeysSchedule}
                      selectionMode="none"
                      sortDescriptor={sortDescriptorSchedule}
                      onSelectionChange={setSelectedKeysSchedule}
                      onSortChange={setSortDescriptorSchedule}
                    >
                      <TableHeader columns={columnsSchedule}>
                        {(column) => (
                          <TableColumn
                            key={column.uid}
                            align={column.uid === "actions" ? "center" : "start"}
                            allowsSorting={column.sortable}
                            className="text-gray-700 font-semibold bg-gray-50 px-2 py-4"
                          >
                            {column.name}
                          </TableColumn>
                        )}
                      </TableHeader>
                      <TableBody emptyContent={"No event or meeting available"} items={sortedSchedule}>
                        {(item) => (
                          <TableRow key={item._id} className="hover:bg-gray-50 transition duration-200">
                            {(columnKey) => (
                              <TableCell className="px-4 py-3 text-gray-700">{renderCellSchedule(item, columnKey)}</TableCell>
                            )}
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </Item>
              </Grid>


            </Grid>
          </Box>
        </div>
      </SidebarInset>
    </SidebarProvider>

  )
}