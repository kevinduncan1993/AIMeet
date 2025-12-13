export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            AIMeet
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            AI-Powered Business Assistant & Appointment Scheduler
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="#pricing"
              className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
            >
              View Pricing
            </a>
            <a
              href="/auth/login"
              className="bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold border-2 border-indigo-600 hover:bg-indigo-50 transition"
            >
              Sign In
            </a>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold mb-2">AI Assistant</h3>
            <p className="text-gray-600">
              Intelligent chatbot that answers FAQs and books appointments automatically
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">📅</div>
            <h3 className="text-xl font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-gray-600">
              Sync with Google/Outlook calendars and manage availability seamlessly
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="text-3xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold mb-2">Embeddable Widget</h3>
            <p className="text-gray-600">
              Add to any website with a simple script tag - fully customizable
            </p>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="max-w-6xl mx-auto py-16">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600">
              Start with a 3-day free trial. No credit card required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-indigo-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold text-gray-900">$19</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-indigo-600 font-semibold mt-2">3-day free trial</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Up to 100 conversations/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Basic AI chat widget</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Email notifications</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Knowledge base (up to 50 articles)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Up to 5 services</span>
                </li>
              </ul>
              <a
                href="/auth/signup?plan=STARTER"
                className="block w-full bg-indigo-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>

            {/* Professional Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-indigo-600 hover:border-indigo-700 transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </span>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold text-gray-900">$29</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-indigo-600 font-semibold mt-2">3-day free trial</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Up to 500 conversations/month</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Advanced AI features</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Calendar sync (Google/Outlook)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom branding</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Knowledge base (up to 200 articles)</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Up to 20 services</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Priority support</span>
                </li>
              </ul>
              <a
                href="/auth/signup?plan=PROFESSIONAL"
                className="block w-full bg-indigo-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border-2 border-gray-200 hover:border-indigo-300 transition-all">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-extrabold text-gray-900">$50</span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="text-sm text-indigo-600 font-semibold mt-2">3-day free trial</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Unlimited conversations</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Custom AI training</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">API access</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Unlimited knowledge base</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Unlimited services</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">Dedicated support</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-indigo-600 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">SLA guarantee</span>
                </li>
              </ul>
              <a
                href="/auth/signup?plan=ENTERPRISE"
                className="block w-full bg-indigo-600 text-white text-center py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-all transform hover:scale-105"
              >
                Start Free Trial
              </a>
            </div>
          </div>

          {/* Trial Info */}
          <div className="text-center mt-12 bg-white rounded-xl p-8 shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Try AIMeet Risk-Free for 3 Days
            </h3>
            <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div>
                <div className="text-3xl mb-2">🎁</div>
                <p className="font-semibold text-gray-900">No Credit Card Required</p>
                <p className="text-sm text-gray-600 mt-1">Start your trial instantly</p>
              </div>
              <div>
                <div className="text-3xl mb-2">⚡</div>
                <p className="font-semibold text-gray-900">Full Access</p>
                <p className="text-sm text-gray-600 mt-1">Try all features during trial</p>
              </div>
              <div>
                <div className="text-3xl mb-2">🔒</div>
                <p className="font-semibold text-gray-900">Cancel Anytime</p>
                <p className="text-sm text-gray-600 mt-1">No commitment required</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
