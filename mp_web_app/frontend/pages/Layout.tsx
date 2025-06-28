// import React from "react";
import {useAuth} from "@/context/AuthContext";
// import {
//   NavigationMenu,
//   NavigationMenuList,
//   NavigationMenuItem,
//   NavigationMenuTrigger,
//   NavigationMenuContent,
//   NavigationMenuLink,
// } from "@/components/ui/navigation-menu";
//
// const Layout = ({children}: { children: React.ReactNode }) => {
//   const {isLoggedIn} = useAuth();
//   return (
//     <div>
//       <NavigationMenu viewport={false}>
//         <NavigationMenuList>
//
//           <NavigationMenuLink href="/">Начало</NavigationMenuLink>
//           <NavigationMenuLink href="/">Продукти</NavigationMenuLink>
//           <NavigationMenuLink href="/">Контакти</NavigationMenuLink>
//
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>За нас</NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <NavigationMenuLink href="/" asChild>Управителен съвет</NavigationMenuLink>
//               <NavigationMenuLink href="/" asChild>Контролен съвет</NavigationMenuLink>
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>Списъци</NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <NavigationMenuLink href="/">Пълномощници</NavigationMenuLink>
//               <NavigationMenuLink href="/">Член кооператори</NavigationMenuLink>
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//
//           <NavigationMenuItem>
//             <NavigationMenuTrigger>Документи</NavigationMenuTrigger>
//             <NavigationMenuContent>
//               <NavigationMenuLink href="/">Нормативни документи</NavigationMenuLink>
//               {isLoggedIn && (
//                 <>
//                   <NavigationMenuLink href="/">Счетоводни документи</NavigationMenuLink>
//                   <NavigationMenuLink href="/">Протоколи</NavigationMenuLink>
//                   <NavigationMenuLink href="/">Стенограми</NavigationMenuLink>
//                 </>
//               )}
//               <NavigationMenuLink href="/">Бланки</NavigationMenuLink>
//             </NavigationMenuContent>
//           </NavigationMenuItem>
//
//         </NavigationMenuList>
//       </NavigationMenu>
//       <main>{children}</main>
//     </div>
//   );
// };

// export default Layout;

"use client"

import * as React from "react"
import {Link} from "react-router-dom"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Alert Dialog",
    href: "/docs/primitives/alert-dialog",
    description:
      "A modal dialog that interrupts the user with important content and expects a response.",
  },
  {
    title: "Hover Card",
    href: "/docs/primitives/hover-card",
    description:
      "For sighted users to preview content available behind a link.",
  },
  {
    title: "Progress",
    href: "/docs/primitives/progress",
    description:
      "Displays an indicator showing the completion progress of a task, typically displayed as a progress bar.",
  },
  {
    title: "Scroll-area",
    href: "/docs/primitives/scroll-area",
    description: "Visually or semantically separates content.",
  },
  {
    title: "Tabs",
    href: "/docs/primitives/tabs",
    description:
      "A set of layered sections of content—known as tab panels—that are displayed one at a time.",
  },
  {
    title: "Tooltip",
    href: "/docs/primitives/tooltip",
    description:
      "A popup that displays information related to an element when the element receives keyboard focus or the mouse hovers over it.",
  },
]

export function Layout({children}: { children: React.ReactNode }) {
  const {isLoggedIn} = useAuth();
  return (
    <div>
      <NavigationMenu viewport={false}>
        <NavigationMenuList>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to={"/"}>Начало</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to={"/"}>Продукти</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuLink asChild className={navigationMenuTriggerStyle()}>
              <Link to={"/"}>Контакти</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>За нас</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Управителен съвет</div>
                      <div className="text-muted-foreground">
                        Списък на членовете на УС към ГПК.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Контролен съвет</div>
                      <div className="text-muted-foreground">
                        Списък на членовете на КС към ГПК.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Списъци</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Пълномощници</div>
                      <div className="text-muted-foreground">
                        Списък на пълномощниците.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Член кооператори</div>
                      <div className="text-muted-foreground">
                        Списък на член кооператорите.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

          <NavigationMenuItem>
            <NavigationMenuTrigger>Документи</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-[300px] gap-4">
                <li>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Нормативни документи</div>
                      <div className="text-muted-foreground">
                        Нормативни документи свързани с дейността на ГПК.
                      </div>
                    </Link>
                  </NavigationMenuLink>
                  <NavigationMenuLink asChild>
                    <Link to={"/"}>
                      <div className="font-medium">Бланки</div>
                      <div className="text-muted-foreground">
                        Бланки свързани с дейноста на кооперацията.
                      </div>
                    </Link>
                  </NavigationMenuLink>

                  {isLoggedIn && (<>
                    <NavigationMenuLink asChild>
                      <Link to={"/"}>
                        <div className="font-medium">Прококоли</div>
                        <div className="text-muted-foreground">
                          Протоколи от преведени заседания на УС и КС.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to={"/"}>
                        <div className="font-medium">Стенограми</div>
                        <div className="text-muted-foreground">
                          Стенограми от преведени заседания на УС.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to={"/"}>
                        <div className="font-medium">Счетоводни документи</div>
                        <div className="text-muted-foreground">
                          Счетоводни документи свързани с дейноста на ГПК.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                    <NavigationMenuLink asChild>
                      <Link to={"/"}>
                        <div className="font-medium">Други</div>
                        <div className="text-muted-foreground">
                          Други документи свързани с дейноста на ГПК.
                        </div>
                      </Link>
                    </NavigationMenuLink>
                  </>)}

                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>

        </NavigationMenuList>
      </NavigationMenu>
      <main>{children}</main>
    </div>
  )
}

export default Layout;

// function ListItem({
//                     title,
//                     children,
//                     href,
//                     ...props
//                   }: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
//   return (
//     <li {...props}>
//       <NavigationMenuLink asChild>
//         <Link href={href}>
//           <div className="text-sm leading-none font-medium">{title}</div>
//           <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
//             {children}
//           </p>
//         </Link>
//       </NavigationMenuLink>
//     </li>
//   )
// }
