import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteDialogProps {
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
}

const DeleteDialog = ({ onConfirm, onCancel }: DeleteDialogProps) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      // close dialog after successful delete
      onCancel();
    } catch (e) {
      // allow parent to show error; we just stop loading
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={true} onOpenChange={onCancel}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <AlertDialogTitle>Delete Record</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Are you sure you want to delete this record? This action cannot be undone and will 
            permanently remove all associated files.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground flex items-center gap-2"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : null}
            {loading ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteDialog;
