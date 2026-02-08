import Sidebar from "@/components/layout/Sidebar";
import { useStore } from "@/lib/store";
import type { User, Role } from "@/lib/store";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Search, UserCog, Edit, Trash2, KeyRound } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function UserManagement() {
  const { currentUser } = useStore();
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newRole, setNewRole] = useState<Role>("Initiator");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newDepartment, setNewDepartment] = useState("");
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<string>("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editDepartment, setEditDepartment] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast({ title: "Error", description: "Failed to load users.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== "IT") {
    return (
      <div className="flex h-screen w-full bg-background items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground" data-testid="text-access-denied">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view this page.</p>
        </div>
      </div>
    );
  }

  const filteredUsers = users.filter((u: User) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newName || !newUsername) return;
    try {
      await api.users.create({
        name: newName,
        username: newUsername,
        role: newRole,
        email: newEmail,
        phone: newPhone,
      });
      toast({ title: "User Created", description: `Successfully created user ${newName}.` });
      setIsCreating(false);
      setNewName("");
      setNewUsername("");
      setNewRole("Initiator");
      setNewEmail("");
      setNewPhone("");
      setNewDepartment("");
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to create user.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      await api.users.update(editingUser.id, {
        name: editName,
        role: editRole as Role,
        email: editEmail,
        phone: editPhone,
      });
      toast({ title: "User Updated", description: "User profile has been updated successfully." });
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update user.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.users.delete(id);
      toast({ title: "User Deleted", description: "User has been removed from the system.", variant: "destructive" });
      fetchUsers();
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete user.", variant: "destructive" });
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      await api.users.resetPassword(id);
      toast({ title: "Password Reset", description: "User password has been reset to default." });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to reset password.", variant: "destructive" });
    }
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditEmail(user.email || "");
    setEditPhone(user.phone || "");
  };

  const roles: Role[] = ["Initiator", "HOD", "Administrative Department", "Operations", "EAG", "MD", "Finance", "IT", "Risk"];

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground" data-testid="text-user-management-title">User Management</h1>
              <p className="text-muted-foreground mt-1">Manage system access, roles, and profiles.</p>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2 shadow-lg" data-testid="button-add-user">
                  <UserCog className="w-4 h-4" /> Add New User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      placeholder="e.g. John Doe"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      data-testid="input-new-user-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Username</Label>
                    <Input
                      placeholder="e.g. johndoe"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      data-testid="input-new-user-username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="e.g. john@alpha10.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      data-testid="input-new-user-email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      placeholder="e.g. +234..."
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      data-testid="input-new-user-phone"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assign Role</Label>
                    <Select onValueChange={(val) => setNewRole(val as Role)} defaultValue={newRole}>
                      <SelectTrigger data-testid="select-new-user-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>Cancel</Button>
                  <Button onClick={handleCreate} disabled={!newName || !newUsername} data-testid="button-create-user">Create User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border border-border shadow-sm">
            <CardHeader className="border-b border-border">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-users"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-muted-foreground">Loading users...</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No users found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]">Avatar</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user: User) => (
                      <TableRow key={user.id} data-testid={`row-user-${user.id}`}>
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium" data-testid={`text-user-name-${user.id}`}>{user.name}</TableCell>
                        <TableCell className="text-muted-foreground">{user.username}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                            {user.role}
                          </span>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{user.email || "—"}</TableCell>
                        <TableCell>
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Dialog open={editingUser?.id === user.id} onOpenChange={(open) => !open && setEditingUser(null)}>
                              <DialogTrigger asChild>
                                <Button variant="ghost" size="sm" onClick={() => openEdit(user)} data-testid={`button-edit-user-${user.id}`}>
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit User Profile</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Full Name</Label>
                                    <Input value={editName} onChange={(e) => setEditName(e.target.value)} data-testid="input-edit-user-name" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={editRole} onValueChange={setEditRole}>
                                      <SelectTrigger data-testid="select-edit-user-role">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {roles.map((r) => (
                                          <SelectItem key={r} value={r}>{r}</SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} data-testid="input-edit-user-email" />
                                  </div>
                                  <div className="space-y-2">
                                    <Label>Phone</Label>
                                    <Input value={editPhone} onChange={(e) => setEditPhone(e.target.value)} data-testid="input-edit-user-phone" />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setEditingUser(null)}>Cancel</Button>
                                  <Button onClick={handleSave} data-testid="button-save-user">Save Changes</Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-amber-500 hover:text-amber-700 hover:bg-amber-50" data-testid={`button-reset-password-${user.id}`}>
                                  <KeyRound className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reset Password?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reset the password for <strong>{user.name}</strong>?
                                    This will set a temporary password that the user must change upon next login.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleResetPassword(user.id)} className="bg-amber-600 hover:bg-amber-700">
                                    Reset Password
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" data-testid={`button-delete-user-${user.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{user.name}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(user.id)} className="bg-red-600 hover:bg-red-700">
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
