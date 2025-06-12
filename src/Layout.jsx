import { Outlet } from 'react-router-dom';

function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 max-w-full overflow-hidden">
      <Outlet />
    </div>
  );
}

export default Layout;