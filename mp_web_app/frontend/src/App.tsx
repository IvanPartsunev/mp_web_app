import React from "react";
import {ThemeProvider} from "@/components/theme-provider"

import { Button } from "@shadcn/ui/button";

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">

            <div className="flex flex-col items-center justify-center min-h-screen">
                <h1 className="text-3xl font-bold underline mb-4">
                    Hello world!
                </h1>
                <Button>
                    Click me
                </Button>
            </div>
        </ThemeProvider>
    );
}

export default App;
