import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from './app';
// Create a client
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(React.StrictMode, null,
    React.createElement(QueryClientProvider, { client: queryClient },
        React.createElement(App, null))));
