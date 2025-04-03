"use client"

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

const eventSchema = z.object({
  subject: z.string().nonempty({ message: "Required" }),
  assignedUser: z.string().optional(),
  location: z.string().optional(),
  customer: z.string().optional(),
  eventType: z.enum(["call", "Call", "Meeting", "meeting", "Demo", "demo", "FollowUp", "follow-up"], { message: "Required" }),
  recurrence: z.enum(["OneTime", "Daily", "Weekly", "Monthly", "Yearly"], { message: "Required" }),
  status: z.enum(["Scheduled", "Completed", "Cancelled", "Postpone"], { message: "Required" }),
  priority: z.enum(["Low", "low", "Medium", "medium", "High", "high"], { message: "Required" }),
  date: z.date().optional(),
  description: z.string().optional(),
});

export default function ScheduledEventForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter()
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      subject: "",
      assignedUser: "",
      customer: "",
      location: "",
      status: "Scheduled",
      eventType: "call",
      priority: "Medium",
      description: "",
      recurrence: "OneTime",
      date: new Date(),
    },
  });

  const onSubmit = async (values: z.infer<typeof eventSchema>) => {
    setIsSubmitting(true);
    try {
      const formattedValues = {
        ...values,
        date: values.date ? format(new Date(values.date), "yyyy-MM-dd") : undefined,
      };
      const response = await fetch("http://localhost:8000/api/v1/scheduledevents/createScheduledEvent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedValues),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to submit the event.");
      }
      toast({
        title: "Event or Meeting Submitted",
        description: "The event or meeting has been successfully created",
      });
      router.push("/Scheduled/table")
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "There was an error creating the event or meeting",
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
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event or Meeting Location</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event or meeting location" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="assignedUser"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hosted By</FormLabel>
                <FormControl>
                  <Input placeholder="Enter event or meeting, host name or host company name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customer"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Member Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter member name who is going to attend by your company side" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="eventType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Event Type</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="call">Call</option>
                    <option value="Meeting">Meeting</option>
                    <option value="Demo">Demo</option>
                    <option value="FollowUp">Follow Up</option>
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="recurrence"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Recurrence</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="OneTime">One Time</option>
                    <option value="Daily">Daily</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Monthly">Monthly</option>
                    <option value="Yearly">Yearly</option>
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
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="Scheduled">Schedule</option>
                    <option value="Postpone">Postpone</option>
                    <option value="Completed">Complete</option>
                    <option value="Cancelled">Cancel</option>
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
                  <select
                    {...field}
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <div className="form-group">
                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                  Event or meeting Date
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
        </div>

        <FormField
          control={form.control}
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

        <div className="flex justify-center sm:justify-end">
          <Button type="submit" className="w-full sm:w-auto flex items-center justify-center" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin mr-2" />
                Submitting...
              </>
            ) : (
              "Create Event or Meeting"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}