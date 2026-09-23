import { NavLink } from "@/components/ui/NavLink";

function Navigation() {
  return (
    <nav>
      <NavLink 
        to="/dashboard" 
        className="px-4 py-2 text-gray-600"
        activeClassName="bg-blue-600 text-white"
      >
        Dashboard
      </NavLink>
    </nav>
  );
}