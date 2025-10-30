import React, { useState, useEffect } from 'react';

const SearchIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FilterIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
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
    <path fillRule="evenodd" d="M5.25 9a6.75 6.75 0 0113.5 0v.75c0 2.123.8 4.057 2.118 5.52a.75.75 0 01-.297 1.206c-1.544.57-3.16.99-4.831 1.243a3.75 3.75 0 11-7.48 0 24.585 24.585 0 01-4.831-1.244.75.75 0 01-.298-1.205A8.217 8.217 0 005.25 9.75V9zm4.502 8.9a2.25 2.25 0 104.496 0 25.057 25.057 0 01-4.496 0z" clipRule="evenodd" />
  </svg>
);

const UserCircleIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const HelpIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm11.378-3.917c-.89-.777-2.366-.777-3.255 0a.75.75 0 01-.988-1.129c1.454-1.272 3.776-1.272 5.23 0 1.513 1.324 1.513 3.518 0 4.842a3.75 3.75 0 01-.837.552c-.676.328-1.028.774-1.028 1.152v.75a.75.75 0 01-1.5 0v-.75c0-1.279 1.06-2.107 1.875-2.502.182-.088.351-.199.503-.331.83-.727.83-1.857 0-2.584zM12 18a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
  </svg>
);

const ThreeDotsIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
  </svg>
);

const UpvoteIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75.75z" clipRule="evenodd" />
  </svg>
);

const CommentIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const ComplaintCard = ({ complaint }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-blue-50 p-6 rounded-xl border-2 border-indigo-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1">
            <UserIcon className="w-10 h-10 text-gray-600" />
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">{complaint.author}</p>
            <p className="text-sm text-gray-600">{formatDate(complaint.date)}</p>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-all duration-200">
          <ThreeDotsIcon />
        </button>
      </div>

      <p className="text-gray-800 text-base leading-relaxed mb-4">{complaint.content}</p>

      <div className="text-sm text-gray-700 mb-4 bg-white px-3 py-2 rounded-lg inline-block border border-indigo-200">
        <span className="font-semibold">Assigned to:</span> {complaint.assignedTo}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t-2 border-indigo-200">
        <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all duration-200">
          <UpvoteIcon />
        </button>
        <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all duration-200">
          <CommentIcon />
        </button>
      </div>
    </div>
  );
};

const GovAuthHomepage = () => {
  const [complaints] = useState([
    {
      id: 1,
      author: 'Anonymous User',
      date: '15/09/2025',
      content: 'Every day on my way to the office, I come across deep potholes that make the journey stressful and unsafe. It\'s not just damaging to vehicles, but it also puts people at real risk. I sincerely hope this issue can be fixed soon, as it affects so many of us daily.',
      assignedTo: 'Road Department, ward No. 3'
    },
    {
      id: 2,
      author: 'Parth Bhatt',
      date: '07/09/2025',
      content: 'The street outside my housing complex has several uneven patches and cracks. During rain, these turn into puddles, making it difficult for vehicles and pedestrians. Please consider resurfacing the road to avoid further deterioration.',
      assignedTo: 'Road Department, Ward No. 8'
    }
  ]);

  const [activeMenu, setActiveMenu] = useState('home');

  const workInProgressItems = [
    'Struggling with potholes every day on the way to office, making travel unsafe and tiring.',
    'Ongoing repair work on the main road is causing frequent traffic blocks. Hoping the maintenance completes soon for smoother commuting.',
    'Newly filled potholes near the school are starting to reopen after rainfall. Temporary fixes aren\'t lasting; a permanent repair is needed.'
  ];

  const getNavButtonClass = (menuItem) => {
    const baseClass = "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all duration-200";
    
    if (activeMenu === menuItem) {
      return `${baseClass} bg-indigo-600 text-white shadow-md hover:shadow-lg hover:bg-indigo-700`;
    }
    
    return `${baseClass} text-gray-700 hover:bg-indigo-100 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]`;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50">
      {/* Left Sidebar */}
      <aside className="w-72 bg-white border-r-4 border-indigo-400 flex flex-col">
        <div className="p-6">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveMenu('home')}
              className={getNavButtonClass('home')}
            >
              <HomeIcon className="w-6 h-6" />
              <span>Home</span>
            </button>
            <button
              onClick={() => setActiveMenu('notification')}
              className={getNavButtonClass('notification')}
            >
              <BellIcon className="w-6 h-6" />
              <span>Notification</span>
            </button>
            <button
              onClick={() => setActiveMenu('profile')}
              className={getNavButtonClass('profile')}
            >
              <UserCircleIcon className="w-6 h-6" />
              <span>Profile</span>
            </button>
            <button
              onClick={() => setActiveMenu('help')}
              className={getNavButtonClass('help')}
            >
              <HelpIcon className="w-6 h-6" />
              <span>Help</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b-4 border-indigo-400 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="search"
                placeholder="Search"
                className="w-full pl-12 pr-4 py-3 border-2 border-indigo-300 rounded-full bg-blue-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition-all duration-200"
              />
            </div>
            <button className="p-3 rounded-full hover:bg-indigo-100 hover:shadow-md transition-all duration-200">
              <FilterIcon className="w-6 h-6 text-indigo-600" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl space-y-6">
            {complaints.map((complaint) => (
              <ComplaintCard key={complaint.id} complaint={complaint} />
            ))}
          </div>
        </div>
      </main>

      {/* Right Sidebar */}
      <aside className="w-96 bg-white border-l-4 border-indigo-400 p-6 overflow-y-auto">
        <div className="mb-6 flex justify-center">
          <button className="bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 hover:shadow-lg hover:-translate-y-[1px] transition-all duration-300 shadow-md">
            Login/SignUp
          </button>
        </div>

        <div className="bg-white border-4 border-indigo-400 rounded-xl p-6">
          <h3 className="font-bold text-xl text-center mb-6 text-indigo-900">
            Work in Progress
          </h3>
          <div className="space-y-4">
            {workInProgressItems.map((item, index) => (
              <div
                key={index}
                className="text-sm text-gray-700 hover:bg-indigo-50 hover:shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[1px] p-4 rounded-lg transition-all duration-200 cursor-pointer border border-indigo-100"
              >
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default GovAuthHomepage;