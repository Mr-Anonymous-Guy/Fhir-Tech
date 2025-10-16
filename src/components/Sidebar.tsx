import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Search,
  Database,
  Upload,
  Activity,
  Home,
  ChevronLeft,
  ChevronRight,
  Stethoscope
} from 'lucide-react';

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: Home },
    { name: 'Search & Map', href: '/search', icon: Search },
    { name: 'All Mappings', href: '/mappings', icon: Database },
    { name: 'Bulk Upload', href: '/bulk-upload', icon: Upload },
    { name: 'Audit Trail', href: '/audit', icon: Activity }
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`${
        collapsed ? 'w-16' : 'w-64'
      } bg-nav border-r border-border transition-all duration-300 flex flex-col shadow-card`}
    >
      {/* Logo and Toggle */}
      <div className="p-4 border-b border-nav-foreground/20 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Stethoscope className="w-8 h-8 text-nav-foreground" />
            <div>
              <h2 className="font-bold text-nav-foreground">NAMASTE</h2>
              <p className="text-xs text-nav-foreground/70">made by CodeMorph</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-nav-foreground/10 text-nav-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <NavLink
                to={item.href}
                className={`
                  w-full flex items-center gap-3 px-3 py-2 rounded text-sm font-medium
                  transition-all duration-200
                  ${
                    isActive(item.href)
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-nav-foreground hover:bg-nav-foreground/10 hover:text-nav-foreground'
                  }
                `}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-4 border-t border-nav-foreground/20">
          <div className="text-xs text-nav-foreground/70 space-y-1">
            <p className="font-medium text-nav-foreground">FHIR R4 Compliant</p>
            <p>India EHR Standards 2016</p>
            <p>Ministry of AYUSH</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;