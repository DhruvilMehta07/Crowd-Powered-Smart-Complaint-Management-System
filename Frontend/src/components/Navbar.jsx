// components/Navbar.jsx
const Navbar = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="flex justify-center items-center bg-[#4a6978] py-3.5 w-full fixed top-0 left-0 z-10 shadow-md">
      <button
        className={`bg-transparent border-none text-white py-3 px-6 text-xl cursor-pointer transition-all duration-300 ease-in-out rounded-lg mx-10 ${
          activeTab === 'Citizen' 
            ? 'bg-white text-[#4a6978] font-bold shadow-md' 
            : 'hover:bg-white hover:text-[#4a6978]'
        }`}
        onClick={() => setActiveTab('Citizen')}
      >
        Citizen
      </button>
      <button
        className={`bg-transparent border-none text-white py-3 px-6 text-xl cursor-pointer transition-all duration-300 ease-in-out rounded-lg mx-10 ${
          activeTab === 'Admin' 
            ? 'bg-white text-[#4a6978] font-bold shadow-md' 
            : 'hover:bg-white hover:text-[#4a6978]'
        }`}
        onClick={() => setActiveTab('Admin')}
      >
        Admin
      </button>
    </nav>
  );
};

export default Navbar;