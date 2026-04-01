import { mockDelay } from "@/lib/mock-delay";
import type { ParentAccount, ChildProfile } from "./types";

export async function getParentAccount(): Promise<ParentAccount> {
  await mockDelay();
  return {
    id: "u1",
    name: "Maria Johnson",
    email: "maria@email.com",
    phone: "+1 (555) 123-4567",
  };
}

export async function getChildProfiles(): Promise<ChildProfile[]> {
  await mockDelay();
  return [
    {
      id: "cp-1",
      name: "Emma",
      age: 9,
      emergencyContactName: "Rosa M.",
    },
    {
      id: "cp-2",
      name: "Lucas",
      age: 6,
      emergencyContactName: "Rosa M.",
    },
  ];
}
