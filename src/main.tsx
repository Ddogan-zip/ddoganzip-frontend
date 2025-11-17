import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { createRoot } from "react-dom/client";
import {
  createBrowserRouter,
  Link,
  Outlet,
  RouterProvider,
} from "react-router-dom";

export function Layout() {
  return (
    <div style={{ padding: 24 }}>
      <nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/order">메뉴 주문 (회원)</Link>
        <Link to="/staff">주문 대시보드 (직원)</Link>
      </nav>
      <Outlet />
    </div>
  );
}

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      {
        index: true,
        lazy: async () => ({
          Component: (await import("./pages/Home")).default,
        }),
      },
      {
        path: "about",
        lazy: async () => ({
          Component: (await import("./pages/About")).default,
        }),
      },
      {
        path: "order",
        lazy: async () => ({
          Component: (await import("./pages/MenuOrderPage")).default,
        }),
      },
      {
        path: "staff",
        lazy: async () => ({
          Component: (await import("./pages/StaffDashboardPage")).default,
        }),
      },
      {
        path: "todos",
        lazy: async () => ({
          Component: (await import("./pages/Todos")).default,
        }),
      },
      {
        path: "*",
        lazy: async () => ({
          Component: () => <div>Not Found</div>,
        }),
      },
    ],
  },
]);

const qc = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
