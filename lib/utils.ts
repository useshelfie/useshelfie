import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'USD',
	}).format(price)
}

export function getBreadcrumbs(pathname: string) {
	const parts = pathname.split("/").filter(Boolean);
	return parts.map((segment, i) => ({
		name: decodeURIComponent(segment),
		href: "/" + parts.slice(0, i + 1).join("/"),
	}));
}
