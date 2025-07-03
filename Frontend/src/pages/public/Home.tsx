import { 
  ShieldCheckIcon, 
  UsersIcon, 
  ChevronRightIcon, 
  PhoneIcon, 
  ClockIcon,
  BoltIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { NearbyDisastersComponent } from '../../components/public/nearbyDisasters';

const DisasterManagementLanding = () => {

  const stats = [
    { number: 'Real-time', label: 'Data Processing', icon: BoltIcon, color: 'text-yellow-400' },
    { number: '24/7', label: 'System Monitoring', icon: ClockIcon, color: 'text-blue-400' },
    { number: 'Global', label: 'Coverage Network', icon: GlobeAltIcon, color: 'text-green-400' },
    { number: 'Verified', label: 'Alert Sources', icon: ShieldCheckIcon, color: 'text-red-400' }
  ];

  const features = [
    {
      icon: BoltIcon,
      title: 'Real-time Monitoring',
      description: 'Live data feeds from verified government and meteorological sources',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      borderColor: 'border-yellow-400/20'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Verified Alerts',
      description: 'Official emergency notifications from authorized disaster management agencies',
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      borderColor: 'border-blue-400/20'
    },
    {
      icon: UsersIcon,
      title: 'Community Safety',
      description: 'Connect with local emergency services and official response teams',
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      borderColor: 'border-green-400/20'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-0 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="mb-8">
              <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
                🚨 Emergency Response System
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
              Disaster Intelligence
              <span className="block bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                & Safety Analytics
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Real-time disaster monitoring and emergency response coordination system with 
              advanced AI-powered analytics and global coverage
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center">
                Access Live Data
                <ChevronRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 hover:border-gray-500">
                View Documentation
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20">
            {stats.map((stat, index) => (
              <div key={index} className="group relative">
                <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-6 text-center hover:bg-gray-800/70 transition-all duration-300 hover:border-gray-600/50 hover:shadow-lg hover:scale-105">
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-700/50 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <NearbyDisastersComponent />

      {/* Features Section */}
      <section className="py-24 bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="mb-4">
              <span className="inline-block px-4 py-2 bg-gray-700/50 text-gray-300 rounded-full text-sm font-medium border border-gray-600/50">
                ⚡ Advanced Features
              </span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Professional Monitoring System
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Built for emergency response teams, government agencies, and communities 
              with enterprise-grade reliability and security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative">
                <div className={`bg-gray-900/50 backdrop-blur-sm border ${feature.borderColor} rounded-xl p-8 hover:bg-gray-900/70 transition-all duration-300 hover:shadow-xl hover:scale-105 hover:border-opacity-50`}>
                  <div className="flex items-center mb-6">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${feature.bgColor} mr-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className={`h-6 w-6 ${feature.color}`} />
                    </div>
                    <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{feature.description}</p>
                  <div className="mt-6 flex items-center text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                    Learn more
                    <ChevronRightIcon className="ml-1 h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24 bg-gradient-to-r from-gray-900 to-gray-800 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-circuit-pattern"></div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-8">
            <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
              🚀 Enterprise Ready
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready for Professional Deployment?
          </h2>
          <p className="text-xl text-gray-300 mb-10 leading-relaxed">
            Contact us for enterprise integration, API access, and custom disaster 
            management solutions tailored to your organization's needs
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center">
              Request Demo
              <ChevronRightIcon className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group border border-gray-600 text-gray-300 hover:text-white hover:bg-gray-800 px-8 py-4 rounded-lg text-lg font-medium transition-all duration-200 hover:border-gray-500 flex items-center justify-center hover:shadow-lg">
              <PhoneIcon className="mr-2 h-5 w-5 transform group-hover:scale-110 transition-transform" />
              Emergency Support
            </button>
          </div>
          
          {/* Trust Indicators */}
          <div className="mt-12 pt-8 border-t border-gray-700/50">
            <p className="text-gray-400 text-sm mb-4">Trusted by emergency response organizations worldwide</p>
            <div className="flex flex-wrap justify-center gap-8 opacity-60">
              <div className="text-gray-500 font-medium">FEMA Compatible</div>
              <div className="text-gray-500 font-medium">ISO 27001 Certified</div>
              <div className="text-gray-500 font-medium">24/7 Support</div>
              <div className="text-gray-500 font-medium">99.9% Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DisasterManagementLanding;