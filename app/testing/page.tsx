'use client'

import { useChat } from '@ai-sdk/react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function Chat() {
	const { messages, input, handleInputChange, handleSubmit, isLoading } =
		useChat()
	const [error, setError] = useState<string | null>(null)

	const onSubmit = async (e: React.FormEvent) => {
		try {
			setError(null)
			await handleSubmit(e)
		} catch (err) {
			console.error('Error sending message:', err)
			setError('Failed to send message. Please try again.')
		}
	}

	return (
		<div className="flex flex-col w-full max-w-2xl mx-auto py-12 px-4">
			<Card className="flex-1 p-4 mb-4 min-h-[400px] max-h-[600px] overflow-y-auto">
				{messages.map((message) => (
					<div
						key={message.id}
						className={`mb-4 p-3 rounded-lg ${
							message.role === 'user'
								? 'bg-primary/10 ml-auto max-w-[80%]'
								: 'bg-muted mr-auto max-w-[80%]'
						}`}
					>
						{message.parts.map((part, i) => {
							switch (part.type) {
								case 'text':
									return (
										<div
											key={`${message.id}-${i}`}
											className="whitespace-pre-wrap"
										>
											{part.text}
										</div>
									)
							}
						})}
					</div>
				))}
				{isLoading && (
					<div className="flex items-center space-x-2 text-muted-foreground">
						<div className="animate-bounce">●</div>
						<div className="animate-bounce delay-100">●</div>
						<div className="animate-bounce delay-200">●</div>
					</div>
				)}
			</Card>

			<form onSubmit={onSubmit} className="flex gap-2">
				<Input
					value={input}
					onChange={handleInputChange}
					placeholder="Type your message..."
					disabled={isLoading}
					className="flex-1"
				/>
				<Button type="submit" disabled={isLoading || !input.trim()}>
					{isLoading ? 'Sending...' : 'Send'}
				</Button>
			</form>

			{error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
		</div>
	)
}
