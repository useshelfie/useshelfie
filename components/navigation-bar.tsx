import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton  } from "@clerk/nextjs"

export default function NavigationBar() {
  return (
    <nav className="flex justify-between items-center p-4 bg-gray-800 text-white">
      <div className="text-lg font-bold">My App</div>
      <div className="flex items-center space-x-4">
        <SignedIn>
          <UserButton />
        </SignedIn>
        <SignedOut>
          <SignInButton mode="modal">Sign In</SignInButton>
          <SignUpButton mode="modal">Sign Up</SignUpButton>
        </SignedOut>
      </div>
    </nav>
  )
}