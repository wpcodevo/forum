import { toast } from "vue-sonner"

export function useToast() {
  const showSuccess = (message: string) => {
    toast.success(message)
  }

  const showError = (message: string) => {
    toast.error(message)
  }

  const showInfo = (message: string) => {
    toast.info(message)
  }

  const showWarning = (message: string) => {
    toast.warning(message)
  }

  const showPromise = <T>(promise: Promise<T>, message: {
    loading: string
    success: string | ((data: T) => string)
    error: string | ((error: any) => string)
  }) => {
    return toast.promise(promise, message)
  }

  return {
    toast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showPromise
  }
}