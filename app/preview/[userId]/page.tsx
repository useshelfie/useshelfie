export default function PreviewPage({
	params,
}: {
	params: { userId: string }
}) {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen">
			<h1 className="text-2xl font-bold">Preview Page</h1>
			<p className="mt-4">User ID: {params.userId}</p>
		</div>
	)
}
