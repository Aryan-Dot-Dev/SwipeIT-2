import React from "react"
import { Link } from "react-router-dom"

export default function App() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-2xl p-8 bg-white rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-4">Welcome to SwipeIT</h1>
        <p className="text-gray-600 mb-6">Create an account or log in to continue.</p>

        <div className="flex gap-4">
          <Link to="/signup" className="px-4 py-2 bg-blue-600 text-white rounded">Sign up</Link>
          <Link to="/login" className="px-4 py-2 border rounded">Log in</Link>
        </div>

        <footer className="mt-6 text-sm text-gray-500">© {new Date().getFullYear()} SwipeIT</footer>
      </div>
    </main>
  )
}
