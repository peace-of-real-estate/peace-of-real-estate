// fallow-ignore-file unused-file -- pending adoption by save flows
import { toast } from 'sonner'

export async function withSaveToast<T>(
	operation: () => Promise<T>,
	options?: { success?: string; error?: string },
): Promise<boolean> {
	try {
		await operation()
		toast.success(options?.success ?? 'Changes saved successfully')
		return true
	} catch {
		toast.error(options?.error ?? 'Error saving. Try again.')
		return false
	}
}
