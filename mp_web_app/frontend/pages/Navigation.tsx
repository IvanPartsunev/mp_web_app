import {useState, useEffect} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "@/context/AuthContext";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {Menu as MenuIcon, X as CloseIcon} from "lucide-react";
import {Button} from "@/components/ui/button";

// All navigation structure mapped here
const NAV_LINKS = [
  {label: "Начало", to: "/home"},
  {label: "Продукти", to: "/products"},
  {label: "Галерия", to: "/gallery"},
  {label: "Контакти", to: "/contacts"},
  {
    label: "Списъци",
    dropdown: [
      {
        label: "Управителен съвет",
        to: "/board",
        description: "Списък на членовете на УС към ГПК.",
      },
      {
        label: "Контролен съвет",
        to: "/control",
        description: "Списък на членовете на КС към ГПК.",
      },
      {
        label: "Пълномощници",
        to: "/proxies",
        description: "Списък на пълномощниците.",
      },
      {
        label: "Член кооператори",
        to: "/cooperative",
        description: "Списък на член кооператорите.",
      },
    ],
  },
  {
    label: "Документи",
    dropdown: [
      {
        label: "Нормативни документи",
        to: "/governing-documents",
        description: "Нормативни документи свързани с дейността на ГПК.",
      },
      {
        label: "Бланки",
        to: "/forms",
        description: "Бланки свързани с дейноста на кооперацията.",
      },
      {
        label: "Протоколи",
        to: "/minutes",
        description: "Протоколи от преведени заседания на УС и КС.",
        requiresAuth: true,
      },
      {
        label: "Стенограми",
        to: "/transcripts",
        description: "Стенограми от преведени заседания на УС.",
        requiresAuth: true,
      },
      {
        label: "Счетоводни документи",
        to: "/accounting-documents",
        description: "Счетоводни документи свързани с дейноста на ГПК.",
        requiresAuth: true,
      },
      {
        label: "Моите документи",
        to: "/mydocuments",
        description: "Документи споделени с мен.",
        requiresAuth: true,
      },
      {
        label: "Други",
        to: "/others",
        description: "Други документи свързани с дейноста на ГПК.",
        requiresAuth: true,
      },
    ],
  },
];

function useWindowWidth() {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return width;
}

