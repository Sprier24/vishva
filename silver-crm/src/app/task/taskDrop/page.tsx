"use client";
import React, { useEffect, useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import SearchBar from "@/components/globalSearch";
import Notification from "@/components/notification";
import { Calendar1, Mail, X } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Task {
  notes: string;
  _id: string;
  subject: string;
  relatedTo: string;
  lastReminder: string;
  name: string;
  assigned: string;
  date: string;
  endDate: string;
  status: "Pending" | "InProgress" | "Resolved";
  isActive: boolean;
  priority: "High" | "Medium" | "Low";
}

const statusColors = {
  Pending: "bg-blue-100 text-blue-800 border-blue-200",
  "InProgress": "bg-yellow-100 text-yellow-800 border-yellow-200",
  Resolved: "bg-green-100 text-green-800 border-green-200",
};

const statusOrder = ["Pending", "InProgress", "Resolved"];

const getAllTasks = async (): Promise<Task[]> => {
  try {
    const response = await fetch("http://localhost:8000/api/v1/task/getAllTasks");
    const data = await response.json();
    if (data.success) return data.data;
    throw new Error(data.message);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    throw new Error("Failed to fetch tasks");
  }
};

export default function TaskBoard() {
  const [groupedTasks, setGroupedTasks] = useState<Record<string, Task[]>>({});
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getAllTasks();
        const grouped = fetchedTasks.reduce((acc, task) => {
          if (!acc[task.status]) acc[task.status] = [];
          acc[task.status].push(task);
          return acc;
        }, {} as Record<string, Task[]>);
        setGroupedTasks(grouped);
      } catch (error) {
        console.error("Error fetching tasks:", error);
      }
    };
    fetchTasks();
  }, []);

  const handleDragStart = (e: React.DragEvent, task: Task, fromStatus: string) => {
    e.dataTransfer.setData("task", JSON.stringify(task));
    e.dataTransfer.setData("fromStatus", fromStatus);
  };

  const handleDrop = async (e: React.DragEvent, toStatus: string) => {
    e.preventDefault();
    const taskData = e.dataTransfer.getData("task");
    const fromStatus = e.dataTransfer.getData("fromStatus");

    if (!taskData || !fromStatus || fromStatus === toStatus) return;

    const task: Task = JSON.parse(taskData);
    const updatedTask = { ...task, status: toStatus };

    setGroupedTasks((prev) => ({
      ...prev,
      [fromStatus]: prev[fromStatus]?.filter((t) => t._id !== task._id) || [],
      [toStatus]: [...(prev[toStatus] || []), updatedTask as Task],
    }));

    try {
      await fetch("http://localhost:8000/api/v1/task/updateTaskStatus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task._id, status: toStatus }),
      });
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList className="flex items-center space-x-2">

                <BreadcrumbItem className="hidden sm:block md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="hidden sm:block md:block" />

                <BreadcrumbItem className="hidden sm:block md:block">
                  <BreadcrumbLink href="/task/table">Task</BreadcrumbLink>
                </BreadcrumbItem>

                <BreadcrumbSeparator className="hidden sm:block md:block" />
                <span className="hidden sm:block md:block">
                  Drag & Drop
                </span>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4 ml-auto mr-4">
            <div  >
              <SearchBar />
            </div>
            <a href="/email" className="relative group">
              <Mail className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
              <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Email
              </div>
            </a>
            <a href="/calendar" className="relative group">
              <Calendar1 className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
              <div className="absolute left-1/2 top-8 -translate-x-1/2 whitespace-nowrap rounded-md bg-gray-800 px-2 py-1 text-xs text-white shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                Calendar
              </div>
            </a>
            <div>
              <Notification />
            </div>
          </div>
        </header>

        <main className="p-4 md:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Object.values(groupedTasks).reduce((sum, tasks) => sum + tasks.length, 0)}
                </div>
              </CardContent>
            </Card>
            {statusOrder.map((status) => (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{status}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{groupedTasks[status]?.length || 0}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-4">
            {statusOrder.map((status) => {
              const tasks = groupedTasks[status] || [];

              return (
                <div
                  key={status}
                  className={`rounded-lg border p-4 transition-colors ${draggedOver === status ? "bg-accent/50" : "bg-background"
                    }`}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnter={() => setDraggedOver(status)}
                  onDragLeave={() => setDraggedOver(null)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`text-sm font-medium px-3 py-1 rounded-full ${statusColors[status as keyof typeof statusColors]}`}>
                      {status}
                    </h3>
                    <span className="text-sm text-muted-foreground">
                      {tasks.length} tasks
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
                    {tasks.length > 0 ? (
                      tasks.map((task) => (
                        <Card
                          key={task._id}
                          className="cursor-grab hover:shadow-sm active:cursor-grabbing"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, status)}
                          onClick={() => {
                            setSelectedTask(task);
                            setIsModalOpen(true);
                          }}
                        >
                          <CardHeader className="p-4 pb-2">
                            <CardTitle className="text-sm font-medium line-clamp-1">
                              {task.subject}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 pt-0">
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {task.name}
                            </p>
                            <p className="text-sm font-semibold mt-2">
                              Due: {formatDate(task.endDate)}
                            </p>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
                        No task in this status
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </main>

        {isModalOpen && selectedTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="relative mx-4 w-full max-w-2xl rounded-lg bg-background shadow-lg">
              <button
                className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none"
                onClick={() => setIsModalOpen(false)}
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Close</span>
              </button>

              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4">{selectedTask.subject}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Name</h3>
                    <p>{selectedTask.name || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Related To</h3>
                    <p>{selectedTask.relatedTo || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Assigned By</h3>
                    <p>{selectedTask.assigned || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Status</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedTask.status]}`}>
                      {selectedTask.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Start Date</h3>
                    <p>{formatDate(selectedTask.date)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Due Date</h3>
                    <p>{formatDate(selectedTask.endDate)}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Priority</h3>
                    <p>{selectedTask.priority || "N/A"}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-sm text-muted-foreground mb-1">Notes</h3>
                    <p className="whitespace-pre-line">{selectedTask.notes || "No description"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </SidebarInset>
    </SidebarProvider>
  );
}