"use client";

import Link from "next/link";
import { loginWithGoogle, login, signup } from "./actions";
import Image from "next/image";
import { useState } from "react";

export default function App() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [error, setError] = useState<string>("");

  const handleEmailAuth = async (formData: FormData) => {
    setError("");
    try {
      const result = mode === "login"
        ? await login(formData)
        : await signup(formData);

      if (result?.error) {
        setError(result.error);
      }
    } catch (err: any) {
      // Next.js redirect throws a NEXT_REDIRECT error, which is expected behavior
      // Only show error if it's not a redirect
      if (err?.digest?.startsWith("NEXT_REDIRECT")) {
        // This is a successful redirect, don't show error
        return;
      }
      console.error("Auth error:", err);
      setError(err?.message || "Authentication failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen relative overflow-clip bg-neutral-50 flex items-center justify-center p-4">
      <Image
        src={"/fsu.jpg"}
        width={100}
        height={100}
        priority={true}
        alt="Fresno State Library at sunset"
        className="absolute top-0 blur-sm z-10 scale-105 left-0 w-full h-full object-cover pointer-events-none"
      ></Image>
      <div className="bg-white relative z-40 p-8 rounded-xl border border-neutral-200 max-w-sm w-full">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold mb-3">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h1>
          <div className="flex justify-center mb-3">
            <div className="button-depth squircle relative w-20 h-20 rounded-lg overflow-hidden border border-neutral-300">
              <Image
                src="/logo.png"
                alt="Bulldog Mapping"
                priority={true}
                width={50}
                height={50}
                className="object-cover w-full h-full"
              />
            </div>
          </div>
          <p className="text-gray-600 text-sm">
            Create events and discover campus spots.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "login"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
            }}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
              mode === "signup"
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Email/Password Form */}
        <form action={handleEmailAuth} className="space-y-3">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {mode === "signup" && (
            <p className="text-xs text-gray-500">
              Password must be at least 6 characters long
            </p>
          )}

          <button
            type="submit"
            className="button-depth w-full bg-blue-600 text-white font-medium py-3 px-4 rounded-lg border border-blue-700 hover:bg-blue-700 transition-[transform_background-color] duration-150 ease-out-2 cursor-pointer hover:scale-105 active:scale-95"
          >
            {mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="my-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google OAuth */}
        <form>
          <button
            formAction={loginWithGoogle}
            className="button-depth w-full bg-white text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-50 transition-[transform_background-color] duration-150 ease-out-2 cursor-pointer hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
          >
            <Image
              src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png"
              alt="Google"
              priority={true}
              width={24}
              height={24}
              className="object-contain"
            />
            Continue with Google
          </button>
        </form>

        <div className="mt-4 text-center">
          <button
            type="button"
            className="text-gray-600 text-sm hover:text-gray-900 underline hover:no-underline transition-colors duration-150 ease-out-2 cursor-pointer"
          >
            <Link href={"/"}>Do It Later</Link>
          </button>
        </div>
      </div>
    </div>
  );
}