export function Navigation() {
  const {isLoggedIn, logout} = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 1200;

  // Helper to filter dropdown items based on auth
  const filterDropdown = (dropdown: any[]) => dropdown.filter((item) => !item.requiresAuth || isLoggedIn);

  // Decode role from access token to check role
  const getUserRole = (): "admin" | "board" | "control" | "accountant" | "regular" | null => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return null;
      const base64Url = token.split(".")[1] || "";
      const base64 = base64Url
        .replace(/-/g, "+")
        .replace(/_/g, "/")
        .padEnd(Math.ceil(base64Url.length / 4) * 4, "=");
      const payload = JSON.parse(atob(base64));
      const role = String(payload?.role || "").toLowerCase();
      if (role === "admin" || role === "board" || role === "control" || role === "accountant" || role === "regular") return role as any;
      return null;
    } catch {
      return null;
    }
  };

  const role = getUserRole();
  const isAdmin = role === "admin";
  const isAccountant = role === "accountant";
  const isBoardOrControl = role === "board" || role === "control";

  // Handle smooth navigation without flickering
  const handleNavigation = (path: string) => {
    if (isMobile) {
      setIsNavigating(true);
      // Close mobile menu with animation
      setMobileMenuOpen(false);
      // Wait for menu close animation to complete before navigating
      setTimeout(() => {
        navigate(path);
        setIsNavigating(false);
      }, 300);
    } else {
      navigate(path);
    }
  };

  // Handle animation for mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      setShowMobileMenu(true);
      // Prevent body scroll when menu is open
      document.body.style.overflow = 'hidden';
      setTimeout(() => setMenuAnimating(true), 10);
    } else if (showMobileMenu) {
      setMenuAnimating(false);
      // Restore body scroll
      document.body.style.overflow = '';
      const timeout = setTimeout(() => setShowMobileMenu(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [mobileMenuOpen, showMobileMenu]);

  // Mobile menu content with animation and scrollability
  const mobileMenu = (
    <div
      className={`
        fixed inset-0 z-50 bg-background flex flex-col p-6
        transition-all duration-300 ease-in-out overflow-y-auto
        ${
          menuAnimating
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-full pointer-events-none"
        }
      `}
    >
      <div className="flex justify-between items-center mb-8">
        <span className="text-xl font-bold text-foreground">Меню</span>
        <Button
          onClick={() => setMobileMenuOpen(false)}
          variant="ghost"
          size="icon"
          className="text-foreground hover:bg-accent active:bg-accent/80 active:scale-[0.98] transition-all duration-150 rounded-full w-9 h-9 p-1.5"
          aria-label="Затвори менюто"
        >
          <CloseIcon className="w-5 h-5" />
        </Button>
      </div>
      <nav className="flex flex-col gap-2">
        {NAV_LINKS.map((link) => {
          if (!link.dropdown) {
            return (
              <a
                key={link.label}
                href={link.to}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation(link.to);
                }}
                className="block px-4 py-3 rounded-lg hover:bg-accent active:bg-accent/80 active:scale-[0.98] transition-all duration-150 text-foreground font-medium"
              >
                {link.label}
              </a>
            );
          }

          const isDocuments = link.label === "Документи";
          const isLists = link.label === "Списъци";

          // Hide entire Documents section when not authenticated
          if (isDocuments && !isLoggedIn) {
            return null;
          }
          // Hide Lists section when not authenticated
          if (isLists && !isLoggedIn) {
            return null;
          }

          // Role-based filtering for Documents
          let documentsItems = link.dropdown;
          if (isDocuments) {
            if (isAdmin || isBoardOrControl) {
              // Admin, Board, Control: see all documents
              documentsItems = link.dropdown;
            } else if (isAccountant) {
              // Accountant: see ONLY accounting documents
              documentsItems = link.dropdown.filter((item: any) => 
                item.to === "/accounting-documents"
              );
            } else {
              // Regular users: see all except "Счетоводни документи" (accounting)
              documentsItems = link.dropdown.filter((item: any) => 
                item.to === "/governing-documents" || 
                item.to === "/forms" || 
                item.to === "/minutes" || 
                item.to === "/transcripts" || 
                item.to === "/mydocuments" ||
                item.to === "/others"
              );
            }
          } else {
            documentsItems = filterDropdown(link.dropdown);
          }

          const itemsToRender = isDocuments ? documentsItems : link.dropdown;

          if ((isDocuments || isLists) && itemsToRender.length === 0) {
            return null;
          }

          return (
            <div key={link.label} className="mt-2">
              <div className="font-semibold mb-2 px-4 text-primary text-sm uppercase tracking-wide">{link.label}</div>
              <div className="space-y-1">
                {itemsToRender.map((item: any) => (
                  <a
                    key={item.label}
                    href={item.to}
                    onClick={(e) => {
                      e.preventDefault();
                      handleNavigation(item.to);
                    }}
                    className="block px-4 py-2 rounded-lg hover:bg-accent active:bg-accent/80 active:scale-[0.98] transition-all duration-150"
                  >
                    <div className="font-medium text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.description}</div>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
        {/* Admin upload action for mobile */}
        {isLoggedIn && isAdmin && (
          <div className="mt-4 space-y-2">
            <Button
              className="w-full"
              onClick={() => handleNavigation("/upload")}
              disabled={isNavigating}
            >
              Качи документ
            </Button>
            <Button
              className="w-full"
              onClick={() => handleNavigation("/admin")}
              disabled={isNavigating}
            >
              Админ панел
            </Button>
          </div>
        )}
        {/* Accountant upload action for mobile */}
        {isLoggedIn && isAccountant && (
          <div className="mt-4">
            <Button
              className="w-full"
              onClick={() => handleNavigation("/upload")}
              disabled={isNavigating}
            >
              Качи документ
            </Button>
          </div>
        )}
        {/* Auth section for mobile */}
        {!isLoggedIn ? (
          <div className="mt-4 space-y-2">
            <div className="font-semibold mb-2 px-4 text-primary text-sm uppercase tracking-wide">Вход</div>
            <Button
              onClick={() => handleNavigation("/login")}
              variant="outline"
              className="w-full h-auto py-3 flex-col items-start"
              disabled={isNavigating}
            >
              <div className="font-medium">Влез</div>
              <div className="text-xs text-muted-foreground mt-0.5">Влезе в своя акаунт</div>
            </Button>
            <Button
              onClick={() => handleNavigation("/register")}
              variant="outline"
              className="w-full h-auto py-3 flex-col items-start"
              disabled={isNavigating}
            >
              <div className="font-medium">Създай</div>
              <div className="text-xs text-muted-foreground mt-0.5">Създай акаунт ако си член на ГПК</div>
            </Button>
          </div>
        ) : (
          <div className="mt-4">
            <Button
              className="w-full"
              onClick={() => {
                logout();
                setMobileMenuOpen(false);
              }}
              disabled={isNavigating}
            >
              Изход
            </Button>
          </div>
        )}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop Navigation */}
      {!isMobile && (
        <div className="flex p-3 w-full items-center justify-center bg-background/95 backdrop-blur-md shadow-sm transition-all duration-300 border-t-2 border-b-2 border-transparent" style={{borderImage: 'linear-gradient(to right, oklch(0.5889 0.145 154.56), oklch(0.5889 0.145 154.56), oklch(0.5889 0.145 154.56 / 0.8)) 1'}}>
          <NavigationMenu viewport={false}>
            <NavigationMenuList className="gap-2">
              {NAV_LINKS.map((link) => {
                if (!link.dropdown) {
                  return (
                    <NavigationMenuItem key={link.label}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link 
                          to={link.to}
                          className="transition-all duration-200 hover:scale-105"
                        >
                          {link.label}
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  );
                }

                const isDocuments = link.label === "Документи";
                const isLists = link.label === "Списъци";

                // Hide entire Documents section when not authenticated
                if (isDocuments && !isLoggedIn) {
                  return null;
                }
                // Hide Lists section when not authenticated
                if (isLists && !isLoggedIn) {
                  return null;
                }

                // Role-based filtering for Documents
                let documentsItems = link.dropdown;
                if (isDocuments) {
                  if (isAdmin || isBoardOrControl) {
                    // Admin, Board, Control: see all documents
                    documentsItems = link.dropdown;
                  } else if (isAccountant) {
                    // Accountant: see ONLY accounting documents
                    documentsItems = link.dropdown.filter((item: any) => 
                      item.to === "/accounting-documents"
                    );
                  } else {
                    // Regular users: see all except "Счетоводні документи" (accounting)
                    documentsItems = link.dropdown.filter((item: any) => 
                      item.to === "/governing-documents" || 
                      item.to === "/forms" || 
                      item.to === "/minutes" || 
                      item.to === "/transcripts" || 
                      item.to === "/mydocuments" ||
                      item.to === "/others"
                    );
                  }
                } else {
                  documentsItems = filterDropdown(link.dropdown);
                }

                const itemsToRender = isDocuments ? documentsItems : link.dropdown;

                if ((isDocuments || isLists) && itemsToRender.length === 0) {
                  return null;
                }

                return (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuTrigger className="transition-all duration-200">
                      {link.label}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent className="relative z-50">
                      <ul className="grid w-[280px] gap-1 p-2">
                        {itemsToRender.map((item: any) => (
                          <li key={item.label}>
                            <NavigationMenuLink asChild>
                              <Link 
                                to={item.to}
                                className="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:shadow-md border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                              >
                                <div className="font-medium text-sm leading-none mb-1 text-gray-900 dark:text-white">{item.label}</div>
                                <div className="text-gray-600 dark:text-gray-400 text-xs leading-snug">{item.description}</div>
                              </Link>
                            </NavigationMenuLink>
                          </li>
                        ))}
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
              {/* Admin upload action for desktop */}
              {isLoggedIn && isAdmin && (
                <>
                  <NavigationMenuItem>
                    <Link to="/upload">
                      <Button className="ml-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                        Качи документ
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Link to="/admin">
                      <Button className="ml-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                        Админ панел
                      </Button>
                    </Link>
                  </NavigationMenuItem>
                </>
              )}
              {/* Accountant upload action for desktop */}
              {isLoggedIn && isAccountant && (
                <NavigationMenuItem>
                  <Link to="/upload">
                    <Button className="ml-2 transition-all duration-200 hover:scale-105 hover:shadow-md">
                      Качи документ
                    </Button>
                  </Link>
                </NavigationMenuItem>
              )}
              {/* Auth section for desktop */}
              {!isLoggedIn ? (
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="transition-all duration-200">
                    Вход
                  </NavigationMenuTrigger>
                  <NavigationMenuContent className="relative z-50">
                    <ul className="grid w-[280px] gap-1 p-2">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/login"
                            className="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:shadow-md border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                          >
                            <div className="font-medium text-sm leading-none mb-1 text-gray-900 dark:text-white">Влез</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs leading-snug">Влезе в своя акаунт</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <Link 
                            to="/register"
                            className="block select-none rounded-lg p-3 leading-none no-underline outline-none transition-all duration-200 hover:bg-gray-100/80 dark:hover:bg-gray-800/80 hover:shadow-md border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50"
                          >
                            <div className="font-medium text-sm leading-none mb-1 text-gray-900 dark:text-white">Създай</div>
                            <div className="text-gray-600 dark:text-gray-400 text-xs leading-snug">Създай акаунт ако си член на ГПК</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <Button 
                    className="ml-2 transition-all duration-200 hover:scale-105 hover:shadow-md" 
                    onClick={logout}
                  >
                    Изход
                  </Button>
                </NavigationMenuItem>
              )}
            </NavigationMenuList>
          </NavigationMenu>
        </div>
      )}

      {/* Hamburger Icon for Mobile */}
      {isMobile && (
        <div className="flex items-center px-2 py-1.5 w-full bg-background/95 backdrop-blur-md shadow-sm border-t-2 border-transparent" style={{borderImageSource: 'linear-gradient(to right, oklch(0.5889 0.145 154.56), oklch(0.5889 0.145 154.56), oklch(0.5889 0.145 154.56 / 0.8))', borderImageSlice: 1}}>
          <Button
            onClick={() => setMobileMenuOpen(true)}
            className="w-full flex items-center justify-center py-1.5 h-[30px]"
            aria-label="Отвори менюто"
            disabled={isNavigating}
          >
            <MenuIcon className="w-5 h-5" />
          </Button>
        </div>
      )}

      {/* Mobile Menu Overlay with animation and scrollability */}
      {showMobileMenu && mobileMenu}
    </>
  );
}

export default Navigation;
