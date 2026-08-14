// src/hooks/useCurrentUser.js
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import { createApiClient } from "../api/client";

export const useCurrentUser = () => {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        if (isMounted) {
          setUser(null);
          setRole(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const client = createApiClient(getToken);
        const data = await client.get("/auth/me");
        
        if (isMounted) {
          setUser({ email: data.email, name: data.name, id: data.student_id });
          setRole(data.role);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, [isLoaded, isSignedIn, getToken]);

  return { user, role, isLoading: !isLoaded || isLoading, error };
};
