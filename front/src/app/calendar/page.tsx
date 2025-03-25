"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaChevronLeft, FaChevronRight, FaPlus } from 'react-icons/fa';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import SearchBar from '@/components/globalSearch';
import Notification from '@/components/notification';
import { Calendar1 } from "lucide-react";
import Select from "react-select";

interface Event {
  _id: string;
  event: string;
  date: string;
  calendarId: number;
}

interface Calendar {
  id: number;
  name: string;
  color: string;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState<boolean>(false);
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const calendars: Calendar[] = [
    { id: 1, name: 'High', color: 'bg-blue-500' },
    { id: 2, name: 'Medium', color: 'bg-green-500' },
    { id: 3, name: 'Low', color: 'bg-yellow-500' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/v1/calendar/getAllData');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = parseInt(e.target.value);
    setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
  };

  const handleAddEvent = () => {
    setSelectedEvent(null);
    setShowEventModal(true);
  };

  const handleUpdateEvent = async (newEvent: Event) => {
    try {
      const response = await fetch(`http://localhost:8000/api/v1/calendar/updateData/${newEvent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!response.ok) {
        throw new Error('Failed to update event');
      }
      const updatedEvent = await response.json();
      setEvents(events.map((event) => (event._id === updatedEvent.data._id ? updatedEvent.data : event)));
    } catch (error) {
      console.error('Error updating event:', error);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/calendar/deleteData', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: eventId }),
      });
      if (!response.ok) {
        throw new Error('Failed to delete event');
      }
      setEvents(events.filter((event) => event._id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const handleCreateEvent = async (newEvent: Event) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/calendar/createData', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      if (!response.ok) {
        throw new Error('Failed to create event');
      }
      const createdEvent = await response.json();
      setEvents([...events, createdEvent.data]);
    } catch (error) {
      console.error('Error creating event:', error);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const today = new Date();

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const isToday = date.toDateString() === today.toDateString();
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate.toDateString() === date.toDateString();
      });

      days.push(
        <div
          key={day}
          className={`p-1 xs:p-2 sm:p-3 md:p-4 lg:p-5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
            isToday ? 'relative bg-blue-50' : ''
          }`}
        >
          <div
            className={`font-bold text-center ${
              isToday ? 'flex items-center justify-center w-6 h-6 bg-blue-500 text-white rounded-full mx-auto' : ''
            }`}
          >
            {day}
          </div>
          {dayEvents.map((event) => (
            <div
              key={event._id}
              className={`${
                calendars.find((cal) => cal.id === event.calendarId)?.color
              } text-white p-1 mb-1 rounded cursor-pointer text-sm leading-tight truncate hover:opacity-90 transition-opacity`}
              style={{ maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
              onClick={() => {
                setSelectedEvent(event);
                setShowEventModal(true);
              }}
            >
              {event.event}
            </div>
          ))}
        </div>
      );
    }
    return days;
  };

  const months = [
    { value: 0, label: "January" },
    { value: 1, label: "February" },
    { value: 2, label: "March" },
    { value: 3, label: "April" },
    { value: 4, label: "May" },
    { value: 5, label: "June" },
    { value: 6, label: "July" },
    { value: 7, label: "August" },
    { value: 8, label: "September" },
    { value: 9, label: "October" },
    { value: 10, label: "November" },
    { value: 11, label: "December" },
  ];

  const years = Array.from({ length: 2100 - 1900 + 1 }, (_, i) => 1900 + i);
  const yearOptions = years.map((year) => ({ value: year, label: year.toString() }));

  const customStyles = {
    control: (base) => ({
      ...base,
      backgroundColor: "#f3f4f6",
      color: "black",
      minHeight: "36px",
      borderRadius: "6px",
      border: "1px solid #d1d5db",
      boxShadow: "none",
      "&:hover": { borderColor: "#9ca3af" },
    }),
    singleValue: (base) => ({
      ...base,
      color: "black",
    }),
    menu: (base) => ({
      ...base,
      maxHeight: "none",
      overflow: "hidden",
      backgroundColor: "white",
      color: "black",
    }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected ? "#2563eb" : "white",
      color: state.isSelected ? "white" : "black",
      "&:hover": { backgroundColor: "#e5e7eb" },
    }),
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-white shadow-sm">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList className="flex items-center space-x-2">
                <BreadcrumbItem className="hidden sm:block md:block">
                  <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block md:block" />
                <span className="hidden sm:block md:block">Calendar</span>
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
        <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8 pt-15">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex space-x-2">
              <Select
                value={months.find((m) => m.value === currentDate.getMonth())}
                onChange={(selectedOption) => handleMonthChange({ target: { value: selectedOption?.value } })}
                options={months}
                className="w-32 text-sm"
                styles={customStyles}
              />
              <Select
                value={yearOptions.find((option) => option.value === currentDate.getFullYear())}
                onChange={(selectedOption) => handleYearChange({ target: { value: selectedOption?.value.toString() } })}
                options={yearOptions}
                className="w-24 text-sm"
                styles={customStyles}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handlePrevMonth}
                className="bg-gray-100 text-black border border-gray-300 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              >
                <FaChevronLeft />
              </button>
              <button
                onClick={handleNextMonth}
                className="bg-gray-100 text-black border border-gray-300 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
              >
                <FaChevronRight />
              </button>
              <button
                onClick={handleAddEvent}
                className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                <FaPlus />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="font-bold text-center text-sm sm:text-base text-gray-700">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">{renderCalendarDays()}</div>
          {showEventModal && (
            <EventModal
              event={selectedEvent}
              onSave={selectedEvent ? handleUpdateEvent : handleCreateEvent}
              onClose={() => setShowEventModal(false)}
              onDelete={handleDeleteEvent}
              calendars={calendars}
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

const EventModal = ({ event, onSave, onClose, onDelete, calendars }: { event: Event | null, onSave: (newEvent: Event) => void, onClose: () => void, onDelete: (eventId: string) => void, calendars: Calendar[] }) => {
  const [eventTitle, setEventTitle] = useState<string>(event ? event.event : '');
  const [date, setDate] = useState<string>(event ? new Date(event.date).toISOString().split('T')[0] : '');
  const [calendarId, setCalendarId] = useState<number>(event ? event.calendarId : calendars[0].id);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: Event = {
      _id: event?._id || Date.now().toString(),
      event: eventTitle,
      date: new Date(date).toISOString(),
      calendarId,
    };

    onSave(newEvent);
    onClose();
  };

  const handleDelete = () => {
    if (event) {
      onDelete(event._id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div ref={modalRef} className="bg-white dark:bg-gray-800 p-4 rounded-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          {event ? 'Edit Event' : 'Add Event'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="event" className="block mb-2 text-gray-900 dark:text-white">
              Event
            </label>
            <input
              type="text"
              id="event"
              value={eventTitle}
              onChange={(e) => setEventTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="date" className="block mb-2 text-gray-900 dark:text-white">
              Date
            </label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="calendar" className="block mb-2 text-gray-900 dark:text-white">
              Calendar
            </label>
            <select
              id="calendar"
              value={calendarId}
              onChange={(e) => setCalendarId(parseInt(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {calendars.map((calendar) => (
                <option key={calendar.id} value={calendar.id}>
                  {calendar.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-2">
            {event && (
              <button
                type="button"
                onClick={handleDelete}
                className="bg-red-500 text-white p-2 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Delete
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-100 text-black border border-gray-300 p-2 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};