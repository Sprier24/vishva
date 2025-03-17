"use client";
import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";

interface NotificationEvent {
  _id: string;
  title: string;
  message: string;
  createdAt: string;
  type: "reminder" | "calendar";
  starred?: boolean;
  error?: boolean;
}

const Notification = () => {
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(
          "http://localhost:8000/api/v1/notification/getAllNotifications"
        );
        const data = await response.json();
        if (data.success) {
          const storedStarred = JSON.parse(
            localStorage.getItem("starredNotifications") || "{}"
          );
          const notificationsWithStars = data.data.map(
            (notification: NotificationEvent) => ({
              ...notification,
              starred: !!storedStarred[notification._id],
            })
          );
          notificationsWithStars.sort((a: NotificationEvent, b: NotificationEvent) => {
            if (a.error && !b.error) return -1;
            if (!a.error && b.error) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
          setNotifications(notificationsWithStars);
        } else {
          setError("Error fetching notifications. Please try again later.");
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    fetchNotifications(); 
    const interval = setInterval(fetchNotifications, 10000); 
    return () => clearInterval(interval); 
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(
        `http://localhost:8000/api/v1/notification/deleteNotification/${id}`,
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
      } else {
        alert("Failed to delete the notification.");
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
      alert("Error deleting notification.");
    }
  };

  const clearAllNotifications = async () => {
    try {
      const response = await fetch(
        "http://localhost:8000/api/v1/notification/deleteAllNotifications",
        {
          method: "DELETE",
        }
      );
      const data = await response.json();
      if (data.success) {
        setNotifications([]);
      } else {
        alert("Failed to delete all notifications.");
      }
    } catch (err) {
      console.error("Error clearing all notifications:", err);
      alert("Error clearing all notifications.");
    }
  };

  const toggleStar = (id: string) => {
    setNotifications((prev) => {
      const updatedNotifications = prev.map((notification) =>
        notification._id === id
          ? { ...notification, starred: !notification.starred }
          : notification
      );
      const starredNotifications = updatedNotifications.reduce((acc, notification) => {
        acc[notification._id] = notification.starred || false;
        return acc;
      }, {} as Record<string, boolean>);
      localStorage.setItem("starredNotifications", JSON.stringify(starredNotifications));
      return updatedNotifications;
    });
  };

  const toggleNotificationPanel = () => {
    setNotificationVisible(!isNotificationVisible);
  };

  const unreadNotificationCount = notifications.length;

  return (
    <>
      <div className="flex-1 flex justify-end space-x-4">
        <button onClick={toggleNotificationPanel} className="relative">
          <Bell className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full px-1">
              {unreadNotificationCount}
            </span>
          )}
        </button>
      </div>
      {isNotificationVisible && (
        <div className="fixed top-0 right-0 w-full sm:w-96 h-full bg-gray-100 dark:bg-[#1a1a1a] shadow-lg border-l border-gray-200 dark:border-gray-700 z-50 p-4 overflow-y-auto hide-scrollbar">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Reminders
            </h2>
            <button
              onClick={() => setNotificationVisible(false)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="flex justify-end mb-4">
            <button
              onClick={clearAllNotifications}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-600"
            >
              Dismiss All Reminders
            </button>
          </div>
          <div className="notification-inbox overflow-y-auto h-full hide-scrollbar">
            {error && <p className="text-red-600 dark:text-red-400">{error}</p>}
            {!error && notifications.length === 0 && (
              <div className="flex justify-center items-center text-gray-500 dark:text-gray-400">
                <p>No new notifications</p>
              </div>
            )}
            {!error && notifications.length > 0 && (
              <ul className="space-y-4">
                {notifications.map((notification) => {
                  const targetPage =
                    notification.type === "reminder"
                      ? "/reminder/table"
                      : notification.type === "calendar"
                      ? "/calendar"
                      : "#";
                  return (
                    <li
                      key={notification._id}
                      className={`flex justify-between items-start p-4 rounded-lg shadow-[4px_4px_10px_rgba(0,0,0,0.1),-2px_-2px_5px_rgba(0,0,0,0.05)] border border-gray-300 dark:border-gray-700 transition-all cursor-pointer ${
                        notification.starred
                          ? "bg-yellow-50 text-yellow-800 border-l-4 border-yellow-500 dark:bg-yellow-900 dark:text-yellow-100"
                          : notification.type === "reminder"
                          ? "bg-gray-50 text-gray-800 border-l-4 border-gray-500 dark:bg-gray-900 dark:text-gray-100"
                          : notification.type === "calendar"
                          ? "bg-gray-50 text-gray-800 border-l-4 border-gray-500 dark:bg-gray-900 dark:text-gray-100"
                          : "bg-gray-50 text-gray-800 border-l-4 border-gray-400 dark:bg-gray-800 dark:text-gray-200"
                      }`}
                    >
                      <Link href={targetPage}>
                        <div className="flex-1">
                          <h4 className="font-bold text-md">{notification.title}</h4>
                          <p className="text-sm mt-1">{notification.message}</p>
                          <span className="block text-xs text-gray-500 dark:text-gray-400 mt-2">
                            {new Date(notification.createdAt).toLocaleString()}
                          </span>
                        </div>
                      </Link>
                      <div className="relative group">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(notification._id);
                          }}
                          className="mr-2 text-yellow-500 hover:text-yellow-700 dark:text-yellow-300 dark:hover:text-yellow-500"
                        >
                          {notification.starred ? "★" : "☆"}
                        </button>
                        <span className="absolute left-1/2 -translate-x-1/2 top-full mt-2 hidden group-hover:block text-xs bg-gray-800 text-white px-2 py-1 rounded shadow-md">
                        Mark as Important
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(notification._id)}
                        className="text-red-600 bg-red-100 border border-red-500 hover:bg-red-200 text-sm font-bold py-1 px-3 rounded"
                      >
                        Dismiss
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Notification;