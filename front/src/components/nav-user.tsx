"use client";

import axios from "axios";
import Link from "next/link";
import { Edit, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronsUpDown, LogOut, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface Owner {
  _id: string;
  logo?: string;
  companyName: string;
  ownerName: string;
  contactNumber: string;
  emailAddress: string;
  website?: string;
  businessRegistration?: string;
  companyType?: string;
  employeeSize?: string;
  panNumber?: string;
  documentType?: string;
  documentNumber?: string;
  gstNumber?: string;
  udhayamAadhar?: string;
  stateCertificate?: string;
  incorporationCertificate?: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const [open, setOpen] = useState(false);
  const [owners, setOwners] = useState<Owner[]>([]);
  const [filteredOwners, setFilteredOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [editOwner, setEditOwner] = useState<Owner | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isDeleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dialogKey, setDialogKey] = useState(0);

  const form = useForm<Owner>({
    defaultValues: {
      companyName: '',
      ownerName: '',
      contactNumber: '',
      emailAddress: '',
      website: '',
      businessRegistration: '',
      companyType: '',
      employeeSize: '',
      panNumber: '',
      documentType: '',
      documentNumber: '',
      gstNumber: '',
      udhayamAadhar: '',
      stateCertificate: '',
      incorporationCertificate: '',
    },
  });

  useEffect(() => {
    const fetchOwners = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
        setOwners(response.data.data);
        const emailFromStorage = typeof window !== "undefined" ? localStorage.getItem("userEmail") : null;
        if (emailFromStorage) {
          const filtered = response.data.data.filter((owner: Owner) => owner.emailAddress === emailFromStorage);
          setFilteredOwners(filtered);
        }
      } catch (err) {
        setError("Failed to fetch owners.");
      } finally {
        setLoading(false);
      }
    };
    fetchOwners();
  }, []);

  const handleEditClick = (owner: Owner) => {
    setEditOwner(owner);
    setIsEditing(true);
    setOpen(false);
    form.reset(owner);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = async () => {
    const userId = localStorage.getItem("userId");
    const token = localStorage.getItem("token");
    const ownerId = currentOwner?._id;

    try {
      setIsDeleting(true);
      let ownerDeleted = false;
      let userDeleted = false;
      if (ownerId) {
        const ownerResponse = await axios.delete(`http://localhost:8000/api/v1/owner/deleteOwner/${ownerId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (ownerResponse.status === 200) {
          ownerDeleted = true;
        } else {
          alert(ownerResponse.data?.message || "Error deleting owner account.");
          return;
        }
      }

      if (userId) {
        const userResponse = await fetch("http://localhost:8000/api/v1/user/delete-account", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        });
        const userResult = await userResponse.json();
        if (userResponse.ok && userResult.success) {
          userDeleted = true;
        } else {
          alert(userResult.message || "Error deleting user account.");
          return;
        }
      }

      if (ownerDeleted || userDeleted) {
        localStorage.clear();
        router.push("/");
      } else {
        alert("Failed to delete the account.");
      }
    } catch (error) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account.");
    } finally {
      setIsDeleting(false);
      setDeleteModalOpen(false);
    }
  };

  const onSubmit = async (data: Owner) => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(data).forEach((key) => {
        if (key !== 'logo') {
          const value = data[key as keyof Owner];
          if (value !== undefined && value !== null) {
            formData.append(key, value as string);
          }
        }
      });

      if (logoPreview && logoPreview.startsWith('data:image')) {
        const blob = await fetch(logoPreview).then((res) => res.blob());
        formData.append('logo', blob, 'logo.png');
      }

      for (const [key, value] of formData.entries()) {
        console.log(key, value);
      }

      await axios.put(`http://localhost:8000/api/v1/owner/updateOwner/${editOwner?._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setIsEditing(false);
      setEditOwner(null);
      const response = await axios.get("http://localhost:8000/api/v1/owner/getAllOwners");
      setOwners(response.data.data);
      setFilteredOwners(
        response.data.data.filter((owner: { emailAddress: string | null }) => owner.emailAddress === localStorage.getItem("userEmail"))
      );
    } catch (error) {
      console.error("Failed to update owner:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  const currentOwner = filteredOwners[0];

  return (
    <>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    src={currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png"}
                    alt={currentOwner?.ownerName || "User"}
                  />
                  <AvatarFallback className="rounded-lg">
                    {currentOwner?.ownerName?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{currentOwner?.ownerName || "User"}</span>
                  <span className="truncate text-xs">{currentOwner?.emailAddress || "No Email"}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg" side={isMobile ? "bottom" : "right"} align="end" sideOffset={4}>
              <DropdownMenuItem>
                <LogOut />
                <Link href="/login">Log out</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteModalOpen(true)} className="text-red-500">
                <Trash2 className="size-4 mr-2" />
                <span>Delete Account</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <button
                  onClick={() => {
                    setOpen(false);
                    setTimeout(() => setOpen(true), 100);
                  }}
                  className="w-full text-left"

                >
                  <Dialog key={dialogKey} open={open} onOpenChange={setOpen}>
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png"}
                            alt={currentOwner?.ownerName || "User"}
                          />
                          <AvatarFallback className="rounded-lg">
                            {currentOwner?.ownerName?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{currentOwner?.ownerName || "User"}</span>
                          <span className="truncate text-xs">{currentOwner?.emailAddress || "No Email"}</span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                  </Dialog>
                </button>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>

      <Dialog open={isDeleteModalOpen} onOpenChange={(open) => {
        if (!open) {
          setDeleteModalOpen(false);
        }
      }}>
        <DialogContent
          onInteractOutside={(e) => {
            e.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>Confirm Account Deletion</DialogTitle>
            <DialogDescription>Are you sure you want to delete your account? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting}>
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>


         <Dialog open={open} onOpenChange={(open) => {
                        if (!open) {
                          setOpen(false);
                        }
                    }}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto hide-scrollbar"
       onInteractOutside={(e) => {
                               e.preventDefault();
                           }
                           } >
          <DialogHeader>
            <DialogTitle className="text-center">Company Profile</DialogTitle>
          </DialogHeader>
          {error ? (
            <div className="text-center text-red-500 py-4">{error}</div>
          ) : currentOwner ? (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-gray-200">
                    <AvatarImage
                      src={currentOwner.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png"}
                      alt={currentOwner.companyName}
                    />
                    <AvatarFallback className="text-xl">
                      {currentOwner.companyName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                  <div>
                      <p className="text-xs text-gray-400">Name</p>
                      <p>{currentOwner.ownerName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Email</p>
                      <p>{currentOwner.emailAddress}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Phone</p>
                      <p>{currentOwner.contactNumber}</p>
                    </div>
                    {currentOwner.website && (
                      <div>
                        <p className="text-xs text-gray-400">Website</p>
                        <a 
                          href={currentOwner.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {currentOwner.website}
                        </a>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Business Details</h3>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <p className="text-xs text-gray-400">Company Name</p>
                      <p>{currentOwner.companyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Company Type</p>
                      <p>{currentOwner.companyType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Registration</p>
                      <p>{currentOwner.businessRegistration}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Employees</p>
                      <p>{currentOwner.employeeSize}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <h3 className="text-sm font-medium text-gray-500">Legal Information</h3>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-400">PAN Number</p>
                      <p>{currentOwner.panNumber}</p>
                    </div>
                    {currentOwner.gstNumber && (
                      <div>
                        <p className="text-xs text-gray-400">GST Number</p>
                        <p>{currentOwner.gstNumber}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Document Type</p>
                      <p>{currentOwner.documentType}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Document Number</p>
                      <p>{currentOwner.documentNumber || "N/A"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => handleEditClick(currentOwner)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No profile information available
            </div>
          )}
        </DialogContent>
      </Dialog>
        
        <Dialog open={isEditing} onOpenChange={(open) => {
                        if (!open) {
                          setIsEditing(false);
                        }
                    }}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto hide-scrollbar"
            onInteractOutside={(e) => {
              e.preventDefault();
          }}>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="flex flex-col items-center gap-4">
                <label htmlFor="logo" className="cursor-pointer">
                  <Avatar className="h-24 w-24 md:h-32 md:w-32 border-2 border-dashed border-gray-300">
                    <AvatarImage
                      src={logoPreview || (currentOwner?.logo ? `http://localhost:8000/uploads/${currentOwner.logo}` : "/default-logo.png")}
                      alt="Company Logo"
                    />
                    <AvatarFallback className="text-xl">
                      {currentOwner?.companyName?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </label>
                <input
                  type="file"
                  id="logo"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner Name</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="companyType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Type</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessRegistration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Registration</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded-md" {...field}>
                          <option value="">Select Registration</option>
                          <option value="Sole proprietorship">Sole proprietorship</option>
                          <option value="One person Company">One person Company</option>
                          <option value="Partnership">Partnership</option>
                          <option value="Private Limited">Private Limited</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee Size</FormLabel>
                      <FormControl>
                        <select className="w-full p-2 border rounded-md" {...field}>
                          <option value="">Select Size</option>
                          <option value="1-10">1-10</option>
                          <option value="11-50">11-50</option>
                          <option value="51-100">51-100</option>
                          <option value=">100">&gt;100</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="panNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PAN Number</FormLabel>
                      <FormControl>
                        <Input disabled {...field} className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gstNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>GST Number</FormLabel>
                      <FormControl>
                      <Input disabled {...field} className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Type</FormLabel>
                      <FormControl>
                      <Input disabled {...field} className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="documentNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document Number</FormLabel>
                      <FormControl>
                      <Input disabled {...field} className="bg-gray-100" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Website</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="https://example.com" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}