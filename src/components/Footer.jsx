export default function Footer() {
  return (
    <footer className="border-t border-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
            <span className="text-white font-bold text-xs">B</span>
          </div>
          <span className="text-sm font-medium text-gray-700">Budget Tracker</span>
        </div>
        <p className="text-sm text-gray-400">© 2026 budget.cloudgeekpro.com</p>
        <div className="flex gap-6 text-sm text-gray-400">
          <a href="#" className="hover:text-gray-600 transition-colors">Privacy</a>
          <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
        </div>
      </div>
    </footer>
  )
}