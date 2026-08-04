import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const RouterContext = createContext(null);

function readPathname() {
  if (typeof window === "undefined") {
    return "/dashboard";
  }
  return window.location.pathname || "/dashboard";
}

export function RouterProvider({ children }) {
  const [pathname, setPathname] = useState(() => readPathname());

  useEffect(() => {
    const handlePopState = () => {
      setPathname(readPathname());
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigate = useCallback((to, { replace = false } = {}) => {
    if (typeof window === "undefined") {
      return;
    }

    const nextPath = to || "/";

    if (replace) {
      window.history.replaceState({}, "", nextPath);
    } else {
      window.history.pushState({}, "", nextPath);
    }

    setPathname(nextPath);
  }, []);

  const value = {
    pathname,
    navigate,
    replace: (to) => navigate(to, { replace: true }),
  };

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within RouterProvider");
  }
  return context;
}
