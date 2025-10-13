import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../pages/SideBar.jsx';

// --- SVG Icon Components ---
// Using inline SVGs to keep everything in one file and avoid external dependencies.

const SearchIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = ({ className = 'w-12 h-12' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    </svg>
);

const HomeIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" />
        <path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />
    </svg>
);

const BellIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M12 2.25c-2.429 0-4.817.178-7.152.521C2.87 3.061 1.5 4.795 1.5 6.741v6.018c0 1.606.68 3.103 1.804 4.155l.38-.38a.75.75 0 011.06 0l1.125 1.125a.75.75 0 010 1.06l-.38.38c1.052 1.124 2.55 1.804 4.155 1.804h6.018c1.946 0 3.68-1.37 3.99-3.268C21.822 16.817 22.5 14.429 22.5 12c0-2.429-.178-4.817-.521-7.152C21.689 2.87 19.955 1.5 18.009 1.5H12a.75.75 0 00-.75.75v.375c0 .098.036.19.1.268A.75.75 0 0012 3.75h6.01c.966 0 1.817.628 2.057 1.539C20.57 7.183 20.25 12 20.25 12c0 2.25-.094 4.5-.278 6.741a2.093 2.093 0 01-2.057 1.539H12c-1.12 0-2.16-.394-2.956-1.054l-.38.38a.75.75 0 01-1.06 0l-1.125-1.125a.75.75 0 010-1.06l.38-.38A3.734 3.734 0 016.75 12.759v-6.018c0-.966.628-1.817 1.539-2.057C10.183 4.178 12 3.75 12 3.75c.098 0 .19-.036.268-.1.078-.064.107-.158.107-.255V2.25z" clipRule="evenodd" />
    </svg>
);

const DocumentTextIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z" clipRule="evenodd" />
        <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-3.434-1.279h-1.875a3.375 3.375 0 01-3.375-3.375V5.25a9.768 9.768 0 00-1.279-.029c.118-.38.247-.754.386-1.128A5.23 5.23 0 0112.97 1.816z" />
    </svg>
);

const UserCircleIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
    </svg>
);

const QuestionMarkCircleIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.882-.41-1.713-.662-2.628-.662-2.276 0-4.607 1.468-4.607 4.106 0 1.581 1.002 2.883 2.28 3.521.782.326 1.62.56 2.502.634v1.875a.75.75 0 001.5 0v-1.875a4.502 4.502 0 002.894-3.521c0-2.3-1.635-4.301-4.393-4.301z" clipRule="evenodd" />
    </svg>
);

const ArrowUpIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75.75z" clipRule="evenodd" />
    </svg>
);

const ChatBubbleIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5.25-1.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z" clipRule="evenodd" />
    </svg>
);

const ShareIcon = ({ className = 'w-5 h-5' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
        <path d="M13 4.5a2.5 2.5 0 11.702 4.289l-4.117 2.428a2.503 2.503 0 010 1.566l4.117 2.428A2.5 2.5 0 1113 15.5V4.5z" />
    </svg>
);

// --- Main Page Components ---

const Header = ({ onLoginClick }) => (
    <header className="bg-white shadow-sm w-full p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex-1 max-w-xl">
            <div className="relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="search"
                    placeholder="Search for complaints, people, or keywords"
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-full bg-gray-50 focus:outline-none focus:ring-2 focus:ring-slate-500"
                />
            </div>
        </div>
        <div className="flex items-center">
            <button
                onClick={onLoginClick}
                className="bg-slate-700 text-white font-bold py-3 px-8 rounded-xl hover:bg-slate-800 transition-colors duration-300"
            >
                Login / SignUp
            </button>
        </div>
    </header>
);

const ComplaintCard = ({ complaint }) => (
    <div className="bg-slate-50/70 p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
                <div className="bg-slate-200 rounded-full p-1 text-slate-500">
                    <UserIcon />
                </div>
                <div>
                    <p className="font-bold text-lg text-slate-800">{complaint.author}</p>
                    <p className="text-sm text-gray-500">{complaint.date}</p>
                </div>
            </div>
        </div>

        <p className="text-gray-700 text-base leading-relaxed mb-4">
            {complaint.content}
        </p>

        <div className="text-sm text-gray-600 mb-4">
            <span className="font-semibold">Assigned to:</span> {complaint.assignedTo}
        </div>

        <div className="flex items-center gap-4 pt-4 border-t border-slate-200">
            <button className="flex items-center gap-2 text-gray-600 hover:text-slate-800 transition-colors">
                <ArrowUpIcon />
                <span>{complaint.upvotes}</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-slate-800 transition-colors">
                <ChatBubbleIcon />
                <span>Comment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-slate-800 transition-colors">
                <ShareIcon />
                <span>Share</span>
            </button>
        </div>
    </div>
);

// --- The Main App Component ---

const Homepage = () => {
    const navigate = useNavigate();

    const onLoginClick = useCallback(() => {
        navigate('/auth');
    }, [navigate]);

    const complaints = [
        {
            author: 'Anonymous User',
            date: '15/09/2025',
            content: 'Every day on my way to the office, I come across deep potholes that make the journey stressful and unsafe. It\'s not just damaging to vehicles, but it also puts people at real risk. I sincerely hope this issue can be fixed soon.',
            assignedTo: 'Road Department, Ward No. 3',
            upvotes: '4k',
        },
        {
            author: 'Parth Bhatt',
            date: '07/09/2025',
            content: 'Every morning and evening, the traffic congestion during office hours makes commuting extremely difficult and exhausting. Long delays not only waste time but also add unnecessary stress to everyone on the road. I kindly request urgent measures to improve traffic flow.',
            assignedTo: 'Traffic Management Department, Ward No. 12',
            upvotes: '3.2k',
        },
        {
            author: 'Anonymous User 2',
            date: '10/09/2025',
            content: 'Water supply has not been coming for the last two days, and it is causing a lot of difficulty for daily needs. I kindly request this issue to be resolved at the earliest.',
            assignedTo: 'Water Supply Department, Ward No. 8',
            upvotes: '2k',
        }
    ];

    return (
        <div className="bg-gray-50 font-inter min-h-screen">
            <Header onLoginClick={onLoginClick} />
            <div className="flex max-w-screen-2xl mx-auto">
                <main className="flex-1 p-4 sm:p-6 md:p-8">
                    <div className="space-y-6">
                        {complaints.map((complaint, index) => (
                            <ComplaintCard key={index} complaint={complaint} />
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Homepage;