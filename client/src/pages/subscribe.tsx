import { useLocation } from "wouter";
import { useEffect } from "react";

export default function Subscribe() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    // Redirect to premium page since subscriptions are no longer available
    setLocation("/premium");
  }, [setLocation]);

  return null;
}