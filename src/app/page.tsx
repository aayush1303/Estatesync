import Image from "next/image";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeImage from "../../public/home.jpg";

export default async function Home() {
  const { userId } = await auth();

  // Don't redirect - let authenticated users see the homepage too
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="text-2xl font-bold text-purple-200">EstateSync</div>
        <div className="hidden md:flex items-center space-x-2">
          <a
            href="#features"
            className="text-purple-200 hover:text-purple-900 hover:bg-white px-4 py-2 rounded-full transition-all duration-300 ease-in-out"
          >
            Features
          </a>
          <a
            href="#pricing"
            className="text-purple-200 hover:text-purple-900 hover:bg-white px-4 py-2 rounded-full transition-all duration-300 ease-in-out"
          >
            Pricing
          </a>
          <a
            href="#contact"
            className="text-purple-200 hover:text-purple-900 hover:bg-white px-4 py-2 rounded-full transition-all duration-300 ease-in-out"
          >
            Contact
          </a>

          {userId ? (
            // Show dashboard link for authenticated users
            <a
              href="/buyers"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-3xl transition-colors"
            >
              Go to Dashboard
            </a>
          ) : (
            // Show sign in button for non-authenticated users
            <SignInButton
              mode="modal"
              forceRedirectUrl="/buyers"
              signUpForceRedirectUrl="/buyers"
            >
              <button className="bg-purple-600 cursor-pointer hover:bg-black hover:text-white px-4 py-2 rounded-3xl transition-colors">
                Sign In
              </button>
            </SignInButton>
          )}
        </div>
        <div className="md:hidden">
          <button className="text-purple-200">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="space-y-8 z-10 relative">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
                A place to manage your{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-600">
                  buyer leads
                </span>
              </h1>

              <p className="text-lg md:text-xl text-purple-200 leading-relaxed max-w-lg">
                Real estate agents can capture, organize, and convert leads into
                successful sales with our intuitive CRM platform.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              {userId ? (
                // Show dashboard link for authenticated users
                <a
                  href="/buyers"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-4 rounded-4xl text-lg font-semibold transition-all duration-300 text-center"
                >
                  Go to Your Dashboard
                </a>
              ) : (
                // Show sign up button for non-authenticated users
                <SignUpButton
                  mode="modal"
                  forceRedirectUrl="/buyers"
                  signInForceRedirectUrl="/buyers"
                >
                  <button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 cursor-pointer px-8 py-4 rounded-4xl text-lg font-semibold transition-all duration-300">
                    Start Managing Leads
                  </button>
                </SignUpButton>
              )}
            </div>

            {/* Feature Tags */}
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full text-sm border border-purple-600/30">
                @leads
              </span>
              <span className="bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full text-sm border border-purple-600/30">
                @conversion
              </span>
              <span className="bg-purple-800/50 text-purple-200 px-4 py-2 rounded-full text-sm border border-purple-600/30">
                @analytics
              </span>
            </div>
          </div>

          {/* Right Content - Image */}
          <div className="relative lg:order-last order-first">
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8 rounded-2xl backdrop-blur-sm border border-purple-500/20">
                <Image
                  src={HomeImage}
                  alt="CRM Dashboard"
                  width={600}
                  height={400}
                  className="rounded-xl w-full h-auto object-cover shadow-2xl"
                  priority
                />
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold z-20 animate-bounce">
              New Lead!
            </div>
            <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-semibold z-20 animate-pulse">
              Converted
            </div>
          </div>
        </div>
      </div>

      {/* Features Preview */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything you need to convert leads
          </h2>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            From lead capture to deal closure, streamline your entire sales
            process with powerful tools designed for real estate professionals.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-purple-800/30 to-slate-800/50 p-6 rounded-xl border border-purple-600/20 hover:border-purple-500/40 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Smart Lead Capture</h3>
            <p className="text-purple-200">
              Automatically capture and organize leads from multiple sources
              with intelligent validation.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-800/30 to-slate-800/50 p-6 rounded-xl border border-purple-600/20 hover:border-purple-500/40 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Pipeline Management</h3>
            <p className="text-purple-200">
              Track leads through every stage of your sales funnel with visual
              pipeline management.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-800/30 to-slate-800/50 p-6 rounded-xl border border-purple-600/20 hover:border-purple-500/40 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">Automated Follow-ups</h3>
            <p className="text-purple-200">
              Never miss a follow-up with automated reminders and personalized
              communication workflows.
            </p>
          </div>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}
