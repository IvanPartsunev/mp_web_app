import {useState, useEffect} from "react";
import {Link} from "react-router-dom";
import {Outlet} from "react-router-dom";
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
  {label: "Контакти", to: "/contacts"},
  {label: "Галерия", to: "/gallery"},
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);

  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 980;

  // Helper to filter dropdown items based on auth
  const filterDropdown = (dropdown: any[]) => dropdown.filter((item) => !item.requiresAuth || isLoggedIn);

  // Decode role from access token to check role
  const getUserRole = (): "admin" | "board" | "control" | "regular" | null => {
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
      if (role === "admin" || role === "board" || role === "control" || role === "regular") return role as any;
      return null;
    } catch {
      return null;
    }
  };

  const role = getUserRole();
  const isAdmin = role === "admin";
  const isBoardOrControl = role === "board" || role === "control";

  // Handle animation for mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      setShowMobileMenu(true);
      setTimeout(() => setMenuAnimating(true), 10);
    } else if (showMobileMenu) {
      setMenuAnimating(false);
      const timeout = setTimeout(() => setShowMobileMenu(false), 300);
      return () => clearTimeout(timeout);
    }
  }, [mobileMenuOpen, showMobileMenu]);

  // Mobile menu content with animation and scrollability
  const mobileMenu = (
    <div
      className={`
        fixed inset-0 z-50 bg-background flex flex-col p-6
        transition-all duration-300 overflow-y-auto
        ${
          menuAnimating
            ? "opacity-100 translate-x-0 pointer-events-auto"
            : "opacity-0 -translate-x-full pointer-events-none"
        }
      `}
    >
      <div className="flex justify-between items-center mb-8">
        <span className="text-xl font-bold">Меню</span>
        <Button
          onClick={() => setMobileMenuOpen(false)}
          className="p-2 rounded hover:bg-accent menu-button bg-primary"
          aria-label="Затвори менюто"
        >
          <CloseIcon size={28} />
        </Button>
      </div>
      <nav className="flex flex-col gap-4">
        {NAV_LINKS.map((link) => {
          if (!link.dropdown) {
            return (
              <Link
                key={link.label}
                to={link.to}
                className="block py-2 text-lg font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
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
          const documentsItems = isDocuments
            ? isAdmin || isBoardOrControl
              ? link.dropdown
              : link.dropdown.filter((item: any) => item.to === "/governing-documents" || item.to === "/forms")
            : filterDropdown(link.dropdown);

          const itemsToRender = isDocuments ? documentsItems : link.dropdown;

          if ((isDocuments || isLists) && itemsToRender.length === 0) {
            return null;
          }

          return (
            <div key={link.label} className="mt-4">
              <div className="font-semibold mb-2">{link.label}</div>
              {itemsToRender.map((item: any) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block w-full mb-1 px-4 py-3 rounded-lg shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:opacity-75 transition-opacity"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </Link>
              ))}
            </div>
          );
        })}
        {/* Admin upload action for mobile */}
        {isLoggedIn && isAdmin && (
          <>
            <Button
              className="mt-2 w-full rounded-lg shadow-md active:opacity-75 transition-opacity"
              onClick={() => {
                setMobileMenuOpen(false);
                window.location.assign("/upload");
              }}
            >
              Качи документ
            </Button>
            <Button
              className="mt-2 w-full rounded-lg shadow-md active:opacity-75 transition-opacity"
              onClick={() => {
                setMobileMenuOpen(false);
                window.location.assign("/admin");
              }}
            >
              Админ панел
            </Button>
          </>
        )}
        {/* Auth section for mobile */}
        {!isLoggedIn ? (
          <div className="mt-4">
            <div className="font-semibold mb-2">Вход</div>
            <Link
              to="/login"
              className="block w-full mb-1 px-4 py-3 rounded-lg shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:opacity-75 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Влез
              <div className="text-xs text-muted-foreground">Влезе в своя акаунт</div>
            </Link>
            <Link
              to="/register"
              className="block w-full mb-1 px-4 py-3 rounded-lg shadow-md bg-secondary text-secondary-foreground hover:bg-secondary/90 active:opacity-75 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            >
              Създай
              <div className="text-xs text-muted-foreground">Създай акаунт ако си член на ГПК</div>
            </Link>
          </div>
        ) : (
          <Button
            className="mt-4 w-full rounded-lg shadow-md active:opacity-75 transition-opacity"
            onClick={() => {
              logout();
              setMobileMenuOpen(false);
            }}
          >
            Изход
          </Button>
        )}
      </nav>
    </div>
  );

  return (
    <div>
      {/* Desktop Navigation */}
      {!isMobile && (
        <div className="sticky top-0 z-40 flex p-3 border-t-2 border-b-2 border-primary w-full items-center justify-center bg-background/80 backdrop-blur-md shadow-sm transition-all duration-300">
          <NavigationMenu viewport={false}>
            <NavigationMenuList>
              {NAV_LINKS.map((link) => {
                if (!link.dropdown) {
                  return (
                    <NavigationMenuItem key={link.label}>
                      <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                        <Link to={link.to}>{link.label}</Link>
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
                const documentsItems = isDocuments
                  ? isAdmin || isBoardOrControl
                    ? link.dropdown
                    : link.dropdown.filter((item: any) => item.to === "/governing-documents" || item.to === "/forms")
                  : filterDropdown(link.dropdown);

                const itemsToRender = isDocuments ? documentsItems : link.dropdown;

                if ((isDocuments || isLists) && itemsToRender.length === 0) {
                  return null;
                }

                return (
                  <NavigationMenuItem key={link.label}>
                    <NavigationMenuTrigger>{link.label}</NavigationMenuTrigger>
                    <NavigationMenuContent className="relative z-50">
                      <ul className="grid w-[250px] gap-4">
                        <li>
                          {itemsToRender.map((item: any) => (
                            <NavigationMenuLink asChild key={item.label}>
                              <Link to={item.to}>
                                <div className="font-medium">{item.label}</div>
                                <div className="text-muted-foreground text-xs">{item.description}</div>
                              </Link>
                            </NavigationMenuLink>
                          ))}
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                );
              })}
              {/* Admin upload action for desktop */}
              {isLoggedIn && isAdmin && (
                <>
                  <NavigationMenuItem>
                    <Button asChild className="ml-2">
                      <Link to="/upload">Качи документ</Link>
                    </Button>
                  </NavigationMenuItem>
                  <NavigationMenuItem>
                    <Button asChild className="ml-2">
                      <Link to="/admin">Админ панел</Link>
                    </Button>
                  </NavigationMenuItem>
                </>
              )}
              {/* Auth section for desktop */}
              {!isLoggedIn ? (
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Вход</NavigationMenuTrigger>
                  <NavigationMenuContent className="relative z-50">
                    <ul className="grid w-[250px] gap-4">
                      <li>
                        <NavigationMenuLink asChild>
                          <Link to="/login">
                            <div className="font-medium">Влез</div>
                            <div className="text-muted-foreground text-xs">Влезе в своя акаунт</div>
                          </Link>
                        </NavigationMenuLink>
                        <NavigationMenuLink asChild>
                          <Link to="/register">
                            <div className="font-medium">Създай</div>
                            <div className="text-muted-foreground text-xs">Създай акаунт ако си член на ГПК</div>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem>
                  <Button className="ml-2" onClick={logout}>
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
        <div className="sticky top-0 z-40 flex items-center p-3 border-t-2 border-b-2 border-primary w-full bg-background/80 backdrop-blur-md shadow-sm">
          <Button
            onClick={() => setMobileMenuOpen(true)}
            className="flex items-center gap-3 px-5 py-3 bg-primary text-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition-all"
            aria-label="Отвори менюто"
          >
            <MenuIcon className="w-6 h-6" />
            <span className="text-lg font-semibold">Меню</span>
          </Button>
        </div>
      )}

      {/* Mobile Menu Overlay with animation and scrollability */}
      {showMobileMenu && mobileMenu}

      <div>
        <Outlet />
      </div>
    </div>
  );
}

export default Navigation;
