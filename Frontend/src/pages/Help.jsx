// Help.jsx - Updated with matching theme and FAQs
import React, { useState } from "react";

const ChevronDownIcon = ({ className = "w-5 h-5" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M12.53 16.28a.75.75 0 01-1.06 0l-7.5-7.5a.75.75 0 011.06-1.06L12 14.69l6.97-6.97a.75.75 0 111.06 1.06l-7.5 7.5z" clipRule="evenodd" />
  </svg>
);

const FAQItem = ({ question, answer, isOpen, onToggle }) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:shadow-md">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-colors duration-200"
      >
        <span className="text-left font-semibold text-gray-800 pr-4">{question}</span>
        <ChevronDownIcon
          className={`w-5 h-5 text-[#4B687A] transition-transform duration-300 flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <div
        className={`transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-gray-700 leading-relaxed whitespace-pre-line">{answer}</p>
        </div>
      </div>
    </div>
  );
};

export default function Help() {
  const [openFAQ, setOpenFAQ] = useState(null);
  const userType = localStorage.getItem('user_type') || 'citizen';

  const citizenFAQs = [
    {
      question: "How do I raise a complaint?",
      answer: `1. Click the "Raise Complaint" button in the sidebar
2. Describe your complaint in detail
3. Choose location method (GPS or Manual address)
4. Select the appropriate department
5. Optionally attach up to 4 images
6. Click "Submit Complaint"

Tip: Our ML system will suggest the right department based on your images!`
    },
    {
      question: "How do I upvote a complaint?",
      answer: `To upvote a complaint:
1. Navigate to the Home page to view all complaints
2. Find the complaint you want to support
3. Click the thumbs-up icon below the complaint
4. Your upvote will be recorded and the count will increase

Upvoting helps prioritize important issues in your community.`
    },
    {
      question: "How do I report a complaint?",
      answer: `If you find a complaint that violates guidelines:
1. Open the complaint details
2. Click on the "Report" button (flag icon)
3. Select the reason for reporting
4. Submit your report

Our team will review reported complaints and take appropriate action.`
    },
    {
      question: "How do I approve a resolution?",
      answer: `Once a fieldworker submits a resolution:
1. You'll receive a notification about the resolution
2. Open the complaint to view the resolution details
3. Review the submitted images and description
4. Click "Approve Resolution" if you're satisfied
5. Or provide feedback if the issue isn't fully resolved

Your approval helps close the complaint successfully.`
    },
    {
      question: "Can I submit complaints anonymously?",
      answer: `Yes! When raising a complaint:
1. Check the "Submit Anonymously" option at the bottom of the form
2. Your name won't be visible to other users
3. You can still track and manage your complaint
4. Authorities can see your identity for verification purposes`
    },
    {
      question: "How do I track my complaints?",
      answer: `To view your complaint history:
1. Click "Past Complaints" in the sidebar
2. You'll see all your submitted complaints
3. Filter by status (Pending, In Progress, Resolved)
4. Click on any complaint to see detailed updates
5. Check notifications for real-time updates`
    }
  ];

  const fieldworkerFAQs = [
    {
      question: "How do I use the application?",
      answer: `Getting started as a fieldworker:
1. Log in with your fieldworker credentials
2. View assigned complaints on your Home page
3. Click on a complaint to see full details
4. Use the navigation sidebar to access different sections
5. Check Notifications regularly for new assignments

Your role is crucial in resolving community issues efficiently.`
    },
    {
      question: "How do I submit a resolution?",
      answer: `To submit a resolution for an assigned complaint:
1. Open the complaint from your dashboard
2. Review the complaint details and location
3. Click "Submit Resolution" button
4. Upload before/after photos showing the work done
5. Provide a detailed description of the resolution
6. Submit for citizen approval

Clear photos and descriptions help get quick approvals!`
    },
    {
      question: "How do I view my assigned complaints?",
      answer: `Your assigned complaints are displayed on:
1. Home page - Shows all complaints assigned to you
2. Filter by status to organize your work
3. Prioritize based on upvotes and urgency
4. Click on any complaint for detailed information
5. Track progress in "Past Complaints" section`
    },
    {
      question: "What should I include in resolution photos?",
      answer: `Best practices for resolution photos:
1. Take clear, well-lit photos
2. Show the problem area before work (if possible)
3. Take multiple angles of the completed work
4. Include close-ups of important details
5. Ensure photos are in focus and properly oriented

Good documentation helps citizens verify the work!`
    },
    {
      question: "What if a citizen doesn't approve my resolution?",
      answer: `If a resolution isn't approved:
1. Check the citizen's feedback carefully
2. Review what aspects need improvement
3. Revisit the location if needed
4. Submit an updated resolution with corrections
5. Add clear notes about additional work done

Open communication helps resolve any concerns.`
    }
  ];

  const faqs = userType === 'fieldworker' ? fieldworkerFAQs : citizenFAQs;

  const toggleFAQ = (index) => {
    setOpenFAQ(openFAQ === index ? null : index);
  };

  return (
    <div className="p-1 bg-grey-200 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-1 mb-1">
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-[#4B687A] to-[#3C5260] rounded-full flex items-center justify-center mx-auto mb-4 mt-4 shadow-lg">
              <span className="text-4xl text-white">?</span>

            </div>
            <h1 className="text-3xl font-bold text-[#4B687A] mb-2">Help & Support</h1>
            <p className="text-gray-600 text-lg mb-1">
              {userType === 'fieldworker' ? 'Fieldworker Guide' : 'Citizen Guide'}
            </p>
            <p className="text-gray-500 text-sm mb-4">
              Find answers to commonly asked questions below
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-xl shadow-lg  p-8">
          <h2 className="text-2xl font-bold text-[#4B687A] mb-6 flex items-center gap-2">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-3">
            {faqs.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openFAQ === index}
                onToggle={() => toggleFAQ(index)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}