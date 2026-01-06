import { useEffect, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { Badge } from "@/shared/components/ui/badge";
import { AlertTriangle, Check, X } from "lucide-react";
import { useAuthStore } from "@/state/auth-store";

export function AdminApprovalsPage() {
  const {
    pendingUsers,
    loadPendingUsers,
    approveUser,
    rejectUser,
    status,
    error,
  } = useAuthStore();
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadPendingUsers();
  }, [loadPendingUsers]);

  const isLoading = status === "loading";

  const handleApprove = async (id: string) => {
    setActionError(null);
    setProcessingId(id);
    try {
      await approveUser(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to approve user";
      setActionError(message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionError(null);
    setProcessingId(id);
    try {
      await rejectUser(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to reject user";
      setActionError(message);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Pending Registrations</h1>
          <p className="text-sm text-muted-foreground">
            Approve or reject new access requests from agency partners.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={loadPendingUsers}
          disabled={isLoading}
          aria-label="Refresh pending registrations list"
        >
          Refresh
        </Button>
      </div>

      {(error || actionError) && (
        <Card className="p-4 border-destructive/30 bg-destructive/5 text-destructive">
          {error || actionError}
        </Card>
      )}

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Agency</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingUsers.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center text-muted-foreground"
                >
                  {isLoading
                    ? "Loading requests..."
                    : "No pending registrations 🎉"}
                </TableCell>
              </TableRow>
            )}
            {pendingUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {user.email}
                  </div>
                </TableCell>
                <TableCell>{user.agency}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge>{user.role}</Badge>
                </TableCell>
                <TableCell>
                  {new Date(user.submittedAt).toLocaleString()}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleApprove(user.id)}
                    disabled={isLoading || processingId === user.id}
                    aria-label={`Approve registration for ${user.name}`}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleReject(user.id)}
                    disabled={isLoading || processingId === user.id}
                    aria-label={`Reject registration for ${user.name}`}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
