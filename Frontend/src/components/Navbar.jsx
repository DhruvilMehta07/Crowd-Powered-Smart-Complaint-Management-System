// components/Navbar.jsx
const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-center items-center bg-[#4a6978] py-3.5 w-full fixed top-0 left-0 z-10 shadow-md">
      <button
        className={`bg-transparent border-none text-blue py-3 px-6 text-xl cursor-pointer transition-all duration-500 ease-out rounded-lg mx-4 transform ${
          activeTab === 'Citizen' 
            ? 'bg-white text-[#4a6978] font-bold shadow-lg scale-105 translate-y-[-2px]' 
            : 'hover:bg-white hover:text-[#4a6978] hover:scale-105 hover:translate-y-[-2px]'
        }`}
        onClick={() => setActiveTab('Citizen')}
      >
        Citizen
      </button>
      <button
        className={`bg-transparent border-none text-blue py-3 px-6 text-xl cursor-pointer transition-all duration-500 ease-out rounded-lg mx-4 transform ${
          activeTab === 'Admin' 
            ? 'bg-white text-[#4a6978] font-bold shadow-lg scale-105 translate-y-[-2px]' 
            : 'hover:bg-white hover:text-[#4a6978] hover:scale-105 hover:translate-y-[-2px]'
        }`}
        onClick={() => setActiveTab('Admin')}
      >
        Admin
      </button>
      <button
        className={`bg-transparent border-none text-blue py-3 px-6 text-xl cursor-pointer transition-all duration-500 ease-out rounded-lg mx-4 transform ${
          activeTab === 'Government Authority' 
            ? 'bg-white text-[#4a6978] font-bold shadow-lg scale-105 translate-y-[-2px]' 
            : 'hover:bg-white hover:text-[#4a6978] hover:scale-105 hover:translate-y-[-2px]'
        }`}
        onClick={() => setActiveTab('Government Authority')}
      >
        Government Authority
      </button>
      <button
        className={`bg-transparent border-none text-blue py-3 px-6 text-xl cursor-pointer transition-all duration-500 ease-out rounded-lg mx-4 transform ${
          activeTab === 'FieldWorker' 
            ? 'bg-white text-[#4a6978] font-bold shadow-lg scale-105 translate-y-[-2px]' 
            : 'hover:bg-white hover:text-[#4a6978] hover:scale-105 hover:translate-y-[-2px]'
        }`}
        onClick={() => setActiveTab('FieldWorker')}
      >
        Field Worker
      </button>
    </nav>
  );
};

export default Navbar;