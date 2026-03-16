import {
  Upload,
  Eye,
  Play,
  LayoutDashboard,
  BookOpen,
  BarChart3,
  Users,
  Settings,
  FileText,
  PlusCircle,
  ClipboardList,
  Trophy,
  LogIn,
  UserPlus,
  Clock,
  Search,
  ListChecks,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/context/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Public navigation items (unauthenticated users)
const publicItems: NavItem[] = [
  { title: "Home", url: "/", icon: LayoutDashboard },
  { title: "Login", url: "/login", icon: LogIn },
  { title: "Register", url: "/register", icon: UserPlus },
];

// Student navigation items
const studentItems: NavItem[] = [
  { title: "Dashboard", url: "/student/dashboard", icon: LayoutDashboard },
  { title: "Browse Quizzes", url: "/student/quizzes", icon: Search },
  { title: "Study Notes", url: "/student/notes", icon: BookOpen },
  { title: "My Results", url: "/student/results", icon: Trophy },
  { title: "My Profile", url: "/student/profile", icon: Users },
];

// Faculty navigation items
const facultyItems: NavItem[] = [
  { title: "Dashboard", url: "/faculty/dashboard", icon: LayoutDashboard },
  { title: "My Quizzes", url: "/faculty/quizzes", icon: ListChecks },
  { title: "My Notes", url: "/faculty/notes", icon: FileText },
  { title: "Quiz Results", url: "/faculty/quiz-results", icon: ClipboardList },
];

// Admin navigation items
const adminItems: NavItem[] = [
  { title: "Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
  { title: "Pending Faculty", url: "/admin/pending-faculty", icon: Clock },
  { title: "Manage Users", url: "/admin/users", icon: Users },
];

// Admin-only tools (Upload Notes)
const adminToolItems: NavItem[] = [
  { title: "Upload Notes", url: "/", icon: Upload },
  { title: "Preview & Edit", url: "/preview", icon: Eye },
];

// Faculty quiz creation tools
const facultyQuizItems: NavItem[] = [
  { title: "Create Quiz", url: "/faculty/create-quiz", icon: PlusCircle },
  { title: "Preview & Edit", url: "/preview", icon: Eye },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isAuthenticated, user, isFaculty, isAdmin } = useAuth();

  // Get role-specific navigation items
  const getRoleItems = (): NavItem[] => {
    if (!isAuthenticated || !user) return [];

    switch (user.role) {
      case "admin":
        return adminItems;
      case "faculty":
        return facultyItems;
      case "student":
      default:
        return studentItems;
    }
  };

  const roleItems = getRoleItems();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="flex flex-row items-center gap-3 px-4 py-4">
        <img
          src="/logo.jpeg"
          alt="PDF to Quiz"
          className={collapsed ? "h-8 w-8 rounded-md object-cover" : "h-10 w-10 rounded-md object-cover"}
        />
        {!collapsed && (
          <span className="text-base font-bold tracking-tight whitespace-nowrap">
            PDF to Quiz
          </span>
        )}
      </SidebarHeader>
      <SidebarContent>
        {/* Role-specific navigation */}
        {isAuthenticated && roleItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>
              {user?.role ? `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)} Menu` : "Menu"}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {roleItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url.endsWith("dashboard")}
                        className="hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Admin Tools - Upload Notes (Admin only) */}
        {isAuthenticated && isAdmin() && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminToolItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Quiz Tools - Faculty only */}
        {isAuthenticated && isFaculty() && (
          <SidebarGroup>
            <SidebarGroupLabel>Quiz Tools</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {facultyQuizItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Public navigation for unauthenticated users */}
        {!isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {publicItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className="hover:bg-accent"
                        activeClassName="bg-accent text-accent-foreground font-medium"
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {!collapsed && <span>{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
