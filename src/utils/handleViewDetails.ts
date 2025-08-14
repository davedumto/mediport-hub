import { useRouter } from "next/navigation";

export const handleViewDetails = (userId: string, type: string) => {
  const router = useRouter();

  // Route to the details page with userId and type as query parameters
  router.push(`/${type}-details/${userId}`);

  // Alternative: If you prefer query parameters
  // router.push(`/${type}-details?id=${userId}`);

  // Alternative: If you want a more RESTful structure
  // router.push(`/users/${type}/${userId}`);
};
