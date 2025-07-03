const Footer = () => (
  <footer className="w-full bg-gray-900 border-t border-gray-700/50 py-6">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
      <span className="text-gray-400 text-sm">&copy; {new Date().getFullYear()} Disaster Intelligence & Safety Analytics. All rights reserved.</span>
      <div className="flex space-x-4 mt-2 md:mt-0">
        <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy Policy</a>
        <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
      </div>
    </div>
  </footer>
);

export default Footer; 