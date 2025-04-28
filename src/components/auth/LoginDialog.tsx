import React from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import LoginForm from './LoginForm';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: () => void;
}

const LoginDialog: React.FC<LoginDialogProps> = ({
  open,
  onOpenChange,
  onLoginSuccess
}) => {
  const handleLoginSuccess = () => {
    // Close the dialog and call the onLoginSuccess callback
    onOpenChange(false);
    onLoginSuccess();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle>Sign In</AlertDialogTitle>
          <AlertDialogDescription>
            Sign in to access premium features or continue as a guest.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <LoginForm onLoginSuccess={handleLoginSuccess} />
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LoginDialog;
