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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <ArrowPathIcon className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
          <p className="text-gray-300">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 mr-3 text-gray-300 hover:text-white hover:bg-gray-800/70 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
            <div>
              <h1 className="text-lg font-semibold text-white">Communication Hub</h1>
              <p className="text-sm text-gray-400">{reportTitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div className={`fixed inset-y-0 left-0 w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 transform transition-transform duration-300 z-20 lg:relative lg:translate-x-0 flex-shrink-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white flex items-center">
                <ChatBubbleLeftEllipsisIcon className="h-6 w-6 mr-3 text-blue-400" />
                Chat Rooms
              </h2>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-white hover:bg-gray-800/70 rounded transition-colors"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-700/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-gray-900 text-white transition-all placeholder-gray-500"
              />
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 text-xs text-gray-400">
                Found {filteredMessages.length} message{filteredMessages.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>

          {/* Current Room */}
          <div className="p-6 border-b border-gray-700/50">
            {disasterId && (
              <div className="bg-gray-900 text-white rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mr-2" />
                  <span className="font-semibold text-sm">Report: {disasterId}</span>
                </div>
                <p className="text-sm text-gray-300">Emergency Discussion</p>
              </div>
            )}
          </div>

          {/* Emergency Details */}
          {disasterId && (
            <div className="p-6 border-b border-gray-700/50">
              {disasterLoading ? (
                <div className="flex items-center text-gray-400">
                  <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
                  <span className="text-sm">Loading emergency details...</span>
                </div>
              ) : disaster ? (
                <div className="space-y-3">
                  <div className="bg-gray-800/50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-red-400 mr-2" />
                      <span className="font-semibold text-sm uppercase text-white">
                        {disaster.emergency_type} - {disaster.urgency_level} Priority
                      </span>
                    </div>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div><span className="font-medium">Location:</span> {disaster.latitude}, {disaster.longitude}</div>
                      <div><span className="font-medium">People Affected:</span> {disaster.people_count}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mr-2" />
                    <span className="text-sm text-gray-300">Emergency details not available</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Participants */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
              Online • {uniqueUsers.length} Participant{uniqueUsers.length !== 1 ? "s" : ""}
            </div>
            <div className="space-y-3">
              {uniqueUsers.map((user, idx) => (
                <div key={idx} className="flex items-center p-3 rounded-lg hover:bg-gray-800/70 transition-colors">
                  <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center mr-3 text-sm font-medium">
                    {user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{user}</p>
                    <p className="text-xs text-gray-400">Online</p>
                  </div>
                  <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="hidden lg:block bg-gray-800/50 backdrop-blur-sm border-b border-gray-700/50 p-6">
            <h2 className="text-xl font-semibold text-white mb-1">{reportTitle}</h2>
            <p className="text-sm text-gray-400">{uniqueUsers.length} participant{uniqueUsers.length !== 1 ? "s" : ""}</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-900/50">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <ChatBubbleLeftEllipsisIcon className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 italic">
                    {disasterId ? "No messages yet in this emergency discussion." : "No messages yet. Start the conversation!"}
                  </p>
                </div>
              </div>
            ) : searchQuery.trim() && filteredMessages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <MagnifyingGlassIcon className="h-12 w-12 text-gray-700 mx-auto mb-3" />
                  <p className="text-gray-400 italic">No messages found for "{searchQuery}"</p>
                </div>
              </div>
            ) : (
              <div className="max-w-4xl mx-auto">
                {Object.entries(messagesByDate).map(([date, dateMessages]) => (
                  <div key={date} className="mb-8">
                    <div className="flex justify-center mb-6">
                      <span className="bg-gray-800/50 text-gray-300 text-xs font-medium px-4 py-2 rounded-full border border-gray-700/50 shadow-sm">
                        {date}
                      </span>
                    </div>

                    <div className="space-y-4">
                      {dateMessages.map((msg) => (
                        <div key={msg.$id} className={`flex ${msg.user === username ? "justify-end" : "justify-start"}`}>
                          {msg.user !== username && (
                            <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center mr-3 flex-shrink-0 text-sm font-medium">
                              {msg.user.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          )}

                          <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-lg ${
                            msg.user === username
                              ? "bg-blue-600 text-white rounded-br-md"
                              : "bg-gray-800/70 text-gray-300 rounded-bl-md border border-gray-700/50"
                          }`}>
                            {msg.user !== username && (
                              <div className="font-semibold text-sm text-blue-300 mb-1">{msg.user}</div>
                            )}
                            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                            <div className={`text-xs mt-2 text-right ${
                              msg.user === username ? "text-blue-200" : "text-gray-400"
                            }`}>
                              {formatTime(msg.timestamp)}
                            </div>
                          </div>

                          {msg.user === username && (
                            <div className="h-10 w-10 rounded-full bg-gray-900 text-white flex items-center justify-center ml-3 flex-shrink-0 text-sm font-medium">
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

          {/* Message Input */}
          <div className="bg-gray-800/50 backdrop-blur-sm border-t border-gray-700/50 p-4 lg:p-6">
            <div className="flex items-end space-x-3 max-w-4xl mx-auto">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Type a message in ${disasterId ? "emergency" : "general"} chat...`}
                className="flex-1 border border-gray-700/50 rounded-xl focus:border-blue-500 focus:ring-blue-500 p-3 min-h-[56px] max-h-[150px] resize-y text-base text-white placeholder-gray-500 focus:outline-none bg-gray-900 transition-all"
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
                className="h-12 w-12 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-700/50 disabled:cursor-not-allowed transition-colors shadow-lg flex-shrink-0"
              >
                {fetchingLocation ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <MapPinIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !username || sending}
                className="h-12 w-12 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-700/50 disabled:cursor-not-allowed transition-colors shadow-lg flex-shrink-0"
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
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
        />
      )}
    </div>
  );
};

export default CommunicationHub;