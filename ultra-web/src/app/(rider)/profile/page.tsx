import { getParentAccount, getChildProfiles } from "@/features/account-management/actions";
import { ProfilePage } from "@/features/account-management/components/ProfilePage";

export default async function ProfileRoute() {
  const [account, children] = await Promise.all([
    getParentAccount(),
    getChildProfiles(),
  ]);
  return <ProfilePage account={account} children={children} />;
}
