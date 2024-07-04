import { Outlet, Link } from "react-router-dom";
import { navItems } from "@/web/App";

const Layout = () => {
  return (
    <main className="flex flex-col min-h-screen p-4 overflow-auto items-center justify-center">
      <nav className="flex space-x-4">
        {navItems.map((item) => (
          <Link key={item.to} to={item.to} className="text-lg">
            {item.icon}
            {item.title}
          </Link>
        ))}
      </nav>
      <Outlet />
    </main>
  );
};

export default Layout;