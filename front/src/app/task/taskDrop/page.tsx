"use client";
import React, { useEffect, useState } from "react";
import { Card, CardBody, CardFooter } from "@heroui/react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { MdCancel } from "react-icons/md";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ModeToggle } from "@/components/ModeToggle";
import { Meteors } from "@/components/ui/meteors";
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import Task from "../form";

interface Task {
  _id: string;
  subject:string;
  relatedTo:string;
  lastReminder:string;
  name:string;
  assigned:string;
  taskDate:string;
  dueDate:string;
  status:"Pending" | "In Progress" | "Resolved" ;
  isActive: boolean;
}

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

export default function App() {
  const [error, setError] = useState("");
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [groupedTasks, setGroupedTasks] = useState<Record<string, Task[]>>({});
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTask(null);
  };
  
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const fetchedTasks = await getAllTasks();
        groupTasksByStatus(fetchedTasks);
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message); 
        } else {
          setError("An unknown error occurred");
      }
    };
  }
    fetchTasks();
  }, []);

  const groupTasksByStatus = (tasks: Task[]) => {
    const grouped = tasks.reduce((acc, task) => {
      if (!acc[task.status]) acc[task.status] = [];
      acc[task.status].push(task);
      return acc;
    }, {} as Record<string, Task[]>);
    setGroupedTasks(grouped);
  };


  const statusColors: Record<string, string> = {
    Pending: "text-gray-800 border-2 border-black shadow-lg shadow-black/50",
    InProgress: "text-gray-800 border-2 border-black shadow-lg shadow-black/50",
    Resolved: "text-gray-800 border-2 border-black shadow-lg shadow-black/50",
  };
  

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toISOString().split("T")[0];
  };

    const handleDragStart = (e: React.DragEvent, task: Task, fromStatus: string) => {
      e.dataTransfer.setData("task", JSON.stringify(task));
      e.dataTransfer.setData("fromStatus", fromStatus);
      e.dataTransfer.effectAllowed = "move";
    };

     const handleDrop = async (e: React.DragEvent, toStatus: string) => {
        e.preventDefault();
        setDraggedOver(null);
        const taskData = e.dataTransfer.getData("task");
        const fromStatus = e.dataTransfer.getData("fromStatus");
    
        if (!taskData || !fromStatus || fromStatus === toStatus) return;
    
        const task: Task = JSON.parse(taskData);
        const updatedTask = { ...task, status: toStatus };
    
        setGroupedTasks((prev) => ({
          ...prev,
          [fromStatus]: prev[fromStatus]?.filter((l) => l._id !== task._id) || [],
          [toStatus]: [...(prev[toStatus] || []), updatedTask as Task], 
        }));
        
        try {
          const response = await fetch("http://localhost:8000/api/v1/task/updateTaskStatus", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ taskId: task._id, status: toStatus }),
          });
          const data = await response.json();
          if (!data.success) throw new Error("Failed to update task status on server.");
        } catch (error) {
          console.error("Error updating status:", error);
        }
      };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <ModeToggle />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/task">Task</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/invoice/invoiceDrop">Drag & Drop</BreadcrumbLink>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="flex items-center space-x-4 ml-auto mr-4">
            <div>
              <SearchBar />
            </div>
            <div>
              <Notification />
            </div>
          </div>
        </header>

        <div className="p-6">
          {error && <p className="text-red-500 text-center">{error}</p>}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
            {Object.keys(statusColors).map((status) => {
              const taskStatus = groupedTasks[status] || [];

              return (
                <div
                  key={status}
                  onDrop={(e) => handleDrop(e, status)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDraggedOver(status);
                  }}
                  onDragLeave={() => setDraggedOver(null)}
                >
                  <h2 className="text-base font-bold mb-4 p-4 bg-white border border-black rounded text-gray-800 text-center">
                    {status}
                  </h2>

                  <div className="p-4 rounded-lg shadow-sm border border-black mb-4">
                    <p className="text-sm font-semibold text-gray-800">Total Task: {taskStatus.length}</p>
                  </div>

                  <div className="mt-4 flex flex-col gap-3 min-h-[250px] max-h-[500px] overflow-y-auto">
                    {taskStatus.length === 0 ? (
                      <p className="text-center text-gray-500">No invoices available</p>
                    ) : (
                      taskStatus.map((task) => (
                        <div
                          key={task._id}
                          className="p-3 border border-black rounded-lg bg-white shadow-sm cursor-grab"
                          draggable
                          onDragStart={(e) => handleDragStart(e, task, status)}
                          onClick={() => handleTaskClick(task)}
                        >
                         <p className="text-sm font-semibold text-black">Subject: {task.subject}</p>
                          </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {isModalOpen && selectedTask && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
    <div className="w-full max-w-md h-auto relative">
      <div className="absolute inset-0 h-full w-full bg-gradient-to-r  rounded-full blur-lg scale-90 opacity-50" />
      <div className="relative bg-white border border-gray-700 rounded-lg p-6 w-[800px] h-700 flex flex-col">
        {/* Close Button */}
        <div
          className="absolute top-3 right-3 h-8 w-8 flex items-center justify-center cursor-pointer"
          onClick={closeModal}
        >
          <MdCancel className="text-gray-500 text-2xl" />
        </div>

        {/* Modal Header */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-6">Invoice Details</h1>
 <Separator className="my-4 border-gray-300" />
        {/* Invoice Details */}
        <div className="grid grid-cols-2 gap-6 text-gray-700 overflow-y-auto">
  {Object.entries(selectedTask)
    .filter(([key]) => !["_id", "__v", "isActive", "createdAt", "updatedAt"].includes(key)) // Exclude unwanted fields
    .map(([key, value]) => (
      <p key={key} className="text-lg">
        <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{" "}
        {["dueDate", "lastReminderDate", "taskDate"].includes(key) && value
          ? new Date(value).toLocaleDateString("en-GB") // ✅ Shows only date (DD/MM/YYYY)
          : value || "N/A"}
      </p>
    ))}
</div>

      </div>
    </div>
  </div>
)}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}