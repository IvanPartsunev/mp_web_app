import React from "react";
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from "@/components/ui/navigation-menu";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div>
    <NavigationMenu>
      <NavigationMenuList>
        {/*<NavigationMenuItem>*/}
        {/*<NavigationMenuTrigger>Menu</NavigationMenuTrigger>*/}
        {/*<NavigationMenuContent>*/}
        <NavigationMenuLink href="/">Начало</NavigationMenuLink>
        <NavigationMenuLink href="/">Продукти</NavigationMenuLink>
        <NavigationMenuLink href="/about">Контакти</NavigationMenuLink>
        <NavigationMenuLink href="/">За нас</NavigationMenuLink>
        <NavigationMenuLink href="/">Нормативни документи</NavigationMenuLink>
        {/* Add more links as needed */}
        {/*</NavigationMenuContent>*/}
        {/*</NavigationMenuItem>*/}
        {/* Add more NavigationMenuItem for more top-level menus */}
      </NavigationMenuList>
    </NavigationMenu>
    <main>{children}</main>
  </div>
);

export default Layout;
