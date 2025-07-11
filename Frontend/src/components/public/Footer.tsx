const Footer = () => (
  <footer className="w-full bg-gray-100 dark:bg-gray-900 border-t border-gray-200/50 dark:border-gray-700/50 py-6 transition-colors duration-300">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
      <span className="text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">&copy; {new Date().getFullYear()} Baminithiya Disaster Intelligence & Safety Analytics. All rights reserved.</span>
      <div className="flex space-x-4 mt-2 md:mt-0">
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Privacy Policy</a>
        <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors text-sm">Terms</a>
      </div>
    </div>
  </footer>
);

export default Footer; 