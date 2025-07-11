import React, { useEffect, useState, useRef } from "react";
import {
  ChatBubbleLeftEllipsisIcon,
  PaperAirplaneIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  Bars3Icon,
  XMarkIcon,
  MapPinIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { authService } from "../../services/auth";
import { Navigate, useNavigate, useParams } from "react-router";
import { appwriteService } from "../../services/appwrite";
import type { Message } from "../../types/messages";
import type { DisasterMessage } from "../../types/disaster";

const CommunicationHub: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [username, setUsername] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [reportTitle, setReportTitle] = useState("General Discussion");
  const [disaster, setDisaster] = useState<DisasterMessage | null>(null);
  const [disasterLoading, setDisasterLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [sending, setSending] = useState(false);

  const navigate = useNavigate();
  const { disasterId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Setup user authentication
  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }

    const tokenPayload = authService.getTokenPayload();
    if (tokenPayload) {
      setUsername(`${tokenPayload.name} (${tokenPayload.role.replace('_', ' ')})`);
    }
    setLoading(false);
  }, []);

  // Fetch disaster data
  const fetchDisasterData = async (reportId: string) => {
    setDisasterLoading(true);
    try {
      const disasterDoc = await appwriteService.getDisasterById(reportId);
      if (disasterDoc) {
        setDisaster({
          emergency_type: disasterDoc.emergency_type as string,
          latitude: disasterDoc.latitude as number,
          longitude: disasterDoc.longitude as number,
          people_count: disasterDoc.people_count as string,
          urgency_level: disasterDoc.urgency_level as string,
        });
      }
    } catch (error) {
      console.error("Error fetching disaster data:", error);
      setDisaster(null);
    } finally {
      setDisasterLoading(false);
    }
  };

  // Load messages
  const loadMessages = async (reportId: string | null) => {
    try {
      const docs = await appwriteService.getMessages(reportId);
      const formattedMessages = docs.map(doc => ({
        ...doc,
        avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${doc.user}`,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
    }
  };

  // Setup real-time subscription
  useEffect(() => {
    setMessages([]);

    // Redirect to history page if no disasterId param
    if (!disasterId) {
      navigate("/user", { replace: true });
      return;
    }

    setReportTitle(`Emergency Chat: ${disasterId}`);
    fetchDisasterData(disasterId);
    loadMessages(disasterId);

    // Subscribe to real-time updates
    const unsubscribe = appwriteService.subscribeToMessages((newMessage) => {
      // Check if message belongs to current chat
      const belongsToCurrentChat = newMessage.report_id === disasterId;
      if (belongsToCurrentChat) {
        setMessages(prev => [...prev, {
          ...newMessage,
          avatar: `https://api.dicebear.com/6.x/initials/svg?seed=${newMessage.user}`
        }]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [disasterId, navigate]);

  // Send message
  const sendMessage = async () => {
    if (!input.trim() || !username || sending) return;
    setSending(true);
    try {
      await appwriteService.createMessage({
        user: username,
        content: input.trim(),
        timestamp: new Date().toISOString(),
        ...(disasterId && { report_id: disasterId })
      });
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setSending(false);
    }
  };

  // Share location
  const shareLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setFetchingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setInput(`📍 Location: https://maps.google.com/?q=${latitude},${longitude}`);
        setFetchingLocation(false);
      },
      (error) => {
        alert("Unable to retrieve your location.");
        console.error(error);
        setFetchingLocation(false);
      }
    );
  };

  // Utility functions
  const formatTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatDate = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      if (date.toDateString() === today.toDateString()) return "Today";
      if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
      return date.toLocaleDateString();
    } catch {
      return "Unknown date";
    }
  };

  // Filter messages
  const filteredMessages = searchQuery.trim() 
    ? messages.filter(msg => 
        msg.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.user.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : messages;

  // Group messages by date
  const messagesByDate = filteredMessages.reduce((acc, message) => {
    const date = formatDate(message.timestamp);
    if (!acc[date]) acc[date] = [];
    acc[date].push(message);
    return acc;
  }, {} as Record<string, Message[]>);

  const uniqueUsers = [...new Set(messages.map(m => m.user))];

  if (!loading && !authService.isAuthenticated()) {
    return <Navigate to="/auth/signin" />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
        {/* Background Elements */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute inset-0 bg-grid-pattern"></div>
        </div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
              <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connecting to Communication Hub</h2>
            <p className="text-gray-600 dark:text-gray-400">Please wait while we establish secure communication...</p>
            <div className="mt-4 flex justify-center">
              <ArrowPathIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden transition-colors duration-300">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute inset-0 bg-grid-pattern"></div>
      </div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-float-reverse"></div>

      <div className="relative h-full flex flex-col">
        {/* Enhanced Mobile Header */}
        <div className="lg:hidden bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-gray-300/30 dark:border-gray-700/30 px-4 py-3 transition-colors duration-300 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 mr-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-300 backdrop-blur-sm"
              >
                {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">Communication Hub</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">{reportTitle}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Main Container */}
        <div className="flex-1 flex overflow-hidden">
          {/* Enhanced Sidebar */}
          <div className={`fixed inset-y-0 left-0 w-80 bg-white/30 dark:bg-gray-800/30 backdrop-blur-xl border-r border-gray-300/30 dark:border-gray-700/30 transform transition-transform duration-300 z-20 lg:relative lg:translate-x-0 flex-shrink-0 flex flex-col shadow-2xl ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}>
            {/* Enhanced Sidebar Header */}
            <div className="p-6 border-b border-gray-300/30 dark:border-gray-700/30">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center mr-3">
                    <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-blue-500" />
                  </div>
                  Chat Rooms
                </h2>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="lg:hidden p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-gray-700/50 rounded-lg transition-all duration-300"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
              {/* Enhanced Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
                <input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 text-sm bg-white/50 dark:bg-gray-900/50 text-gray-900 dark:text-white transition-all placeholder-gray-500 dark:placeholder-gray-400 backdrop-blur-sm"
                />
              </div>
              {searchQuery.trim() && (
                <div className="mt-3 p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-lg border border-blue-500/30 dark:border-blue-500/20">
                  <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    Found {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""}
                  </div>
                </div>
              )}
            </div>

            {/* Current Room */}
            <div className="p-6 border-b border-gray-300/30 dark:border-gray-700/30">
              {disasterId && (
                <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 text-gray-900 dark:text-white rounded-xl p-4 border border-red-500/30 dark:border-red-500/20 backdrop-blur-sm shadow-lg">
                  <div className="flex items-center mb-3">
                    <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center mr-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                    </div>
                    <span className="font-semibold text-sm">Report: {disasterId}</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">Emergency Discussion</p>
                </div>
              )}
            </div>

            {/* Emergency Details */}
            {disasterId && (
              <div className="p-6 border-b border-gray-300/30 dark:border-gray-700/30">
                {disasterLoading ? (
                  <div className="flex items-center text-gray-500 dark:text-gray-400">
                    <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                    <span className="text-sm">Loading emergency details...</span>
                  </div>
                ) : disaster ? (
                  <div className="space-y-3">
                    <div className="bg-gray-100/50 dark:bg-gray-700/20 rounded-xl p-4 border border-gray-300/30 dark:border-gray-600/30 backdrop-blur-sm shadow-lg">
                      <div className="flex items-center mb-2">
                        <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center mr-2">
                          <ExclamationTriangleIcon className="h-4 w-4 text-red-500" />
                        </div>
                        <span className="font-semibold text-sm uppercase text-gray-900 dark:text-white">
                          {disaster.emergency_type} - {disaster.urgency_level} Priority
                        </span>
                      </div>
                      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                        <div><span className="font-medium">Location:</span> {disaster.latitude}, {disaster.longitude}</div>
                        <div><span className="font-medium">People Affected:</span> {disaster.people_count}</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gray-100/50 dark:bg-gray-700/20 rounded-xl p-4 border border-gray-300/30 dark:border-gray-600/30 backdrop-blur-sm shadow-lg">
                    <div className="flex items-center">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Emergency details not available</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Participants */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-4 flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Online • {uniqueUsers.length} Participant{uniqueUsers.length !== 1 ? "s" : ""}
              </div>
              <div className="space-y-3">
                {uniqueUsers.map((user, idx) => (
                  <div key={idx} className="flex items-center p-3 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/30 transition-all duration-300 group border border-gray-300/20 dark:border-gray-600/20 backdrop-blur-sm">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center mr-3 text-sm font-medium shadow-lg group-hover:shadow-blue-500/25 transition-all duration-300">
                      {user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user}</p>
                      <p className="text-xs text-green-500 flex items-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                        Online
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Enhanced Chat Area */}
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="hidden lg:block bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-b border-gray-300/30 dark:border-gray-700/30 p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{reportTitle}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    {uniqueUsers.length} participant{uniqueUsers.length !== 1 ? "s" : ""} • Live Discussion
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-green-500/20 text-green-600 dark:text-green-400 rounded-full text-sm font-medium border border-green-500/30 backdrop-blur-sm">
                    🔒 Encrypted
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Messages */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-b from-transparent to-gray-50/50 dark:to-gray-900/50">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ChatBubbleLeftEllipsisIcon className="h-10 w-10 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Ready to Start</h3>
                    <p className="text-gray-600 dark:text-gray-400 italic">
                      {disasterId ? "No messages yet in this emergency discussion." : "No messages yet. Start the conversation!"}
                    </p>
                  </div>
                </div>
              ) : searchQuery.trim() && filteredMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MagnifyingGlassIcon className="h-10 w-10 text-gray-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Results Found</h3>
                    <p className="text-gray-600 dark:text-gray-400 italic">No messages found for "{searchQuery}"</p>
                  </div>
                </div>
              ) : (
                <div className="max-w-4xl mx-auto">
                  {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                    <div key={date} className="mb-8">
                      <div className="flex justify-center mb-6">
                        <span className="bg-white/40 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300 text-xs font-medium px-4 py-2 rounded-full border border-gray-300/30 dark:border-gray-700/30 shadow-lg backdrop-blur-sm">
                          {date}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {dateMessages.map((msg) => (
                          <div key={msg.$id} className={`flex ${msg.user === username ? "justify-end" : "justify-start"}`}>
                            {msg.user !== username && (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium shadow-lg">
                                {msg.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}

                            <div className={`max-w-[75%] px-6 py-4 rounded-2xl shadow-lg backdrop-blur-sm border transition-all duration-300 hover:shadow-xl ${
                              msg.user === username
                                ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-br-md border-blue-500/30"
                                : "bg-white/60 dark:bg-gray-800/60 text-gray-900 dark:text-gray-100 rounded-bl-md border-gray-300/30 dark:border-gray-700/30"
                            }`}>
                              {msg.user !== username && (
                                <div className="font-semibold text-sm text-blue-600 dark:text-blue-400 mb-1">{msg.user}</div>
                              )}
                              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                              <div className={`text-xs mt-2 text-right ${
                                msg.user === username ? "text-blue-200" : "text-gray-500 dark:text-gray-400"
                              }`}>
                                {formatTime(msg.timestamp)}
                              </div>
                            </div>

                            {msg.user === username && (
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center ml-3 flex-shrink-0 text-sm font-medium shadow-lg">
                                {msg.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Enhanced Message Input */}
            <div className="bg-white/40 dark:bg-gray-800/40 backdrop-blur-xl border-t border-gray-300/30 dark:border-gray-700/30 p-4 lg:p-6 shadow-lg">
              <div className="flex items-end space-x-3 max-w-4xl mx-auto">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Type a message in ${disasterId ? "emergency" : "general"} chat...`}
                  className="flex-1 border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:border-blue-500 focus:ring-blue-500/50 p-4 min-h-[60px] max-h-[150px] resize-y text-base text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none bg-white/50 dark:bg-gray-900/50 transition-all backdrop-blur-sm shadow-lg"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                />
                <button
                  onClick={shareLocation}
                  disabled={fetchingLocation}
                  className="h-14 w-14 rounded-xl bg-gradient-to-r from-green-600 to-blue-600 text-white flex items-center justify-center hover:from-green-700 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-green-500/25 flex-shrink-0 transform hover:-translate-y-0.5"
                  title="Share Location"
                >
                  {fetchingLocation ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <MapPinIcon className="h-5 w-5" />}
                </button>
                <button
                  onClick={sendMessage}
                  disabled={!input.trim() || !username || sending}
                  className="h-14 w-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center hover:from-blue-700 hover:to-purple-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-blue-500/25 flex-shrink-0 transform hover:-translate-y-0.5"
                  title="Send Message"
                >
                  {sending ? <ArrowPathIcon className="h-6 w-6 animate-spin" /> : <PaperAirplaneIcon className="h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-10 lg:hidden"
          />
        )}
      </div>
    </div>
  );
};

export default CommunicationHub;