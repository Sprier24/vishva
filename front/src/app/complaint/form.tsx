"use client";

import * as z from "zod"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "@/hooks/use-toast"
import { useForm } from "react-hook-form"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Loader2 } from "lucide-react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

const complaintSchema = z.object({
  companyName: z.string().optional(),
  complainerName: z.string().min(2, { message: "Complainer name is required." }),
  contactNumber: z.string().regex(/^\d*$/, { message: "Paid amount must be numeric" }).optional(),
  emailAddress: z.string().optional(),
  subject: z.string().min(2, { message: "Subject is required." }),
  date: z.date().optional(),
  caseStatus: z.enum(["Pending", "Resolved", "In Progress"]),
  priority: z.enum(["High", "Medium", "Low"]),
  caseOrigin: z.string().optional(),
});

export default function ComplaintForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<z.infer<typeof complaintSchema>>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      companyName: "",
      complainerName: "",
      contactNumber: "",
      emailAddress: "",
      subject: "",
      date: new Date(),
      caseStatus: "Pending",
      priority: "Medium",
      caseOrigin: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof complaintSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/complaint/createComplaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit the complaint.");
      }
      toast({
        title: "Complaint Submitted",
        description: "The complaint has been successfully created",
      });
      router.push("/complaint/table")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error creating the complaint",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Company Name (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="complainerName"
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
                <FormLabel>Contact Number (Optional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Enter contact number"
                    type="tel"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, ''); // Allow only numeric values
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
                <FormLabel>Email Address (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter valid email address" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Subject</FormLabel>
                <FormControl>
                  <Input placeholder="Enter subject" {...field} />
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
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                      >
                        {field.value ? format(field.value, "dd-MM-yyyy") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}

                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="caseStatus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Case Status</FormLabel>
                <FormControl>
                  <select {...field} 
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
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
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
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
          name="caseOrigin"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Problem (Optional)</FormLabel>
              <FormControl>
                <textarea
                  placeholder="Enter client / customer problem briefly..."
                  {...field}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-black resize-none"
                  rows={3}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-center sm:justify-end">
          <Button type="submit" className="w-full sm:w-auto flex items-center justify-center" disabled={isSubmitting}>          
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Create Complaint"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}