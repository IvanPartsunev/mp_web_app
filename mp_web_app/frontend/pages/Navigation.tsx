import * as React from "react";
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
    label: "За нас",
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
    ],
  },
  {
    label: "Списъци",
    dropdown: [
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
        label: "Други",
        to: "/others",
        description: "Други документи свързани с дейноста на ГПК.",
        requiresAuth: true,
      },
    ],
  },
  {
    label: "Вход",
    dropdown: [
      {
        label: "Влез",
        to: "/login",
        description: "Влезе в своя акаунт",
      },
      {
        label: "Създай",
        to: "/register",
        description: "Създай акаунт ако си член на ГПК",
      },
    ],
  },
];

export function Navigation() {
  const {isLoggedIn} = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [menuAnimating, setMenuAnimating] = useState(false);

  // Helper to filter dropdown items based on auth
  const filterDropdown = (dropdown: any[]) =>
    dropdown.filter((item) => !item.requiresAuth || isLoggedIn);

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
        fixed inset-0 z-50 bg-background flex flex-col p-6 sm:hidden
        transition-all duration-300 overflow-y-auto
        ${menuAnimating
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
          <CloseIcon size={28}/>
        </Button>
      </div>
      <nav className="flex flex-col gap-4">
        {NAV_LINKS.map((link) =>
          !link.dropdown ? (
            <Link
              key={link.label}
              to={link.to}
              className="text-lg font-medium"
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ) : (
            <div key={link.label} className="mt-4">
              <div className="font-semibold mb-2">{link.label}</div>
              {filterDropdown(link.dropdown).map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  className="block mb-1"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                  <div className="text-xs text-muted-foreground">{item.description}</div>
                </Link>
              ))}
            </div>
          )
        )}
      </nav>
    </div>
  );

  return (
    <div>
      <div className="hidden sm:flex p-2 border-t-3 border-b-3 border-primary w-full items-center justify-center">
        {/* Desktop Navigation */}
        <NavigationMenu viewport={false}>
          <NavigationMenuList>
            {NAV_LINKS.map((link) =>
              !link.dropdown ? (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
                    <Link to={link.to}>{link.label}</Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ) : (
                <NavigationMenuItem key={link.label}>
                  <NavigationMenuTrigger>{link.label}</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[250px] gap-4">
                      <li>
                        {filterDropdown(link.dropdown).map((item) => (
                          <NavigationMenuLink asChild key={item.label}>
                            <Link to={item.to}>
                              <div className="font-medium">{item.label}</div>
                              <div className="text-muted-foreground text-xs">
                                {item.description}
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        ))}
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              )
            )}
          </NavigationMenuList>
        </NavigationMenu>
      </div>

      {/* Hamburger Icon for Mobile */}
      <div className="sm:hidden flex items-center p-4">
        <Button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded hover:bg-accent menu-button"
          aria-label="Отвори менюто"
        >
          <MenuIcon size={28}/>
        </Button>
        <span className="ml-2 text-lg font-bold"></span>
      </div>

      {/* Mobile Menu Overlay with animation and scrollability */}
      {showMobileMenu && mobileMenu}

      <div>
        <Outlet/>
      </div>
    </div>
  );
}

export default Navigation;