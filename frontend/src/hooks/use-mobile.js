import { useIsMobile } from "@/hooks/use-mobile";

function MyComponent() {
  const isMobile = useIsMobile();
  
  if (isMobile === undefined) {
    return <div>Loading...</div>;
  }
  
  return (
    <div>
      {isMobile ? (
        <div>Mobile layout</div>
      ) : (
        <div>Desktop layout</div>
      )}
    </div>
  );
}