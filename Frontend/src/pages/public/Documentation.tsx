import React from 'react';

const Documentation: React.FC = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300 px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-400 dark:to-blue-600 bg-clip-text text-transparent">
          AI Workflow & Platform Overview
        </h1>
        <p className="text-lg md:text-xl mb-10 text-center text-gray-700 dark:text-gray-300">
          Beminithiya is a disaster management platform that leverages advanced AI workflows to provide real-time disaster monitoring, emergency response coordination, and actionable analytics for communities, responders, and government agencies.
        </p>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-10 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-4 text-blue-700 dark:text-blue-300">What does this website do?</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-800 dark:text-gray-200">
            <li>Monitors disasters in real-time using AI-powered analytics and global data feeds.</li>
            <li>Coordinates emergency response by connecting users, volunteers, first responders, and government agencies.</li>
            <li>Provides official alerts, safety instructions, and resource locations to affected communities.</li>
            <li>Automates report analysis, task creation, and resource dispatch using multi-agent AI workflows.</li>
            <li>Visualizes disaster data and response metrics for decision-makers and the public.</li>
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-semibold mb-6 text-blue-700 dark:text-blue-300">AI Workflow Architecture</h2>
          <ol className="list-decimal pl-6 space-y-6 text-gray-900 dark:text-gray-100">
            <li>
              <span className="font-bold">Multiagent Emergency Report Analysis</span>
              <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300">
                <li>Triggered when an emergency report or photo is submitted.</li>
                <li>AI agents analyze reports, predict impact, and validate authenticity using computer vision, weather, and disaster history tools.</li>
                <li>Coordinators manage data flow, validation, and final decision-making.</li>
              </ul>
            </li>
            <li>
              <span className="font-bold">Task Creation & Dispatch</span>
              <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300">
                <li>Triggered when a report is approved by government officials.</li>
                <li>AI generates specific responder tasks and dispatches them to the appropriate teams.</li>
              </ul>
            </li>
            <li>
              <span className="font-bold">Additional Help Requests</span>
              <ul className="list-disc pl-6 mt-2 text-gray-700 dark:text-gray-300">
                <li>Triggered when more people in the same area request help.</li>
                <li>AI quickly generates and adds new tasks to the ongoing disaster response.</li>
              </ul>
            </li>
          </ol>
          <div className="mt-8 text-center">
            <span className="inline-block px-4 py-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 rounded-full text-sm font-medium border border-blue-500/30">
              Secure, scalable, and AI-driven disaster management
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Documentation; 